import { FREE_TIER, type LimitTier } from './limits'

/**
 * Paket kurallarının SAF (server-only bağımlılığı olmayan) çekirdeği.
 * `lib/entitlement.ts` bunları Supabase okumasıyla birleştirir; burada
 * tutulmalarının nedeni testlerde ve istemci tarafında da kullanılabilmeleri.
 */

export interface PlanLike {
  tier?: string | null
  api_included?: boolean | null
  features?: string[] | null
}

export function tierOf(entitlement: PlanLike | null | undefined): LimitTier {
  return (entitlement?.tier as LimitTier) ?? FREE_TIER
}

/**
 * `feature` yetkisi var mı? `api` özel anlamlıdır: features dizisinde değil,
 * `api_included` alanında tutulur (BYOK paketlerinde false).
 */
export function entitlementAllows(entitlement: PlanLike | null | undefined, feature: string): boolean {
  if (feature === 'api') return entitlement?.api_included === true
  return Boolean(entitlement?.features?.includes(feature))
}
