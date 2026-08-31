import 'server-only'

import { NextResponse } from 'next/server'
import { getActiveEntitlement } from '@/lib/payments/access'
import { entitlementAllows } from '@/lib/payments/planRules'
import { getToolById } from '@/lib/tools/registry'

/**
 * Paket kısıtlamasının GERÇEK uygulandığı yer.
 *
 * Menüdeki kilit ikonu yalnızca bir işarettir; kullanıcı adresi doğrudan
 * yazabilir ya da API'yi kendisi çağırabilir. Kısıtlama bu yüzden sunucuda,
 * isteği karşılayan uçta yapılır.
 *
 * Hesap sahibi satın alma olmadan tam yetkili sayıldığı için
 * getActiveEntitlement() ona bütün özellikleri döndürür ve buradan sorunsuz
 * geçer; ayrıca bir sahip kontrolü gerekmez.
 */
export async function requireToolFeature(...toolIds: string[]): Promise<NextResponse | null> {
  // Bazı uçları birden çok araç kullanıyor (ör. /api/transcribe hem Klip
  // Üretici hem Altyazı için çalışıyor). Bu durumda araçlardan HERHANGİ
  // BİRİNE hakkı olan kullanıcı geçer; aksi halde altyazı hakkı olan biri
  // klip özelliği yok diye engellenirdi.
  const araclar = toolIds.map((id) => getToolById(id)).filter(Boolean)
  const gerekli = [...new Set(araclar.flatMap((t) => t?.requiredFeature ?? []))]
  const tool = araclar[0]
  if (gerekli.length === 0) return null

  const entitlement = await getActiveEntitlement()
  // Listedeki özelliklerden herhangi biri yeterli: aynı aracın farklı
  // paketlerde farklı adı olabiliyor (image-basic / image-advanced gibi).
  const izinli = gerekli.some((feature) => entitlementAllows(entitlement, feature))
  if (izinli) return null

  return NextResponse.json(
    {
      error: `${tool?.name ?? 'Bu araç'} paketinde yok.`,
      kilit: { araclar: toolIds, gerekenOzellikler: gerekli },
      yonlendir: '/dashboard/packages',
    },
    { status: 402 },
  )
}
