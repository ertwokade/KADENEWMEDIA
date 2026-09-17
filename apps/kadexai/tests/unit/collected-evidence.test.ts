import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCollected, normalizeName } from '../../lib/client/collectedEvidence'

test('Trend Radar kanal adı boşluk ve büyük harf farkına rağmen eşleşir, başka kanallar alınmaz', () => {
  assert.equal(normalizeName('FatihSelim Tube'), normalizeName('fatihselim tube'))
  const items = mergeCollected('FatihSelim Tube', [], [
    { title: 'Yeni video', author: 'Fatih Selim Tube', url: 'https://youtube.com/watch?v=1', views: 1200 },
    { title: 'Başka', author: 'Evrim Ağacı', url: 'https://youtube.com/watch?v=2', views: 5 },
    { title: 'Yeni video', author: 'Fatih Selim Tube', url: 'https://youtube.com/watch?v=1', views: 1200 },
  ])
  assert.equal(items.length, 1)
  assert.equal(items[0].source, 'Trend Radar')
  assert.equal(items[0].views, 1200)
})
