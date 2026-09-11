import test from 'node:test'
import assert from 'node:assert/strict'
import { uniqueAlerts, withAlertTrend } from '../../lib/kade-search/alerts'

test('same cross-platform observation keeps the first (newest) alert across source IDs', () => {
  const rows = [
    { id: 12, trend_id: 'youtube:a', type: 'cross_platform', message: '"Ha Leylim" 4 platformda görülüyor' },
    { id: 11, trend_id: 'music:a', type: 'cross_platform', message: ' "Ha Leylim"  4 platformda görülüyor ' },
    { id: 10, trend_id: 'tiktok:a', type: 'cross_platform', message: '"Ha Leylim" 3 platformda görülüyor' },
  ]
  assert.deepEqual(uniqueAlerts(rows).map(row => row.id), [12, 10])
  assert.equal(rows.length, 3)
})

test('different alert types and watchlist trend identities are not collapsed', () => {
  const base = { type: 'watchlist', trend_id: 'a', message: 'Eşleşme' }
  assert.equal(uniqueAlerts([base, { ...base }, { ...base, trend_id: 'b' }, { ...base, type: 'breakout' }]).length, 3)
})

test('trend enrichment preserves alert ID, type and seen state', () => {
  const alert = { id: 52, trend_id: 'youtube:a', type: 'breakout', seen: false }
  const trend = { id: 'youtube:a', title: 'Örnek', platform: 'youtube', url: 'https://youtube.com/watch?v=a' }
  assert.deepEqual(withAlertTrend(alert, trend), { ...alert, title: trend.title, platform: trend.platform, url: trend.url })
  assert.deepEqual(withAlertTrend(alert), alert)
})
