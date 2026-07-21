import type { BillingPeriod, PaymentProduct, PlanTier } from './types'

/**
 * KadeAI paket kataloğu.
 *
 * Ürünler; tier (Başlangıç/Pro/Sınırsız) × periyot (haftalık/aylık/yıllık) ×
 * API dahil/hariç kombinasyonlarından FİYAT MODELİ ile otomatik üretilir.
 *
 * 💡 Fiyatları değiştirmek için yalnızca `TIER_MONTHLY_TRY`, `PERIOD_FACTOR` ve
 *    `API_EXCLUDED_DISCOUNT` sabitlerini düzenlemen yeterli.
 *
 * Not: Kişiye özel / 15 dk geçerli teklifler bu katalogda YER ALMAZ; onlar
 * çalışma anında `createDynamicOffer()` ile üretilir (bkz. offers.ts).
 */

// —— Fiyat modeli (TRY, kuruş cinsinden minor unit) ————————————————————————

/** Aylık taban fiyat (API dahil, TL). Kolayca değiştir. */
const TIER_MONTHLY_TRY: Record<PlanTier, number> = {
  baslangic: 499,
  pro: 999,
  sinirsiz: 1999,
}

/** Periyot çarpanı: haftalık ~ ayın 1/3'ü, yıllıkta 2 ay bedava (×10). */
const PERIOD_FACTOR: Record<BillingPeriod, number> = {
  weekly: 0.35,
  monthly: 1,
  yearly: 10,
}

/** "API hariç" (kendi anahtarını getir) paketlerde indirim oranı. */
const API_EXCLUDED_DISCOUNT = 0.4

// —— Özellik matrisi (featureAccess ile eşleşir) ——————————————————————————

const TIER_FEATURES: Record<PlanTier, readonly string[]> = {
  baslangic: ['content-generation', 'image-basic', 'video-factory-basic'],
  pro: [
    'content-generation',
    'image-advanced',
    'video-factory',
    'auto-captions',
    'clip-generator',
  ],
  sinirsiz: [
    'content-generation',
    'image-advanced',
    'video-factory',
    'auto-captions',
    'clip-generator',
    'auto-publish',
    'bulk',
    'priority-queue',
  ],
}

const TIER_LABEL: Record<PlanTier, string> = {
  baslangic: 'Başlangıç',
  pro: 'Pro',
  sinirsiz: 'Sınırsız',
}

const PERIOD_LABEL: Record<BillingPeriod, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
}

// —— Katalog üretimi —————————————————————————————————————————————————————

const TIERS: PlanTier[] = ['baslangic', 'pro', 'sinirsiz']
const PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'yearly']

/** productId formatı: `<tier>-<period>-<api|noapi>` (ör. pro-monthly-api). */
export function buildProductId(tier: PlanTier, period: BillingPeriod, apiIncluded: boolean) {
  return `${tier}-${period}-${apiIncluded ? 'api' : 'noapi'}`
}

function priceMinor(tier: PlanTier, period: BillingPeriod, apiIncluded: boolean): number {
  const base = TIER_MONTHLY_TRY[tier] * PERIOD_FACTOR[period]
  const withApi = apiIncluded ? base : base * (1 - API_EXCLUDED_DISCOUNT)
  // TL → kuruş, tam sayıya yuvarla
  return Math.round(withApi * 100)
}

function buildProduct(tier: PlanTier, period: BillingPeriod, apiIncluded: boolean): PaymentProduct {
  const apiLabel = apiIncluded ? 'API Dahil' : 'Kendi Anahtarın'
  return Object.freeze({
    id: buildProductId(tier, period, apiIncluded),
    name: `KadeAI ${TIER_LABEL[tier]} — ${PERIOD_LABEL[period]} (${apiLabel})`,
    amountMinor: priceMinor(tier, period, apiIncluded),
    currency: 'TRY' as const,
    tier,
    period,
    apiIncluded,
    features: TIER_FEATURES[tier],
  })
}

const CATALOG: Readonly<Record<string, PaymentProduct>> = Object.freeze(
  Object.fromEntries(
    TIERS.flatMap((tier) =>
      PERIODS.flatMap((period) =>
        [true, false].map((apiIncluded) => {
          const p = buildProduct(tier, period, apiIncluded)
          return [p.id, p] as const
        }),
      ),
    ),
  ),
)

// Geriye dönük uyumluluk: eski sandbox test ürünü
const LEGACY: Readonly<Record<string, PaymentProduct>> = Object.freeze({
  'sandbox-credit': Object.freeze({
    id: 'sandbox-credit',
    name: 'KadeAI Sandbox Kredisi',
    amountMinor: 10000,
    currency: 'TRY' as const,
  }),
})

const PRODUCTS: Readonly<Record<string, PaymentProduct>> = Object.freeze({ ...LEGACY, ...CATALOG })

export function getPaymentProduct(productId: string): PaymentProduct | undefined {
  return PRODUCTS[productId]
}

/** UI için: tüm paketleri döndürür. */
export function listPackages(): PaymentProduct[] {
  return Object.values(CATALOG)
}

/** Bir planın kaç gün sürdüğü (yetki bitiş tarihini hesaplamak için). */
export function periodDurationDays(period: BillingPeriod): number {
  return period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
}

export { TIER_LABEL, PERIOD_LABEL, TIER_FEATURES }
