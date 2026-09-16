/**
 * Zamanlanmış toplama iki saatte bir tek kaynak tarar. Erişimi olmayan kaynak
 * (ör. TikTok/Instagram bilgileri tanımlı değilken) döngüde kalırsa o dilimler
 * her gün sıfır kayıt ve yanlış kaynak uyarısı üretir; bu yüzden yalnız veri
 * alınabilecek kaynaklar arasında dönülür.
 */
export function rotationSource<T extends string>(sources: readonly T[], canCollect: (source: T) => boolean, now = Date.now()): T | null {
  const available = sources.filter(canCollect)
  if (!available.length) return null
  const twoHourBucket = Math.floor(now / (2 * 60 * 60 * 1000))
  return available[twoHourBucket % available.length]
}
