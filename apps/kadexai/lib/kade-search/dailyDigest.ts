import type { CurrentTrendRow } from './types'
import { selectWeeklyDigestTrends } from './weeklyDigest'
import { ayiklanmisTrendler } from './relevance'

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram: 'Instagram',
  google: 'Google',
  reddit: 'Reddit',
  music: 'Müzik',
}

/** Tek satırlık öğede yer kaplamasın diye aşama kısa bir işaretle gösterilir. */
const STAGE_MARKS: Record<string, string> = {
  emerging: '✦',
  rising: '↑',
  peak: '●',
  plateau: '→',
  declining: '↓',
}

const STAGE_LABELS: Record<string, string> = {
  emerging: 'Yeni doğuyor',
  rising: 'Yükseliyor',
  peak: 'Zirvede',
  plateau: 'Dengede',
  declining: 'Düşüyor',
}

function clean(value: unknown, max = 80) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function safeLink(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function dateKey(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function dailyDigestKey(now = new Date()) {
  return dateKey(now)
}

/**
 * Günlük özete girecek satırlar.
 *
 * Önce alakasız kayıtlar ayıklanır (şarkı klipleri, dizi bölümleri, yabancı
 * dildeki shorts'lar) ve Türkçe olanlar öne alınır; ardından platform/kategori
 * çeşitliliğine göre seçim yapılır. Ayıklama olmadan liste YouTube TR trend
 * sayfasının kopyasına dönüyordu.
 */
export function selectDailyDigestTrends(rows: CurrentTrendRow[], limit = 20) {
  return selectWeeklyDigestTrends(ayiklanmisTrendler(rows), limit)
}

export function formatDailyDigest(
  rows: CurrentTrendRow[],
  opts: { now?: Date; dashboardUrl?: string } = {},
) {
  const now = opts.now ?? new Date()
  const dashboardUrl = opts.dashboardUrl ?? 'https://kadenewmedia.com/kadexai/dashboard/kade-search'
  const date = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', weekday: 'long',
  }).format(now)
  const header = [
    '*KadexAI · Günlük İçerik Seçimin*',
    date,
    '',
    'Onayladığın içerik için çekime hazır üretim paketi hazırlanır.',
    '',
  ]
  const footer = ['', `Onaylamak için: ${dashboardUrl}`]

  if (!rows.length) {
    return [...header, 'Bugün yeni bir içerik adayı bulunamadı.', ...footer].join('\n').slice(0, 1800)
  }

  // Her satıra ayrı bir onay bağlantısı konuyordu; bağlantı ~110 karakter
  // tuttuğu için mesaj 1780 sınırına 3-4 öğede dayanıyor ve döngü kırılıyordu.
  // Bağlantı sona tek sefer taşındı, öğeler iki satıra indi; böylece 20 öğe
  // rahatça sığıyor.
  const lines = [...header]
  for (const [index, trend] of rows.entries()) {
    const mark = STAGE_MARKS[trend.stage ?? ''] ?? '·'
    const item = [
      `${index + 1}. *${clean(trend.title, 46)}* — ${PLATFORM_LABELS[trend.platform] ?? trend.platform} ${mark}${Math.round(trend.score ?? 0)}`,
    ]
    if ([...lines, ...item, ...footer].join('\n').length > 1780) break
    lines.push(...item)
  }
  return [...lines, ...footer].join('\n').slice(0, 1800)
}

function contentAngle(trend: CurrentTrendRow) {
  const topic = clean(trend.title, 58)
  if (trend.kind === 'sound') return `“${topic}” sesiyle üç sahneli bir dönüşüm videosu hazırla.`
  if (trend.kind === 'hashtag' || trend.kind === 'challenge') return `“${topic}” akımını markanın günlük hayatına uyarlayan bir POV çek.`
  if (trend.kind === 'keyword' || trend.kind === 'topic') return `“${topic}” konusunu 30 saniyede üç maddede anlat; sonucu ilk iki saniyede göster.`
  return `“${topic}” formatını kendi nişine uyarlayan kısa bir önce/sonra veya üç adımlı video çek.`
}

export function formatSelectedTrend(trend: CurrentTrendRow, dashboardUrl: string) {
  const lines = [
    '*KadexAI · Seçtiğin İçerik*',
    '',
    `*${clean(trend.title, 90)}*`,
    `${PLATFORM_LABELS[trend.platform] ?? trend.platform} · ${STAGE_LABELS[trend.stage ?? ''] ?? 'İzlemede'} · skor ${Math.round(trend.score ?? 0)}`,
    '',
    `İçerik fikri: ${contentAngle(trend)}`,
  ]
  const source = safeLink(trend.url)
  if (source) lines.push(`Kaynak: ${source}`)
  lines.push(`KadexAI detayı: ${dashboardUrl}?trend=${encodeURIComponent(trend.id)}`)
  return lines.join('\n').slice(0, 1800)
}
