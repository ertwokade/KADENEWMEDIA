import test from 'node:test'
import assert from 'node:assert/strict'
import { removeInventedChapters, removeUnfilledPlaceholders } from '../../lib/ai/outputCleanup'

test('doldurulmamış bağlantı yer tutucusu satırıyla birlikte kaldırılır', () => {
  const text = 'Kade New Media ile tanışın.\n👉 Web sitemiz: [Web Sitesi Linki]\nÜcretsiz keşif görüşmesi için yazın.'
  assert.equal(removeUnfilledPlaceholders(text), 'Kade New Media ile tanışın.\nÜcretsiz keşif görüşmesi için yazın.')
})

test('video süresi verilmediyse uydurma bölüm zaman damgaları kaldırılır', () => {
  const text = 'Küçük işletmeler için rehber.\n\nBölümler: 00:00 Giriş 01:15 Yanlış Hedef Kitle Seçimi 02:30 Düzensiz Paylaşım Yapmak\n\nAbone olmayı unutmayın.'
  const cleaned = removeInventedChapters(text, 'Başlık: 5 hata')
  assert.doesNotMatch(cleaned, /\d{2}:\d{2}/)
  assert.match(cleaned, /Küçük işletmeler için rehber\./)
  assert.match(cleaned, /Abone olmayı unutmayın\./)
  assert.equal(removeInventedChapters(text, 'Video süresi 03:10, 01:15 hedef kitle'), text)
})

test('sohbet girişi silinir, gerçek ilk paragraf korunur', async () => {
  const { removeChatIntro } = await import('../../lib/ai/outputCleanup')
  assert.equal(removeChatIntro('Videonuzu analiz ederek hazırladığım raporu aşağıda bulabilirsiniz.\n\n## Özet\nMetin'), '## Özet\nMetin')
  assert.equal(removeChatIntro('Merhaba! İşte analiz:\n\nİçerik'), 'İçerik')
  const real = 'Başlık ile metin arasında uyumsuzluk var.\n\nİkinci paragraf'
  assert.equal(removeChatIntro(real), real)
})
