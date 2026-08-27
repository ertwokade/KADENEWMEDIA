import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { estimateCostUsd } from '@/lib/ai/pricing'
import { getLimitForTier, FREE_TIER, type LimitTier } from '@/lib/payments/limits'

/**
 * AI kullanım defteri (§32).
 *
 * Kayıt SUNUCUDA, sağlayıcı yanıtındaki gerçek token sayımından üretilir.
 * Tarayıcının bildirdiği değere güvenilmez.
 */

export interface UsageEventInput {
  userId: string
  tool?: string | null
  model: string
  provider?: string | null
  tier?: LimitTier | null
  productId?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  byok?: boolean
  status?: 'success' | 'failed'
}

function intOrNull(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed)
}

/**
 * Defter kaydını yazar. Hiçbir zaman fırlatmaz — telemetri, üretim akışını
 * durdurmamalı. Migration henüz uygulanmamışsa da sessizce geçer.
 */
export async function recordAiUsage(input: UsageEventInput): Promise<void> {
  try {
    const inputTokens = intOrNull(input.inputTokens)
    const outputTokens = intOrNull(input.outputTokens)
    const totalTokens = intOrNull(input.totalTokens)
      ?? (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null)

    const costUsd = estimateCostUsd({
      model: input.model,
      inputTokens,
      outputTokens,
      totalTokens,
      byok: input.byok,
    })

    const admin = createAdminClient()
    await admin.from('ai_usage_events').insert({
      user_id: input.userId,
      tool: input.tool || 'unknown',
      model: input.model,
      provider: input.provider || null,
      tier: input.tier && input.tier !== FREE_TIER ? input.tier : null,
      product_id: input.productId || null,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      byok: Boolean(input.byok),
      status: input.status || 'success',
    })
  } catch {
    // Defter yazılamadı; üretim isteği bundan etkilenmez.
  }
}

export interface UsageSummary {
  periodStart: string
  totalTokens: number
  billableTokens: number
  costUsd: number
  costKnown: boolean
  requests: number
  limit: number
  remaining: number | null
}

const DAY_MS = 86_400_000

/** Fatura dönemi başlangıcı: son 30 gün. */
export function currentPeriodStart(now = Date.now()) {
  return new Date(now - 30 * DAY_MS).toISOString()
}

/**
 * Kullanıcının içinde bulunduğu dönemdeki kullanımı ve kalan kotası.
 * Okuma başarısız olursa `null` döner — çağıran taraf kotayı zorlamaz
 * (fail-open: defter erişilemiyor diye ürün kilitlenmez).
 */
export async function getUserUsageSummary(userId: string, tier: LimitTier): Promise<UsageSummary | null> {
  try {
    const periodStart = currentPeriodStart()
    const admin = createAdminClient()

    // Toplama veritabanında yapılır: kota kontrolü her AI çağrısından önce
    // çalıştığı için satırları çekip burada toplamak sıcak yolu yavaşlatır.
    const { data, error } = await admin.rpc('ai_usage_summary', {
      p_user_id: userId,
      p_since: periodStart,
    })
    if (error) return null

    const row = (Array.isArray(data) ? data[0] : data) as {
      total_tokens?: number | string
      billable_tokens?: number | string
      cost_usd?: number | string
      unpriced_requests?: number | string
      requests?: number | string
    } | null
    if (!row) return null

    const totalTokens = Number(row.total_tokens) || 0
    const billableTokens = Number(row.billable_tokens) || 0
    const costUsd = Number(row.cost_usd) || 0
    // Fiyatı bilinmeyen çağrı varsa toplam maliyet eksiktir; UI bunu belirtir.
    const costKnown = (Number(row.unpriced_requests) || 0) === 0
    const requests = Number(row.requests) || 0

    const limit = getLimitForTier(tier, 'monthly_ai_tokens')
    return {
      periodStart,
      totalTokens,
      billableTokens,
      costUsd: Math.round(costUsd * 1e6) / 1e6,
      costKnown,
      requests,
      limit,
      remaining: limit < 0 ? null : Math.max(0, limit - billableTokens),
    }
  } catch {
    return null
  }
}
