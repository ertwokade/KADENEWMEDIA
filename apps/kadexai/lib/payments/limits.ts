import type { PlanTier } from './types'

/**
 * Paket bazlı sayısal limitler (§33 "getLimit" katmanı).
 *
 * `-1` = sınırsız. Kod içinde `if (tier === 'pro')` gibi dağınık kontroller
 * yerine buradaki tek tablo kullanılır.
 */

export type LimitKey =
  | 'monthly_ai_tokens'
  | 'projects'
  | 'brands'
  | 'bulk_batch_size'

/** Aktif paketi olmayan kullanıcı. */
export const FREE_TIER = 'free' as const
export type LimitTier = PlanTier | typeof FREE_TIER

const LIMITS: Record<LimitTier, Record<LimitKey, number>> = {
  free: {
    // Kota zorlaması varsayılan olarak KAPALI (bkz. isTokenQuotaEnforced).
    // Açılırsa mevcut ücretsiz kullanıcılar bu tavana çarpar — ürün kararıdır.
    monthly_ai_tokens: 100_000,
    projects: 1,
    brands: 1,
    bulk_batch_size: 3,
  },
  baslangic: {
    monthly_ai_tokens: 1_000_000,
    projects: 3,
    brands: 2,
    bulk_batch_size: 10,
  },
  pro: {
    monthly_ai_tokens: 5_000_000,
    projects: 15,
    brands: 10,
    bulk_batch_size: 50,
  },
  sinirsiz: {
    monthly_ai_tokens: -1,
    projects: -1,
    brands: -1,
    bulk_batch_size: 200,
  },
}

export function getLimitForTier(tier: LimitTier, key: LimitKey): number {
  return LIMITS[tier]?.[key] ?? LIMITS.free[key]
}

export function listLimitsForTier(tier: LimitTier): Record<LimitKey, number> {
  return { ...(LIMITS[tier] ?? LIMITS.free) }
}

/**
 * Token kotasının gerçekten BLOKLAYIP bloklamayacağı.
 *
 * Varsayılan `false`: kullanım ölçülür ve panelde gösterilir ama kimse
 * kesilmez. Canlıda ücretsiz kullanıcıları bir anda durdurmamak için
 * bilinçli olarak kapalı; `KADEXAI_ENFORCE_TOKEN_QUOTA=1` ile açılır.
 */
export function isTokenQuotaEnforced() {
  return process.env.KADEXAI_ENFORCE_TOKEN_QUOTA === '1'
}
