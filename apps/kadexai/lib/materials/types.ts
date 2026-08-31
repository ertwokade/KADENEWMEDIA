export type MaterialKind = 'video' | 'photo'

export interface MaterialItem {
  id: string
  source: string
  kind: MaterialKind
  externalId?: string | null
  title: string
  description?: string | null
  pageUrl: string
  mediaUrl?: string | null
  thumbnail?: string | null
  durationSec?: number | null
  width?: number | null
  height?: number | null
  viewCount?: number | null
  tags: string[]
  publishedAt?: string | null
}

export interface MaterialFilters {
  q?: string
  kind?: string
  source?: string
  sort?: 'yeni' | 'izlenme' | 'sure'
  limit: number
  offset: number
}

export interface MaterialSyncResult {
  source: string
  found: number
  inserted: number
  updated: number
  ok: boolean
  error?: string
}
