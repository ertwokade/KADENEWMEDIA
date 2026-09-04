import { createAdminClient } from '@/lib/supabase/admin'
import type { BillingPeriod, PlanTier } from './types'

/**
 * KadexAI fiyatlandırma override katmanı.
 *
 * catalog.ts'teki TIER_MONTHLY_TRY / PERIOD_FACTOR / API_EXCLUDED_DISCOUNT
 * sabitleri artık yalnızca "varsayılan" (fallback) değerdir. Admin panelinden
 * (bkz. app/api/payments/admin/pricing/route.ts) kaydedilen kısmi override'lar
 * bu modülde bellek-içi (in-memory) bir cache'te tutulur ve senkron olarak
 * okunur — böylece checkout/webhook/entitlement gibi ödeme akışındaki hiçbir
 * çağrı asenkron hale getirilmek zorunda kalmaz.
 *
 * Supabase'e ulaşılamazsa ya da tablo boşsa cache sessizce varsayılan
 * değerlerde kalır: fiyat admin panelinden hiç düzenlenmemiş olsa da,
 * ya da veritabanı geçici olarak erişilemez olsa da ödeme akışı ASLA kırılmaz.
 */

const DEFAULT_TIER_MONTHLY_TRY: Record<PlanTier, number> = {
  baslangic: 499,
  pro: 999,
  sinirsiz: 1999,
}

const DEFAULT_PERIOD_FACTOR: Record<BillingPeriod, number> = {
  weekly: 0.35,
  monthly: 1,
  yearly: 10,
}

const DEFAULT_API_EXCLUDED_DISCOUNT = 0.4

const DEFAULT_TIER_LABELS: Record<PlanTier, string> = {
  baslangic: 'Başlangıç',
  pro: 'Pro',
  sinirsiz: 'Sınırsız',
}

const DEFAULT_TIER_FEATURES: Record<PlanTier, string[]> = {
  baslangic: ['content-generation', 'trend-radar', 'image-basic', 'video-factory-basic'],
  pro: ['content-generation', 'trend-radar', 'image-advanced', 'video-factory', 'auto-captions', 'clip-generator'],
  sinirsiz: [
    'content-generation', 'trend-radar', 'image-advanced', 'video-factory', 'auto-captions',
    'clip-generator', 'auto-publish', 'bulk', 'priority-queue',
  ],
}

export interface PricingSnapshot {
  tierMonthlyTry: Record<PlanTier, number>
  periodFactor: Record<BillingPeriod, number>
  apiExcludedDiscount: number
  /** Kullanıcıya görünen paket adları (§13). */
  tierLabels: Record<PlanTier, string>
  /** Paketin açtığı özellikler; entitlement grant'ine bu liste yazılır. */
  tierFeatures: Record<PlanTier, string[]>
  fetchedAt: number
  source: 'default' | 'db'
}

let cache: PricingSnapshot = {
  tierMonthlyTry: { ...DEFAULT_TIER_MONTHLY_TRY },
  periodFactor: { ...DEFAULT_PERIOD_FACTOR },
  apiExcludedDiscount: DEFAULT_API_EXCLUDED_DISCOUNT,
  tierLabels: { ...DEFAULT_TIER_LABELS },
  tierFeatures: cloneFeatures(DEFAULT_TIER_FEATURES),
  fetchedAt: 0,
  source: 'default',
}

function cloneFeatures(value: Record<PlanTier, string[]>): Record<PlanTier, string[]> {
  return {
    baslangic: [...value.baslangic],
    pro: [...value.pro],
    sinirsiz: [...value.sinirsiz],
  }
}

const TIERS: PlanTier[] = ['baslangic', 'pro', 'sinirsiz']

/** Boş ya da bozuk ad, paketi isimsiz bırakır — bu değerler reddedilir. */
function sanitizeLabelMap(value: unknown): Partial<Record<PlanTier, string>> {
  if (!value || typeof value !== 'object') return {}
  const out: Partial<Record<PlanTier, string>> = {}
  for (const key of TIERS) {
    const raw = (value as Record<string, unknown>)[key]
    if (typeof raw !== 'string') continue
    const label = raw.trim().slice(0, 60)
    if (label) out[key] = label
  }
  return out
}

/**
 * Özellik listesi entitlement'a yazıldığı için BOŞ dizi kabul edilmez:
 * yanlışlıkla temizlenen bir paket, satın alan kullanıcıyı yetkisiz bırakırdı.
 */
function sanitizeFeatureMap(value: unknown): Partial<Record<PlanTier, string[]>> {
  if (!value || typeof value !== 'object') return {}
  const out: Partial<Record<PlanTier, string[]>> = {}
  for (const key of TIERS) {
    const raw = (value as Record<string, unknown>)[key]
    if (!Array.isArray(raw)) continue
    const features = [...new Set(
      raw.map((item) => typeof item === 'string' ? item.trim().slice(0, 60) : '')
        .filter(Boolean),
    )].slice(0, 40)
    if (features.length > 0) out[key] = features
  }
  return out
}

const TTL_MS = 60_000
let refreshing = false

