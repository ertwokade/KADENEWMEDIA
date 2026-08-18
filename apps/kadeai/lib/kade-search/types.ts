/** KADE SEARCH veri tipleri (toplama -> siniflandirma -> depolama -> pano). */

export type TrendPlatform =
  | 'tiktok' | 'youtube' | 'youtube_shorts' | 'instagram' | 'google' | 'reddit' | 'music'

export type TrendKind =
  | 'hashtag' | 'sound' | 'video' | 'creator' | 'topic' | 'keyword' | 'format' | 'challenge'

export type TrendStage = 'emerging' | 'rising' | 'peak' | 'plateau' | 'declining' | 'dead'

export type SourceId = 'googleTrends' | 'tiktok' | 'youtube' | 'musicCharts' | 'reddit' | 'instagram'

export interface TrendMetrics {
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  posts?: number
  followers?: number
  extra?: Record<string, unknown>
}

/** Toplayicidan cikan ham kayit. */
export interface RawTrendItem {
  platform: TrendPlatform
  kind: TrendKind
  external_id?: string | null
  title: string
  description?: string | null
  author?: string | null
  author_url?: string | null
  url?: string | null
  thumbnail?: string | null
  country?: string | null
  language?: string | null
  rank?: number | null
  duration_sec?: number | null
  published_at?: string | null
  hashtags?: string[]
  tags?: string[]
  hint?: string | null
  industry?: string | null
  ytCategoryId?: string | number | null
  sourceCategory?: string | null
  inferred?: boolean
  metrics?: TrendMetrics
  raw?: Record<string, unknown>
}

/** Siniflandirmadan gecmis kayit. */
export interface EnrichedTrendItem extends RawTrendItem {
  normalized: string
  category: string
  subcategories: string[]
  categoryConfidence: number
  formats: string[]
  language: string
}

/** Veritabanindaki trend satiri (kade_trends). */
export interface TrendRow {
  id: string
  platform: TrendPlatform
  kind: TrendKind
  external_id: string | null
  title: string
  normalized: string
  url: string | null
  thumbnail: string | null
  author: string | null
  author_url: string | null
  description: string | null
  category: string | null
  subcategories: string[]
  formats: string[]
  country: string | null
  language: string | null
  duration_sec: number | null
  published_at: string | null
  first_seen: string
  last_seen: string
  inferred: boolean
}

export interface SnapshotRow {
  id: number
  trend_id: string
  run_id: string | null
  captured_at: string
  rank: number | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  posts: number
  followers: number
  extra: Record<string, unknown>
}

export interface ScoreRecord {
  trend_id: string
  score: number
  velocity: number
  acceleration: number
  engagement: number
  volume_score: number
  rank_score: number
  cross_score: number
  freshness: number
  stage: TrendStage
  breakdown: Record<string, number | boolean>
}

/** kade_trend_current gorunumunun satiri: trend + son skor + son olcum. */
export interface CurrentTrendRow extends TrendRow {
  score: number | null
  velocity: number | null
  acceleration: number | null
  engagement: number | null
  volume_score: number | null
  rank_score: number | null
  cross_score: number | null
  freshness: number | null
  stage: TrendStage | null
  breakdown: Record<string, number | boolean> | null
  computed_at: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  posts: number | null
  followers: number | null
  rank: number | null
  snapshot_count: number
  link_count: number
}

export interface TrendFilters {
  platform?: string
  kind?: string
  category?: string
  country?: string
  stage?: string
  format?: string
  q?: string
  sort?: 'score' | 'velocity' | 'views' | 'new' | 'title'
  limit?: number
  offset?: number
  minScore?: number
  sinceHours?: number
}

export interface CollectResult {
  items: RawTrendItem[]
  errors: string[]
  note?: string
}

export interface Collector {
  id: SourceId
  label: string
  platforms: TrendPlatform[]
  collect(opts: { country: string; limit: number; period: number }): Promise<CollectResult>
}

export interface TrendAlert {
  id: number
  trend_id: string | null
  type: 'breakout' | 'watchlist' | 'cross_platform' | 'new_format'
  message: string
  severity: string
  created_at: string
  seen: boolean
}
