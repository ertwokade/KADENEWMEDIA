import { BRAND } from '../../config/brand'
import { LOGO_SOURCES, LOGO_RATIO } from '../../config/brandAssets'

/**
 * Marka logosu — TEK yerleştirme noktası.
 *
 * Header, sticky header, mobil menü, footer, loading ekranı ve paylaşım
 * alanları bu bileşeni kullanır. Logo dosyaları güncellendiğinde yalnızca
 * config/brandAssets.js değişir; hiçbir sayfaya dokunulmaz.
 *
 * İki farklı kompozisyon var, çünkü tek bir dosya her zemin için çalışmıyor
 * (gerekçe ve ölçümler: config/brandAssets.js):
 *
 *   variant="light"  → koyu zemin. Tam yatay wordmark (`/logo.png`).
 *   diğer varyantlar → açık zemin. Gerçek şimşek sembolü + metin wordmark.
 *
 * Açık zeminde wordmark GÖRSELİ kullanılmaz: harfleri beyaza giden degrade
 * taşıdığı için krem zeminde 1,4:1 kontrasta düşüp kayboluyor. Sembol
 * markayı taşır, metin okunabilirliği garanti eder.
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
  const label = BRAND.name.replace(' New', '')

  // Koyu zemin: tam wordmark görseli — bu zeminde tasarlandığı gibi çalışır.
  if (variant === 'light') {
    return (
      <img
        src={LOGO_SOURCES.light}
        width={width}
        height={Math.round(width / LOGO_RATIO)}
        alt={decorative ? '' : BRAND.name}
        aria-hidden={decorative || undefined}
        className={`kade-logo${className ? ` ${className}` : ''}`}
        style={{ width, height: 'auto', display: 'block' }}
        loading="eager"
        decoding="async"
        draggable="false"
        {...rest}
      />
    )
  }

  // Yalnız işaret istendiğinde metin eklenmez.
  if (variant === 'symbol') {
    const size = Math.round(width / 4)
    return (
      <img
        src={LOGO_SOURCES.symbol}
        width={size}
        height={size}
        alt={decorative ? '' : BRAND.name}
        aria-hidden={decorative || undefined}
        className={`kade-logo kade-logo--symbol${className ? ` ${className}` : ''}`}
        loading="eager"
        decoding="async"
        draggable="false"
        {...rest}
      />
    )
  }

  // Açık zemin: sembol + metin. Tek bir erişilebilir ad taşır; sembol
  // dekoratiftir, adı yanındaki metin verir.
  return (
    <span
      className={`kade-logo kade-logo--lockup${className ? ` ${className}` : ''}`}
      aria-hidden={decorative || undefined}
      {...rest}
    >
      <img
        src={LOGO_SOURCES.symbol}
        width={26}
        height={26}
        alt=""
        aria-hidden="true"
        className="kade-logo__mark"
        loading="eager"
        decoding="async"
        draggable="false"
      />
      <span className="kade-logo__text">{label}</span>
    </span>
  )
}
