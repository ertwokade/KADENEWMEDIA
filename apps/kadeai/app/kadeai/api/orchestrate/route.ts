import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { PIPELINES, runPipeline } from '@/lib/orchestration/runner'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import type { AIModel, Platform } from '@/types'

export const dynamic = 'force-dynamic'

const PLATFORMS: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin']

function text(value: unknown, max: number, fallback = '') {
  const parsed = String(value ?? '').trim().slice(0, max)
  return parsed || fallback
}

/** Kullanılabilir akışlar — istemci adım listesini göremez, yalnız kimlik ve etiket. */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'orchestrate-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  return NextResponse.json({
    pipelines: PIPELINES.map((pipeline) => ({
      id: pipeline.id,
      label: pipeline.label,
      description: pipeline.description,
      steps: pipeline.steps.map((step) => ({ id: step.id, label: step.label })),
    })),
  }, { headers })
}

/**
 * Akışı çalıştırır. Zincir birden çok AI çağrısı yaptığı için limit dar
 * tutuldu: dakikada 3, kullanıcı başına.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'orchestrate-run'), 3, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla akış isteği. Bir dakika bekle.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    const body = await request.json() as Record<string, unknown>
    const platform = text(body.platform, 20) as Platform
    const niche = text(body.niche, 200)
    if (!niche) return NextResponse.json({ error: 'Niş alanı zorunlu.' }, { status: 400, headers })
    if (!PLATFORMS.includes(platform)) return NextResponse.json({ error: 'Geçersiz platform.' }, { status: 400, headers })

    const result = await runPipeline(user.id, {
      // Akış kimliği dışında hiçbir yapısal bilgi istemciden alınmaz.
      pipelineId: text(body.pipelineId, 60),
      niche,
      platform,
      goal: text(body.goal, 200, 'takipçi ve etkileşim artışı'),
      competitor: text(body.competitor, 400, 'Belirtilmedi — genel niş rekabeti üzerinden değerlendir.'),
      region: text(body.region, 60, 'Türkiye / Türkçe'),
      frequency: text(body.frequency, 60, 'haftada 3 içerik'),
      model: text(body.model, 40, 'auto') as AIModel,
    })

    return NextResponse.json(result, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Akış çalıştırılamadı.'
    // Yetki/akış hataları kullanıcı hatasıdır; sunucu hatası olarak loglanmaz.
    if (message.includes('paketinde') || message.includes('Bilinmeyen akış')) {
      return NextResponse.json({ error: message }, { status: 403, headers })
    }
    captureApiError(error, '/api/orchestrate#post')
    return NextResponse.json({ error: 'Akış çalıştırılamadı.' }, { status: 503, headers })
  }
}
