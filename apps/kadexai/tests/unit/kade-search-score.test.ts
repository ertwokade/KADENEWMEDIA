import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyCategory, detectLanguage } from '../../lib/kade-search/classify'
import { computeVelocity, scoreTrend } from '../../lib/kade-search/score'
import type { RawTrendItem, SnapshotRow, TrendRow } from '../../lib/kade-search/types'

test('ülke kodu belirsiz içeriğe dil uydurmaz', () => {
  const item = { title: 'Summer morning routine', country: 'TR' } as RawTrendItem
  assert.equal(detectLanguage(item), 'und')
})

test('tek ölçüm sahte hız veya hız puanı üretmez', () => {
  const trend = {
    id: 'trend-1', first_seen: new Date().toISOString(), published_at: new Date().toISOString(), inferred: false,
  } as TrendRow
  const snapshot = {
    trend_id: trend.id, captured_at: new Date().toISOString(), views: 100_000,
    posts: 0, followers: 0, likes: 5_000, comments: 50, shares: 10, saves: 0, rank: 3,
  } as SnapshotRow
  const score = scoreTrend(trend, [snapshot])

  assert.ok(score)
  assert.equal(score.velocity, 0)
  assert.equal(score.breakdown.hizOlculdu, false)
  assert.equal(score.breakdown.hiz, 0)
  assert.notEqual(score.stage, 'peak')
})

test('birbirine yakın kategori sinyallerinde kesin kategori uydurmaz', () => {
  const category = classifyCategory({ platform: 'google', kind: 'topic', title: 'fitness teknoloji' })
  assert.equal(category.category, 'diger')
  assert.ok(category.confidence < 0.5)
  assert.ok(category.subcategories.length >= 2)
})

function snap(minutes: number, views: number | null, extra = {}) {
  return { captured_at: new Date(Date.UTC(2026, 8, 5, 0, minutes)).toISOString(), views, posts: null, followers: null, ...extra } as unknown as SnapshotRow
}

test('hız için en az 30 dakika aralıklı iki geçerli ölçüm gerekir', () => {
  assert.equal(computeVelocity([snap(0, 100), snap(29, 110)]), null)
  assert.equal(computeVelocity([snap(0, 100), snap(0, 110)]), null)
  assert.equal(computeVelocity([snap(0, 100), { ...snap(30, 110), captured_at: 'invalid' }]), null)
  assert.ok(Math.abs(computeVelocity([snap(0, 100), snap(30, 110)])! - 4.8) < 1e-9)
})

test('ölçümler zaman sırasına alınır, girdi değiştirilmez', () => {
  const snapshots = [snap(60, 110), snap(0, 100), snap(59, 109)]
  assert.ok(Math.abs(computeVelocity(snapshots)! - 2.4) < 1e-9)
  assert.equal(snapshots[0].views, 110)
})

test('sıfır taban, eksik metrik veya değişen ölçüm türü sahte büyüme üretmez', () => {
  assert.equal(computeVelocity([snap(0, 0), snap(60, 100)]), null)
  assert.equal(computeVelocity([snap(0, 100), snap(60, null)]), null)
  assert.equal(computeVelocity([snap(0, 100), snap(60, null, { posts: 100 })]), null)
  assert.equal(computeVelocity([snap(0, 100), snap(60, 100, { posts: 100 })]), 0)
  assert.equal(computeVelocity([snap(0, 100), snap(60, 0)]), -3)
})

test('türetilmiş kayıtların hızı ölçülmüş gibi etiketlenmez', () => {
  const trend = { id: 'inferred', first_seen: new Date().toISOString(), inferred: true } as TrendRow
  const score = scoreTrend(trend, [snap(0, 100), snap(60, 110), snap(120, 140)])!
  assert.equal(score.breakdown.hizOlculdu, false)
  assert.equal(score.velocity, 0)
  assert.equal(score.acceleration, 0)
  assert.equal(scoreTrend(trend, [{ ...snap(0, 100), captured_at: 'invalid' }]), null)
})

test('skor kırılımının toplamı karttaki skora eşittir', () => {
  const trend = { id: 'sum', first_seen: new Date().toISOString(), published_at: new Date().toISOString(), inferred: false } as TrendRow
  const measured = scoreTrend(trend, [snap(0, 50_000, { likes: 900, rank: 4 }), snap(120, 80_000, { likes: 1_500, rank: 2 })])!
  const single = scoreTrend(trend, [snap(0, 50_000, { likes: 900, rank: 4 })])!
  for (const score of [measured, single]) {
    const b = score.breakdown as Record<string, number>
    const total = b.hacim + b.hiz + b.etkilesim + b.siralama + b.caprazPlatform + b.tazelik
    assert.ok(Math.abs(total - score.score) <= 3, `${total} vs ${score.score}`)
  }
})
