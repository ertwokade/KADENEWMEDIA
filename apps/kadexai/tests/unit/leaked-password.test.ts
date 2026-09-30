import assert from 'node:assert/strict'
import test from 'node:test'
import { checkPasswordExposure } from '../../lib/auth/leakedPassword'

test('checks only a five-character SHA-1 prefix and requests response padding', async () => {
  let requestedUrl = ''
  let requestedHeaders: HeadersInit | undefined
  const result = await checkPasswordExposure('password', async (input, init) => {
    requestedUrl = String(input)
    requestedHeaders = init?.headers
    return new Response('1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\r\n')
  })

  assert.equal(requestedUrl, 'https://api.pwnedpasswords.com/range/5BAA6')
  assert.equal(new Headers(requestedHeaders).get('Add-Padding'), 'true')
  assert.deepEqual(result, { checked: true, compromised: true, count: 3_861_493 })
})

test('ignores zero-count padding entries and accepts an unseen password', async () => {
  const result = await checkPasswordExposure('password', async () => (
    new Response('1E4C9B93F3F0682250B6CF8331B7EE68FD8:0\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2\r\n')
  ))

  assert.deepEqual(result, { checked: true, compromised: false, count: 0 })
})

test('fails closed at the route layer when the external check is unavailable', async () => {
  const result = await checkPasswordExposure('password', async () => new Response('busy', { status: 503 }))
  assert.deepEqual(result, { checked: false, compromised: false, count: 0 })
})
