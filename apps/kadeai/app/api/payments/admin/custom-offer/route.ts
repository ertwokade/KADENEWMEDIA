import { NextRequest, NextResponse } from 'next/server'
import { createDynamicOffer } from '@/lib/payments/offers'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import { hasValidAdminSecret } from '@/lib/auth/adminSecret'

export const dynamic = 'force-dynamic'

/**
 * Admin tarafindan tetiklenen, kisiye ozel/anlasilan fiyatli tek seferlik
 * odeme linki olusturma uc noktasi.
 *
 * Bu route kullanici oturumu degil, sunucular-arasi paylasilan bir sir
 * (KADEAI_ADMIN_API_SECRET) ile korunur - legacy site (kademedia admin
 * paneli / Teklif Builder) buraya server-to-server istek atar.
 */

export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-custom-offer'), 20, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Cok fazla istek.' }, { status: 429, headers })
  }

  if (!hasValidAdminSecret(request)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401, headers })
  }

  try {
    const body = (await request.json()) as {
      productId?: string
      customAmountMinor?: number
      customerEmail?: string
      currency?: string
      validityMinutes?: number
    }

    const result = await createDynamicOffer({
      productId: String(body.productId || ''),
      customAmountMinor: Number(body.customAmountMinor),
      customerEmail: String(body.customerEmail || ''),
      currency: body.currency === 'TRY' ? 'TRY' : undefined,
      validityMinutes: body.validityMinutes,
    })

    return NextResponse.json(result, { status: 201, headers })
  } catch (error) {
    captureApiError(error, '/api/payments/admin/custom-offer')
    const message = error instanceof Error ? error.message : 'Teklif olusturulamadi.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
