import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { createAdminClient } from '@/lib/supabase/admin'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { RATES_REVIEWED_AT, listModelRates } from '@/lib/ai/pricing'

export const dynamic = 'force-dynamic'

const DAY_MS = 86_400_000
const MAX_ROWS = 50_000

interface UsageRow {
  user_id: string
  model: string
  provider: string | null
  tier: string | null
  total_tokens: number | null
  cost_usd: string | number | null
  byok: boolean
}

/**
 * USD → TRY dönüşümü yalnızca `KADE_USD_TRY_RATE` tanımlıysa yapılır.
 * Kur uydurulmaz; tanımsızsa brüt marj "hesaplanamadı" olarak döner.
 */
function usdTryRate(): number | null {
  const raw = Number(process.env.KADE_USD_TRY_RATE)
  return Number.isFinite(raw) && raw > 0 ? raw : null
}

function bucketAdd(
  map: Map<string, { tokens: number; costUsd: number; costKnown: boolean; requests: number }>,
  key: string,
  tokens: number,
  cost: number | null,
) {
  const current = map.get(key) || { tokens: 0, costUsd: 0, costKnown: true, requests: 0 }
  current.tokens += tokens
  current.requests += 1
  if (cost === null) current.costKnown = false
  else current.costUsd += cost
  map.set(key, current)
}

function toSortedList(map: Map<string, { tokens: number; costUsd: number; costKnown: boolean; requests: number }>, limit = 50) {
  return [...map.entries()]
    .map(([key, value]) => ({ key, ...value, costUsd: round6(value.costUsd) }))
    .sort((a, b) => b.costUsd - a.costUsd || b.tokens - a.tokens)
    .slice(0, limit)
}

function round6(value: number) {
  return Math.round(value * 1e6) / 1e6
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-usage'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
    return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })
  }

  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days')) || 30))
  const since = new Date(Date.now() - days * DAY_MS).toISOString()

  try {
    const admin = createAdminClient()
    const [usageResult, ordersResult] = await Promise.all([
      admin.from('ai_usage_events')
        .select('user_id, model, provider, tier, total_tokens, cost_usd, byok')
        .gte('created_at', since)
        .limit(MAX_ROWS),
      admin.from('payment_orders')
        .select('user_id, product_id, amount_minor, currency, status, updated_at')
        .eq('status', 'paid')
        .gte('updated_at', since)
        .limit(MAX_ROWS),
    ])

    if (usageResult.error) {
      // Migration henüz uygulanmadıysa burası düşer; bunu hata gibi değil,
      // "defter henüz canlıda yok" olarak bildir.
      return NextResponse.json({
        available: false,
        reason: 'ai_usage_events tablosu okunamadı. 202608260006_ai_usage_ledger.sql migration\'ı uygulanmamış olabilir.',
        ratesReviewedAt: RATES_REVIEWED_AT,
      }, { headers })
    }

    const rows = (usageResult.data || []) as UsageRow[]
    const byUser = new Map<string, { tokens: number; costUsd: number; costKnown: boolean; requests: number }>()
    const byModel = new Map<string, { tokens: number; costUsd: number; costKnown: boolean; requests: number }>()
    const byTier = new Map<string, { tokens: number; costUsd: number; costKnown: boolean; requests: number }>()

    let totalTokens = 0
    let totalCostUsd = 0
    let unpricedRequests = 0
    let byokRequests = 0
    // Hangi modellerin fiyatı bilinmiyor? "Bir şeyler eksik" demek yerine
    // doldurulmaya hazır bir iskelet üretebilmek için toplanıyor.
    const unpricedModels = new Set<string>()

    for (const row of rows) {
      const tokens = Number(row.total_tokens) || 0
      const cost = row.cost_usd === null || row.cost_usd === undefined ? null : Number(row.cost_usd)
      totalTokens += tokens
      if (cost === null) {
        unpricedRequests += 1
        unpricedModels.add(row.model)
      }
      else totalCostUsd += cost
      if (row.byok) byokRequests += 1

      bucketAdd(byUser, row.user_id, tokens, cost)
      bucketAdd(byModel, row.model, tokens, cost)
      bucketAdd(byTier, row.tier || 'free', tokens, cost)
    }

    const orders = ordersResult.error ? [] : (ordersResult.data || [])
    const revenueByCurrency = new Map<string, number>()
    const revenueByProduct = new Map<string, number>()
    for (const order of orders) {
      const currency = String(order.currency || 'TRY')
      revenueByCurrency.set(currency, (revenueByCurrency.get(currency) || 0) + Number(order.amount_minor || 0))
      revenueByProduct.set(String(order.product_id), (revenueByProduct.get(String(order.product_id)) || 0) + Number(order.amount_minor || 0))
    }

    const rate = usdTryRate()
    const revenueTryMinor = revenueByCurrency.get('TRY') || 0
    const costTryMinor = rate === null ? null : Math.round(totalCostUsd * rate * 100)
    const marginAvailable = rate !== null && unpricedRequests === 0 && revenueTryMinor > 0
    const grossMarginPercent = marginAvailable && costTryMinor !== null
      ? Math.round(((revenueTryMinor - costTryMinor) / revenueTryMinor) * 1000) / 10
      : null

    return NextResponse.json({
      available: true,
      windowDays: days,
      since,
      totals: {
        requests: rows.length,
        byokRequests,
        unpricedRequests,
        totalTokens,
        totalCostUsd: round6(totalCostUsd),
        costTryMinor,
        revenueTryMinor,
        revenueByCurrency: Object.fromEntries(revenueByCurrency),
        paidOrders: orders.length,
      },
      margin: {
        available: marginAvailable,
        grossMarginPercent,
        usdTryRate: rate,
        reason: marginAvailable
          ? null
          : rate === null
            ? 'KADE_USD_TRY_RATE tanımlı değil; USD maliyet TRY gelirle karşılaştırılamıyor.'
            : unpricedRequests > 0
              ? `${unpricedRequests} çağrının modeli fiyat tablosunda yok; maliyet eksik.`
              : 'Seçilen aralıkta ödenmiş sipariş yok.',
      },
      byUser: toSortedList(byUser),
      byModel: toSortedList(byModel),
      byTier: toSortedList(byTier),
      revenueByProduct: [...revenueByProduct.entries()]
        .map(([key, amountMinor]) => ({ key, amountMinor }))
        .sort((a, b) => b.amountMinor - a.amountMinor),
      rates: listModelRates(),
      ratesReviewedAt: RATES_REVIEWED_AT,
      unpricedModels: [...unpricedModels].sort(),
      // AI_MODEL_RATES_JSON'a olduğu gibi yapıştırılıp iki sayı doldurulur.
      unpricedTemplate: unpricedModels.size
        ? JSON.stringify(Object.fromEntries([...unpricedModels].sort().map((model) => [model, { in: 0, out: 0 }])))
        : null,
    }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/usage#get')
    return NextResponse.json({ error: 'Maliyet verileri okunamadı.' }, { status: 503, headers })
  }
}
