import type { CurrentTrendRow } from './types'

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram: 'Instagram',
  google: 'Google',
  reddit: 'Reddit',
  music: 'Müzik',
}

const STAGE_LABELS: Record<string, string> = {
  emerging: 'Yeni doğuyor',
  rising: 'Yükseliyor',
  peak: 'Zirvede',
  plateau: 'Dengede',
  declining: 'Düşüyor',
  dead: 'Bitti',
}

function clean(value: unknown, max = 90) {
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

function contentAngle(trend: CurrentTrendRow) {
  const topic = clean(trend.title, 58)
  switch (trend.kind) {
    case 'sound':
      return `“${topic}” sesiyle 3 sahneli bir dönüşüm/Reels kurgusu çek.`
    case 'hashtag':
    case 'challenge':
      return `“${topic}” akımını markanın günlük hayatına uyarlayan bir POV çek.`
    case 'keyword':
    case 'topic':
      return `“${topic}” konusunu 30 saniyede 3 maddede anlat; ilk 2 saniyede sonucu göster.`
    case 'creator':
      return `“${topic}” yaklaşımını analiz eden kısa bir tepki/duet videosu hazırla.`
    default:
      return `“${topic}” formatını kendi nişine uyarlayıp önce/sonra veya 3 adımlı kısa video çek.`
  }
}

/** Haftanın pazartesisini UTC bazında kararlı bir tekrar-engelleme anahtarına çevirir. */
export function weeklyDigestKey(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

/** Aynı platform/kategorinin listeyi ele geçirmesini önleyerek gönderilecek seçkiyi oluşturur. */
export function selectWeeklyDigestTrends(rows: CurrentTrendRow[], limit = 4) {
  const ordered = [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const selected: CurrentTrendRow[] = []
  const titles = new Set<string>()
  const platforms = new Set<string>()
  const categories = new Set<string>()

  const add = (row: CurrentTrendRow) => {
    const title = clean(row.normalized || row.title).toLocaleLowerCase('tr-TR')
    if (!title || titles.has(title) || selected.length >= limit) return false
    titles.add(title)
    platforms.add(row.platform)
    if (row.category) categories.add(row.category)
    selected.push(row)
    return true
  }

  for (const row of ordered) {
    if (selected.length >= limit) break
    if (!platforms.has(row.platform) || (row.category && !categories.has(row.category))) add(row)
  }
  for (const row of ordered) {
    if (selected.length >= limit) break
    add(row)
  }
  return selected
}

export function formatWeeklyDigest(
  rows: CurrentTrendRow[],
  opts: { now?: Date; dashboardUrl?: string } = {},
) {
  const now = opts.now ?? new Date()
  const dashboardUrl = opts.dashboardUrl ?? 'https://kadenewmedia.com/kadexai/dashboard/trend-radar'
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: 'numeric',
    month: 'short',
  })
  const start = new Date(now.getTime() - 6 * 86400e3)
  const lines = [
    '*KadeSearch · Haftalık İçerik Radarın*',
    `${formatter.format(start)} – ${formatter.format(now)}`,
    '',
  ]

  if (!rows.length) {
    lines.push('Bu hafta yeterli güncel sinyal oluşmadı. Kaynak toplama durumu için Trend Radar’ı kontrol et.')
  } else {
    rows.forEach((trend, index) => {
      const meta = [
        PLATFORM_LABELS[trend.platform] ?? trend.platform,
        clean(trend.category || 'Genel', 24),
        STAGE_LABELS[trend.stage ?? ''] ?? 'İzlemede',
        `skor ${Math.round(trend.score ?? 0)}`,
      ].join(' · ')
      lines.push(`${index + 1}. *${clean(trend.title)}*`)
      lines.push(meta)
      lines.push(`Fikir: ${contentAngle(trend)}`)
      const link = safeLink(trend.url)
      if (link) lines.push(`Kaynak: ${link}`)
      lines.push('')
    })
  }

  lines.push(`Tüm radar: ${dashboardUrl}`)
  return lines.join('\n').slice(0, 1800)
}
