import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import { captureServerAnalytics } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'payment-webhook'), 60, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla webhook isteği.' }, { status: 429, headers })
  const rawBody = await request.text()
  if (rawBody.length > 64_000) return NextResponse.json({ error: 'Webhook gövdesi çok büyük.' }, { status: 413, headers })

  try {
    const provider = getPaymentProvider()
    const event = provider.verifyWebhook(rawBody, request.headers.get('x-kade-signature') || '')
    const admin = createAdminClient()
    const { error: eventError } = await admin.from('payment_events').insert({
      provider: provider.name,
      event_id: event.eventId,
      order_id: event.orderId,
      status: event.status,
    })
    if (eventError?.code === '23505') return NextResponse.json({ ok: true, duplicate: true }, { headers })
    if (eventError) throw new Error('Ödeme olayı kaydedilemedi.')
    const { error: updateError } = await admin.from('payment_orders')
      .update({ status: event.status, updated_at: new Date().toISOString() })
      .eq('id', event.orderId).eq('provider', provider.name)
    if (updateError) throw new Error('Ödeme durumu güncellenemedi.')
    const { data: order } = await admin.from('payment_orders')
      .select('user_id, analytics_consent').eq('id', event.orderId).maybeSingle()
    if (order) {
      const analyticsEvent = event.status === 'paid' ? 'payment_completed' : 'payment_failed'
      void captureServerAnalytics(analyticsEvent, order.user_id, order.analytics_consent === true)
    }
    return NextResponse.json({ ok: true, duplicate: false }, { headers })
  } catch (error) {
    captureApiError(error, '/api/payments/webhook')
    return NextResponse.json({ error: 'Webhook doğrulanamadı.' }, { status: 400, headers })
  }
}
