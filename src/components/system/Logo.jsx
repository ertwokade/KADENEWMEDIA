import { BRAND } from '../../config/brand'
import { LOGO_SOURCES, LOGO_RATIO, hasBrandAssets } from '../../config/brandAssets'

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
 * ŞU AN: kullanıcı logoları henüz yüklenmedi (`hasBrandAssets === false`).
 * Repodaki /logo.svg KULLANILAMAZ DURUMDA: viewBox 514×180 olduğu hâlde
 * gerçek çizim içeriği yalnız 65×100'lük bir köşede; tuvalin %87'si boş,
 * bu yüzden görsel minicik ve kırpılmış görünüyor.
 *
 * Bu nedenle logo dosyası gelene kadar METİN WORDMARK gösterilir — bozuk
 * bir görsel yerine sitenin önceki davranışı korunur. Sahte veya otomatik
 * üretilmiş bir logo BİLEREK oluşturulmamıştır.
 * Dosyalar eklenince config/brandAssets.js içinde `hasBrandAssets = true`
 * yapmak yeterlidir; burada değişiklik gerekmez.
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
  // Marka varlıkları yüklenene kadar metin wordmark.
  if (!hasBrandAssets) {
    return (
      <span
        className={`kade-logo kade-logo--text${className ? ` ${className}` : ''}`}
        aria-hidden={decorative || undefined}
        {...rest}
      >
        {BRAND.name.replace(' New', '')}
      </span>
    )
  }

  const src = LOGO_SOURCES[variant] || LOGO_SOURCES.primary

  return (
    <img
      src={src}
      // Oran korunur; width/height doğru oranla verilir ki görsel inmeden
      // yer ayrılsın (layout shift olmasın).
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
