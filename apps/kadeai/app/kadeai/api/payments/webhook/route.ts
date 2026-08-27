import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments/server'
import { grantEntitlementForOrder } from '@/lib/payments/entitlements'
import { getPaymentProduct } from '@/lib/payments/catalog'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'
import { captureServerAnalytics } from '@/lib/analytics/server'
import { recordAuditEvent } from '@/lib/audit/server'

export const dynamic = 'force-dynamic'

interface PaidOrder {
  id: string
  user_id: string
  product_id: string
  analytics_consent?: boolean | null
}

/**
 * Ödenmiş sipariş için paket yetkisini garanti eder.
 *
 * Idempotent: aynı sipariş için ikinci çağrı `source_order_id` unique index'i
 * sayesinde yeni yetki üretmez. Bu yüzden hem ilk olayda hem de yinelenen
 * olayda güvenle çağrılabilir.
 *
 * Başarısızlık SESSİZ KALMAZ: audit trail'e `outcome: 'failed'` olarak yazılır.
 * Aksi halde "para tahsil edildi, paket açılmadı" durumu yalnızca Sentry'de
 * kalıyor ve satış merkezinde hiçbir iz bırakmıyordu.
 */
async function ensureEntitlement(admin: ReturnType<typeof createAdminClient>, order: PaidOrder) {
  const consented = order.analytics_consent === true
  try {
    const grant = await grantEntitlementForOrder(admin, {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id,
    })
    if (!grant.granted) {
      // 'zaten-verilmiş' beklenen ve iyi bir durum; diğer sebepler ürün
      // kataloğu dışı sipariş demektir ve iz bırakmalı.
      if (grant.reason && grant.reason !== 'zaten-verilmiş') {
        void recordAuditEvent({
          actorUserId: order.user_id,
          action: 'entitlement.grant_skipped',
          resourceType: 'payment_order',
          resourceId: order.id,
          outcome: 'failed',
          metadata: { reason: grant.reason, productId: order.product_id },
        })
      }
      return
    }

    void captureServerAnalytics('checkout_completed', order.user_id, consented)
    void captureServerAnalytics('subscription_activated', order.user_id, consented)
    // Paket yönü: yükseltme/düşürme ayrımı ürün kararları için gerekli.
    if (grant.tierChange === 'upgrade') void captureServerAnalytics('upgrade', order.user_id, consented)
    if (grant.tierChange === 'downgrade') void captureServerAnalytics('downgrade', order.user_id, consented)
  } catch (grantError) {
    captureApiError(grantError, '/api/payments/webhook#grant')
    void recordAuditEvent({
      actorUserId: order.user_id,
      action: 'entitlement.grant_failed',
      resourceType: 'payment_order',
      resourceId: order.id,
      outcome: 'failed',
      metadata: { productId: order.product_id },
    })
  }
}

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
    const { data: order } = await admin.from('payment_orders')
      .select('id, user_id, product_id, amount_minor, currency, status, analytics_consent, expires_at')
      .eq('id', event.orderId)
      .eq('provider', provider.name)
      .maybeSingle()
    if (!order) throw new Error('Ödeme siparişi bulunamadı.')

    if (order.status === 'expired') {
      return NextResponse.json(
        { error: 'Bu ödeme teklifi sona ermiş. Yeni bir sipariş oluşturulmalı.' },
        { status: 410, headers },
      )
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ ok: true, duplicate: true }, { headers })
    }

    if (order.expires_at && new Date(order.expires_at).getTime() <= Date.now()) {
      const { error: expireError } = await admin.from('payment_orders')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'pending')
      if (expireError) throw new Error('Süresi dolan ödeme güncellenemedi.')
      return NextResponse.json(
        { error: 'Bu ödeme teklifi sona ermiş. Yeni bir sipariş oluşturulmalı.' },
        { status: 410, headers },
      )
    }

    // Tutar, para birimi ve paket checkout sırasında yalnızca sunucudaki bu
    // kayıttan üretildi. Callback imzası sipariş kimliğini doğrular; grant de
    // tekrar bu kayıtlı product_id üzerinden yapılır, istemci girdisi kullanılmaz.
    if (!getPaymentProduct(order.product_id) || order.amount_minor <= 0 || order.currency !== 'TRY') {
      throw new Error('Ödeme siparişi doğrulaması başarısız.')
    }

    const { error: eventError } = await admin.from('payment_events').insert({
      provider: provider.name,
      event_id: event.eventId,
      order_id: event.orderId,
      status: event.status,
    })
    if (eventError?.code === '23505') {
      // Aynı olay daha önce işlendi. Ama ilk denemede yetki verme adımı
      // düşmüş olabilir (ör. tablo yok, geçici DB hatası). Sipariş ödenmişse
      // yetkiyi burada TEKRAR dene: grant zaten idempotent (source_order_id
      // üzerinde unique index). Aksi halde ödeme alınmış, paket hiç açılmamış
      // bir sipariş sessizce öyle kalırdı.
      if (event.status === 'paid') await ensureEntitlement(admin, order)
      return NextResponse.json({ ok: true, duplicate: true }, { headers })
    }
    if (eventError) throw new Error('Ödeme olayı kaydedilemedi.')
    const { error: updateError } = await admin.from('payment_orders')
      .update({ status: event.status, updated_at: new Date().toISOString() })
      .eq('id', event.orderId).eq('provider', provider.name).eq('status', 'pending')
    if (updateError) throw new Error('Ödeme durumu güncellenemedi.')
    if (order) {
      // Ödeme başarılıysa paket yetkisini OTOMATİK ver.
      if (event.status === 'paid') await ensureEntitlement(admin, order)
      const analyticsEvent = event.status === 'paid' ? 'payment_completed' : 'payment_failed'
      void captureServerAnalytics(analyticsEvent, order.user_id, order.analytics_consent === true)
    }
    return NextResponse.json({ ok: true, duplicate: false }, { headers })
  } catch (error) {
    captureApiError(error, '/api/payments/webhook')
    return NextResponse.json({ error: 'Webhook doğrulanamadı.' }, { status: 400, headers })
  }
}
