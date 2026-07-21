import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Paket yetkisi kontrolü. Kullanıcının aktif (süresi geçmemiş) bir
 * entitlement'ı ve içinde istenen `feature` var mı?
 *
 * RLS: kullanıcı yalnızca kendi entitlement'larını okuyabilir.
 */

export interface ActiveEntitlement {
  tier: 'baslangic' | 'pro' | 'sinirsiz'
  period: 'weekly' | 'monthly' | 'yearly'
  api_included: boolean
  features: string[]
  expires_at: string
}

export async function getActiveEntitlement(): Promise<ActiveEntitlement | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('entitlements')
    .select('tier, period, api_included, features, expires_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ActiveEntitlement | null) ?? null
}

export async function userHasFeature(feature: string): Promise<boolean> {
  const ent = await getActiveEntitlement()
  return Boolean(ent?.features?.includes(feature))
}
