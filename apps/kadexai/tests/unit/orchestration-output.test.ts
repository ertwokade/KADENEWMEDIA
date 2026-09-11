import test from 'node:test'
import assert from 'node:assert/strict'
import { stepContext, validateStepOutput } from '../../lib/orchestration/output'

test('pipeline rejects truncated JSON and empty successful-looking payloads', () => {
  for (const text of ['', '{"gunler":[', '{}', '{"raw":"model hatası"}']) assert.throws(() => validateStepOutput('content-plan', text))
  assert.throws(() => validateStepOutput('title', '[{"title":"yanlış sözleşme"}]'))
  assert.throws(() => validateStepOutput('hashtag', '{"yuksek":[],"orta":[],"dusuk":[],"niche":[]}'))
})

test('pipeline accepts valid fenced and nested serialized output', () => {
  assert.deepEqual(validateStepOutput('title', '```json\n["Başlık"]\n```'), ['Başlık'])
  assert.deepEqual(validateStepOutput('title', JSON.stringify(JSON.stringify(['İstanbul']))), ['İstanbul'])
  assert.ok(validateStepOutput('content-plan', '{"strateji":"Plan","gunler":[{"baslik":"Gün 1"}]}'))
  assert.ok(validateStepOutput('trends', '{"sicak_trendler":[{"konu":"Kamera"}]}'))
  assert.ok(validateStepOutput('competitor', '{"rakip_profili":{},"farklilasma_stratejisi":"Açı","fırsatlar":[{"firsat":"Konu"}]}'))
})

test('pipeline context is bounded labelled text, never a broken JSON fragment', () => {
  const context = stepContext({ gunler: Array.from({ length: 30 }, (_, i) => ({ baslik: `Başlık ${i}`, aciklama: '🎬'.repeat(600) })) }, 2000)
  assert.ok(context.length <= 2000)
  assert.ok(context.includes('gunler / 1 / baslik: Başlık 0'))
  assert.ok(context.includes('bazı alanlar aktarılmadı'))
  assert.equal(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(context), false)
})
