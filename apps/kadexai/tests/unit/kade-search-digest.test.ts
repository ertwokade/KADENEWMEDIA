import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDailyDigest, selectDailyDigestTrends } from '../../lib/kade-search/dailyDigest'
import { ayiklanmisTrendler, elemeSebebi } from '../../lib/kade-search/relevance'

const satir = (over: Record<string, unknown> = {}) => ({
  id: String(Math.random()), title: 'Başlık', platform: 'tiktok',
  stage: 'rising', score: 50, ...over,
}) as never

test('alakasız kayıtlar günlük özete girmez', () => {
  assert.equal(elemeSebebi(satir({ title: 'Daha 17 | 14. Bölüm' })), 'dizi-kaydi')
  assert.equal(elemeSebebi(satir({ platform: 'music', title: 'PRESS PLAY' })), 'muzik-platformu')
  assert.equal(elemeSebebi(satir({ title: 'Sezen Aksu (Official Music Video)' })), 'muzik-kaydi')
  assert.equal(elemeSebebi(satir({ title: 'रक्षाबंधन पर ननद की विदाई' })), 'yabanci-dil')
  // Emoji içeren Türkçe başlık elenmemeli.
  assert.equal(elemeSebebi(satir({ title: 'Evde 5 dakikada kahvaltı 🍳 nasıl yapılır' })), null)
})

test('Türkçe başlıklar listenin başına alınır', () => {
  const sirali = ayiklanmisTrendler([
    satir({ title: 'Amazing morning routine', score: 90 }),
    satir({ title: 'Sabah rutini nasıl kurulur', score: 10 }),
  ])
  assert.equal(sirali[0].title, 'Sabah rutini nasıl kurulur')
})

test('yirmi öğe WhatsApp mesajına sığar', () => {
  // Öğe başına ayrı bir onay bağlantısı konduğunda mesaj 1780 sınırına 3-4
  // öğede dayanıyor ve döngü kırılıyordu; bu test o gerilemeyi yakalar.
  const rows = Array.from({ length: 20 }, (_, i) => satir({
    id: `trend-${i}`,
    title: `Türkçe içerik başlığı örneği numara ${i + 1} biraz uzun olsun diye`,
    score: 90 - i,
  }))
  const msg = formatDailyDigest(rows, { dashboardUrl: 'https://kadenewmedia.com/kadexai/dashboard/kade-search' })
  const girenler = (msg.match(/^\d+\. /gm) ?? []).length
  assert.equal(girenler, 20, `mesaja yalnızca ${girenler} öğe girdi`)
  assert.ok(msg.length <= 1800, `mesaj ${msg.length} karakter`)
})

test('seçim varsayılanı yirmi öğedir', () => {
  const rows = Array.from({ length: 60 }, (_, i) => satir({
    id: `t-${i}`, title: `Türkçe başlık ${i}`, score: 100 - i,
    platform: i % 3 === 0 ? 'tiktok' : i % 3 === 1 ? 'youtube' : 'instagram',
  }))
  assert.equal(selectDailyDigestTrends(rows).length, 20)
})
