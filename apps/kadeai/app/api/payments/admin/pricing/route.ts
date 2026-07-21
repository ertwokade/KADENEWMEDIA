import { NextRequest, NextResponse } from 'next/server'
import { getPricingSnapshot, updatePricingOverrides } from '@/lib/payments/pricingConfig'
import { TIER_LABEL, PERIOD_LABEL } from '@/lib/payments/catalog'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

/**
 * KadeAI paket fiyatlandirmasini (TIER_MONTHLY_TRY / PERIOD_FACTOR /
 * API_EXCLUDED_DISCOUNT) yeniden deploy etmeden okuyup guncellemek icin
 * admin-only uc nokta.
 *
 * custom-offer route'unda oldugu gibi kullanici oturumu degil, sunucular-arasi
 * paylasilan bir sir (KADEAI_ADMIN_API_SECRET) ile korunur - legacy site
 * (kademedia admin paneli) buraya server-to-server istek atar.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.KADEAI_ADMIN_API_SECRET
  if (!secret) return false
  const provided = request.headers.get('x-kade-admin-secret') || ''
  return provided.length > 0 && provided === secret
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-pricing-get'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Cok fazla istek.' }, { status: 429, headers })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401, headers })
  }

  const snapshot = getPricingSnapshot()
  return NextResponse.json(
    {
      tierMonthlyTry: snapshot.tierMonthlyTry,
      periodFactor: snapshot.periodFactor,
      apiExcludedDiscount: snapshot.apiExcludedDiscount,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
      tierLabels: TIER_LABEL,
      periodLabels: PERIOD_LABEL,
    },
    { headers },
  )
}

export async function PUT(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-pricing-put'), 10, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Cok fazla istek.' }, { status: 429, headers })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401, headers })
  }

  try {
    const body = (await request.json()) as {
      tierMonthlyTry?: Record<string, number>
      periodFactor?: Record<string, number>
      apiExcludedDiscount?: number
      updatedBy?: string
    }

    const updated = await updatePricingOverrides({
      tierMonthlyTry: body.tierMonthlyTry,
      periodFactor: body.periodFactor,
      apiExcludedDiscount:
        typeof body.apiExcludedDiscount === 'number' ? body.apiExcludedDiscount : undefined,
      updatedBy: body.updatedBy,
    })

    return NextResponse.json(
      {
        ok: true,
        tierMonthlyTry: updated.tierMonthlyTry,
        periodFactor: updated.periodFactor,
        apiExcludedDiscount: updated.apiExcludedDiscount,
      },
      { headers },
    )
  } catch (error) {
    captureApiError(error, '/api/payments/admin/pricing')
    const message = error instanceof Error ? error.message : 'Fiyat ayarlari guncellenemedi.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
