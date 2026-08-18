import 'server-only'

/**
 * TikTok toplayici.
 *
 * Kaynak: TikTok Creative Center (ads.tiktok.com) trend uclari — hashtag, sarki,
 * populer video ve kreator listeleri.
 *
 * ONEMLI: TikTok bu uclari oturum arkasina aldi; cerez olmadan "no permission"
 * doner. Gercek veri icin TIKTOK_COOKIE ortam degiskeni gerekir. Cerez yoksa
 * toplayici diger platformlardaki sinyallerden TikTok adaylari uretir ve
 * bunlari acikca "cikarim" (inferred) olarak isaretler.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { getJson } from '../http'
import { parseCount, normalizeText } from '../util'
import type { Collector, RawTrendItem } from '../types'

const BASE = 'https://ads.tiktok.com/creative_radar_api/v1'

function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function headers(country: string): Record<string, string> {
  const h: Record<string, string> = {
    referer: `https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?countryCode=${country}`,
    origin: 'https://ads.tiktok.com',
    'anonymous-user-id': randomId(),
    timestamp: String(Math.floor(Date.now() / 1000)),
    'web-id': String(Math.floor(Math.random() * 9e18)),
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
  }
  const cookie = process.env.TIKTOK_COOKIE?.trim()
  if (cookie) h.cookie = cookie
  return h
}

/** Creative Center yanitlarindan listeyi cikarir (sema surumleri arasi tolerans). */
function pickList(data: unknown): Array<Record<string, unknown>> {
  if (!data) return []
  const root = data as Record<string, unknown>
  const d = (root.data ?? root) as Record<string, unknown>
  for (const key of ['list', 'hashtag_list', 'music_list', 'creator_list', 'materials', 'videos', 'items']) {
    if (Array.isArray(d?.[key])) return d[key] as Array<Record<string, unknown>>
  }
  if (Array.isArray(d)) return d as Array<Record<string, unknown>>
  return []
}

const str = (v: unknown, fallback = '') => (v == null ? fallback : String(v))

