import type { CurrentTrendRow, RawTrendItem, TrendPlatform } from './types'

export const DISCOVERY_LANGUAGES = {
  tr: 'Türkçe',
  en: 'İngilizce',
  de: 'Almanca',
  fr: 'Fransızca',
  es: 'İspanyolca',
  it: 'İtalyanca',
  pt: 'Portekizce',
  ar: 'Arapça',
  ru: 'Rusça',
  hi: 'Hintçe',
  ja: 'Japonca',
  ko: 'Korece',
} as const

export type DiscoveryLanguage = keyof typeof DISCOVERY_LANGUAGES
export type DiscoveryPlatform = TrendPlatform
export type DiscoverySourceKind = 'live-api' | 'live-web' | 'measured-index'

export interface DiscoveryResult {
  id: string
  platform: DiscoveryPlatform
  title: string
  description: string | null
  author: string | null
  url: string
  thumbnail: string | null
  language: string | null
  country: string | null
  publishedAt: string | null
  lastSeen: string
  durationSec: number | null
  views: number
  likes: number
  comments: number
  shares: number
  posts: number
  trendScore: number | null
  popularityScore: number
  platformRank: number
  sourceKind: DiscoverySourceKind
  fresh: boolean
}

export interface DiscoveryCoverage {
  platform: DiscoveryPlatform
  count: number
  mode: 'live' | 'measured' | 'unavailable'
  note: string
}

export interface DiscoveryScriptScene {
  order: number
  time: string
  visual: string
  narration: string
  onScreenText: string
  camera: string
  transition: string
}

export interface DiscoveryScript {
  title: string
  language: string
  angle: string
  hook: string
  durationSec: number
  voiceover: string
  scenes: DiscoveryScriptScene[]
  caption: string
  cta: string
  hashtags: string[]
  productionNotes: string[]
}

const PLATFORMS = new Set<DiscoveryPlatform>([
  'tiktok', 'youtube', 'youtube_shorts', 'instagram', 'google', 'reddit', 'music',
])

const PLATFORM_VOLUME_CEILING: Record<DiscoveryPlatform, number> = {
  tiktok: 1_000_000_000,
  youtube: 500_000_000,
  youtube_shorts: 250_000_000,
  instagram: 250_000_000,
  google: 10_000_000,
  reddit: 5_000_000,
  music: 100_000_000,
}

function clean(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function safeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

function safeDate(value: unknown) {
  const raw = clean(value, 80)
  if (!raw || !Number.isFinite(Date.parse(raw))) return null
  return new Date(raw).toISOString()
}

function safeUrl(value: unknown) {
  const raw = clean(value, 1000)
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function freshnessHours(result: Pick<DiscoveryResult, 'publishedAt' | 'lastSeen'>, now = Date.now()) {
  const dates = [result.publishedAt, result.lastSeen]
    .map((value) => value ? Date.parse(value) : Number.NaN)
    .filter(Number.isFinite)
  if (!dates.length) return Number.POSITIVE_INFINITY
  return Math.max(0, (now - Math.max(...dates)) / 3_600_000)
}

function popularity(result: Omit<DiscoveryResult, 'popularityScore' | 'platformRank' | 'fresh'>, now = Date.now()) {
  const volume = Math.max(result.views, result.posts * 700)
  const ceiling = PLATFORM_VOLUME_CEILING[result.platform]
  const volumeScore = Math.min(1, Math.log10(volume + 1) / Math.log10(ceiling))
  const engagementBase = Math.max(result.views, result.posts * 700, 1)
  const engagement = Math.min(1, (result.likes + result.comments * 3 + result.shares * 5) / engagementBase / 0.12)
  const age = freshnessHours(result, now)
  const freshness = Math.pow(0.5, age / 72)
  const existingScore = Math.max(0, Math.min(100, result.trendScore ?? 0)) / 100
  return Math.round((volumeScore * 0.52 + engagement * 0.15 + freshness * 0.23 + existingScore * 0.1) * 1000) / 10
}

export function discoveryFromTrend(row: CurrentTrendRow): DiscoveryResult | null {
  const url = safeUrl(row.url)
  if (!url || row.inferred || !PLATFORMS.has(row.platform)) return null
  const base = {
    id: row.id,
    platform: row.platform,
    title: clean(row.title, 220),
    description: clean(row.description, 700) || null,
    author: clean(row.author, 120) || null,
    url,
    thumbnail: safeUrl(row.thumbnail),
    language: clean(row.language, 12) || null,
    country: clean(row.country, 8) || null,
    publishedAt: safeDate(row.published_at),
    lastSeen: safeDate(row.last_seen) ?? new Date().toISOString(),
    durationSec: row.duration_sec && row.duration_sec > 0 ? Math.round(row.duration_sec) : null,
    views: safeNumber(row.views),
    likes: safeNumber(row.likes),
    comments: safeNumber(row.comments),
    shares: safeNumber(row.shares),
    posts: safeNumber(row.posts),
    trendScore: Number.isFinite(row.score) ? Number(row.score) : null,
    sourceKind: 'measured-index' as const,
  }
  return { ...base, popularityScore: popularity(base), platformRank: 0, fresh: freshnessHours(base) <= 72 }
}

export function discoveryFromRaw(item: RawTrendItem, sourceKind: 'live-api' | 'live-web'): DiscoveryResult | null {
  const url = safeUrl(item.url)
  if (!url || item.inferred || !PLATFORMS.has(item.platform)) return null
  const now = new Date().toISOString()
  const metrics = item.metrics ?? {}
  const base = {
    id: `${item.platform}:${item.kind}:${clean(item.external_id || item.url, 240)}`,
    platform: item.platform,
    title: clean(item.title, 220),
    description: clean(item.description, 700) || null,
    author: clean(item.author, 120) || null,
    url,
    thumbnail: safeUrl(item.thumbnail),
    language: clean(item.language, 12) || null,
    country: clean(item.country, 8) || null,
    publishedAt: safeDate(item.published_at),
    lastSeen: now,
    durationSec: item.duration_sec && item.duration_sec > 0 ? Math.round(item.duration_sec) : null,
    views: safeNumber(metrics.views),
    likes: safeNumber(metrics.likes),
    comments: safeNumber(metrics.comments),
    shares: safeNumber(metrics.shares),
    posts: safeNumber(metrics.posts),
    trendScore: null,
    sourceKind,
  }
  if (!base.title) return null
  return { ...base, popularityScore: popularity(base), platformRank: 0, fresh: freshnessHours(base) <= 72 }
}

export function rankDiscoveryResults(rows: DiscoveryResult[], limit = 36) {
  const unique = new Map<string, DiscoveryResult>()
  for (const row of rows) {
    const parsed = new URL(row.url)
    parsed.hash = ''
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|igshid$|si$)/i.test(key)) parsed.searchParams.delete(key)
    }
    const key = parsed.toString().replace(/\/$/, '').toLocaleLowerCase('en-US')
    const previous = unique.get(key)
    if (!previous || row.sourceKind.startsWith('live-')) unique.set(key, row)
  }
  const ranked = [...unique.values()].sort((a, b) =>
    b.popularityScore - a.popularityScore || b.views - a.views || Date.parse(b.lastSeen) - Date.parse(a.lastSeen)
  )
  const platformCounts = new Map<DiscoveryPlatform, number>()
  return ranked.slice(0, Math.max(1, Math.min(limit, 60))).map((row) => {
    const rank = (platformCounts.get(row.platform) ?? 0) + 1
    platformCounts.set(row.platform, rank)
    return { ...row, platformRank: rank }
  })
}

