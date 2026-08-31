# 04 — Tasarım Sistemi (Faz 2)

Referans: `src/styles/kade-tokens.css` (tek doğruluk kaynağı) ve
`src/components/system/` bileşen katmanı — şartname §6 gereği birincil
tasarım kaynağı budur.

> **29 Tem 2026 notu.** Bu doküman ilk yazıldığında referans olarak
> `public/site.html` gösteriliyordu. O dosya başka bir projenin derlenmiş
> çıktısıydı ve kaldırıldı; tasarım kaynağı artık repodaki tokenlar ve
> bileşenlerdir. Ayrıntı: `docs/homepage-rebuild-plan.md`.

## 1. Design tokenları (kök — kaynak referans)

Kaynak: `src/index.css` (:root ve `[data-theme="dark"]` blokları).

| Grup | Token | Açık tema | Koyu tema |
|---|---|---|---|
| Renk — marka | `--primary` | `#e0a81f` | `#e0a81f` (sabit) |
| | `--primary-dark` | `#c8901a` | aynı |
| | `--primary-light` | `#fff2cc` | aynı |
| Renk — zemin | `--black` (asıl arka plan) | `#fdf6e3` (krem) | `#1a1715` |
| | `--white` (asıl metin) | `#17130a` (neredeyse siyah) | `#e8e2dc` |
| | `--bg-primary` | `#fdf6e3` | `#e8e2dc` |
| Renk — nötr skala | `--dark-gray/--gray/--gray-light/--gray-lighter` | krem tonları | koyu tonları |
| Kenarlık | `--border-color` | `rgba(23,19,10,.12)` | `rgba(0,0,0,.07)` |
| Gölge | `--shadow-glow`, `--shadow-glow-strong` | altın parıltı | altın parıltı (koyu zeminde) |
| Gradient | `--gradient-primary` | `135deg #e8b93a → #e0a81f` | aynı |
| Tipografi | `--font-display`/`--font-primary` | `TikTokSans, Outfit, sans-serif` | aynı |
| | `--font-secondary` | `TikTokSans, Inter, sans-serif` | aynı |
| | `--font-mono` | `GeistMono, ui-monospace, monospace` | aynı |
| Layout | `--section-padding` | `100px 0` (mobilde `60px 0`) | aynı |
| | `--container-width` | `1200px` | aynı |
| Hareket | `--transition-fast/normal/slow` | `.2s/.3s/.5s ease` | aynı |

**Marka rengi tek ve tutarlı: altın/amber `#e0a81f`.** Bu, bu oturumun önceki
turlarında yeniden tasarlanan `/@handle` link-profil sayfasında da (`#d4943f`
civarı, aynı aile) ve admin panelinin "Vurgu Rengi" seçicisinde de kullanılıyor —
**marka rengi zaten tutarlı**, ek iş gerekmiyor.

## 2. `apps/kadexai` tokenları — karşılaştırma

Kaynak: `apps/kadexai/app/globals.css`.

