import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeIdeaOutput } from '../../lib/kade-search/ideaOutput'

const valid = { trendId: 'id', kanca: 'Kanca', kurgu: ['A', 'B', 'C'], cta: 'Kaydet' }

test('partial or malformed AI replies cannot replace a complete template', () => {
  for (const value of [null, [], {}, { ...valid, cta: null }, { ...valid, kurgu: [{}, true, 'C'] }, { ...valid, kurgu: ['A', 'A', 'A'] }]) {
    assert.equal(normalizeIdeaOutput(value), null)
  }
  assert.equal(normalizeIdeaOutput(valid)?.kanca, 'Kanca')
})

test('Radar shares normalized deduplicated hashtags and excludes fabricated objects', () => {
  const output = normalizeIdeaOutput({ ...valid, hashtagler: ['#İçerik', '#icerik', {}, '#Şehir'], alternatifKancalar: [{}, 'Alternatif'] })!
  assert.deepEqual(output.hashtagler, ['#icerik', '#sehir'])
  assert.deepEqual(output.alternatifKancalar, ['Alternatif'])
})

test('invalid clock values and arbitrary difficulty labels are rejected', () => {
  const output = normalizeIdeaOutput({ ...valid, paylasimSaati: ['99:99', '24:00', '12:60', '19:00-21:00', '23:59'], zorluk: { level: 'Kesin viral', note: 'iddia' } })!
  assert.deepEqual(output.paylasimSaati, ['19:00-21:00', '23:59'])
  assert.equal(output.zorluk, null)
})
