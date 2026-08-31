import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { getConnection } from '@/lib/youtube/oauth'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
// YouTube dil kodlari: "tr", "en", "pt-BR" gibi.
const LANGUAGE = /^[a-zA-Z]{2,3}(-[A-Za-z0-9]{2,8})?$/

async function requireConnection() {
  const user = await getAuthenticatedUser()
  if (!user) return { error: NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 }) }
  const connection = await getConnection(user.id, { withToken: true })
  if (!connection.connected || !connection.accessToken) {
    return { error: NextResponse.json({ error: 'YouTube hesabı bağlı değil.' }, { status: 409 }) }
  }
  return { accessToken: connection.accessToken }
}

/** Bir videonun mevcut altyazi izleri. */
export async function GET(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const videoId = req.nextUrl.searchParams.get('videoId') ?? ''
  if (!VIDEO_ID.test(videoId)) return NextResponse.json({ error: 'Geçerli bir video ID gerekli.' }, { status: 400 })

  const conn = await requireConnection()
  if (conn.error) return conn.error

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${encodeURIComponent(videoId)}`,
      {
        headers: { Authorization: `Bearer ${conn.accessToken}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      }
    )
    const json = (await res.json()) as {
      items?: Array<{ id: string; snippet?: { language?: string; name?: string; trackKind?: string; isDraft?: boolean } }>
    }
    if (!res.ok) return NextResponse.json({ error: 'Altyazı listesi alınamadı.' }, { status: 502 })

    return NextResponse.json({
      izler: (json.items ?? []).map((item) => ({
        id: item.id,
        language: item.snippet?.language ?? '',
        name: item.snippet?.name ?? '',
        trackKind: item.snippet?.trackKind ?? 'standard',
        isDraft: Boolean(item.snippet?.isDraft),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Altyazı listesi alınamadı.' }, { status: 500 })
  }
}

interface UploadBody {
  videoId?: string
  language?: string
  name?: string
  content?: string
  format?: 'srt' | 'vtt'
  isDraft?: boolean
  captionId?: string
}

/**
 * Altyaziyi videoya yukler (captions.insert) veya mevcut izi gunceller
 * (captions.update). Google bu uclarda multipart/related gövde bekler.
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const limit = rateLimit(getRateLimitKey(req, 'youtube-captions'), 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  let body: UploadBody
  try {
    body = (await req.json()) as UploadBody
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const videoId = String(body.videoId ?? '')
  const language = String(body.language ?? 'tr')
  const content = String(body.content ?? '')
  const name = String(body.name ?? 'KadexAI').slice(0, 80)

  if (!VIDEO_ID.test(videoId)) return NextResponse.json({ error: 'Geçerli bir video ID gerekli.' }, { status: 400 })
  if (!LANGUAGE.test(language)) return NextResponse.json({ error: 'Geçersiz dil kodu.' }, { status: 400 })
  if (!content.trim()) return NextResponse.json({ error: 'Altyazı içeriği boş.' }, { status: 400 })
  if (content.length > 2_000_000) return NextResponse.json({ error: 'Altyazı dosyası çok büyük.' }, { status: 413 })

  const conn = await requireConnection()
  if (conn.error) return conn.error

  const isUpdate = Boolean(body.captionId)
  const snippet = isUpdate
    ? { id: body.captionId, snippet: { isDraft: Boolean(body.isDraft) } }
    : { snippet: { videoId, language, name, isDraft: Boolean(body.isDraft) } }

  const boundary = `kade${Date.now().toString(36)}`
  const multipart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(snippet),
    `--${boundary}`,
    `Content-Type: ${body.format === 'vtt' ? 'text/vtt' : 'application/octet-stream'}`,
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  try {
    const url = `https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=${isUpdate ? 'id,snippet' : 'snippet'}`
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
      signal: AbortSignal.timeout(90_000),
    })
    const json = (await res.json()) as {
      id?: string
      snippet?: { language?: string; name?: string }
      error?: { message?: string; errors?: Array<{ reason?: string }> }
    }

    if (!res.ok) {
      const reason = json.error?.errors?.[0]?.reason
      const message =
        reason === 'captionExists'
          ? 'Bu dilde altyazı zaten var. Mevcut izi güncellemeyi seç.'
          : reason === 'forbidden'
            ? 'Bu video için altyazı yükleme izni yok (video bağlı kanala ait olmalı).'
            : json.error?.message || 'Altyazı yüklenemedi.'
      return NextResponse.json({ error: message, reason }, { status: res.status === 403 ? 403 : 502 })
    }

    return NextResponse.json({
      yuklendi: true,
      captionId: json.id ?? null,
      language: json.snippet?.language ?? language,
      name: json.snippet?.name ?? name,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Altyazı yüklenemedi.' }, { status: 500 })
  }
}