function sanitizeTierMap(value: unknown): Partial<Record<PlanTier, number>> {
  if (!value || typeof value !== 'object') return {}
  const out: Partial<Record<PlanTier, number>> = {}
  for (const key of ['baslangic', 'pro', 'sinirsiz'] as PlanTier[]) {
    const raw = (value as Record<string, unknown>)[key]
    const num = Number(raw)
    if (Number.isFinite(num) && num > 0) out[key] = num
  }
  return out
}

function sanitizePeriodMap(value: unknown): Partial<Record<BillingPeriod, number>> {
  if (!value || typeof value !== 'object') return {}
  const out: Partial<Record<BillingPeriod, number>> = {}
  for (const key of ['weekly', 'monthly', 'yearly'] as BillingPeriod[]) {
    const raw = (value as Record<string, unknown>)[key]
    const num = Number(raw)
    if (Number.isFinite(num) && num > 0) out[key] = num
  }
  return out
}

async function refreshFromDb(): Promise<void> {
  if (refreshing) return
  refreshing = true
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('kadexai_pricing_overrides')
      .select('tier_monthly_try, period_factor, api_excluded_discount, tier_labels, tier_features')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return

    const discount = Number(data.api_excluded_discount)
    cache = {
      tierMonthlyTry: { ...DEFAULT_TIER_MONTHLY_TRY, ...sanitizeTierMap(data.tier_monthly_try) },
      periodFactor: { ...DEFAULT_PERIOD_FACTOR, ...sanitizePeriodMap(data.period_factor) },
      apiExcludedDiscount:
        Number.isFinite(discount) && discount >= 0 && discount < 1 ? discount : DEFAULT_API_EXCLUDED_DISCOUNT,
      tierLabels: { ...DEFAULT_TIER_LABELS, ...sanitizeLabelMap(data.tier_labels) },
      tierFeatures: { ...cloneFeatures(DEFAULT_TIER_FEATURES), ...sanitizeFeatureMap(data.tier_features) },
      fetchedAt: Date.now(),
      source: 'db',
    }
  } catch {
    // Sessizce yut — mevcut (varsayılan ya da son bilinen) cache ile devam.
  } finally {
    refreshing = false
  }
}

/**
 * Senkron okuma: her zaman en son bilinen değerleri anında döner.
 * Cache süresi dolmuşsa arka planda tazeleme başlatır (bu çağrıyı bloklamaz).
 */
export function getPricingSnapshot(): PricingSnapshot {
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    void refreshFromDb()
  }
  return cache
}

/** Cold start sırasında bir kez çağrılabilir; hata verirse sessizce yutulur. */
export function primePricingCache(): void {
  void refreshFromDb()
}

export interface PricingOverrideInput {
  tierMonthlyTry?: Partial<Record<PlanTier, number>>
  periodFactor?: Partial<Record<BillingPeriod, number>>
  apiExcludedDiscount?: number
  tierLabels?: Partial<Record<PlanTier, string>>
  tierFeatures?: Partial<Record<PlanTier, string[]>>
  updatedBy?: string
}

export async function updatePricingOverrides(input: PricingOverrideInput): Promise<PricingSnapshot> {
  const admin = createAdminClient()
  const current = getPricingSnapshot()

  const mergedTier = { ...current.tierMonthlyTry, ...sanitizeTierMap(input.tierMonthlyTry) }
  const mergedPeriod = { ...current.periodFactor, ...sanitizePeriodMap(input.periodFactor) }
  const mergedDiscount =
    typeof input.apiExcludedDiscount === 'number' &&
    Number.isFinite(input.apiExcludedDiscount) &&
    input.apiExcludedDiscount >= 0 &&
    input.apiExcludedDiscount < 1
      ? input.apiExcludedDiscount
      : current.apiExcludedDiscount

  const mergedLabels = { ...current.tierLabels, ...sanitizeLabelMap(input.tierLabels) }
  const mergedFeatures = { ...current.tierFeatures, ...sanitizeFeatureMap(input.tierFeatures) }

  const { error } = await admin
    .from('kadexai_pricing_overrides')
    .update({
      tier_monthly_try: mergedTier,
      period_factor: mergedPeriod,
      api_excluded_discount: mergedDiscount,
      tier_labels: mergedLabels,
      tier_features: mergedFeatures,
      updated_at: new Date().toISOString(),
      updated_by: input.updatedBy || null,
    })
    .eq('id', 1)

  if (error) throw new Error(`Fiyat ayarları kaydedilemedi: ${error.message}`)

  cache = {
    tierMonthlyTry: mergedTier,
    periodFactor: mergedPeriod,
    apiExcludedDiscount: mergedDiscount,
    tierLabels: mergedLabels,
    tierFeatures: mergedFeatures,
    fetchedAt: Date.now(),
    source: 'db',
  }
  return cache
}

export {
  DEFAULT_TIER_MONTHLY_TRY,
  DEFAULT_PERIOD_FACTOR,
  DEFAULT_API_EXCLUDED_DISCOUNT,
  DEFAULT_TIER_LABELS,
  DEFAULT_TIER_FEATURES,
  sanitizeLabelMap,
  sanitizeFeatureMap,
}
