import 'server-only'

/**
 * YouTube + YouTube Shorts toplayici.
 *
 * Iki mod:
 *  1) YOUTUBE_API_KEY tanimliysa resmi Data API v3 (chart=mostPopular + kategori bazli).
 *  2) Anahtar yoksa arama sonucu sayfasindaki ytInitialData ayristirilir
 *     ("bu hafta + en cok izlenen" filtresiyle).
 */
import { getJson, getText, extractJsonAfter } from '../http'
import { parseCount, parseIsoDuration } from '../util'
import type { Collector, RawTrendItem } from '../types'

const API = 'https://www.googleapis.com/youtube/v3'

// Data API'de her bolgede gecerli olan yaygin kategori kimlikleri
const CATEGORY_IDS = [10, 20, 24, 22, 23, 17, 26, 28, 27, 25, 1, 2, 15, 19]

interface ApiVideo {
  id: string
  snippet?: {
    title?: string
    description?: string
    channelTitle?: string
    channelId?: string
    publishedAt?: string
    categoryId?: string
    tags?: string[]
    defaultAudioLanguage?: string
    thumbnails?: Record<string, { url?: string }>
  }
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }
  contentDetails?: { duration?: string }
}

function mapApiVideo(v: ApiVideo, country: string, rank: number): RawTrendItem {
  const dur = parseIsoDuration(v.contentDetails?.duration)
  const taggedShort = /#shorts?/i.test(`${v.snippet?.title ?? ''} ${v.snippet?.description ?? ''}`)
  const isShort = (dur > 0 && dur <= 180 && taggedShort) || (dur > 0 && dur <= 60)
  return {
    platform: isShort ? 'youtube_shorts' : 'youtube',
    kind: 'video',
    external_id: v.id,
    title: v.snippet?.title ?? '',
    description: (v.snippet?.description ?? '').slice(0, 600),
    author: v.snippet?.channelTitle ?? null,
    author_url: v.snippet?.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    thumbnail: v.snippet?.thumbnails?.medium?.url ?? v.snippet?.thumbnails?.default?.url ?? null,
    country,
    rank,
    duration_sec: dur,
    published_at: v.snippet?.publishedAt ?? null,
    ytCategoryId: v.snippet?.categoryId ?? null,
    tags: v.snippet?.tags ?? [],
    metrics: {
      views: parseCount(v.statistics?.viewCount),
      likes: parseCount(v.statistics?.likeCount),
      comments: parseCount(v.statistics?.commentCount),
    },
    raw: { categoryId: v.snippet?.categoryId, defaultAudioLanguage: v.snippet?.defaultAudioLanguage },
  }
}

async function apiMostPopular(opts: { country: string; limit: number; key: string; categoryId?: number }) {
  const { country, limit, key, categoryId } = opts
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: country,
    maxResults: String(Math.min(limit, 50)),
    key,
  })
  if (categoryId) params.set('videoCategoryId', String(categoryId))

  const res = await getJson<{ items?: ApiVideo[] }>(`${API}/videos?${params}`, {
    label: `yt-api-${country}-${categoryId ?? 'all'}`,
  })
  if (!res.ok) throw new Error(res.error)
  return (res.data.items ?? []).map((v, i) => mapApiVideo(v, country, i + 1))
}

/** Son gunlerde yuklenmis, hizli buyuyen Shorts'lari arar. */
async function apiTrendingShorts(opts: { country: string; limit: number; key: string }) {
  const { country, limit, key } = opts
  const publishedAfter = new Date(Date.now() - 3 * 86400e3).toISOString()
  const params = new URLSearchParams({
    part: 'snippet',
    q: '#shorts',
    type: 'video',
    videoDuration: 'short',
    order: 'viewCount',
    regionCode: country,
    maxResults: String(Math.min(limit, 50)),
    publishedAfter,
    key,
  })
  const res = await getJson<{ items?: Array<{ id?: { videoId?: string } }> }>(`${API}/search?${params}`, {
    label: `yt-shorts-search-${country}`,
  })
  if (!res.ok) throw new Error(res.error)

  const ids = (res.data.items ?? []).map((i) => i.id?.videoId).filter((x): x is string => Boolean(x))
  if (!ids.length) return []

  const det = await getJson<{ items?: ApiVideo[] }>(
    `${API}/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${key}`,
    { label: `yt-shorts-detail-${country}` }
  )
  if (!det.ok) throw new Error(det.error)
  return (det.data.items ?? []).map((v, i) => ({
    ...mapApiVideo(v, country, i + 1),
    platform: 'youtube_shorts' as const,
  }))
}