- Nötr skala: Tailwind `zinc-50…zinc-950` (CLAUDE.md'de de dokümante). Kök sitenin
  krem/siyah nötr skalasından **farklı bir sistem** (zinc gri tonları vs. kökün
  sıcak krem/kahve tonları).
  **Karar: Bu bilinçli bir ayrım olarak korunmalı** — kadexai bir "araç paneli"
  (dashboard, çok sayıda tablo/form/veri yoğun ekran), kök site bir pazarlama
  sitesi. Şartname §6.1 zaten "aynı marka ailesinde fakat kullanım amacına uygun
  ayrı yoğunluk seviyeleri" istiyor — bu tam olarak bu.
- Marka rengi: `--kade-yellow: #f2c322` — kökün `#e0a81f`'ine **çok yakın**, aynı
  altın/amber ailesi. Tutarlı, ek iş gerekmiyor.
- `--kade-paper`/`--kade-ink` kökün `--bg-primary`/`--white` mantığına paralel.

**Sonuç: renk/marka tutarlılığı zaten sağlanmış.** Eksik olan ortak, paylaşılan
bileşen kütüphanesi (aşağıya bakın), token'ların kendisi değil.

## 3. Ortak bileşen envanteri (şartname §6.1'in istediği liste)

| Bileşen | Kök'te var mı | kadexai'de var mı | Durum |
|---|---|---|---|
| Layout/Header/Footer | `src/components/Navbar.jsx`, `Footer.jsx` | `apps/kadexai/components/layout/*` (CLAUDE.md'de referans var) | Ayrı implementasyonlar, paylaşılmıyor — **beklenen** (ayrı Next.js/Vite projeleri, kod paylaşımı build-sistemi karmaşıklığı doğurur) |
| Section/Container | CSS class bazlı (`--container-width`) | Tailwind class bazlı | Farklı teknoloji, aynı görsel sonuç |
| Button | `.btn`, `.btn-primary`, `.btn-outline` (CSS) | Tailwind + muhtemelen `cn()` util (CLAUDE.md kuralı) | Var, tutarlı altın renk kullanıyor |
| Card | `.glass-card` (kök) | Tailwind `bg-zinc-800/50 border-zinc-700/50` (CLAUDE.md) | Var |
| Modal | `admin-modal-overlay`/`admin-modal` (Admin.jsx içinde) | — | Kökte var, kadexai'de doğrulanmadı |
| Toast | Admin panelinde `showToast` mevcut | — | Kökte var |
| Table | Admin panelinde `admin-table-wrapper` deseni | — | Kökte var |
| Tabs | Admin panelinde `admin-tabs`/`admin-tab` deseni | — | Kökte var |
| EmptyState | Admin panelinde `admin-empty-state` deseni | — | Kökte var |
| Skeleton | `kd-loading-card` (LinkProfile.jsx, bu oturumda görüldü) | — | Kısmi |
| ErrorState | `ErrorBoundary.jsx` (kök) | — | Var |

**Değerlendirme: Şartnamenin istediği bileşenlerin BÜYÜK KISMI zaten mevcut**,
ama resmi olarak adlandırılmış/dokümante edilmiş "design system" paketi olarak
değil — CSS class konvansiyonu olarak dağınık şekilde var. Bunları ayrı bir
component kütüphanesi paketine (`packages/ui` gibi) çıkarmak büyük bir refactor
riski taşır (davranış kırılması). **Karar: Mevcut CSS class konvansiyonu
korunacak, yeni sayfalar bu konvansiyona uyacak şekilde yazılacak — mevcut,
çalışan bileşenleri "resmi" bir pakete taşımak için ayrı bir refactor sprinti
gerekmiyor, risk/fayda dengesi negatif.**

## 4. Hata/durum sayfaları (§6.1)

| Sayfa | Kökte | kadexai'de |
|---|---|---|
| 404 | `src/pages/NotFound.jsx` — var, kullanılıyor (`*` route) | ayrı, doğrulanmadı |
| 403/401 | Admin `ProtectedAdminRoute` içinde JS-seviyeli engelleme var; **gerçek HTTP 403/401 sayfası olarak ayrı bir route yok** | — |
| 429 | Rate-limit API yanıtlarında JSON `{error: "Çok fazla..."}` var ama özel bir SAYFA yok | — |
| 500 | `ErrorBoundary.jsx` var (React hata sınırı) | — |
| Bakım sayfası | **Yok** | — |

**Blocker/eksik:** 403/401/429/bakım için özel tasarım sayfası yok, sadece JSON/
inline mesajlar var. Bu düşük-orta öncelikli bir Faz 8 işi — kritik değil çünkü
mevcut davranış (JSON hata + admin'de redirect) kullanıcıyı bilgilendiriyor, sadece
görsel olarak tutarlı değil.

## 5. Erişilebilirlik/hareket (§6.1) — güncellendi

- `prefers-reduced-motion`: 12 CSS/JS dosyasında zaten kısmi destek vardı (`AuroraBackground.css`, `kade-motion.js` vb.) ama site genelinde her yerde kullanılan `PageTransition.jsx` (her sayfa geçişi) ve `Animations.jsx` (`FadeIn`/`StaggerContainer`/`ScaleIn` — transform/scale tabanlı) bu tercihi **hiç kontrol etmiyordu**. **Düzeltildi:** `src/main.jsx`'te uygulama kökü `<MotionConfig reducedMotion="user">` ile sarıldı — Framer Motion'ın resmi mekanizması, OS/tarayıcı `prefers-reduced-motion` sinyali verdiğinde TÜM `motion.*` bileşenlerindeki transform tabanlı animasyonları (`y`/`x`/`scale`) otomatik devre dışı bırakır, opacity geçişlerini korur — tek satırlık, düşük riskli, tüm siteyi kapsayan bir çözüm (her bileşeni tek tek değiştirmek yerine).
- `apps/kadexai` bu turda incelenmedi.

## 6. Sonuç

**Design token seviyesinde iş yok** (marka rengi zaten tutarlı, iki
uygulama bilinçli olarak farklı yoğunluk seviyelerinde). Faz 8 için
planlanan üç eksikten ikisi artık kapalı: (a) 401/403/429/bakım
sayfaları — Faz 2'de eklendi, (b) reduced-motion — bu turda `MotionConfig`
ile kapatıldı. Kalan: (c) referans ürünlerden (rekt/YouMind/ChatCut)
hangi UI fikirlerinin alınacağına dair karar — `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md`'de
tamamlandı. **Bu belgenin kapsamındaki hiçbir madde artık açık değil.**
