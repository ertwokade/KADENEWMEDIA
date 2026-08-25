import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildApprovalDraft, formatApprovalWhatsApp, normalizeApprovalStatus, sanitizeApprovalIdea } from '../../lib/kade-search/approvals'
import { formatWeeklySiteReport, weeklySiteReportKey, type WeeklySiteAudit } from '../../lib/reports/weeklySiteReport'

const idea = sanitizeApprovalIdea({
  trendId: 'google:keyword:abc', baslik: 'AI içerik sistemi', kategori: 'Teknoloji',
  kanca: 'İçerik ekibinin kaybettiği zamanı göster', kurgu: ['0-2 sn: Sonuç', '2-10 sn: Süreç'],
  cta: 'Kontrol listesini kaydet', hashtagler: ['kadeai', '#icerik'], paylasimSaati: ['19:00'],
  neden: 'Arama ilgisi yükseliyor.', kaynak: { platform: 'Google', url: 'https://example.com/topic', skor: 81, asama: 'Yükseliyor' },
  format: { label: 'Kısa video', aciklama: 'Dikey anlatım' },
})

test('onay fikri temizlenir ve üretim paketine dönüşür', () => {
  const draft = buildApprovalDraft(idea)
  assert.equal(draft.title, 'AI içerik sistemi')
  assert.deepEqual(draft.hashtags, ['#kadeai', '#icerik'])
  assert.match(draft.visualBrief, /Kade New Media/)
  assert.equal(normalizeApprovalStatus('invalid'), 'pending')
})

test('onaylı içerik WhatsApp mesajı güvenli ve eyleme dönüktür', () => {
  const message = formatApprovalWhatsApp(idea, buildApprovalDraft(idea), 'https://kadenewmedia.com/kadeai/dashboard/kade-search')
  assert.match(message, /Onaylı İçerik Paketi/)
  assert.match(message, /#kadeai/)
  assert.doesNotMatch(message, /javascript:/)
  assert.ok(message.length <= 1800)
})

test('haftalık rapor tarih anahtarı ve hata özeti üretir', () => {
  assert.equal(weeklySiteReportKey(new Date('2026-08-25T21:30:00Z')), '2026-08-26')
  const audit: WeeklySiteAudit = {
    generatedAt: '2026-08-26T06:00:00Z',
    pages: [{ path: '/', status: 200, durationMs: 420, ok: true }, { path: '/blog', status: 500, durationMs: 900, ok: false }],
    averageDurationMs: 660, titlePresent: true, h1Present: true, canonicalPresent: true,
    structuredDataPresent: true, sitemapOk: true, sitemapUrlCount: 207, robotsOk: true, aiCrawlerRules: 8,
  }
  const message = formatWeeklySiteReport(audit, 'https://kadenewmedia.com/kadeai/dashboard')
  assert.match(message, /Haftalık Site Raporu/)
  assert.match(message, /\/blog \(500\)/)
  assert.match(message, /207 URL/)
})
