import 'server-only'

/**
 * YouTube materyal toplayicisi.
 *
 * Kanalin kendi yuklemelerini Data API v3 ile okur — bunun icin OAuth degil,
 * YOUTUBE_API_KEY yeterlidir (OAuth yalnizca kanala *yukleme* yaparken gerekir).
 * Anahtar yoksa sessizce bos doner; uydurma kayit uretmez.
 */
import { getJson } from '@/lib/kade-search/http'
import type { MaterialItem } from './types'

const API = 'https://www.googleapis.com/youtube/v3'
const PAGE = 50
const MAX_PAGES = 4

interface ChannelResponse {
  items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>
}

interface PlaylistResponse {
  nextPageToken?: string
  items?: Array<{ contentDetails?: { videoId?: string } }>
}

interface VideoResponse {
  items?: Array<{
    id: string
    snippet?: {
      title?: string
      description?: string
      publishedAt?: string
      tags?: string[]
      thumbnails?: Record<string, { url?: string; width?: number; height?: number }>
    }
    statistics?: { viewCount?: string }
    contentDetails?: { duration?: string }
  }>
}

/** PT1M30S -> 90 */
function isoDuration(value?: string) {
  if (!value) return null
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function bestThumb(thumbs?: Record<string, { url?: string; width?: number; height?: number }>) {
  if (!thumbs) return { url: null as string | null, width: null as number | null, height: null as number | null }
  const ordered = ['maxres', 'standard', 'high', 'medium', 'default']
  for (const key of ordered) {
    const thumb = thumbs[key]
    if (thumb?.url) return { url: thumb.url, width: thumb.width ?? null, height: thumb.height ?? null }
  }
  return { url: null, width: null, height: null }
}

async function uploadsPlaylist(handle: string, key: string) {
  const query = handle.startsWith('@')
    ? `forHandle=${encodeURIComponent(handle)}`
    : `id=${encodeURIComponent(handle)}`
  const res = await getJson<ChannelResponse>(`${API}/channels?part=contentDetails&${query}&key=${key}`)
  if (!res.ok) throw new Error(`YouTube kanal bilgisi alınamadı (${res.status}).`)
  const uploads = res.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) throw new Error(`YouTube kanalı bulunamadı: ${handle}`)
  return uploads
}

export async function collectYouTube(handleInput?: string): Promise<MaterialItem[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim()
  if (!key) return []
  const handle = (handleInput || process.env.KADE_YOUTUBE_HANDLE || '@kadenewmedia').trim()

  const playlist = await uploadsPlaylist(handle, key)
  const videoIds: string[] = []
  let pageToken: string | undefined

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${API}/playlistItems?part=contentDetails&playlistId=${playlist}&maxResults=${PAGE}` +
      (pageToken ? `&pageToken=${pageToken}` : '') + `&key=${key}`
    const res = await getJson<PlaylistResponse>(url)
    if (!res.ok) break
    for (const item of res.data?.items ?? []) {
      if (item.contentDetails?.videoId) videoIds.push(item.contentDetails.videoId)
    }
    pageToken = res.data?.nextPageToken
    if (!pageToken) break
  }
  if (!videoIds.length) return []

  const items: MaterialItem[] = []
  for (let i = 0; i < videoIds.length; i += PAGE) {
    const batch = videoIds.slice(i, i + PAGE).join(',')
    const res = await getJson<VideoResponse>(
      `${API}/videos?part=snippet,statistics,contentDetails&id=${batch}&key=${key}`
    )
    if (!res.ok) continue
    for (const video of res.data?.items ?? []) {
      const thumb = bestThumb(video.snippet?.thumbnails)
      items.push({
        id: `youtube:video:${video.id}`,
        source: 'youtube',
        kind: 'video',
        externalId: video.id,
        title: video.snippet?.title ?? '',
        description: video.snippet?.description ?? null,
        pageUrl: `https://www.youtube.com/watch?v=${video.id}`,
        mediaUrl: null,
        thumbnail: thumb.url,
        durationSec: isoDuration(video.contentDetails?.duration),
        width: thumb.width,
        height: thumb.height,
        viewCount: video.statistics?.viewCount ? Number(video.statistics.viewCount) : null,
        tags: video.snippet?.tags?.slice(0, 8) ?? [],
        publishedAt: video.snippet?.publishedAt ?? null,
      })
    }
  }
  return items
}
