/**
 * TikTok ve Instagram icin resmi API baglantilari.
 *
 *  - TikTok Research API (open.tiktokapis.com): client_credentials belirteci +
 *    video sorgusu. Gercek izlenme, begeni, yorum ve paylasim sayilari doner.
 *  - Instagram Graph API Hashtag Search (graph.facebook.com): Business/Creator
 *    hesabi ile hashtag kimligi + top_media. Baskalarinin gonderilerinde izlenme
 *    sayisi VERILMEZ; yalniz begeni ve yorum sayisi gelir, izlenme uydurulmaz.
 *
 * Modul saf tutuldu (server-only / http.ts yok): fetch ve ortam disaridan
 * verilebilir, boylece birim testleri ag olmadan calisir. Anahtar/belirtec
 * degerleri hicbir hata mesajina veya kayda yazilmaz.
 */
import type { RawTrendItem } from './types'

type Env = Record<string, string | undefined>
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export type SocialAccessMode = 'official' | 'legacy' | 'none'

export interface SocialAccess {
  mode: SocialAccessMode
  official: boolean
  legacy: boolean
  live: boolean
}

const TIKTOK_API = 'https://open.tiktokapis.com/v2'
const DEFAULT_GRAPH_VERSION = 'v23.0'
const TIMEOUT_MS = 15_000

function value(env: Env, key: string) {
  return env[key]?.trim() || ''
}

function disabled(env: Env, integration: string) {
  return value(env, 'KADE_DISABLED_INTEGRATIONS')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .includes(integration)
}

function access(official: boolean, legacy: boolean): SocialAccess {
  return { mode: official ? 'official' : legacy ? 'legacy' : 'none', official, legacy, live: official || legacy }
}

export function tiktokAccess(env: Env = process.env): SocialAccess {
  if (disabled(env, 'tiktok')) return access(false, false)
  return access(
    Boolean(value(env, 'TIKTOK_RESEARCH_CLIENT_KEY') && value(env, 'TIKTOK_RESEARCH_CLIENT_SECRET')),
    Boolean(value(env, 'TIKTOK_COOKIE')),
  )
}

export function instagramAccess(env: Env = process.env): SocialAccess {
  if (disabled(env, 'instagram')) return access(false, false)
  return access(
    Boolean(value(env, 'INSTAGRAM_GRAPH_ACCESS_TOKEN') && value(env, 'INSTAGRAM_BUSINESS_ACCOUNT_ID')),
    Boolean(value(env, 'INSTAGRAM_SESSION_ID')),
  )
}

/** Hata mesajlarini kullaniciya guvenle gosterilebilir, sir icermeyen metne indirger. */
export class OfficialApiError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message)
    this.name = 'OfficialApiError'
  }
}

