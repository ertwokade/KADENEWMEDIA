# Kade ortak UI sistemi

Tarih: 28 Temmuz 2026

## Tek doğruluk kaynağı

`src/styles/kade-tokens.css` React site, admin, müşteri panelleri, giriş
ekranları ve araçların ortak token katmanıdır. `src/index.css` bu dosyayı ilk
import olarak yükler.

Token grupları:

- Marka: altın, mürekkep, krem yüzey ve durum renkleri.
- Tipografi: 15 px mobil gövde alt sınırı, 400/500/600/700 ağırlıkları,
  akışkan başlık ölçeği ve ortak line-height.
- Düzen: 4 px tabanlı spacing, container, section boşluğu.
- Bileşen: radius, gölge, focus halkası, geçiş süreleri.
- Etkileşim: 44 px dokunma hedefi ve `prefers-reduced-motion`.

## Poppins

Aktif font sistemi self-host Poppins'tir. Dört ağırlık için latin ve latin-ext
subset'leri kullanılır; sekiz WOFF2 dosyanın toplamı 53.532 bayttır. Türkçe
`ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü` glifleri latin-ext dosyalarından gelir.

Eski fontların hem `public/fonts` kopyaları hem kök `fonts` kopyaları
kaldırıldı. Kök kopyalarda ayrıca yaklaşık 1,03 MB kullanılmayan binary vardı.
Form kontrolleri, dialog, placeholder ve dosya seçici fontu miras alır; gerçek
kod blokları okunabilirlik için monospace kalabilir.

## Statik snapshot ve bağımsız kabuklar

Ana sayfa React global CSS'ini yüklemediği için
`scripts/apply-poppins-to-site.mjs` build öncesi:

1. Poppins face/preload bloklarını ekler.
2. Snapshot Tailwind font değişkenlerini ezer.
3. Vendored FontFace URL'lerini Poppins'e taşır.
4. Inline font atamalarını güvenli stack'e çevirir.

`scripts/sanitize-site-snapshot.mjs` aynı aşamada başarısız QWeather isteğini
ve istemci bundle'ına gömülü anahtarı kaldırır. Her iki script idempotenttir ve
`legacy:prepare-snapshot` üzerinden production build hattının parçasıdır.

`public/404.html`, `public/offline.html`, Organizasyon Kiti iframe kabuğu,
canvas yazıları ve admin HTML raporu da Poppins'e taşındı.

## Responsive ve erişilebilirlik

- Kritik public rotalarda 390 px yatay taşma testi bulunur.
- 390/768/1440 canlı audit'inde yatay taşma görülmedi.
- Skip-link ve `main-content` hedefi korunur.
- Mobil menü `aria-expanded` durumunu bildirir.
- Footer admin formu label/id eşleşmeleriyle klavye ve ekran okuyucuya
  bağlandı.
- Admin başarı toast'ı `role=status`, hata toast'ı `role=alert` kullanır.
- Görünür focus halkası ve hareket azaltma tercihi otomatik test edilir.
- Emoji logo değerleri `<img src>` yapılmaz; URL/path/data görselleri ayrı
  doğrulanır.

## Görsel doğrulama

Production-benzeri yerel build için `/`, `/hakkimizda`, `/hizmetler`,
`/paketler`, `/sss`, `/iletisim`, `/kariyer`, admin dashboard ve admin Footer
editörü 1440×900, 768×1024 ve 390×844 boyutlarında çekildi.

Toplam 27 “after” görseli
[`docs/design-references/`](./design-references/) altında
`after-<rota>-<viewport>-20260728114333.png` biçiminde saklanır. Eski
`audit-*` görselleri önceki görsel referans olarak korunmuştur.
