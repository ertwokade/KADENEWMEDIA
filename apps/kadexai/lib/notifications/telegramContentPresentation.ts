import { parseTelegramContentLink, type TelegramContentPlatform } from './telegramContentLinks'

export interface TelegramSavedContent {
  id: string
  chat_id: string
  platform: TelegramContentPlatform
  canonical_url: string
  title: string | null
  description: string | null
  author_name: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  metadata_source: string
  metrics_source: string | null
  metrics_status: 'available' | 'partial' | 'unavailable'
  metric_updated_at: string | null
  production_status: 'pending' | 'shot'
  shot_at: string | null
  added_at: string
  updated_at: string
}

export type TelegramContentSort = 'performance' | 'latest'

function compact(value: unknown, max = 110) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function count(value: number | null) {
  return value === null ? null : new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function istanbulTime(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'veri alınamadı'
  return new Date(value).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function contentPerformanceValue(row: TelegramSavedContent) {
  if (row.views !== null) return row.views
  const values = [row.likes, row.comments, row.shares, row.saves]
  if (values.every((value) => value === null)) return null
  return (row.likes ?? 0) + (row.comments ?? 0) * 3 + (row.shares ?? 0) * 5 + (row.saves ?? 0) * 4
}

export function sortTelegramSavedContent(rows: TelegramSavedContent[], sort: TelegramContentSort) {
  return [...rows].sort((left, right) => {
    if (sort === 'performance') {
      const a = contentPerformanceValue(left)
      const b = contentPerformanceValue(right)
      if (a !== null || b !== null) {
        if (a === null) return 1
        if (b === null) return -1
        if (a !== b) return b - a
      }
    }
    return Date.parse(right.added_at) - Date.parse(left.added_at)
  })
}

function metricsLine(row: TelegramSavedContent) {
  const metrics = [
    row.views === null ? null : `👁 ${count(row.views)}`,
    row.likes === null ? null : `❤ ${count(row.likes)}`,
    row.comments === null ? null : `💬 ${count(row.comments)}`,
    row.shares === null ? null : `↗ ${count(row.shares)}`,
    row.saves === null ? null : `🔖 ${count(row.saves)}`,
  ].filter(Boolean)
  return metrics.length ? metrics.join(' · ') : 'Performans: veri alınamadı'
}

function contentTitle(row: TelegramSavedContent) {
  const supplied = compact(row.title || row.description)
  if (supplied) return supplied
  const link = parseTelegramContentLink(row.canonical_url)
  const kind = row.platform === 'instagram'
    ? 'Instagram Reel'
    : row.canonical_url.includes('/photo/') ? 'TikTok fotoğrafı' : 'TikTok videosu'
  return `${kind} · ${link?.externalId ?? row.id.slice(0, 8)}`
}

export function formatTelegramContentList(
  rows: TelegramSavedContent[],
  options: {
    title: string
    sort: TelegramContentSort
    limit?: number
    page?: number
    command?: string
  },
) {
  const limit = Math.max(1, Math.min(options.limit ?? 8, 10))
  const sorted = sortTelegramSavedContent(rows, options.sort)
  const totalPages = Math.max(1, Math.ceil(sorted.length / limit))
  const page = Math.max(1, Math.min(options.page ?? 1, totalPages))
  const offset = (page - 1) * limit
  const selected = sorted.slice(offset, offset + limit)
  if (!sorted.length) {
    return `${options.title}\n\nHenüz kayıtlı içerik yok. Bir Instagram Reel veya TikTok bağlantısını doğrudan göndererek ekleyebilirsin.`
  }
  const command = options.command ?? 'icerikler'
  return [
    `${options.title} · Sayfa ${page}/${totalPages}`,
    `Toplam: ${sorted.length} · ⏳ Bekliyor · ✅ Çekildi`,
    '',
    ...selected.flatMap((row, index) => [
      `${String(offset + index + 1).padStart(2, '0')} │ ${row.production_status === 'shot' ? '✅' : '⏳'} │ ${row.platform === 'instagram' ? 'IG' : 'TT'} │ ${row.id.slice(0, 8)}`,
      `   ${contentTitle(row)}`,
      `   ${metricsLine(row)}`,
      `   ${row.canonical_url}`,
    ]),
    '',
    options.sort === 'performance'
      ? 'Sıralama: önce erişilebilen performans verisi, veri yoksa en yeni eklenen.'
      : 'Sıralama: en yeni eklenen önce.',
    ...(page < totalPages ? [`Sonraki sayfa: /${command} ${page + 1}`] : []),
    ...(page > 1 ? [`Önceki sayfa: /${command} ${page - 1}`] : []),
    'İşaretle: /cekildi KOD · Geri al: /cekilmedi KOD',
    'Tek kayıt sil: /sil KOD',
  ].join('\n').slice(0, 4096)
}

export function formatSavedContentResult(row: TelegramSavedContent, updated: boolean) {
  return [
    updated ? '♻️ Bağlantı zaten kayıtlıydı; verileri yenilendi.' : '✅ İçerik kaydedildi.',
    '',
    `${row.platform === 'instagram' ? 'Instagram Reels' : 'TikTok'} · ${contentTitle(row)}`,
    metricsLine(row),
    `Metadata: ${compact(row.metadata_source, 100)}`,
    `Metrik: ${compact(row.metrics_source || 'veri alınamadı', 100)}`,
    `Son güncelleme: ${istanbulTime(row.metric_updated_at || row.updated_at)}`,
    `Kod: ${row.id.slice(0, 8)}`,
    `Durum: ${row.production_status === 'shot' ? '✅ Çekildi' : '⏳ Bekliyor'}`,
    row.canonical_url,
  ].join('\n')
}
