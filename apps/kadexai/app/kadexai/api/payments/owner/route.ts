import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDynamicOffer } from '@/lib/payments/offers'
import { getPricingSnapshot, updatePricingOverrides } from '@/lib/payments/pricingConfig'
import { listPackages } from '@/lib/payments/catalog'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { recordAuditEvent } from '@/lib/audit/server'

export const dynamic = 'force-dynamic'

async function owner() {
  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) return null
  return user
}

function limited(request: NextRequest, action: string, max: number) {
  const limit = rateLimit(getRateLimitKey(request, `payments-owner-${action}`), max, 60_000)
  return { limit, headers: { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' } }
}

export async function GET(request: NextRequest) {
  const { limit, headers } = limited(request, 'read', 30)
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })
  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  try {
    const admin = createAdminClient()
    const now = Date.now()
    const weekStart = new Date(now - 7 * 86_400_000).toISOString()
    const monthStart = new Date(now - 30 * 86_400_000).toISOString()
    const [ordersResult, entitlementsResult, usersResult, auditResult] = await Promise.all([
      admin.from('payment_orders')
        .select('id, user_id, product_id, amount_minor, currency, status, checkout_url, expires_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100),
      // Sınırsız okuma yapma: yalnız aktif ve süresi geçmemiş yetkiler
      // MRR hesabına giriyor; tablo büyüdükçe sorgu sabit kalsın.
      admin.from('entitlements')
        .select('id, tier, period, api_included, status, expires_at')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(5_000),
      admin.from('profiles').select('user_id', { count: 'exact', head: true }),
      admin.from('platform_audit_events')
        .select('id, action, resource_type, outcome, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    // Hangi kaynağın düştüğü GÖRÜNÜR olmalı: tek bir "okunamadı" mesajı
    // eksik migration ile gerçek bir arıza arasındaki farkı gizliyordu.
    const sourceErrors: Record<string, string> = {}
    if (ordersResult.error) sourceErrors.orders = ordersResult.error.message
    if (entitlementsResult.error) sourceErrors.entitlements = entitlementsResult.error.message
    if (usersResult.error) sourceErrors.profiles = usersResult.error.message
    if (auditResult.error) sourceErrors.auditEvents = auditResult.error.message

    // Sipariş ve yetki olmadan satış merkezi anlamlı değil; ikisi zorunlu.
    if (ordersResult.error || entitlementsResult.error) {
      return NextResponse.json({
        error: 'Satış merkezi verileri okunamadı.',
        sourceErrors,
      }, { status: 503, headers })
    }

    const orders = ordersResult.data || []
    const paid = orders.filter((item) => item.status === 'paid')
    const sumSince = (iso: string) => paid
      .filter((item) => item.updated_at >= iso)
      .reduce((sum, item) => sum + item.amount_minor, 0)
    const active = (entitlementsResult.data || []).filter((item) => item.status === 'active' && new Date(item.expires_at).getTime() > now)
    const monthlyRecurringMinor = active.reduce((sum, item) => {
      const product = listPackages().find((candidate) => candidate.tier === item.tier && candidate.period === item.period && candidate.apiIncluded === item.api_included)
      if (!product) return sum
      const factor = item.period === 'weekly' ? 30 / 7 : item.period === 'yearly' ? 1 / 12 : 1
      return sum + Math.round(product.amountMinor * factor)
    }, 0)

    return NextResponse.json({
      metrics: {
        users: usersResult.error ? null : usersResult.count,
        activeSubscriptions: active.length,
        mrrMinor: monthlyRecurringMinor,
        arrMinor: monthlyRecurringMinor * 12,
        weeklySalesMinor: sumSince(weekStart),
        monthlySalesMinor: sumSince(monthStart),
        pendingPayments: orders.filter((item) => item.status === 'pending').length,
        failedPayments: orders.filter((item) => item.status === 'failed').length,
        expiredOffers: orders.filter((item) => item.status === 'expired').length,
      },
      orders,
      auditEvents: auditResult.error ? [] : auditResult.data,
      // Zorunlu olmayan kaynaklar düştüyse panel yine açılır, sebebi görünür.
      sourceErrors: Object.keys(sourceErrors).length ? sourceErrors : undefined,
      packages: listPackages(),
      pricing: getPricingSnapshot(),
    }, { headers })
  } catch (error) {
    captureApiError(error, '/api/payments/owner#get')
    return NextResponse.json({ error: 'Satış merkezi verileri okunamadı.' }, { status: 503, headers })
  }
}

export async function POST(request: NextRequest) {
  const { limit, headers } = limited(request, 'write', 10)
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })
  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  try {
    const body = await request.json() as {
      action?: 'create-offer' | 'update-pricing'
      productId?: string
      customerEmail?: string
      amountMinor?: number
      tierMonthlyTry?: Record<string, number>
      periodFactor?: Record<string, number>
      apiExcludedDiscount?: number
      tierLabels?: Record<string, string>
      tierFeatures?: Record<string, string[]>
    }

    if (body.action === 'create-offer') {
      const result = await createDynamicOffer({
        productId: String(body.productId || ''),
        customerEmail: String(body.customerEmail || ''),
        customAmountMinor: Number(body.amountMinor),
        validityMinutes: 15,
      })
      void recordAuditEvent({
        actorUserId: user.id,
        action: 'custom_offer.created',
        resourceType: 'payment_order',
        resourceId: result.orderId,
        metadata: { amountMinor: result.amountMinor, validityMinutes: 15 },
      })
      return NextResponse.json({ offer: result }, { status: 201, headers })
    }

    if (body.action === 'update-pricing') {
      const pricing = await updatePricingOverrides({
        tierMonthlyTry: body.tierMonthlyTry,
        periodFactor: body.periodFactor,
        apiExcludedDiscount: body.apiExcludedDiscount,
        tierLabels: body.tierLabels,
        tierFeatures: body.tierFeatures,
        updatedBy: user.email || user.id,
      })
      void recordAuditEvent({ actorUserId: user.id, action: 'pricing.updated', resourceType: 'pricing' })
      return NextResponse.json({ pricing }, { headers })
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400, headers })
  } catch (error) {
    captureApiError(error, '/api/payments/owner#post')
    const message = error instanceof Error ? error.message : 'İşlem tamamlanamadı.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
