import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_TIER_FEATURES,
  DEFAULT_TIER_LABELS,
  sanitizeFeatureMap,
  sanitizeLabelMap,
} from '../../lib/payments/pricingConfig'

test('boş veya boşluk paket adı reddedilir', () => {
  assert.deepEqual(sanitizeLabelMap({ pro: '   ', baslangic: 'Yeni Ad' }), { baslangic: 'Yeni Ad' })
})

test('paket adı 60 karakterle sınırlanır', () => {
  const long = 'A'.repeat(200)
  assert.equal(sanitizeLabelMap({ pro: long }).pro?.length, 60)
})

test('bilinmeyen tier anahtarları yok sayılır', () => {
  assert.deepEqual(sanitizeLabelMap({ enterprise: 'Kurumsal' }), {})
  assert.deepEqual(sanitizeFeatureMap({ enterprise: ['x'] }), {})
})

test('BOŞ özellik listesi reddedilir — satın alan kullanıcı yetkisiz kalmasın', () => {
  assert.deepEqual(sanitizeFeatureMap({ pro: [] }), {})
  assert.deepEqual(sanitizeFeatureMap({ pro: ['', '  '] }), {})
})

test('özellik listesi tekilleştirilir ve 40 ile sınırlanır', () => {
  assert.deepEqual(sanitizeFeatureMap({ pro: ['a', 'a', 'b'] }).pro, ['a', 'b'])
  const many = [...Array(80).keys()].map((index) => `f${index}`)
  assert.equal(sanitizeFeatureMap({ pro: many }).pro?.length, 40)
})

test('dizi olmayan özellik değeri yok sayılır', () => {
  assert.deepEqual(sanitizeFeatureMap({ pro: 'content-generation' }), {})
  assert.deepEqual(sanitizeFeatureMap(null), {})
})

test('varsayılan paket adları ve özellikleri tanımlı kalır', () => {
  for (const tier of ['baslangic', 'pro', 'sinirsiz'] as const) {
    assert.ok(DEFAULT_TIER_LABELS[tier])
    assert.ok(DEFAULT_TIER_FEATURES[tier].length > 0)
  }
})
