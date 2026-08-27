import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEMO_CONTENT_DEFAULTS, mergeContent } from '../../lib/cms/defaults'

test('override varsayılanın üzerine biner, dokunulmayan alan korunur', () => {
  const merged = mergeContent(DEMO_CONTENT_DEFAULTS, { title: 'Yeni başlık' })
  assert.equal(merged.title, 'Yeni başlık')
  assert.equal(merged.eyebrow, DEMO_CONTENT_DEFAULTS.eyebrow)
  assert.deepEqual(merged.features, DEMO_CONTENT_DEFAULTS.features)
})

test('şemada olmayan alanlar yok sayılır (CMS şemayı kod belirler)', () => {
  const merged = mergeContent(DEMO_CONTENT_DEFAULTS, { title: 'X', kotuAlan: '<script>' }) as unknown as Record<string, unknown>
  assert.equal(merged.kotuAlan, undefined)
})

test('tip uyuşmazlığı varsayılanı bozmaz', () => {
  const merged = mergeContent(DEMO_CONTENT_DEFAULTS, { title: 42, features: 'dizi değil' })
  assert.equal(merged.title, DEMO_CONTENT_DEFAULTS.title)
  assert.deepEqual(merged.features, DEMO_CONTENT_DEFAULTS.features)
})

test('dizi alanı kısmi birleştirilmez, tamamen değiştirilir', () => {
  const merged = mergeContent(DEMO_CONTENT_DEFAULTS, { faq: [{ question: 'S', answer: 'C' }] })
  assert.equal(merged.faq.length, 1)
  assert.equal(merged.faq[0].question, 'S')
})

test('iç içe nesne alan alan birleşir', () => {
  const merged = mergeContent(DEMO_CONTENT_DEFAULTS, { seo: { title: 'Yeni SEO' } })
  assert.equal(merged.seo.title, 'Yeni SEO')
  assert.equal(merged.seo.ogTitle, DEMO_CONTENT_DEFAULTS.seo.ogTitle)
})

test('null veya geçersiz override varsayılana düşer', () => {
  assert.deepEqual(mergeContent(DEMO_CONTENT_DEFAULTS, null), DEMO_CONTENT_DEFAULTS)
  assert.deepEqual(mergeContent(DEMO_CONTENT_DEFAULTS, 'metin'), DEMO_CONTENT_DEFAULTS)
  assert.deepEqual(mergeContent(DEMO_CONTENT_DEFAULTS, []), DEMO_CONTENT_DEFAULTS)
})
