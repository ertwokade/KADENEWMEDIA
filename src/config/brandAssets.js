/**
 * Marka görsel varlıklarının TEK kayıt yeri.
 *
 * Header, sticky header, mobil menü, footer, loading ekranı, favicon,
 * manifest ve Open Graph alanları bu haritadan beslenir.
 *
 * ── Neden iki ayrı varlık var ────────────────────────────────────────────
 * Kullanıcının verdiği yatay wordmark (`/logo.png`, 514×180) altından
 * beyaza giden bir degrade taşıyor; KOYU ZEMİN İÇİN tasarlanmış.
 * Krem zemin (--kade-canvas #fbfaf4) üzerinde ölçüldüğünde:
 *
 *   şimşek işareti (0–128 px)   → 6,5–6,9:1   okunur
 *   "KADE" harfleri (128–514px) → 1,38–1,75:1 okunmaz
 *
 * Bu yüzden wordmark yalnız koyu zeminde (giriş ekranları, zemin
 * rgb(6,6,6)) kullanılır. Açık zeminde marka, GERÇEK şimşek sembolü +
 * metin wordmark bileşimiyle kurulur — sembol markayı taşır, metin
 * okunabilirliği garanti eder.
 *
 * Not: repoda duran `/logo-icon.svg` Kade'nin sembolü DEĞİL (ince, farklı
 * bir şimşek formu). Gerçek sembol `/favicon.png` — kullanıcının verdiği
 * dosya. Sembol gereken her yerde bu kullanılır.
 */
export const hasBrandAssets = true

export const LOGO_SOURCES = {
  /** Açık zemin — sembol + metin bileşimi (Logo.jsx kurar). */
  primary: '/favicon.png',
  /** Koyu zemin — tam yatay wordmark. */
  light: '/logo.png',
  /** Açık zemin — sembol + metin bileşimi. */
  dark: '/favicon.png',
  /** Yalnız işaret. */
  symbol: '/favicon.png',
  favicon: '/favicon.png',
}

/**
 * Yatay wordmark'ın en-boy oranı (genişlik / yükseklik) — `/logo.png`
 * 514×180. `<img>` etiketine doğru height verilerek görsel inmeden yer
 * ayrılır ve layout shift oluşmaz.
 */
export const LOGO_RATIO = 514 / 180

/** Kare sembolün oranı — `/favicon.png` 512×512. */
export const SYMBOL_RATIO = 1
