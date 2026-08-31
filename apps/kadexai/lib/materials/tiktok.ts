import 'server-only'

/**
 * TikTok materyal toplayicisi.
 *
 * TikTok, profil video listesini oturumsuz vermiyor; Creative Center uclari da
 * cerez istiyor. Bu yuzden:
 *  - TIKTOK_COOKIE varsa Creative Center araması ile kanalin videolari cekilir,
 *  - yoksa BOS liste ve acik bir gerekce doner.
 * Materyal kutuphanesi bir arsiv oldugu icin burada "cikarim" uretmiyoruz:
 * olmayan bir video kaydi olusturmak kutuphaneyi kirletir.
 */
import { getJson } from '@/lib/kade-search/http'
import type { MaterialItem } from './types'

const BASE = 'https://ads.tiktok.com/creative_radar_api/v1'

interface RadarResponse {
  data?: {
    videos?: Array<{
      id?: string
      item_id?: string
      title?: string
      cover?: string
      video_url?: string
      duration?: number
      play_count?: number
      create_time?: number
    }>
  }
}

export interface TikTokResult {
  items: MaterialItem[]
  reason?: string
}

export async function collectTikTok(handleInput?: string): Promise<TikTokResult> {
  const cookie = process.env.TIKTOK_COOKIE?.trim()
  if (!cookie) {
    return {
      items: [],
      reason: 'TIKTOK_COOKIE tanımlı değil; TikTok profil listesi oturumsuz alınamıyor.',
    }
  }
  const handle = (handleInput || process.env.KADE_TIKTOK_HANDLE || '@kadenewmedia').replace(/^@/, '')

  const res = await getJson<RadarResponse>(
    `${BASE}/popular_trend/list?period=30&page=1&limit=50&keyword=${encodeURIComponent(handle)}`,
    { headers: { cookie, 'user-agent': 'Mozilla/5.0', 'accept-language': 'tr-TR,tr;q=0.9' } }
  )
  if (!res.ok) return { items: [], reason: `TikTok yanıtı alınamadı (${res.status}).` }

  const items: MaterialItem[] = []
  for (const video of res.data?.data?.videos ?? []) {
    const id = video.item_id || video.id
    if (!id) continue
    items.push({
      id: `tiktok:video:${id}`,
      source: 'tiktok',
      kind: 'video',
      externalId: id,
      title: video.title ?? '',
      description: null,
      pageUrl: `https://www.tiktok.com/@${handle}/video/${id}`,
      mediaUrl: video.video_url ?? null,
      thumbnail: video.cover ?? null,
      durationSec: video.duration ?? null,
      width: null,
      height: null,
      viewCount: video.play_count ?? null,
      tags: [],
      publishedAt: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
    })
  }
  return { items }
}
