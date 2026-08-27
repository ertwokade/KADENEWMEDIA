import type { BillingPeriod, PaymentProduct, PlanTier } from './types'
import { getPricingSnapshot } from './pricingConfig'

/**
 * KadeAI paket kataloğu.
 *
 * Ürünler; tier (Başlangıç/Pro/Sınırsız) × periyot (haftalık/aylık/yıllık) ×
 * API dahil/hariç kombinasyonlarından FİYAT MODELİ ile otomatik üretilir.
 *
 * 💡 Fiyatlar artık admin panelinden (bkz. app/api/payments/admin/pricing/route.ts)
 * yeniden deploy etmeden düzenlenebilir — bkz. pricingConfig.ts. Oradaki
 * DEFAULT_TIER_MONTHLY_TRY / DEFAULT_PERIOD_FACTOR / DEFAULT_API_EXCLUDED_DISCOUNT
 * değerleri, veritabanında hiç override yokken ya da veritabanına erişilemezken
 * kullanılan güvenli varsayılanlardır.
 *
 * Not: Kişiye özel / 15 dk geçerli teklifler bu katalogda YER ALMAZ; onlar
 * çalışma anında `createDynamicOffer()` ile üretilir (bkz. offers.ts).
 */

// —— Özellik matrisi ve paket adları ——————————————————————————————————————
//
// Artık ikisi de admin panelinden yönetilebiliyor (§13). Varsayılanlar
// pricingConfig.ts'te; buradaki okumalar fiyatla aynı senkron snapshot'tan
// gelir, böylece checkout/webhook akışı asenkron hale gelmez.

/** Paketin açtığı özellikler — entitlement grant'ine bu liste yazılır. */
function tierFeatures(tier: PlanTier): readonly string[] {
  return getPricingSnapshot().tierFeatures[tier]
}

/** Kullanıcıya görünen paket adı. */
function tierLabel(tier: PlanTier): string {
  return getPricingSnapshot().tierLabels[tier]
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
  const snapshot = getPricingSnapshot()
  const base = snapshot.tierMonthlyTry[tier] * snapshot.periodFactor[period]
  const withApi = apiIncluded ? base : base * (1 - snapshot.apiExcludedDiscount)
  // TL → kuruş, tam sayıya yuvarla
  return Math.round(withApi * 100)
}

function buildProduct(tier: PlanTier, period: BillingPeriod, apiIncluded: boolean): PaymentProduct {
  const apiLabel = apiIncluded ? 'API Dahil' : 'Kendi Anahtarın'
  return Object.freeze({
    id: buildProductId(tier, period, apiIncluded),
    name: `KadeAI ${tierLabel(tier)} — ${PERIOD_LABEL[period]} (${apiLabel})`,
    amountMinor: priceMinor(tier, period, apiIncluded),
    currency: 'TRY' as const,
    tier,
    period,
    apiIncluded,
    features: tierFeatures(tier),
  })
}

/**
 * Katalog artık modül yüklenirken bir kez donmuş (frozen) bir nesne olarak
 * üretilmiyor — her çağrıda `getPricingSnapshot()`'un güncel (varsayılan ya da
 * admin panelinden güncellenmiş) değerleriyle YENİDEN hesaplanıyor. Bu sayede
 * admin panelinden yapılan bir fiyat değişikliği, sunucu yeniden başlatılmadan
 * (cache TTL'i içinde) devreye girer.
 */
function buildCatalog(): Record<string, PaymentProduct> {
  return Object.fromEntries(
    TIERS.flatMap((tier) =>
      PERIODS.flatMap((period) =>
        [true, false].map((apiIncluded) => {
          const p = buildProduct(tier, period, apiIncluded)
          return [p.id, p] as const
        }),
      ),
    ),
  )
}

// Geriye dönük uyumluluk: eski sandbox test ürünü (sabit fiyat, override edilmez)
const LEGACY: Readonly<Record<string, PaymentProduct>> = Object.freeze({
  'sandbox-credit': Object.freeze({
    id: 'sandbox-credit',
    name: 'KadeAI Sandbox Kredisi',
    amountMinor: 10000,
    currency: 'TRY' as const,
  }),
})

export function getPaymentProduct(productId: string): PaymentProduct | undefined {
  if (LEGACY[productId]) return LEGACY[productId]
  for (const tier of TIERS) {
    for (const period of PERIODS) {
      for (const apiIncluded of [true, false]) {
        if (buildProductId(tier, period, apiIncluded) === productId) {
          return buildProduct(tier, period, apiIncluded)
        }
      }
    }
  }
  return undefined
}

/** UI için: tüm paketleri döndürür. */
export function listPackages(): PaymentProduct[] {
  return Object.values(buildCatalog())
}

/** Bir planın kaç gün sürdüğü (yetki bitiş tarihini hesaplamak için). */
export function periodDurationDays(period: BillingPeriod): number {
  return period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365
}

export { PERIOD_LABEL, tierLabel, tierFeatures }

/**
 * Geriye dönük uyumluluk: eskiden sabit birer nesne olan TIER_LABEL ve
 * TIER_FEATURES artık DB'den beslendiği için fonksiyonla okunuyor. Çağıran
 * kod sabit nesne bekliyorsa güncel snapshot'tan üretilmiş kopya alır.
 */
export function TIER_LABEL_MAP(): Record<PlanTier, string> {
  return { ...getPricingSnapshot().tierLabels }
}

export function TIER_FEATURES_MAP(): Record<PlanTier, readonly string[]> {
  return { ...getPricingSnapshot().tierFeatures }
}