/* ----------------------------- HTML ayristirma ---------------------------- */

type Json = Record<string, unknown>

/** ytInitialData icinde belirtilen renderer tipindeki tum nesneleri toplar. */
function collectRenderers(node: unknown, typeNames: string[], out: Json[] = [], depth = 0): Json[] {
  if (!node || typeof node !== 'object' || depth > 30) return out
  if (Array.isArray(node)) {
    for (const n of node) collectRenderers(n, typeNames, out, depth + 1)
    return out
  }
  for (const [k, v] of Object.entries(node as Json)) {
    if (typeNames.includes(k) && v && typeof v === 'object') out.push(v as Json)
    else collectRenderers(v, typeNames, out, depth + 1)
  }
  return out
}

function txt(o: unknown): string {
  if (!o) return ''
  if (typeof o === 'string') return o
  const obj = o as { simpleText?: string; runs?: Array<{ text?: string }> }
  if (obj.simpleText) return obj.simpleText
  if (Array.isArray(obj.runs)) return obj.runs.map((r) => r.text ?? '').join('')
  return ''
}

function relativeToIso(s: string): string | null {
  // "3 saat once" / "2 hours ago" -> ISO tarih
  const m = String(s).match(/(\d+)\s*(saniye|dakika|saat|g[uü]n|hafta|ay|y[ıi]l|second|minute|hour|day|week|month|year)/i)
  if (!m) return null
  const n = Number(m[1])
  const unit = m[2].toLowerCase()
  const mult = /saniye|second/.test(unit) ? 1e3
    : /dakika|minute/.test(unit) ? 60e3
    : /saat|hour/.test(unit) ? 3600e3
    : /g[uü]n|day/.test(unit) ? 86400e3
    : /hafta|week/.test(unit) ? 604800e3
    : /ay|month/.test(unit) ? 2592000e3
    : 31536000e3
  return new Date(Date.now() - n * mult).toISOString()
}

const SP = {
  buHaftaEnCokIzlenen: 'CAMSAggD', // sirala: izlenme + yuklenme: bu hafta
  buHaftaKisaVideo: 'CAMSBAgDGAE%3D', // + sure: 4 dk alti (Shorts yakalamak icin)
}

// Kategori taramasi icin sorgu havuzu (kategori anahtari -> arama terimi)
const SEARCH_QUERIES: Array<[string, string]> = [
  ['komedi', 'komedi skec'],
  ['muzik', 'yeni sarki'],
  ['yemek', 'yemek tarifi'],
  ['oyun', 'oyun'],
  ['teknoloji', 'teknoloji inceleme'],
  ['yapayzeka', 'yapay zeka'],
  ['guzellik', 'makyaj'],
  ['moda', 'kombin moda'],
  ['fitness', 'antrenman spor'],
  ['egitim', 'nasil yapilir'],
  ['finans', 'para yatirim'],
  ['seyahat', 'gezi vlog'],
  ['hayvan', 'kedi kopek'],
  ['film', 'dizi film'],
  ['haber', 'gundem'],
  ['yasam', 'vlog gunluk'],
  ['diy', 'kendin yap'],
  ['otomobil', 'araba'],
  ['toplum', 'sokak roportaji'],
]

async function scrapePage(url: string, label: string) {
  // hl=en: izlenme sayilari "1.2M views" olarak gelir; Turkce "B=bin" belirsizligi olmaz
  const res = await getText(url, { label, headers: { 'accept-language': 'en-US,en;q=0.9' } })
  if (!res.ok) throw new Error(res.error)
  const data = extractJsonAfter(res.data, 'var ytInitialData =') ?? extractJsonAfter(res.data, 'ytInitialData"] =')
  if (!data) throw new Error('ytInitialData bulunamadı (YouTube sayfa yapısı değişmiş olabilir)')
  return data
}

function durationToSec(text: string) {
  if (!text) return 0
  return text.split(':').reverse().reduce((acc, p, i) => acc + (Number(p) || 0) * Math.pow(60, i), 0)
}

