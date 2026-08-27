import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildContentStudioPrompt,
  formatContentPackageWhatsApp,
  normalizeContentStudioPackage,
  sanitizeSourceUrl,
  sanitizeVoiceSamples,
  voiceStrength,
} from '../../lib/contentStudio'

test('içerik stüdyosu girdileri güvenli sınırlar içinde normalize edilir', () => {
  assert.equal(sanitizeSourceUrl('javascript:alert(1)'), null)
  assert.equal(sanitizeSourceUrl('https://example.com/video'), 'https://example.com/video')
  const samples = sanitizeVoiceSamples(['kısa', 'Bu benim gerçek yazı örneğimdir ve yeterince uzun bir cümledir.'])
  assert.equal(samples.length, 1)
  assert.ok(voiceStrength(samples) > 0)
  assert.ok(voiceStrength(['x'.repeat(4000), 'y'.repeat(4000), 'z'.repeat(4000)]) <= 100)
})

test('model çıktısı yayın paketine ve WhatsApp özetine dönüşür', () => {
  const output = normalizeContentStudioPackage({
    title: 'Kaynak bağlı içerik', sourceSummary: 'Gerçek kaynağın özeti.',
    thread: ['İlk post', 'İkinci post'], linkedIn: 'LinkedIn metni',
    newsletter: { subject: 'Haftalık not', body: 'Bülten metni' },
    captions: { instagram: 'Instagram metni', tiktok: 'TikTok metni', youtube: 'YouTube metni' },
    summary: ['Birinci bulgu', 'İkinci bulgu'], quotes: ['Kaynak alıntısı'],
    evidence: [{ claim: 'Birinci bulgu', evidence: 'Kaynakta geçen kanıt' }],
  }, 'Yedek')
  assert.equal(output.thread.length, 2)
  assert.equal(output.evidence[0].claim, 'Birinci bulgu')
  const message = formatContentPackageWhatsApp(output, 'https://kadenewmedia.com/kadeai/dashboard/content-studio')
  assert.match(message, /Haftalık İçerik Paketi/)
  assert.match(message, /Instagram metni/)
  assert.ok(message.length <= 1800)
})

test('üretim promptu kaynak gerçekliği ve ses ayrımını açık tutar', () => {
  const prompt = buildContentStudioPrompt({
    sourceTitle: 'Deneme', sourceUrl: null,
    sourceText: 'Kaynak metin '.repeat(20),
    voiceSamples: ['Bu benim yazı sesimi gösteren yeterince uzun bir örnektir.'],
  })
  assert.match(prompt, /KAYNAK METİN/)
  assert.match(prompt, /MARKA SESİ/)
  assert.match(prompt, /evidence/)
})