async function fetchHashtags(country: string, period: number, limit: number): Promise<RawTrendItem[]> {
  const url = `${BASE}/popular_trend/hashtag/list?page=1&limit=${Math.min(limit, 50)}&period=${period}&country_code=${country}&sort_by=popular`
  const res = await getJson(url, { headers: headers(country), label: `tiktok-hashtag-${country}` })
  if (!res.ok) throw new Error(`hashtag listesi alınamadı: ${res.error}`)

  return pickList(res.data).map((h, i) => {
    const name = str(h.hashtag_name ?? h.name ?? h.hashtag)
    const industry = (h.industry_info as { value?: string } | undefined)?.value ?? (h.industry as string | undefined)
    return {
      platform: 'tiktok',
      kind: 'hashtag',
      external_id: str(h.hashtag_id ?? name),
      title: `#${name.replace(/^#/, '')}`,
      url: `https://www.tiktok.com/tag/${encodeURIComponent(name.replace(/^#/, ''))}`,
      country,
      rank: (h.rank as number | undefined) ?? i + 1,
      industry: industry ?? null,
      hashtags: [name.replace(/^#/, '')],
      metrics: {
        posts: parseCount(h.publish_cnt ?? h.video_count ?? 0),
        views: parseCount(h.video_views ?? h.view_count ?? 0),
        extra: { rank_diff: h.rank_diff, is_promoted: h.is_promoted },
      },
      raw: h,
    }
  })
}

async function fetchSongs(country: string, period: number, limit: number): Promise<RawTrendItem[]> {
  const url = `${BASE}/popular_trend/music/list?page=1&limit=${Math.min(limit, 50)}&period=${period}&country_code=${country}&rank_type=popular&commercial_music=false`
  const res = await getJson(url, { headers: headers(country), label: `tiktok-music-${country}` })
  if (!res.ok) throw new Error(`şarkı listesi alınamadı: ${res.error}`)

  return pickList(res.data).map((m, i) => ({
    platform: 'tiktok',
    kind: 'sound',
    external_id: str(m.song_id ?? m.music_id ?? m.clip_id ?? m.title),
    title: str(m.title ?? m.song_name ?? m.music_name, 'Bilinmeyen ses'),
    author: (m.author ?? m.artist ?? m.author_name) ? str(m.author ?? m.artist ?? m.author_name) : null,
    url: str(m.link ?? m.song_url) || (m.song_id ? `https://www.tiktok.com/music/x-${str(m.song_id)}` : null),
    thumbnail: str(m.cover ?? m.cover_url) || null,
    country,
    rank: (m.rank as number | undefined) ?? i + 1,
    duration_sec: (m.duration as number | undefined) ?? null,
    metrics: {
      posts: parseCount(m.user_count ?? m.post_count ?? 0),
      views: parseCount(m.play_count ?? 0),
      extra: { rank_diff: m.rank_diff, on_list_days: m.on_list_days },
    },
    hint: 'muzik sarki ses',
    raw: m,
  }))
}

async function fetchTopVideos(country: string, period: number, limit: number): Promise<RawTrendItem[]> {
  const url = `${BASE}/top_ads/v2/list?period=${period}&page=1&limit=${Math.min(limit, 50)}&order_by=vv&country_code=${country}&ad_language=&ad_format=&objective=`
  const res = await getJson(url, { headers: headers(country), label: `tiktok-video-${country}` })
  if (!res.ok) throw new Error(`popüler video listesi alınamadı: ${res.error}`)

  return pickList(res.data).map((v, i) => {
    const info = v.video_info as { share_url?: string; cover?: string; duration?: number } | undefined
    const brand = str(v.brand_name)
    const adTitle = str(v.ad_title ?? v.title, 'TikTok videosu')
    return {
      platform: 'tiktok',
      kind: 'video',
      external_id: str(v.id ?? v.item_id ?? v.video_id ?? i),
      title: brand ? `${brand} - ${adTitle}`.trim() : adTitle,
      description: str(v.ad_title ?? v.desc) || null,
      author: brand || str(v.author) || null,
      url: info?.share_url ?? (str(v.share_url) || null),
      thumbnail: info?.cover ?? (str(v.cover) || null),
      country,
      rank: i + 1,
      industry: str(v.industry_key ?? v.industry) || null,
      duration_sec: info?.duration ?? null,
      metrics: {
        views: parseCount(v.vv ?? v.play_count ?? 0),
        likes: parseCount(v.like ?? v.digg_count ?? 0),
        comments: parseCount(v.comment ?? 0),
        shares: parseCount(v.share ?? 0),
        extra: { ctr: v.ctr, cost: v.cost },
      },
      raw: v,
    }
  })
}

async function fetchCreators(country: string, limit: number): Promise<RawTrendItem[]> {
  const url = `${BASE}/popular_trend/creator/list?page=1&limit=${Math.min(limit, 50)}&country_code=${country}&sort_by=follower`
  const res = await getJson(url, { headers: headers(country), label: `tiktok-creator-${country}` })
  if (!res.ok) throw new Error(`kreatör listesi alınamadı: ${res.error}`)

  return pickList(res.data).map((c, i) => {
    const uniqueId = str(c.unique_id)
    return {
      platform: 'tiktok',
      kind: 'creator',
      external_id: str(c.tcm_id ?? c.user_id ?? c.nick_name),
      title: str(c.nick_name ?? c.unique_id, 'Kreatör'),
      author: uniqueId ? `@${uniqueId}` : null,
      url: uniqueId ? `https://www.tiktok.com/@${uniqueId}` : null,
      thumbnail: str(c.avatar_url) || null,
      country,
      rank: i + 1,
      industry: str(c.tcm_industry) || null,
      metrics: {
        followers: parseCount(c.follower_cnt ?? 0),
        likes: parseCount(c.liked_cnt ?? 0),
        views: parseCount(c.vv_median ?? 0),
        extra: { engagement_rate: c.engagement_rate },
      },
      raw: c,
    }
  })
}

/**
 * Cerez yoksa: diger platformlardaki yuksek skorlu sinyallerden TikTok adaylari
 * uretir. Bunlar OLCUM DEGIL TAHMINDIR ve `inferred` ile isaretlenir.
 */
async function inferFromOtherPlatforms(country: string, limit: number): Promise<RawTrendItem[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('kade_trend_current')
    .select('title, kind, author, category, score, views')
    .in('platform', ['youtube_shorts', 'google', 'music', 'reddit'])
    .gte('last_seen', new Date(Date.now() - 7 * 86400e3).toISOString())
    .order('score', { ascending: false, nullsFirst: false })
    .limit(limit)

  return (data ?? []).map((r, i) => {
    const isSound = r.kind === 'sound'
    const term = normalizeText(r.title).replace(/[^a-z0-9]/g, '').slice(0, 30)
    return {
      platform: 'tiktok',
      kind: isSound ? 'sound' : 'keyword',
      external_id: `inferred:${term || i}`,
      title: r.title,
      author: r.author,
      description:
        '[ÇIKARIM] TikTok çerezi tanımlı değil. Bu kayıt diğer platformlardaki sinyallerden türetilmiş bir adaydır, gerçek TikTok ölçümü değildir.',
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(r.title)}`,
      country,
      rank: i + 1,
      sourceCategory: r.category,
      metrics: { views: Math.round((r.views ?? 0) * 0.6), extra: { inferred: true, sourceScore: r.score } },
      inferred: true,
      raw: { inferred: true, basis: 'capraz platform sinyali' },
    }
  })
}

const tiktok: Collector = {
  id: 'tiktok',
  label: 'TikTok',
  platforms: ['tiktok'],

  async collect({ country, period, limit }) {
    const items: RawTrendItem[] = []
    const errors: string[] = []
    const tasks: Array<[string, () => Promise<RawTrendItem[]>]> = [
      ['hashtag', () => fetchHashtags(country, period, limit)],
      ['sarki', () => fetchSongs(country, period, limit)],
      ['video', () => fetchTopVideos(country, period, limit)],
      ['kreator', () => fetchCreators(country, limit)],
    ]

    for (const [name, fn] of tasks) {
      try {
        items.push(...(await fn()))
      } catch (e) {
        errors.push(`tiktok/${name}/${country}: ${(e as Error).message}`)
      }
    }

    if (!items.length) {
      const inferred = await inferFromOtherPlatforms(country, Math.min(limit, 40))
      return {
        items: inferred,
        errors: [],
        note: process.env.TIKTOK_COOKIE?.trim()
          ? 'çıkarım modu — çerez çalışmadı (süresi dolmuş olabilir)'
          : 'çıkarım modu (tahmin) — TIKTOK_COOKIE tanımlı değil',
      }
    }

    return { items, errors, note: process.env.TIKTOK_COOKIE?.trim() ? 'Creative Center (çerezli)' : 'Creative Center' }
  },
}

export default tiktok
