import test from 'node:test'
import assert from 'node:assert/strict'
import { humanizeCodeList, humanizeKey, humanizeValue } from '../../lib/ui/outputLabels'

test('JSON anahtarları Türkçe karakterleriyle ve büyük harf bozulması olmadan etiketlenir', () => {
  assert.equal(humanizeKey('baslik'), 'Başlık')
  assert.equal(humanizeKey('aciklama'), 'Açıklama')
  assert.equal(humanizeKey('tarih_onerisi'), 'Tarih önerisi')
  assert.equal(humanizeKey('icerik_turu'), 'İçerik türü')
  assert.equal(humanizeKey('saglikSkoru'), 'Sağlık skoru')
  assert.equal(humanizeKey('veriEksigi'), 'Veri eksiği')
  assert.equal(humanizeKey('hizliKazanimlar'), 'Hızlı kazanımlar')
  assert.equal(humanizeKey('aracAdi'), 'Araç adı')
  assert.equal(humanizeKey('ideas'), 'Fikirler')
  assert.equal(humanizeKey('analysis'), 'Analiz')
  assert.equal(humanizeKey('onScreenText'), 'Ekran yazısı')
  assert.equal(humanizeKey('sicak_trendler'), 'Sıcak trendler')
  assert.equal(humanizeKey('niche'), 'Niş')
})

test('kodlanmış değerler okunur hâle gelir, serbest metin değişmez', () => {
  assert.equal(humanizeValue('veri_yok'), 'Veri yok')
  assert.equal(humanizeValue('bu_hafta'), 'Bu hafta')
  assert.equal(humanizeValue('zayif'), 'Zayıf')
  assert.equal(humanizeValue('egitici'), 'Eğitici')
  assert.equal(humanizeValue('knowledge'), 'Bilgi')
  assert.equal(humanizeValue(true), 'Evet')
  assert.equal(humanizeValue('Bu videoda zayif noktaları anlatıyorum'), 'Bu videoda zayif noktaları anlatıyorum')
  assert.equal(humanizeCodeList('Puanlanamayan: bio, son_icerikler'), 'Puanlanamayan: bio, son içerikler')
})
