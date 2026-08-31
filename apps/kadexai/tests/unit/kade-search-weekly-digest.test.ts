import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formatWeeklyDigest,
  selectWeeklyDigestTrends,
  weeklyDigestKey,
} from '../../lib/kade-search/weeklyDigest'
import {
  dailyDigestKey,
  formatDailyDigest,
  formatSelectedTrend,
  selectDailyDigestTrends,
} from '../../lib/kade-search/dailyDigest'
import type { CurrentTrendRow } from '../../lib/kade-search/types'

function trend(overrides: Partial<CurrentTrendRow> = {}): CurrentTrendRow {
  return {
    id: 'trend-1', platform: 'tiktok', kind: 'video', external_id: null,
    title: 'Hızlı tarif', normalized: 'hizli tarif', url: 'https://example.com/video',
    thumbnail: null, author: null, author_url: null, description: null,
    category: 'yemek', subcategories: [], formats: [], country: 'TR', language: 'tr',
    duration_sec: 30, published_at: null, first_seen: '2026-08-20T00:00:00Z',
    last_seen: '2026-08-24T00:00:00Z', inferred: false, score: 80, velocity: 0.4,
    acceleration: 0, engagement: 0, volume_score: 0, rank_score: 0, cross_score: 0,
    freshness: 1, stage: 'rising', breakdown: {}, computed_at: null, views: 1000,
    likes: 100, comments: 10, shares: 5, saves: 4, posts: 0, followers: 0,
    rank: 1, snapshot_count: 2, link_count: 0, ...overrides,
  }
}

test('haftalık anahtar her zaman ilgili pazartesiyi kullanır', () => {
  assert.equal(weeklyDigestKey(new Date('2026-08-24T06:00:00Z')), '2026-08-24')
  assert.equal(weeklyDigestKey(new Date('2026-08-30T23:59:00Z')), '2026-08-24')
})

test('seçki önce platform ve kategori çeşitliliğini korur', () => {
  const rows = [
    trend({ id: '1', title: 'A', normalized: 'a', score: 99 }),
    trend({ id: '2', title: 'B', normalized: 'b', score: 98 }),
    trend({ id: '3', title: 'C', normalized: 'c', platform: 'instagram', category: 'moda', score: 90 }),
  ]
  const selected = selectWeeklyDigestTrends(rows, 2)
  assert.deepEqual(selected.map((row) => row.id), ['1', '3'])
})

test('WhatsApp özeti eyleme dönük fikir ve güvenli bağlantı üretir', () => {
  const message = formatWeeklyDigest([trend()], { now: new Date('2026-08-24T06:00:00Z') })
  assert.match(message, /KadeSearch · Haftalık İçerik Radarın/)
  assert.match(message, /Fikir:/)
  assert.match(message, /https:\/\/example\.com\/video/)
  assert.ok(message.length <= 1800)
})

test('javascript bağlantıları özete alınmaz', () => {
  const message = formatWeeklyDigest([trend({ url: 'javascript:alert(1)' })])
  assert.doesNotMatch(message, /javascript:/)
})

test('günlük anahtar İstanbul takvim gününü kullanır', () => {
  assert.equal(dailyDigestKey(new Date('2026-08-24T21:30:00Z')), '2026-08-25')
})

test('günlük seçki çeşitlendirilmiş seçim bağlantıları üretir', () => {
  const rows = [
    trend({ id: 'tiktok:video:abc', title: 'A', normalized: 'a', score: 99 }),
    trend({ id: 'youtube:topic:def', title: 'B', normalized: 'b', platform: 'youtube', score: 90 }),
  ]
  const selected = selectDailyDigestTrends(rows, 10)
  const message = formatDailyDigest(selected, {
    now: new Date('2026-08-25T06:00:00Z'),
    dashboardUrl: 'https://kadenewmedia.com/kadexai/dashboard/kade-search',
  })
  assert.match(message, /KadexAI · Günlük İçerik Seçimin/)
  assert.match(message, /incele/i)
  assert.match(message, /trend=tiktok%3Avideo%3Aabc/)
  assert.match(message, /trend=youtube%3Atopic%3Adef/)
  assert.ok(message.length <= 1800)
})

test('seçilen trend WhatsApp için fikir ve güvenli kaynak üretir', () => {
  const message = formatSelectedTrend(
    trend({ id: 'trend:selected' }),
    'https://kadenewmedia.com/kadexai/dashboard/trend-radar',
  )
  assert.match(message, /KadexAI · Seçtiğin İçerik/)
  assert.match(message, /İçerik fikri:/)
  assert.match(message, /https:\/\/example\.com\/video/)
  assert.match(message, /trend=trend%3Aselected/)
})
