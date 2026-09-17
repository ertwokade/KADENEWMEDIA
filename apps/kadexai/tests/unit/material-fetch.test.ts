import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchMaterial, materialTarget, thumbnailBytes } from '../../lib/materials/fetch'

test('material requests allow known HTTPS media CDNs, never private or deceptive hosts', () => {
  assert.equal(materialTarget('https://str.arsivhub.com/a.jpg').hostname, 'str.arsivhub.com')
  for (const url of ['http://str.arsivhub.com/a', 'https://127.0.0.1/a', 'https://169.254.169.254/', 'https://str.arsivhub.com.evil.test/a', 'https://x@str.arsivhub.com/a', 'https://str.arsivhub.com:8000/a']) assert.throws(() => materialTarget(url))
})

test('a redirect to an internal server is blocked before the second request', async () => {
  let calls = 0
  await assert.rejects(fetchMaterial('https://str.arsivhub.com/a.jpg', async () => {
    calls++
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secrets' } })
  }))
  assert.equal(calls, 1)
})

test('thumbnail accepts raster bytes and rejects SVG, empty and oversized responses', async () => {
  const result = await thumbnailBytes(new Response(new Uint8Array([255, 216, 255]), { headers: { 'content-type': 'image/jpeg' } }))
  assert.equal(result.bytes.length, 3)
  await assert.rejects(thumbnailBytes(new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } })))
  await assert.rejects(thumbnailBytes(new Response('12345', { headers: { 'content-type': 'image/jpeg' } }), 4))
  await assert.rejects(thumbnailBytes(new Response('', { headers: { 'content-type': 'image/jpeg' } })))
})

test('video önizleme aralık isteğini iletir, geçersiz aralığı göndermez ve sayılar Türkçe kısaltılır', async () => {
  const seen: (string | null)[] = []
  const request = (async (_url: URL, init?: RequestInit) => {
    seen.push(new Headers(init?.headers).get('range'))
    return new Response('ok', { status: 206, headers: { 'content-range': 'bytes 0-1/2' } })
  }) as typeof fetch
  await fetchMaterial('https://str.arsivhub.com/a.mp4', request, 'bytes=0-')
  await fetchMaterial('https://str.arsivhub.com/a.mp4', request, 'bytes=0-\r\nx: y')
  assert.deepEqual(seen, ['bytes=0-', null])
  const { sayiMetni } = await import('../../lib/materials/format')
  assert.equal(sayiMetni(1_000), '1 bin')
  assert.equal(sayiMetni(2_450_000), '2,5 Mn')
  assert.equal(sayiMetni(999), '999')
})
