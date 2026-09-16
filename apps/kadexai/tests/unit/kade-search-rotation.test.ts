import test from 'node:test'
import assert from 'node:assert/strict'
import { rotationSource } from '../../lib/kade-search/rotation'

const SOURCES = ['googleTrends', 'youtube', 'musicCharts', 'reddit', 'tiktok', 'instagram'] as const

test('zamanlanmış toplama erişimi olmayan kaynağı hiç seçmez', () => {
  const noSocial = (id: string) => id !== 'tiktok' && id !== 'instagram'
  const picked = new Set<string>()
  for (let hour = 0; hour < 48; hour += 2) picked.add(rotationSource(SOURCES, noSocial, Date.UTC(2026, 8, 16, hour, 17))!)
  assert.deepEqual([...picked].sort(), ['googleTrends', 'musicCharts', 'reddit', 'youtube'])
  // Canlı olayda 16.09.2026 08:17 UTC dilimi TikTok'a düşüp sıfır kayıt üretiyordu.
  assert.notEqual(rotationSource(SOURCES, noSocial, Date.UTC(2026, 8, 16, 8, 17)), 'tiktok')
})

test('erişim eklenince kaynak kendiliğinden döngüye girer, hiç kaynak yoksa null döner', () => {
  const picked = new Set<string>()
  for (let hour = 0; hour < 48; hour += 2) picked.add(rotationSource(SOURCES, () => true, Date.UTC(2026, 8, 16, hour, 17))!)
  assert.equal(picked.size, 6)
  assert.equal(rotationSource(SOURCES, () => false), null)
})
