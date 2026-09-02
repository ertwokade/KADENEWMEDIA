import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { getPricingSnapshot } from '@/lib/payments/pricingConfig'

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

/**
 * Hesap sahibi kendi ürününü kullanmak için paket SATIN ALMAK ZORUNDA DEĞİL.
 *
 * Bu olmadan sahip `tier: free` kalıyor ve pakete bağlı her özellik
 * (Video Fabrikası, Akışlar, toplu üretim…) kendisine de kapanıyordu —
 * canlıda hiç ödenmiş sipariş olmadığı için ürünün yarısı erişilemezdi.
 *
 * Sentetik olarak en üst paket verilir; veritabanına satır YAZILMAZ, bu yüzden
 * gelir raporlarını ve MRR hesabını kirletmez. Özellik listesi katalogla aynı
 * kaynaktan gelir, böylece pakete yeni özellik eklendiğinde sahip de alır.
 */
function ownerEntitlement(): ActiveEntitlement {
  return {
    tier: 'sinirsiz',
    period: 'yearly',
    api_included: true,
    features: [...getPricingSnapshot().tierFeatures.sinirsiz],
    // Sabit uzak tarih: sahip yetkisinin süresi dolmaz.
    expires_at: '2099-12-31T00:00:00.000Z',
  }
}

export async function getActiveEntitlement(): Promise<ActiveEntitlement | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  const { data } = await supabase
    .from('entitlements')
    .select('tier, period, api_included, features, expires_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const purchased = (data as ActiveEntitlement | null) ?? null
  if (purchased) return purchased

  // Satın alınmış yetki yoksa ve kullanıcı sahipse: en üst paket.
  if (user && (isAllowedOwnerUser(user) || isSettingsOwnerUser(user))) return ownerEntitlement()

  return null
}

/**
 * Kendi sağlayıcı anahtarını girebilir mi?
 *
 * Eskiden tek şart `api_included === false` idi: yani API'yi pakete dahil
 * ETMEYEN "Kendi Anahtarın" paketi. Sahibin yetkisi ise en üst paket olduğu
 * için `api_included: true` dönüyordu — her pakete sahip olan tek kişi,
 * BYOK ekranında yazı bile yazamıyordu (input `disabled` kalıyordu).
 *
 * Kendi anahtarını kullanmak bir kısıt değil, bir yetenek: API dahil paketi
 * olan da kendi anahtarını girip kendi kotasından harcamak isteyebilir.
 * Bu yüzden sahip her zaman, diğerleri ise etkin bir yetkisi olduğunda açık.
 */
export async function canUseOwnProviderKeys(): Promise<boolean> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (user && (isAllowedOwnerUser(user) || isSettingsOwnerUser(user))) return true

  const ent = await getActiveEntitlement()
  return Boolean(ent)
}

export async function userHasFeature(feature: string): Promise<boolean> {
  const ent = await getActiveEntitlement()
  return Boolean(ent?.features?.includes(feature))
}
