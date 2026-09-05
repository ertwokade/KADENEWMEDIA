import test from 'node:test'
import assert from 'node:assert/strict'
import { asBoolean, asNumber, asRecord, asRecordList, asText, asTextList, asTextRecord } from '../../lib/ai/outputValidation'

test('model çıktı doğrulayıcıları nesne ve liste dışı değerleri güvenle reddeder', () => {
  assert.equal(asRecord(['yanlış']), null)
  assert.equal(asRecord(null), null)
  assert.deepEqual(asTextList({ value: 'yanlış' }), [])
  assert.deepEqual(asRecordList('yanlış', () => ({ ok: true })), [])
})

test('model çıktı doğrulayıcıları metinleri sınırlar ve sayıları aralıkta tutar', () => {
  assert.equal(asText('  abcdef  ', 3), 'abc')
  assert.equal(asNumber('140'), 100)
  assert.equal(asNumber('-5'), 0)
  assert.equal(asNumber('bozuk', 12), 12)
  assert.equal(asBoolean('true'), true)
  assert.deepEqual(asTextRecord({ title: ' Başlık ', nested: { bad: true }, count: 3 }), { title: 'Başlık', count: '3' })
})
