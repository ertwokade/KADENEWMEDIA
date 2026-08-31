import 'server-only'

import { getActiveEntitlement } from '@/lib/payments/access'
import { FREE_TIER, getLimitForTier, listLimitsForTier, type LimitKey } from '@/lib/payments/limits'
import { getPricingSnapshot } from '@/lib/payments/pricingConfig'
import { entitlementAllows, tierOf } from '@/lib/payments/planRules'

/**
 * Merkezi entitlement motoru (§33).
 *
 * Kural: özellik ve limit kontrolü kod içine `if (plan === 'pro')` biçiminde
 * dağıtılmaz. Her yerde `canUse()` / `getLimit()` kullanılır.
 */

export type { LimitKey }
export { entitlementAllows, tierOf }

export async function canUse(feature: string): Promise<boolean> {
  return entitlementAllows(await getActiveEntitlement(), feature)
}

export async function getLimit(key: LimitKey): Promise<number> {
  return getLimitForTier(tierOf(await getActiveEntitlement()), key)
}

export async function getCurrentPlan() {
  const entitlement = await getActiveEntitlement()
  const tier = tierOf(entitlement)
  return {
    tier,
    // Görünen ad fiyat yapılandırmasından gelir; arayüzde ikinci bir
    // tier->etiket eşlemesi tutulursa ikisi zamanla ayrışır.
    label: tier === FREE_TIER ? 'Ücretsiz' : getPricingSnapshot().tierLabels[tier],
    period: entitlement?.period ?? null,
    apiIncluded: entitlement?.api_included ?? false,
    features: entitlement?.features ?? [],
    expiresAt: entitlement?.expires_at ?? null,
    limits: listLimitsForTier(tier),
  }
}
