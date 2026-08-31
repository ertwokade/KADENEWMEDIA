import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { userHasFeature } from '@/lib/payments/access'
import { callBackend } from '@/lib/backend/client'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Video Fabrikası: konu/senaryodan otomatik video üretimi.
 * Yetki: aktif pakette 'video-factory' veya 'video-factory-basic' özelliği gerekir.
 * Üretim backend (FastAPI) motorunda çalışır.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'video-factory'), 5, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  // Paket yetkisi kontrolü
  const allowed = (await userHasFeature('video-factory')) || (await userHasFeature('video-factory-basic'))
  if (!allowed) {
    return NextResponse.json(
      { error: 'Bu özellik için aktif bir paket gerekli.', code: 'entitlement_required' },
      { status: 402, headers },
    )
  }

  try {
    const body = (await request.json()) as {
      subject?: string
      script?: string
      language?: 'tr' | 'en'
      aspect?: 'portrait' | 'landscape'
      voiceName?: string
    }
    const subject = String(body.subject || '').trim()
    if (subject.length < 2 || subject.length > 300) {
      return NextResponse.json({ error: 'Konu 2-300 karakter olmalı.' }, { status: 400, headers })
    }

    const result = await callBackend(
      '/video-factory',
      {
        subject,
        script: typeof body.script === 'string' ? body.script.slice(0, 8000) : '',
        language: body.language === 'en' ? 'en' : 'tr',
        aspect: body.aspect === 'landscape' ? 'landscape' : 'portrait',
        voice_name: body.voiceName || null,
      },
      280_000, // video üretimi uzun sürebilir
    )

    if (!result.ok) {
      const detail = (result.data as { detail?: string })?.detail || 'Video üretilemedi.'
      return NextResponse.json({ error: detail }, { status: result.status, headers })
    }
    return NextResponse.json(result.data, { headers })
  } catch (error) {
    captureApiError(error, '/api/video')
    return NextResponse.json({ error: 'Video üretimi başlatılamadı.' }, { status: 500, headers })
  }
}
