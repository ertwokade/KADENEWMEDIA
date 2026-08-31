import { NextRequest, NextResponse } from 'next/server'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function parseVideoId(value: string | null) {
  if (!value) return null
  const text = value.trim()
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return /^[A-Za-z0-9_-]{11}$/.test(text) ? text : null
}

export async function GET(req: NextRequest) {
  if (!(await hasAuthenticatedUser())) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const limit = rateLimit(getRateLimitKey(req, 'youtube-comments'), 10, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  const key = process.env.YOUTUBE_API_KEY?.trim()
  if (!key) return NextResponse.json({ error: 'YouTube entegrasyonu yapılandırılmamış.' }, { status: 503 })

  const { searchParams } = req.nextUrl
  const videoId = parseVideoId(searchParams.get('videoUrl') || searchParams.get('videoId'))
  if (!videoId) return NextResponse.json({ error: 'Geçerli bir YouTube linki/ID bulunamadı.' })

  const max = Math.min(Number(searchParams.get('max')) || 100, 300)
  const comments: Array<{ text: string; likes: number; author: string }> = []
  let pageToken = ''

  try {
    while (comments.length < max) {
      const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('videoId', videoId)
      url.searchParams.set('maxResults', '100')
      url.searchParams.set('order', 'relevance')
      url.searchParams.set('key', key)
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) return NextResponse.json({ error: 'YouTube yorumları alınamadı.' }, { status: 502 })

      for (const item of data.items || []) {
        const snippet = item.snippet?.topLevelComment?.snippet
        if (snippet) {
          comments.push({
            text: snippet.textOriginal || '',
            likes: snippet.likeCount || 0,
            author: snippet.authorDisplayName || '',
          })
        }
      }

      pageToken = data.nextPageToken || ''
      if (!pageToken) break
    }
  } catch {
    return NextResponse.json({ error: 'YouTube yorumları alınamadı.' }, { status: 500 })
  }

  return NextResponse.json({ videoId, comments: comments.slice(0, max) })
}
