import test from 'node:test'
import assert from 'node:assert/strict'
import { elemeSebebi, turkceGorunuyor, ayiklanmisTrendler } from '../../lib/kade-search/relevance'
import { selectDailyDigestTrends } from '../../lib/kade-search/dailyDigest'
import type { CurrentTrendRow } from '../../lib/kade-search/types'

/**
 * Örnekler CANLI veriden alındı (kade_trend_current, 1 Eylül 2026). Uydurma
 * başlıklarla test etmek, gerçek listeyi bozan durumları kaçırıyordu.
 */
const TEMEL = {
  id: 'x', title: '', normalized: '', platform: 'youtube', category: 'yasam',
  score: 50, stage: 'rising', kind: 'video',
} as unknown as CurrentTrendRow

function satir(over: Partial<CurrentTrendRow>): CurrentTrendRow {
  return { ...TEMEL, ...over }
}

test('dizi bölümleri elenir — desen ASCII biçimi de tanımalı', () => {
  // `normalized` sütununda Türkçe harfler soyuluyor ("bölüm" → "bolum").
  // Eleme bu sütuna bakarken desen hiç tutmuyor, diziler listeye giriyordu.
  assert.equal(elemeSebebi(satir({ title: 'Daha 17 | 14. Bölüm', normalized: 'daha 17 | 14. bolum', category: 'film' })), 'muzik-kaydi')
  assert.equal(elemeSebebi(satir({ title: 'Sahtekarlar 3. Bolum Fragmani', normalized: 'sahtekarlar 3. bolum fragmani', category: 'yasam' })), 'dizi-kaydi')
})

test('müzik kaydı kategoriden yakalanır', () => {
  // "Mabel Matiz - Ha Leylim" hiçbir müzik işareti taşımıyor; kategori taşıyor.
  assert.equal(elemeSebebi(satir({ title: 'Mabel Matiz - Ha Leylim', normalized: 'mabel matiz - ha leylim', category: 'muzik' })), 'muzik-kaydi')
})

test('hashtagler yabancı dil ölçümünü seyreltmemeli', () => {
  // Devanagari başlık, İngilizce hashtag'lerle Latin oranını yükseltip
  // filtreden kaçıyordu.
  const hintce = satir({
    title: 'रक्षाबंधन पर ननद की विदाई 😁 #anandraja #comedy #funny #entertainment #shorts',
    normalized: 'रक्षाबंधन पर ननद की विदाई #anandraja #comedy #funny #shorts',
  })
  assert.equal(elemeSebebi(hintce), 'yabanci-dil')
})

test('Türkçe algılama ham başlığa bakar', () => {
  // normalized diakritiksiz olduğu için /[çğıöşü]/ orada ASLA eşleşmiyordu.
  const tr = satir({ title: 'Evde kolay kahvaltı böreği', normalized: 'evde kolay kahvalti boregi' })
  assert.equal(turkceGorunuyor(tr), true)
})

test('Türkçe içerik listenin başına alınır ve bu sıra korunur', () => {
  const rows = [
    satir({ id: 'a', title: 'Random english short #shorts', normalized: 'random english short', score: 99 }),
    satir({ id: 'b', title: 'Evde kolay kahvaltı böreği', normalized: 'evde kolay kahvalti boregi', score: 10 }),
    satir({ id: 'c', title: 'Another english clip', normalized: 'another english clip', score: 80 }),
  ]
  assert.equal(ayiklanmisTrendler(rows)[0].id, 'b')

  // selectDailyDigestTrends skora göre YENİDEN sıralarsa Türkçe önceliği
  // silinirdi; sıra korunmalı.
  assert.equal(selectDailyDigestTrends(rows, 3)[0].id, 'b')
})

test('günlük özet 20 öğeye kadar doldurur', () => {
  const rows = Array.from({ length: 40 }, (_, i) =>
    satir({ id: `t${i}`, title: `Türkçe içerik fikri ${i}`, normalized: `turkce icerik fikri ${i}`, score: 100 - i }))
  assert.equal(selectDailyDigestTrends(rows, 20).length, 20)
})
