import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { getConnection } from '@/lib/youtube/oauth'

export const dynamic = 'force-dynamic'

/** Bagli kanalin kendi videolari — altyazi yuklerken hedef secmek icin. */
export async function GET(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })

  const limit = rateLimit(getRateLimitKey(req, 'youtube-videos'), 20, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  try {
    const connection = await getConnection(user.id, { withToken: true })
    if (!connection.connected || !connection.accessToken) {
      return NextResponse.json({ error: 'YouTube hesabı bağlı değil.' }, { status: 409 })
    }

    const params = new URLSearchParams({
      part: 'snippet',
      forMine: 'true',
      type: 'video',
      order: 'date',
      maxResults: String(Math.min(Number(req.nextUrl.searchParams.get('limit')) || 25, 50)),
    })
    const q = req.nextUrl.searchParams.get('q')
    if (q) params.set('q', q.slice(0, 80))

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      headers: { Authorization: `Bearer ${connection.accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    const json = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string }
        snippet?: { title?: string; publishedAt?: string; thumbnails?: { default?: { url?: string } } }
      }>
    }
    if (!res.ok) return NextResponse.json({ error: 'YouTube videoları alınamadı.' }, { status: 502 })

    const videolar = (json.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        id: item.id!.videoId as string,
        title: item.snippet?.title ?? 'Başlıksız video',
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbnail: item.snippet?.thumbnails?.default?.url ?? null,
      }))

    return NextResponse.json({ videolar })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Videolar alınamadı.' }, { status: 500 })
  }
}
