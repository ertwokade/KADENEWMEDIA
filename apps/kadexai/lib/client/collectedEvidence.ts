import { apiFetch } from '@/lib/client/api'

export interface CollectedItem {
  title: string
  url: string
  author: string | null
  views: number | null
  source: 'Materyal Kütüphanesi' | 'Trend Radar'
}

type Row = Record<string, unknown>

const number = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/** Eşleşme için Türkçe duyarlı, noktalama ve boşluktan bağımsız karşılaştırma. */
export function normalizeName(value: string) {
  return value.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, '')
}

export function mergeCollected(name: string, materials: Row[], trends: Row[]): CollectedItem[] {
  const wanted = normalizeName(name)
  const items: CollectedItem[] = [
    ...materials.map((row) => ({
      title: String(row.title || 'Başlıksız'), url: String(row.page_url || ''), author: null,
      views: number(row.view_count), source: 'Materyal Kütüphanesi' as const,
    })),
    // Trend kayıtlarında kanal adı "author" alanında durur; yalnız adı eşleşenler alınır.
    ...trends
      .filter((row) => wanted && (normalizeName(String(row.author || '')).includes(wanted) || normalizeName(String(row.title || '')).includes(wanted)))
      .map((row) => ({
        title: String(row.title || 'Başlıksız'), url: String(row.url || ''), author: row.author ? String(row.author) : null,
        views: number(row.views), source: 'Trend Radar' as const,
      })),
  ]
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url || `${item.source}:${item.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 25)
}

/** Materyal Kütüphanesi ve Trend Radar'da toplanmış gerçek içerikleri ada göre arar. */
export async function findCollectedContent(name: string): Promise<CollectedItem[]> {
  const query = name.trim().slice(0, 120)
  if (!query) return []
  const [materials, trends] = await Promise.all([
    apiFetch(`/api/materials?q=${encodeURIComponent(query)}&sort=izlenme&limit=20`, { cache: 'no-store' })
      .then(async (response) => response.ok ? ((await response.json()).materyaller ?? []) as Row[] : [])
      .catch(() => [] as Row[]),
    apiFetch(`/api/kade-search/trends?q=${encodeURIComponent(query)}&country=all&language=all&sort=views&limit=40&since=8760`, { cache: 'no-store' })
      .then(async (response) => response.ok ? ((await response.json()).trendler ?? []) as Row[] : [])
      .catch(() => [] as Row[]),
  ])
  return mergeCollected(query, materials, trends)
}

export function collectedEvidenceText(items: CollectedItem[]) {
  return items.map((item) => [
    item.title,
    item.author,
    item.views != null ? `${item.views.toLocaleString('tr-TR')} görüntülenme` : 'görüntülenme bilgisi yok',
    item.source,
    item.url,
  ].filter(Boolean).join(' | ')).join('\n')
}
