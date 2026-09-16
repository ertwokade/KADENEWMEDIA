import test from 'node:test'
import assert from 'node:assert/strict'
import { publicStats } from '../../server/api/_lib/public-content.js'

test('public stats omit private fields, unpublished and blank rows while preserving real zero', () => {
  const result = publicStats({ notes: 'private', rakamlar: [
    { sayi: 0, etiket: 'Kampanya', privateNote: 'private' },
    { sayi: '94%', etiket: 'Taslak', published: false },
    { sayi: '', etiket: 'Belirsiz' },
  ] });
  assert.deepEqual(result, { rakamlar: [{ sayi: '0', etiket: 'Kampanya', ikon: '' }] });
  assert.deepEqual(publicStats(null), { rakamlar: [] });
});

test('herkese açık GA ölçüm kimliği yalnız geçerli değerde döner', async () => {
  const { publicGaMeasurementId } = await import('../../server/api/content.js')
  assert.equal(publicGaMeasurementId({ VITE_GA_ID: 'G-XXXXXXXXXX' }), null)
  assert.equal(publicGaMeasurementId({ VITE_GA_ID: '' }), null)
  assert.equal(publicGaMeasurementId({ VITE_GA_ID: 'UA-1234-1' }), null)
  assert.equal(publicGaMeasurementId({ VITE_GA_ID: ' g-ab12cd34ef ' }), 'G-AB12CD34EF')
})

test('statik sayfalar ölçümü yalnız çerez onayından sonra başlatır', async () => {
  const { readFile } = await import('node:fs/promises')
  const code = await readFile(new URL('../../haoqi-clone/kade-analytics.js', import.meta.url), 'utf8')
  const transform = await readFile(new URL('../../haoqi-clone/kade-html-transform.mjs', import.meta.url), 'utf8')
  assert.match(transform, /'\/kade-analytics\.js'/)
  assert.match(code, /if \(consent === 'accepted'\) start\(\)/)
  assert.match(code, /else if \(consent !== 'declined'\) banner\(\)/)
  assert.ok(code.indexOf("post('pageview'") > code.indexOf('function start()'), 'sayfa görüntüleme yalnız start() içinde gönderilir')
})