export function sanitizeDiscoverySource(value: unknown): DiscoveryResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const platform = clean(raw.platform, 32) as DiscoveryPlatform
  const url = safeUrl(raw.url)
  const title = clean(raw.title, 220)
  if (!PLATFORMS.has(platform) || !url || !title) return null
  const base = {
    id: clean(raw.id, 300), platform, title,
    description: clean(raw.description, 700) || null,
    author: clean(raw.author, 120) || null,
    url,
    thumbnail: safeUrl(raw.thumbnail),
    language: clean(raw.language, 12) || null,
    country: clean(raw.country, 8) || null,
    publishedAt: safeDate(raw.publishedAt),
    lastSeen: safeDate(raw.lastSeen) ?? new Date().toISOString(),
    durationSec: safeNumber(raw.durationSec) || null,
    views: safeNumber(raw.views), likes: safeNumber(raw.likes),
    comments: safeNumber(raw.comments), shares: safeNumber(raw.shares), posts: safeNumber(raw.posts),
    trendScore: Number.isFinite(Number(raw.trendScore)) ? Math.max(0, Math.min(100, Number(raw.trendScore))) : null,
    sourceKind: ['live-api', 'live-web', 'measured-index'].includes(String(raw.sourceKind))
      ? raw.sourceKind as DiscoverySourceKind : 'measured-index' as const,
  }
  return { ...base, popularityScore: popularity(base), platformRank: safeNumber(raw.platformRank), fresh: freshnessHours(base) <= 72 }
}

function list(value: unknown, limit: number, max: number) {
  return (Array.isArray(value) ? value : []).map((item) => clean(item, max)).filter(Boolean).slice(0, limit)
}

export function normalizeDiscoveryScript(value: unknown, language: DiscoveryLanguage, fallbackTitle: string): DiscoveryScript {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const rawScenes = Array.isArray(raw.scenes) ? raw.scenes : []
  const scenes = rawScenes.slice(0, 16).map((scene, index) => {
    const item = scene && typeof scene === 'object' && !Array.isArray(scene) ? scene as Record<string, unknown> : {}
    return {
      order: index + 1,
      time: clean(item.time, 30) || `${index * 5}-${(index + 1) * 5} sn`,
      visual: clean(item.visual, 400),
      narration: clean(item.narration, 500),
      onScreenText: clean(item.onScreenText, 180),
      camera: clean(item.camera, 180),
      transition: clean(item.transition, 160),
    }
  }).filter((scene) => scene.visual && (scene.narration || scene.onScreenText))
  if (scenes.length < 3) throw new Error('Senaryo yeterli sahne içermiyor.')
  const duration = Math.max(15, Math.min(180, safeNumber(raw.durationSec) || 45))
  return {
    title: clean(raw.title, 180) || clean(fallbackTitle, 180),
    language: DISCOVERY_LANGUAGES[language],
    angle: clean(raw.angle, 500),
    hook: clean(raw.hook, 400),
    durationSec: duration,
    voiceover: clean(raw.voiceover, 5000),
    scenes,
    caption: clean(raw.caption, 2200),
    cta: clean(raw.cta, 300),
    hashtags: list(raw.hashtags, 15, 60).map((tag) => tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`),
    productionNotes: list(raw.productionNotes, 12, 300),
  }
}