async function fetchJson(fetchImpl: FetchLike, url: string, init: RequestInit = {}) {
  let response: Response
  try {
    response = await fetchImpl(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (error) {
    const name = (error as Error).name
    throw new OfficialApiError(name === 'TimeoutError' || name === 'AbortError' ? 'zaman aşımı' : 'bağlantı kurulamadı')
  }
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  return { response, body }
}

function num(input: unknown) {
  const n = Number(input)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

function text(input: unknown, max: number) {
  return String(input ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

/* --------------------------------- TikTok --------------------------------- */

const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export function resetOfficialSocialCaches() {
  tokenCache.clear()
  hashtagIdCache.clear()
}

async function tiktokToken(env: Env, fetchImpl: FetchLike) {
  const clientKey = value(env, 'TIKTOK_RESEARCH_CLIENT_KEY')
  const clientSecret = value(env, 'TIKTOK_RESEARCH_CLIENT_SECRET')
  if (!clientKey || !clientSecret) throw new OfficialApiError('TikTok Research API bilgileri tanımlı değil')

  const cached = tokenCache.get(clientKey)
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const { response, body } = await fetchJson(fetchImpl, `${TIKTOK_API}/oauth/token/`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'cache-control': 'no-cache' },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, grant_type: 'client_credentials' }),
  })
  const token = typeof body?.access_token === 'string' ? body.access_token : ''
  if (!response.ok || !token) {
    throw new OfficialApiError('TikTok erişim belirteci alınamadı (anahtar, sır veya Research API onayı geçersiz)', response.status, text(body?.error, 60))
  }
  const ttlSec = Math.max(60, num(body?.expires_in) || 7200)
  tokenCache.set(clientKey, { token, expiresAt: Date.now() + (ttlSec - 60) * 1000 })
  return token
}

interface TikTokResearchVideo {
  id?: string | number
  create_time?: number
  username?: string
  region_code?: string
  video_description?: string
  like_count?: number
  comment_count?: number
  share_count?: number
  view_count?: number
  hashtag_names?: string[]
  video_duration?: number
}

const TIKTOK_FIELDS = [
  'id', 'create_time', 'username', 'region_code', 'video_description', 'like_count',
  'comment_count', 'share_count', 'view_count', 'hashtag_names', 'video_duration',
].join(',')

export function mapTikTokResearchVideo(video: TikTokResearchVideo, rank: number): RawTrendItem | null {
  const id = text(video.id, 40)
  const username = text(video.username, 80).replace(/^@/, '')
  if (!/^\d+$/.test(id) || !username) return null
  const description = text(video.video_description, 700)
  const hashtags = (Array.isArray(video.hashtag_names) ? video.hashtag_names : []).map((tag) => text(tag, 60)).filter(Boolean)
  return {
    platform: 'tiktok',
    kind: 'video',
    external_id: id,
    title: description.split(/\s#/)[0].slice(0, 140) || (hashtags[0] ? `#${hashtags[0]}` : `@${username} TikTok videosu`),
    description: description || null,
    author: `@${username}`,
    author_url: `https://www.tiktok.com/@${encodeURIComponent(username)}`,
    url: `https://www.tiktok.com/@${encodeURIComponent(username)}/video/${id}`,
    country: text(video.region_code, 4).toUpperCase() || null,
    rank,
    duration_sec: num(video.video_duration) || null,
    published_at: num(video.create_time) ? new Date(num(video.create_time) * 1000).toISOString() : null,
    hashtags,
    metrics: {
      views: num(video.view_count),
      likes: num(video.like_count),
      comments: num(video.comment_count),
      shares: num(video.share_count),
    },
    raw: { source: 'tiktok-research-api' },
  }
}

/**
 * Research API video sorgusu. `query` bossa yalniz ulke + tarih araligiyla
 * sorgulanir (trend toplayici icin). Sonuclar izlenmeye gore siralanir.
 */
export async function searchTikTokResearch(
  opts: { query?: string; country: string; periodDays: number; limit: number },
  env: Env = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<RawTrendItem[]> {
  const token = await tiktokToken(env, fetchImpl)
  // Research API en fazla 30 gunluk aralik kabul eder; bitis bugun olabilir.
  const days = Math.max(1, Math.min(Math.floor(opts.periodDays) || 7, 30))
  const end = new Date()
  const start = new Date(end.getTime() - (days - 1) * 86400e3)
  const and: Array<Record<string, unknown>> = []
  if (/^[A-Z]{2}$/.test(opts.country)) {
    and.push({ operation: 'IN', field_name: 'region_code', field_values: [opts.country] })
  }
  const keywords = text(opts.query, 100).split(' ').filter((word) => word.length > 1).slice(0, 5)
  for (const keyword of keywords) and.push({ operation: 'EQ', field_name: 'keyword', field_values: [keyword] })
  if (!and.length) throw new OfficialApiError('TikTok sorgusu için ülke veya anahtar kelime gerekli')

  const { response, body } = await fetchJson(fetchImpl, `${TIKTOK_API}/research/video/query/?fields=${TIKTOK_FIELDS}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      query: { and },
      start_date: yyyymmdd(start),
      end_date: yyyymmdd(end),
      max_count: Math.max(1, Math.min(Math.floor(opts.limit) || 50, 100)),
      is_random: false,
    }),
  })
  const error = body?.error as { code?: string; message?: string } | undefined
  if (!response.ok || (error?.code && error.code !== 'ok')) {
    if (response.status === 401) tokenCache.clear()
    const reason = response.status === 429 ? 'günlük TikTok Research API kotası doldu'
      : response.status === 401 || response.status === 403 ? 'TikTok Research API yetkisi reddedildi'
      : `TikTok Research API hatası (${text(error?.code, 40) || response.status})`
    throw new OfficialApiError(reason, response.status, text(error?.code, 40))
  }
  const videos = ((body?.data as { videos?: TikTokResearchVideo[] } | undefined)?.videos ?? [])
  return videos
    .map((video) => mapTikTokResearchVideo(video, 0))
    .filter((item): item is RawTrendItem => Boolean(item))
    .sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
    .slice(0, Math.max(1, opts.limit))
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

/* -------------------------------- Instagram ------------------------------- */

const hashtagIdCache = new Map<string, string>()

/** Arama metnini Instagram hashtag bicimine indirger ("Yapay zeka" -> "yapayzeka"). */
export function toInstagramHashtag(query: string) {
  return query
    .toLocaleLowerCase('tr-TR')
    .replace(/^#/, '')
    .replace(/[^\p{L}\p{N}_]+/gu, '')
    .slice(0, 100)
}

interface GraphMedia {
  id?: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  like_count?: number
  comments_count?: number
  timestamp?: string
}

export function mapInstagramGraphMedia(media: GraphMedia, tag: string, country: string, rank: number): RawTrendItem | null {
  const permalink = text(media.permalink, 300)
  if (!media.id || !/^https:\/\/(www\.)?instagram\.com\//.test(permalink)) return null
  // Reels kesfi: yalniz video medyasi. Gorsel/karusel gonderiler Reels degildir.
  if (media.media_type !== 'VIDEO') return null
  const caption = text(media.caption, 700)
  const published = media.timestamp && Number.isFinite(Date.parse(media.timestamp)) ? new Date(media.timestamp).toISOString() : null
  return {
    platform: 'instagram',
    kind: 'video',
    external_id: text(media.id, 60),
    title: caption.split(/\s#/)[0].slice(0, 140) || `Reel #${tag}`,
    description: caption || null,
    url: permalink,
    thumbnail: text(media.thumbnail_url, 1000) || null,
    country,
    rank,
    published_at: published,
    hashtags: [tag],
    // Graph API baskasinin medyasi icin izlenme vermez; 0 = bilinmiyor.
    metrics: { likes: num(media.like_count), comments: num(media.comments_count) },
    raw: { source: 'instagram-graph-api' },
  }
}

function graphError(response: Response, body: Record<string, unknown> | null) {
  const error = body?.error as { code?: number; error_subcode?: number } | undefined
  const code = Number(error?.code)
  const reason = code === 190 ? 'Instagram erişim belirtecinin süresi dolmuş veya geçersiz'
    : code === 4 || code === 17 || code === 32 || code === 613 ? 'Instagram API istek sınırı doldu'
    : code === 10 || code === 200 ? 'Instagram Public Content Access izni yok'
    : code === 24 ? 'Instagram hashtag kotası doldu (7 günde 30 farklı hashtag)'
    : `Instagram Graph API hatası (${Number.isFinite(code) ? code : response.status})`
  return new OfficialApiError(reason, response.status, Number.isFinite(code) ? String(code) : undefined)
}

export async function searchInstagramGraph(
  opts: { query: string; country: string; periodDays: number; limit: number },
  env: Env = process.env,
  fetchImpl: FetchLike = fetch,
): Promise<RawTrendItem[]> {
  const token = value(env, 'INSTAGRAM_GRAPH_ACCESS_TOKEN')
  const userId = value(env, 'INSTAGRAM_BUSINESS_ACCOUNT_ID')
  if (!token || !/^\d+$/.test(userId)) throw new OfficialApiError('Instagram Graph API bilgileri tanımlı değil')
  const version = /^v\d+\.\d+$/.test(value(env, 'META_GRAPH_API_VERSION')) ? value(env, 'META_GRAPH_API_VERSION') : DEFAULT_GRAPH_VERSION
  const base = `https://graph.facebook.com/${version}`
  const tag = toInstagramHashtag(opts.query)
  if (tag.length < 2) return []

  // Hashtag kimligini onbellekle: Meta 7 gunde en fazla 30 farkli hashtag aramasina izin verir.
  let hashtagId = hashtagIdCache.get(tag)
  if (!hashtagId) {
    const params = new URLSearchParams({ user_id: userId, q: tag, access_token: token })
    const { response, body } = await fetchJson(fetchImpl, `${base}/ig_hashtag_search?${params}`)
    if (!response.ok) throw graphError(response, body)
    hashtagId = text((body?.data as Array<{ id?: string }> | undefined)?.[0]?.id, 40)
    if (!/^\d+$/.test(hashtagId)) return []
    hashtagIdCache.set(tag, hashtagId)
  }

  const params = new URLSearchParams({
    user_id: userId,
    fields: 'id,caption,media_type,thumbnail_url,permalink,like_count,comments_count,timestamp',
    limit: String(Math.max(1, Math.min(Math.floor(opts.limit) || 25, 50))),
    access_token: token,
  })
  const { response, body } = await fetchJson(fetchImpl, `${base}/${hashtagId}/top_media?${params}`)
  if (!response.ok) throw graphError(response, body)

  const cutoff = Date.now() - Math.max(1, Math.min(opts.periodDays, 30)) * 86400e3
  return ((body?.data as GraphMedia[] | undefined) ?? [])
    .map((media, index) => mapInstagramGraphMedia(media, tag, opts.country, index + 1))
    .filter((item): item is RawTrendItem => Boolean(item))
    .filter((item) => !item.published_at || Date.parse(item.published_at) >= cutoff)
}

/* ------------------------------ Baglanti testi ----------------------------- */

export interface AccessCheck {
  platform: 'tiktok' | 'instagram'
  mode: SocialAccessMode
  ok: boolean
  message: string
}

/**
 * Resmi bilgileri canli dogrular. Instagram testi hashtag kotasi harcamaz
 * (yalniz hesap kimligini okur); TikTok testi tek kayitlik bir sorgu atar.
 */
export async function checkOfficialSocialAccess(env: Env = process.env, fetchImpl: FetchLike = fetch): Promise<AccessCheck[]> {
  const tiktok = tiktokAccess(env)
  const instagram = instagramAccess(env)
  const unavailable = (mode: SocialAccessMode) => mode === 'legacy'
    ? 'Resmi bilgiler tanımlı değil; yalnız yedek çerez yolu açık'
    : 'Resmi bilgiler tanımlı değil'

  const tiktokCheck = async (): Promise<AccessCheck> => {
    if (!tiktok.official) return { platform: 'tiktok', mode: tiktok.mode, ok: false, message: unavailable(tiktok.mode) }
    try {
      await searchTikTokResearch({ country: 'TR', periodDays: 1, limit: 1 }, env, fetchImpl)
      return { platform: 'tiktok', mode: 'official', ok: true, message: 'TikTok Research API bağlantısı çalışıyor' }
    } catch (error) {
      return { platform: 'tiktok', mode: 'official', ok: false, message: safeMessage(error) }
    }
  }

  const instagramCheck = async (): Promise<AccessCheck> => {
    if (!instagram.official) return { platform: 'instagram', mode: instagram.mode, ok: false, message: unavailable(instagram.mode) }
    const userId = value(env, 'INSTAGRAM_BUSINESS_ACCOUNT_ID')
    if (!/^\d+$/.test(userId)) {
      return { platform: 'instagram', mode: 'official', ok: false, message: 'INSTAGRAM_BUSINESS_ACCOUNT_ID yalnız rakamlardan oluşmalı' }
    }
    const version = /^v\d+\.\d+$/.test(value(env, 'META_GRAPH_API_VERSION')) ? value(env, 'META_GRAPH_API_VERSION') : DEFAULT_GRAPH_VERSION
    try {
      const params = new URLSearchParams({ fields: 'id,username', access_token: value(env, 'INSTAGRAM_GRAPH_ACCESS_TOKEN') })
      const { response, body } = await fetchJson(fetchImpl, `https://graph.facebook.com/${version}/${userId}?${params}`)
      if (!response.ok) throw graphError(response, body)
      const username = text(body?.username, 60)
      return { platform: 'instagram', mode: 'official', ok: true, message: `Instagram Graph API bağlantısı çalışıyor${username ? ` (@${username})` : ''}` }
    } catch (error) {
      return { platform: 'instagram', mode: 'official', ok: false, message: safeMessage(error) }
    }
  }

  return Promise.all([tiktokCheck(), instagramCheck()])
}

function safeMessage(error: unknown) {
  return error instanceof OfficialApiError ? error.message : 'beklenmeyen hata'
}
