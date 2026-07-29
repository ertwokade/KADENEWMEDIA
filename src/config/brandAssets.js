/**
 * Marka görsel varlıklarının TEK kayıt yeri.
 *
 * Logo dosyaları yüklendiğinde yalnızca bu dosya değişir:
 *   1) dosyaları /public/brand/ altına koyun,
 *   2) `hasBrandAssets` değerini true yapın.
 * Header, sticky header, mobil menü, footer, loading ekranı, favicon,
 * manifest ve Open Graph alanları bu haritadan beslenir.
 *
 * ŞU AN: kullanıcı logoları henüz yüklemedi. Repoda mevcut /logo.svg
 * geçici olarak kullanılır. Sahte veya otomatik üretilmiş logo BİLEREK
 * oluşturulmamıştır.
 */
export const hasBrandAssets = false

export const LOGO_SOURCES = hasBrandAssets
  ? {
      primary: '/brand/logo-primary.svg',
      light: '/brand/logo-light.svg',
      dark: '/brand/logo-dark.svg',
      symbol: '/brand/logo-symbol.svg',
      favicon: '/brand/favicon.svg',
    }
  : {
      primary: '/logo.svg',
      light: '/logo.svg',
      dark: '/logo.svg',
      symbol: '/logo-icon.svg',
      favicon: '/favicon.png',
    }

/**
 * Ana logonun en-boy oranı (genişlik / yükseklik).
 * Mevcut /logo.svg 514×180 → 2.856. Kendi logonuzu ekledikten sonra bu
 * değeri de güncelleyin; `<img>` etiketine doğru height verilerek görsel
 * inmeden yer ayrılır ve layout shift oluşmaz.
 */
export const LOGO_RATIO = 514 / 180
