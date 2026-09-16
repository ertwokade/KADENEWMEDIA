import test from 'node:test'
import assert from 'node:assert/strict'
import {
  discoveryFromRaw,
  discoveryFromTrend,
  normalizeDiscoveryScript,
  rankDiscoveryResults,
  sanitizeDiscoverySource,
} from '../../lib/kade-search/discovery'
import { detectLanguage } from '../../lib/kade-search/classify'
import type { CurrentTrendRow, RawTrendItem } from '../../lib/kade-search/types'

const NOW = new Date().toISOString()

function raw(overrides: Partial<RawTrendItem> = {}): RawTrendItem {
  return {
    platform: 'youtube', kind: 'video', external_id: 'abc', title: 'Gerçek içerik',
    url: 'https://www.youtube.com/watch?v=abc', country: 'TR', language: 'tr',
    published_at: NOW, metrics: { views: 1_000_000, likes: 50_000, comments: 2_000 },
    ...overrides,
  }
}

test('keşif listesi çıkarım kayıtlarını ve güvensiz URLleri reddeder', () => {
  assert.equal(discoveryFromRaw(raw({ inferred: true }), 'live-web'), null)
  assert.equal(discoveryFromRaw(raw({ url: 'javascript:alert(1)' }), 'live-web'), null)
  const trend = { ...raw(), id: 'stored', normalized: 'gercek', category: 'teknoloji', subcategories: [], formats: [],
    first_seen: NOW, last_seen: NOW, score: 90, inferred: true } as unknown as CurrentTrendRow
  assert.equal(discoveryFromTrend(trend), null)
})

test('canlı sonuç aynı URLde eski indeks kaydının yerini alır ve platform sırası oluşur', () => {
  const stored = discoveryFromRaw(raw(), 'live-web')!
  const live = discoveryFromRaw(raw({ title: 'Canlı başlık', metrics: { views: 2_000_000 } }), 'live-api')!
  const other = discoveryFromRaw(raw({ external_id: 'two', url: 'https://www.youtube.com/watch?v=two', metrics: { views: 500_000 } }), 'live-api')!
  const ranked = rankDiscoveryResults([{ ...stored, sourceKind: 'measured-index' }, live, other])
  assert.equal(ranked.length, 2)
  assert.equal(ranked[0].title, 'Canlı başlık')
  assert.deepEqual(ranked.map((row) => row.platformRank), [1, 2])
})

test('senaryo çıktısı sahneleri normalize eder ve yetersiz çıktıyı reddeder', () => {
  const scene = (index: number) => ({
    time: `${index * 5}-${(index + 1) * 5} sn`, visual: `Görsel ${index}`,
    narration: `Anlatım ${index}`, onScreenText: `Yazı ${index}`, camera: 'Yakın plan', transition: 'Kesme',
  })
  const script = normalizeDiscoveryScript({
    title: 'Yeni video', durationSec: 45, angle: 'Özgün açı', hook: 'İlk iki saniye',
    voiceover: 'Tam metin', scenes: [scene(0), scene(1), scene(2), scene(3)],
    caption: 'Caption', cta: 'Yorum yaz', hashtags: ['trend'], productionNotes: ['Dikey çek'],
  }, 'tr', 'Yedek')
  assert.equal(script.scenes.length, 4)
  assert.equal(script.hashtags[0], '#trend')
  assert.throws(() => normalizeDiscoveryScript({ scenes: [scene(0)] }, 'tr', 'Yedek'), /yeterli sahne/)
})

test('istemciden gelen kaynak yeniden doğrulanır', () => {
  const source = discoveryFromRaw(raw(), 'live-api')!
  assert.equal(sanitizeDiscoverySource(source)?.title, 'Gerçek içerik')
  assert.equal(sanitizeDiscoverySource({ ...source, url: 'data:text/html,x' }), null)
})

test('seçilebilir diller temel metin sinyallerinden ayırt edilir', () => {
  assert.equal(detectLanguage(raw({ title: 'Warum ist dieses Video so beliebt und wie funktioniert es?' })), 'de')
  assert.equal(detectLanguage(raw({ title: 'Pourquoi cette vidéo est devenue populaire avec une idée simple' })), 'fr')
  assert.equal(detectLanguage(raw({ title: 'Как это видео стало популярным' })), 'ru')
  assert.equal(detectLanguage(raw({ title: 'Bu video neden bu kadar popüler oldu?' })), 'tr')
})
