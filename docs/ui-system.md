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

## Renk kontrastı

Mürekkep tonları krem zemin (#fbfaf4 / #fdf6e3) üzerinde ölçülmüştür:

| Token | Oran | Kullanım |
|---|---:|---|
| `--kade-ink` | 16,9:1 | Ana metin, başlık |
| `--kade-ink-2` | 8,4:1 | İkincil metin |
| `--kade-ink-3` | 5,2:1 | Yardımcı metin — küçük punto dahil AA |
| `--kade-ink-4` | 2,4:1 | **AA'yı geçmez** — yalnız devre dışı kontrol, ayraç, dekoratif |

Footer ikincil metni önceden `rgba(23,19,10,0.45)` (2,97:1) idi ve 11 sayfada
WCAG 2.1 AA ihlali üretiyordu; `--kade-ink-3` tokenına bağlanarak tek noktadan
çözüldü.

## Modal ve dialog davranışı

`src/hooks/useDialog.js` iki API sunar:

- `useDialogBehavior()` — admin kökünde bir kez çağrılır, DOM'da açık olan
  modalı yönetir. Dokuz modal ayrı bileşenlerde tanımlı olduğu için her birini
  sarmalamak yerine merkezi davranış tercih edildi.
- `useDialogRef(open, onClose)` — yeni modallarda tercih edilen bileşen içi yol.

Her ikisi de Escape ile kapatma, odak tuzağı, açılışta odağı içeri taşıma,
kapanışta çağırana geri verme ve arka plan kaydırmasını durdurma sağlar.
Modallar `role="dialog"`, `aria-modal="true"` taşır; kapatma düğmelerinin
`aria-label="Kapat"` erişilebilir adı vardır.

## Admin düzen kuralları

- `.admin-main` bir flex item'dır; `min-width: 0` olmadan varsayılan
  `min-width: auto` yüzünden 390 px ekranda 510 px'e çıkıp paneli yatay
  kaydırıyordu.
- Yeni kodda inline `gridTemplateColumns` yerine `.admin-grid-2/3/4`
  sınıflarını kullanın: inline stil media query ile ezilemez. Mevcut 30+
  inline grid için dar ekranda tek sütuna indiren merkezi bir kural vardır.
- Geniş tablolar `.admin-table-wrapper` içinde `overflow-x: auto` ile kendi
  kapsayıcısında kayar; gövde asla yatay kaymaz.

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
- Admin mobil menü düğmesi `aria-label` + `aria-expanded` + `aria-controls`
  taşır, Escape ile kapanır; aktif bölüm `aria-current="page"` bildirir.
- axe-core ile WCAG 2.1 AA taraması 13 masaüstü + 4 mobil rotada çalışır
  (`tests/e2e/accessibility.spec.js`); serious/critical ihlal build'i düşürür.
  Ana sayfa kapsam dışıdır: kaynağı bu repoda olmayan minified snapshot'tır.
- Dokunma hedefleri admin panelinde 24 px alt sınırıyla test edilir.

## Görsel doğrulama

Production-benzeri yerel build için `/`, `/hakkimizda`, `/hizmetler`,
`/paketler`, `/sss`, `/iletisim`, `/kariyer`, admin dashboard ve admin Footer
editörü 1440×900, 768×1024 ve 390×844 boyutlarında çekildi.

Toplam 27 “after” görseli
[`docs/design-references/`](./design-references/) altında
`after-<rota>-<viewport>-20260728114333.png` biçiminde saklanır. Eski
`audit-*` görselleri önceki görsel referans olarak korunmuştur.
