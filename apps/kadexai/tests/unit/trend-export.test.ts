import test from 'node:test'
import assert from 'node:assert/strict'
import { csvCell, hasMeasuredVelocity, trendCsv } from '../../lib/kade-search/export'
import type { CurrentTrendRow } from '../../lib/kade-search/types'

const fixture: CurrentTrendRow = {
  id: 'fixture', platform: 'youtube', kind: 'video', external_id: null, title: 'Türkçe 🎬', normalized: 'turkce',
  url: null, thumbnail: null, author: null, author_url: null, description: null, category: null,
  subcategories: [], formats: [], country: 'TR', language: 'tr', duration_sec: null, published_at: null,
  first_seen: '2026-09-06T10:00:00Z', last_seen: '2026-09-06T11:00:00Z', inferred: false,
  score: null, velocity: null, acceleration: null, engagement: null, volume_score: null, rank_score: null,
  cross_score: null, freshness: null, stage: null, breakdown: null, computed_at: null,
  views: null, likes: null, comments: null, shares: null, saves: null, posts: null, followers: null,
  rank: null, snapshot_count: 1, link_count: 0,
}

test('CSV protects spreadsheet formulas, quotes, Turkish text and real negative numbers', () => {
  assert.equal(csvCell(' =HYPERLINK("x")'), '"\' =HYPERLINK(""x"")"')
  assert.equal(csvCell('@SUM(A1)'), '"\'@SUM(A1)"')
  assert.equal(csvCell('İstanbul, güzel'), '"İstanbul, güzel"')
  assert.equal(csvCell(-12.5), '"-12.5"')
  assert.equal(csvCell(null), '""')
  assert.equal(csvCell(NaN), '""')
})

test('only verified measurements produce a growth number; unknown is not zero', () => {
  const row = { inferred: false, snapshot_count: 2, velocity: 0, breakdown: { hizOlculdu: true } }
  assert.equal(hasMeasuredVelocity(row), true)
  assert.equal(hasMeasuredVelocity({ ...row, inferred: true }), false)
  assert.equal(hasMeasuredVelocity({ ...row, breakdown: null }), false)
  assert.equal(hasMeasuredVelocity({ ...row, velocity: null }), false)
  assert.equal(hasMeasuredVelocity({ ...row, snapshot_count: 1 }), false)
  const csv = trendCsv([{ ...fixture, ...row, velocity: .125 }])
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes('"12.5","Ölçüldü"'))
  const unknown = trendCsv([{ ...fixture, ...row, inferred: true }])
  assert.ok(unknown.includes('"","Yeterli doğrulanmış ölçüm yok","Çıkarım"'))
})
