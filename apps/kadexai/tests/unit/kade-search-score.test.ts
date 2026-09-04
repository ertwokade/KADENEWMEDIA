import test from 'node:test'
import assert from 'node:assert/strict'
import { detectLanguage } from '../../lib/kade-search/classify'
import { scoreTrend } from '../../lib/kade-search/score'
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
