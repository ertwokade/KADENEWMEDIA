import type { SupabaseClient } from '@supabase/supabase-js'
import type { BillingPeriod, PlanTier } from './types'
import { getPaymentProduct, periodDurationDays, tierFeatures } from './catalog'

/**
 * Ödeme onaylandığında kullanıcıya paket yetkisini OTOMATİK veren katman.
 * Yalnızca sunucu (service-role) tarafından çağrılır.
 */

export interface ParsedPlan {
  tier: PlanTier
  period: BillingPeriod
  apiIncluded: boolean
}

const TIERS = new Set<PlanTier>(['baslangic', 'pro', 'sinirsiz'])
const PERIODS = new Set<BillingPeriod>(['weekly', 'monthly', 'yearly'])

/** `pro-monthly-api` → { tier:'pro', period:'monthly', apiIncluded:true } */
export function parseProductId(productId: string): ParsedPlan | null {
  const parts = productId.split('-')
  if (parts.length !== 3) return null
  const [tier, period, apiFlag] = parts
  if (!TIERS.has(tier as PlanTier)) return null
  if (!PERIODS.has(period as BillingPeriod)) return null
  if (apiFlag !== 'api' && apiFlag !== 'noapi') return null
  return {
    tier: tier as PlanTier,
    period: period as BillingPeriod,
    apiIncluded: apiFlag === 'api',
  }
}

export interface OrderForGrant {
  id: string
  user_id: string
  product_id: string
}

/**
 * Sipariş için yetki üretir. Idempotent: aynı sipariş için tek yetki
 * (entitlements_source_order_uidx sayesinde ikinci çağrı çakışırsa yok sayılır).
 */
export type TierChange = 'new' | 'upgrade' | 'downgrade' | 'renewal'

const TIER_RANK: Record<PlanTier, number> = { baslangic: 1, pro: 2, sinirsiz: 3 }

/** Yeni paketin öncekine göre yönü — analytics ve müşteri iletişimi için. */
async function resolveTierChange(
  admin: SupabaseClient,
  userId: string,
  nextTier: PlanTier,
): Promise<TierChange> {
  const { data } = await admin
    .from('entitlements')
    .select('tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previous = (data as { tier?: PlanTier } | null)?.tier
  if (!previous) return 'new'
  if (TIER_RANK[nextTier] > TIER_RANK[previous]) return 'upgrade'
  if (TIER_RANK[nextTier] < TIER_RANK[previous]) return 'downgrade'
  return 'renewal'
}

export async function grantEntitlementForOrder(
  admin: SupabaseClient,
  order: OrderForGrant,
): Promise<{ granted: boolean; reason?: string; tierChange?: TierChange }> {
  const plan = parseProductId(order.product_id)
  if (!plan) {
    // Katalog dışı ürün (ör. sandbox-credit) — yetki üretme.
    return { granted: false, reason: 'plan-dışı-ürün' }
  }

  // Ürünün gerçekten katalogda olduğunu doğrula (fiyat/özellik güvenliği)
  const product = getPaymentProduct(order.product_id)
  if (!product) return { granted: false, reason: 'bilinmeyen-ürün' }

  // Yön tespiti INSERT'ten ÖNCE yapılmalı; sonrasında yeni yetki de
  // "önceki" sayılır ve her satın alma 'renewal' görünürdü.
  const tierChange = await resolveTierChange(admin, order.user_id, plan.tier)

  const now = new Date()
  const expires = new Date(now.getTime() + periodDurationDays(plan.period) * 86_400_000)

  const { error } = await admin.from('entitlements').insert({
    user_id: order.user_id,
    tier: plan.tier,
    period: plan.period,
    api_included: plan.apiIncluded,
    features: tierFeatures(plan.tier),
    status: 'active',
    source_order_id: order.id,
    starts_at: now.toISOString(),
    expires_at: expires.toISOString(),
  })

  if (error) {
    // 23505 = unique violation → bu sipariş zaten yetkilendirilmiş (idempotent)
    if ((error as { code?: string }).code === '23505') return { granted: false, reason: 'zaten-verilmiş' }
    throw new Error(`Yetki verilemedi: ${error.message}`)
  }

  return { granted: true, tierChange }
}
