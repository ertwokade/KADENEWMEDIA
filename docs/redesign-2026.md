# Kade New Media — arayüz yeniden yapılandırması

Tarih: 29 Temmuz 2026
Referans yaklaşım: haoqi.design (birebir kopya değil; boşluk kullanımı,
editoryal tipografi, proje listeleme mantığı ve geçiş kalitesi uyarlandı)

## 1. Tespit edilen temel sorunlar

| # | Sorun | Kök neden |
|---|---|---|
| 1 | Ana sayfa ile iç sayfalar iki ayrı tasarım sistemi | `/` başka bir Next.js projesinin minified statik snapshot'ına (`public/site.html` + vendored `public/_next/**`) rewrite ediliyordu; kaynağı repoda yok |
| 2 | Ana sayfada hydration hatası (React #418) | Aynı snapshot; sunucu HTML'i ile istemci render'ı uyuşmuyordu |
| 3 | İçerik kalıcı olarak `opacity: 0`'da takılıyor | İki reveal sistemi aynı `.kade-reveal` sınıfını kullanıyor, eşit specificity'de sonra yüklenen CSS kazanıyordu |
| 4 | Portfolyo placeholder | Proje veri modeli, detay rotası ve yönetim ekranı yoktu |
| 5 | Admin'de uydurma veri | `DEFAULT_PORTFOLIO` sabitinde sahte müşteri adları ve performans rakamları |
| 6 | Her gezinme tam sayfa yüklemesi | Nav linkleri `static: true` ile `<a href>` idi (snapshot dönemi zorunluluğu) |
| 7 | Hizmet detayları ince içerik | Açıklama + özellik listesinden ibaretti |

## 2. Ana sayfada yapılan değişiklikler

`/` React uygulamasına taşındı (`src/pages/Home.jsx`). Snapshot'ın editoryal
görsel dili korundu: krem zemin, altın vurgu, büyük uppercase tipografi,
dikey ızgara, marquee, İSTANBUL/koordinat/saat durum şeridi.

Bölümler: hero → manifesto → marquee → seçili işler → hizmetler → süreç →
kapanış CTA → iletişim satırı.

Seçili işler bölümü admin portfolyo verisinden beslenir; veri yoksa boş
durum gösterir.

## 3. İç sayfalarda yapılan değişiklikler

| Sayfa | Değişiklik |
|---|---|
| `/hizmetler` | Editoryal satır düzeni, marquee, süreç bölümü |
| `/hizmetler/:slug` (6 sayfa) | 10 bölümlü ortak şablon: hero → problem → kime uygun → kapsam → süreç → teslim edilenler → örnek çalışmalar → SSS → ilgili hizmetler → CTA |
| `/portfolio` | Kategori filtresi, responsive grid, yükleniyor/boş/hata durumları |
| `/portfolio/:slug` | **Yeni** dinamik detay şablonu |
| `/paketler` | Kapsam kartları, koşullu fiyat, erişilebilir SSS |
| `/hakkimizda` | Manifesto → hikâye → değerler → prensipler → ekip → alanlar |
| `/iletisim` | Ortak hero + kapanış CTA (form mantığı değişmedi) |

## 4. Oluşturulan yeni rotalar

- `/portfolio/:slug` — proje detayı. `vercel.json` rewrite, `serve-dist.mjs`
  taklidi ve SEO doğrulayıcı aynı listeyi paylaşır.

## 5. Oluşturulan ortak bileşenler

`src/components/system/`:
`Reveal`, `RevealGroup`, `Logo`, `Container`, `Section`, `Eyebrow`,
`SectionHeading`, `PageHero`, `Button`, `LinkArrow`, `Media`,
`ProjectCard`, `ServiceCard`, `Marquee`, `ContactCTA`, `EmptyState`.

Destek modülleri: `src/utils/motion.js`, `src/utils/mediaValue.js`,
`src/config/brandAssets.js`, `src/data/projects.js`.

## 6. Animasyonların bozulma nedenleri

1. **Sınıf çakışması.** `kade-motion.js` seçici tabanlı otomatik reveal
   uygularken `.kade-reveal` sınıfını ekliyordu; yeni `Reveal` bileşeni de
   aynı sınıfı kullanıyordu. `.kade-motion .kade-reveal { opacity: 0 }` ile
   `.kade-reveal.is-visible { opacity: 1 }` eşit specificity'de; en son
   yüklenen `kade-yeni.css` kazanıyor ve içerik görünmez kalıyordu.
2. **Cleanup eksikliği.** Eski reveal `requestAnimationFrame` döngüsüyle
   çalışıyor, route değişiminde durmuyordu.
3. **Ölçüm zamanlaması.** Lazy medya yüklenmeden yapılan ölçüm bazı
   öğelerin hiç tetiklenmemesine yol açabiliyordu.

## 7. Animasyon sisteminde yapılan düzeltmeler

- Otomatik katman `.kade-automotion` adına taşındı; iki sistem çakışmıyor.
- `Reveal` bileşeni: tek IntersectionObserver, görünürlük React state'inde
  (CSS'e bırakılmaz), unmount'ta observer temizlenir, bir kez göründükten
  sonra observer bırakılır.
- **Failsafe:** observer 2,5 saniye içinde tetiklenmezse içerik zorla
  görünür yapılır — hiçbir koşulda `opacity: 0`'da takılmaz.
- `prefers-reduced-motion` açıkken içerik ilk render'da görünür başlar.
- Hareket tokenları: `--dur-micro` (0,18s), `--dur-ui` (0,36s),
  `--dur-page` (0,7s), üç easing, `--stagger-step`.
- Hover efektleri `@media (hover: hover)` ile sınırlandı; dokunmatikte
  takılı kalmaz.

## 8. Portfolyo ve proje detay sistemi

`src/data/projects.js` tek veri sözleşmesi: slug, müşteri, yıl, kategori,
özet (problem/hedef/yaklaşım/rol), süreç, medya, sonuçlar, hizmetler, SEO,
yayın durumu, sıra.

Kurallar:
- Bölümler veriye bağlı çizilir; boş alan → bölüm hiç render edilmez.
- Sonuç rakamları yalnız girildiyse gösterilir; uydurulmaz.
- Detay içeriği olmayan proje listede tıklanamaz ve sitemap'e girmez.
- Slug benzersizliği admin'de kontrol edilir ve önizlenir.

## 9. Poppins

Beş ağırlık (300/400/500/600/700), latin + latin-ext, self-host, toplam
66 KB. Fallback: `"Poppins", system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif`. Doğrulama: `scripts/verify-poppins.mjs` — 20 rotada
gerçekten çizilen font ölçülür, Türkçe glifler genişlik karşılaştırmasıyla
denetlenir.

## 10. Logo

`src/config/brandAssets.js` tek kayıt yeri, `components/system/Logo` tek
yerleştirme noktası. Header, mobil menü ve footer buradan beslenir.

**Kullanıcı logoları henüz yüklenmedi.** `hasBrandAssets = false` olduğu
için repodaki mevcut `/logo.svg` geçici olarak kullanılıyor. Sahte veya
otomatik üretilmiş logo bilerek oluşturulmadı.

## 11. Medya ve asset

- `Media` bileşeni: sabit en-boy oranı (layout shift yok), video için
  `autoplay/muted/loop/playsInline/preload/poster`, `onError` ile fallback.
- Görsel yoksa veya yüklenemezse alan boş kalmaz.
- Emoji/URL ayrımı `utils/mediaValue.js` ile yapılır.
- Kaldırıldı: `public/site.html`, `public/_next/**` (~2 MB), üç snapshot
  yama scripti.

## 12. Responsive

Test edilen genişlikler: 1440, 768, 390. Grid'ler `minmax(0, 1fr)` kullanır
(taşma koruması), tablolar kendi kapsayıcısında kayar, mobilde çok sütunlu
düzenler tek sütuna iner.

## 13. SEO

Korunan değişmezler (`scripts/verify-seo-invariants.mjs`):
- 20 indekslenebilir sayfa (ana sayfa dahil) ön-render + tek canonical
- 5 public arşiv `noindex, follow`
- Korumalı alanlar noindex + robots.txt
- Blanket SPA rewrite yok → bilinmeyen URL 404
- Redirect hedefleri ve kalıcılığı değişmedi

Eklenenler: `/portfolio/:slug` proje detayları indekslenir ve sitemap'e
girer (yalnız yayında + gerçek içerikli olanlar); breadcrumb, Service ve
FAQPage schema.

## 14. Performans

- Font: ~600 KB → 66 KB; Google Fonts runtime bağımlılığı yok.
- Vendored Next.js bundle (~2 MB) kaldırıldı.
- Animasyonlar yalnız `transform`, `opacity` ve `clip-path` kullanır.
- Görsellerde `loading="lazy"` (hero hariç), `decoding="async"`, sabit
  en-boy oranı.

## 15. Paket değişiklikleri

- Eklendi: `@axe-core/playwright` (devDependency, WCAG taraması).
- Kaldırılan çalışma zamanı bağımlılığı yok.

## 16. Test edilen ortamlar

Chromium (masaüstü 1440, tablet 768, mobil 390 — Playwright). Safari,
Firefox, Edge, iOS Safari ve Android Chrome'da elle doğrulama YAPILMADI.

## 17. Hâlâ gereken gerçek içerik

Bkz. ana rapor. Özet: logo dosyaları (5), portfolyo proje medyaları ve
metinleri, ekip/ofis fotoğrafları, sosyal medya adresleri, form alıcı
e-posta adresi.
