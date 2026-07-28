import { BRAND } from '../../config/brand'
import { LOGO_SOURCES } from '../../config/brandAssets'

/**
 * Marka logosu — TEK yerleştirme noktası.
 *
 * Header, sticky header, mobil menü, footer, loading ekranı ve paylaşım
 * alanları bu bileşeni kullanır. Logo dosyaları güncellendiğinde yalnızca
 * aşağıdaki LOGO_SOURCES haritası değişir; hiçbir sayfaya dokunulmaz.
 *
 * Dosya yerleşimi (kullanıcı yükleyince):
 *   /public/brand/logo-primary.svg
 *   /public/brand/logo-light.svg    → koyu zemin
 *   /public/brand/logo-dark.svg     → açık zemin
 *   /public/brand/logo-symbol.svg
 *   /public/brand/favicon.svg
 *
 * Şu an bunlar HENÜZ YÜKLENMEDİ; mevcut /logo.svg geçici olarak kullanılır.
 * Sahte veya otomatik üretilmiş logo bilerek oluşturulmamıştır.
 * Yeni dosyalar eklendiğinde `hasBrandAssets` true yapılır.
 */

/**
 * @param {'primary'|'light'|'dark'|'symbol'} variant
 * @param {number} width  Piksel genişlik; yükseklik oranı korumak için auto.
 * @param {boolean} decorative  Yanında marka adı metni varsa true yapın;
 *                              logo ekran okuyucuya iki kez okunmaz.
 */
export default function Logo({
  variant = 'primary',
  width = 132,
  className = '',
  decorative = false,
  ...rest
}) {
  const src = LOGO_SOURCES[variant] || LOGO_SOURCES.primary

  return (
    <img
      src={src}
      width={width}
      height="auto"
      alt={decorative ? '' : BRAND.name}
      aria-hidden={decorative || undefined}
      className={`kade-logo${className ? ` ${className}` : ''}`}
      style={{ width, height: 'auto', display: 'block' }}
      // Logo her sayfada ilk boyada görünür; lazy yüklenmesi layout shift yapar.
      loading="eager"
      decoding="async"
      draggable="false"
      {...rest}
    />
  )
}
