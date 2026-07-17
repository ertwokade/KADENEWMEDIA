import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { getPaymentProduct } from '@/lib/payments/catalog'
import { getPaymentProvider } from '@/lib/payments/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import { captureServerAnalytics } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'payment-checkout'), 5, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla ödeme isteği.' }, { status: 429, headers })

  try {
    const user = await assertAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })
    const body = await request.json() as { productId?: string }
    const product = getPaymentProduct(String(body.productId || ''))
    if (!product) return NextResponse.json({ error: 'Geçersiz ürün.' }, { status: 400, headers })

    const provider = getPaymentProvider()
    const idempotencyKey = request.headers.get('idempotency-key') || randomUUID()
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      return NextResponse.json({ error: 'Geçersiz idempotency anahtarı.' }, { status: 400, headers })
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('payment_orders')
      .select('id, provider, checkout_url, status')
      .eq('user_id', user.id).eq('idempotency_key', idempotencyKey).maybeSingle()
    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        checkoutUrl: existing.checkout_url,
        provider: existing.provider,
        status: existing.status,
        duplicate: true,
      }, { headers })
    }

    const orderId = randomUUID()
    const analyticsConsent = request.headers.get('x-kade-analytics-consent') === 'granted'
    const { error } = await admin.from('payment_orders').insert({
      id: orderId,
      user_id: user.id,
      provider: provider.name,
      product_id: product.id,
      amount_minor: product.amountMinor,
      currency: product.currency,
      status: 'pending',
      idempotency_key: idempotencyKey,
      analytics_consent: analyticsConsent,
    })
    if (error) {
      if (error.code === '23505') {
        const { data: raced } = await admin.from('payment_orders')
          .select('id, provider, checkout_url, status')
          .eq('user_id', user.id).eq('idempotency_key', idempotencyKey).maybeSingle()
        if (raced) return NextResponse.json({ orderId: raced.id, checkoutUrl: raced.checkout_url, provider: raced.provider, status: raced.status, duplicate: true }, { headers })
      }
      throw new Error('Ödeme siparişi kaydedilemedi.')
    }

    const callbackUrl = new URL('/kadeai/api/payments/webhook', process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).toString()
    const checkout = await provider.createCheckout({ orderId, product, callbackUrl, customerEmail: user.email })
    const { error: updateError } = await admin.from('payment_orders')
      .update({ external_id: checkout.externalId, checkout_url: checkout.checkoutUrl })
      .eq('id', orderId).eq('user_id', user.id)
    if (updateError) throw new Error('Ödeme yönlendirmesi kaydedilemedi.')
    void captureServerAnalytics('payment_started', user.id, analyticsConsent)
    return NextResponse.json({ orderId, checkoutUrl: checkout.checkoutUrl, provider: provider.name }, { status: 201, headers })
  } catch (error) {
    captureApiError(error, '/api/payments/checkout')
    const message = error instanceof Error && /yapılandır|devre dışı|merchant/.test(error.message)
      ? error.message
      : 'Ödeme başlatılamadı.'
    return NextResponse.json({ error: message }, { status: 503, headers })
  }
}