function mapRenderer(v: Json, country: string, rank: number, hint: string): RawTrendItem | null {
  const id = v.videoId as string | undefined
  if (!id) return null
  const durSec = durationToSec(txt(v.lengthText))
  const viewText = txt(v.viewCountText) || txt(v.shortViewCountText)
  const isShort = durSec > 0 && durSec <= 60
  const detailed = v.detailedMetadataSnippets as Array<{ snippetText?: unknown }> | undefined
  const thumbs = (v.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)?.thumbnails
  return {
    platform: isShort ? 'youtube_shorts' : 'youtube',
    kind: 'video',
    external_id: id,
    title: txt(v.title),
    description: txt(v.descriptionSnippet) || txt(detailed?.[0]?.snippetText),
    author: txt(v.ownerText) || txt(v.longBylineText) || null,
    url: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    thumbnail: thumbs?.at(-1)?.url ?? null,
    country,
    rank,
    duration_sec: durSec,
    published_at: relativeToIso(txt(v.publishedTimeText)),
    hint,
    metrics: { views: parseCount(viewText.replace(/[^\d.,kmbKMB]/g, '')) },
    raw: { source: 'search-scrape' },
  }
}

async function scrapeSearch(opts: { query: string; country: string; limit: number; sp?: string; hint: string }) {
  const { query, country, limit, sp = SP.buHaftaEnCokIzlenen, hint } = opts
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=${country}&sp=${sp}`
  const data = await scrapePage(url, `yt-search-${country}-${query.slice(0, 18)}`)
  const vids = collectRenderers(data, ['videoRenderer'])
  const out: RawTrendItem[] = []
  const seen = new Set<string>()
  for (const v of vids) {
    const id = v.videoId as string | undefined
    if (!id || seen.has(id)) continue
    seen.add(id)
    const item = mapRenderer(v, country, out.length + 1, hint)
    if (item && (item.metrics?.views ?? 0) > 0) out.push(item)
    if (out.length >= limit) break
  }
  return out
}

const youtube: Collector = {
  id: 'youtube',
  label: 'YouTube & Shorts',
  platforms: ['youtube', 'youtube_shorts'],

  async collect({ country, limit }) {
    const key = process.env.YOUTUBE_API_KEY?.trim()
    const items: RawTrendItem[] = []
    const errors: string[] = []

    if (key) {
      try {
        items.push(...(await apiMostPopular({ country, limit, key })))
      } catch (e) {
        errors.push(`youtube/api/${country}: ${(e as Error).message}`)
      }

      // Kategori bazli populer videolar - "her kategoride trend" kapsamasi icin
      for (const catId of CATEGORY_IDS) {
        try {
          items.push(...(await apiMostPopular({ country, limit: 20, key, categoryId: catId })))
        } catch {
          /* bolgede kategori desteklenmiyor olabilir - sessiz gec */
        }
      }

      try {
        items.push(...(await apiTrendingShorts({ country, limit, key })))
      } catch (e) {
        errors.push(`youtube/shorts-api/${country}: ${(e as Error).message}`)
      }
    } else {
      for (const [hint, query] of SEARCH_QUERIES) {
        try {
          items.push(...(await scrapeSearch({ query, country, limit: Math.min(limit, 12), hint })))
        } catch (e) {
          errors.push(`youtube/arama/${query}: ${(e as Error).message}`)
        }
      }
      for (const [hint, q] of [
        ['shorts', '#shorts'],
        ['komedi', 'komik shorts'],
        ['dans', 'dans akim'],
        ['yemek', 'tarif shorts'],
        ['oyun', 'oyun shorts'],
        ['guzellik', 'makyaj shorts'],
        ['egitim', 'bilgi shorts'],
        ['hayvan', 'kedi kopek shorts'],
      ] as Array<[string, string]>) {
        try {
          const rows = await scrapeSearch({ query: q, country, limit: Math.min(limit, 20), sp: SP.buHaftaKisaVideo, hint })
          items.push(
            ...rows
              .filter((r) => (r.duration_sec ?? 0) > 0 && (r.duration_sec ?? 0) <= 60)
              .map((r) => ({
                ...r,
                platform: 'youtube_shorts' as const,
                url: `https://www.youtube.com/shorts/${r.external_id}`,
                hashtags: [...new Set([...(r.hashtags ?? []), 'shorts'])],
              }))
          )
        } catch (e) {
          errors.push(`youtube/shorts/${q}: ${(e as Error).message}`)
        }
      }
    }

    return {
      items,
      errors,
      note: key
        ? 'resmi Data API v3'
        : 'API anahtarı yok — kategori bazlı arama taraması (bu hafta + en çok izlenen)',
    }
  },
}

export default youtube
export { CATEGORY_IDS }
