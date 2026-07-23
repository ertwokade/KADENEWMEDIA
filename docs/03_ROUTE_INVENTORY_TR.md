# 03 — Rota Envanteri (Faz 1)

Tarih: 23 Temmuz 2026. Kaynak: `src/App.jsx` (kök, elle çıkarıldı) ve `apps/kadeai/app/**` (find ile otomatik çıkarıldı). Kökteki önceki `ROUTE_MATRIX.md`/`ROUTE_AUDIT.md` ile çapraz kontrol edildi; bu belge güncel/taze halidir.

**En önemli bulgu:** `apps/kadeai/app/dashboard/**` altında zaten 39 araç sayfası var ve bunların çoğu şartnamenin §15 (genel sosyal medya araçları) ve §16 (kişisel analiz) bölümlerinde "oluştur" denen araçlarla **birebir veya çok yakın örtüşüyor** (hook, title, description, hashtag, thread, carousel, clickbait-detector, viral-score, retention-analysis, competitor, social-audit, content-plan, comment-analysis, trends, performance, analytics, ideas, ab-test). Ayrıca `video-factory`, `clip-generator`, `dubbing` gibi sayfalar şartname §17'nin istediği "ChatCut alternatifi video editör" ile örtüşüyor olabilir. **Sonraki fazlarda bu envantere karşı gap-analizi yapılmadan hiçbir §15/§16/§17 özelliği "sıfırdan inşa" olarak ele alınmamalı** — aksi halde zaten var olan bir şey tekrar yazılır.

---

## A. Kök uygulama (`kadenewmedia.com`) — React SPA, `src/App.jsx`

| Rota | Tür | Amaç | Erişim | Durum |
|---|---|---|---|---|
| `/` | Public | Ana sayfa (React değil — `window.location.replace('/')` ile statik `site.html`'e yönlendiriyor) | Herkes | Çalışıyor |
| `/hakkimizda` | Public | Kurumsal sayfa | Herkes | Çalışıyor |
| `/hizmetler` | Public | Hizmetler listesi | Herkes | Çalışıyor |
| `/hizmetler/:slug` | Public, dinamik | Hizmet detayı | Herkes | Çalışıyor |
| `/new-media-ajansi` | Public | Konumlandırma/SEO sayfası | Herkes | Çalışıyor |
| `/blog` | Public | Blog listesi | Herkes | Çalışıyor |
| `/blog/:slug` | Public, dinamik | Blog detayı | Herkes | Çalışıyor |
| `/iletisim` | Public | İletişim formu | Herkes | Çalışıyor |
| `/paketler` | Public (lazy) | Paket/fiyat sayfası | Herkes | Çalışıyor — bu oturumda admin fiyatına gerçekten bağlandı |
| `/partnerler`, `/partnerler/:id` | Public (lazy) | Partner listesi/detay | Herkes | Çalışıyor |
| `/kariyer` | Public (lazy) | Kariyer/başvuru | Herkes | Çalışıyor |
| `/portfolio` | Public (lazy) | Portfolyo | Herkes | Çalışıyor |
| `/ekip` | Public (lazy) | Ekip sayfası | Herkes | Çalışıyor |
| `/basari-hikayeleri` | Public (lazy) | Vaka çalışmaları | Herkes | Çalışıyor |
| `/kvkk`, `/gizlilik`, `/cerez-politikasi`, `/telif-haklari` | Public, hukuki (lazy) | Yasal sayfalar | Herkes | Çalışıyor — içerik hukuki inceleme gerektirir (bkz. BLOCKERS) |
| `/admin` | Admin, korumalı | Yönetim paneli | Sadece admin (server-side JWT doğrulama) | Çalışıyor |
| `/sss` | Public (lazy) | SSS | Herkes | Çalışıyor |
| `/referanslar` | Public (lazy) | Referanslar | Herkes | Çalışıyor |
| `/tesekkur` | Public (lazy) | Form sonrası teşekkür | Herkes | Çalışıyor |
| `/teklif-al` | Public (lazy) | Teklif formu | Herkes | Çalışıyor |
| `/giris` | Public (lazy) | Giriş hub'ı (rol seçimi) | Herkes | Çalışıyor |
| `/giris/danismanlik` | Public (lazy) | Danışmanlık girişi | Herkes | Çalışıyor |
| `/musteri-panel` | Müşteri, korumalı (lazy) | Müşteri paneli | Giriş yapmış müşteri | Çalışıyor |
| `/organizasyon-kiti`, `.../plan/fractional-new-media-director` | Ürün, korumalı (lazy) | "Organizasyon Kiti" ürünü | Yetkili kullanıcı (Guard) | Çalışıyor |
| `/kade-kit-business` | Ürün, korumalı (lazy) | "Kade Kit Business" ürünü | Yetkili kullanıcı (Guard) | Çalışıyor |
| `/kadirdemir` | Redirect | `/@kadirdemir`'e yönlendirme | Herkes | Çalışıyor |
| `/:handle` | Public, dinamik (`@` ile başlayan) | Link-in-bio sayfası (`/@link` modülünün karşılığı) | Herkes (public), admin CRUD | Çalışıyor — şartname §12'nin temel gövdesi zaten mevcut |
| `/s/:slug` | Redirect, dinamik | Kısa link yönlendirmesi | Herkes | Çalışıyor |
| `/proje-takip` | Müşteri, korumalı (lazy) | Proje takip ekranı | Giriş yapmış müşteri (Guard) | Çalışıyor |
| `/links`, `/kadelinks` | External redirect | `kadirardademir.com/links`'e yönlendirme | Herkes | Çalışıyor — kasıtlı olduğu iki bağımsız kaynaktan doğrulandı (önceki oturum notu) |
| `*` | 404 | Bilinmeyen rota | Herkes | Çalışıyor, gerçek 404 döndüğü Faz 8'de HTTP-seviyesinde doğrulanmalı |

**API rotaları (`api/[...path].js` üzerinden, ~29 handler):** auth, blog, customer-auth, customer-portal, customers, shopier, calendar-invite, chat, client, contact, content, crm, linkprofiles, media, messages, notifications, ops, partners, proposals, referrals, reminders, seed, shortlinks, sitemap, subscriptions, surveys, tasks, users. Hepsi bu oturumda MongoDB'den Supabase'e taşındı ve `node --check` ile doğrulandı; canlı veriyle henüz test edilmedi (bkz. BLOCKERS).

**Webhook:** `/api/shopier` (POST, imza doğrulamalı). **Cron:** `/api/reminders?action=check` (günlük).

## B. `apps/kadeai` (`/kadeai/**`, ayrı Vercel projesi, rewrite ile bağlı)

### Sayfalar (39 dashboard alt sayfası + 5 auth/onboarding sayfası)

| Grup | Sayfalar |
|---|---|
| Auth/onboarding | `/`, `/login`, `/logout`, `/onboarding`, `/reset-password`, `/auth` |
| İçerik üretim araçları | `text-generator`, `title`, `description`, `hashtag`, `thread`, `carousel`, `hook`, `faq`, `quote-extractor` |
| Analiz araçları | `analytics`, `performance`, `retention-analysis`, `viral-score`, `clickbait-detector`, `comment-analysis`, `social-audit`, `competitor`, `trends` |
| Video/medya | `video-factory`, `clip-generator`, `dubbing`, `ai-thumbnail` |
| Planlama/operasyon | `calendar`, `content-plan`, `ideas`, `bulk`, `templates`, `history`, `operations` |
| Ticaret | `packages`, `shopier` |
| Diğer | `ab-test`, `bio-link`, `collab-mail`, `youtube-seo`, `settings` |

### API rotaları (~50)

Auth (`auth/*`), ödeme (`payments/checkout`, `payments/webhook`, `payments/status`, `payments/admin/pricing`, `payments/admin/custom-offer`, `payments/shopier/redirect`), araç üretim uçları (`generate/*`, 20+ endpoint, yukarıdaki sayfalarla birebir eşleşiyor), yardımcı (`assistant`, `image`, `transcribe`, `video`, `templates`, `history`, `profile`, `youtube/comments`, `config`, `env-status`, `backend/health`, `health`).

### Statik/özel

`/robots.txt`, `/sitemap.xml` — Next.js route handler olarak üretiliyor.

## C. Yetim/gizli/preview rota taraması

- Kökte `App.jsx` dışında ekstra bir route tanımı bulunamadı; SPA `*` fallback'i ile tüm bilinmeyen yollar 404'e düşüyor (statik `app.html` sunumu doğrulanmalı — bkz. BLOCKERS, bu turda canlı HTTP testi yapılmadı).
- `apps/kadeai`'de sayfa listesiyle `generate/*` API listesi karşılaştırıldığında birebir örtüşüyor — yetim API rotası görünmüyor.
- Preview/test amaçlı ayrı bir rota tespit edilmedi.

## D. Sonraki adım

Her rotanın HTTP durum kodu, canonical/index durumu, mobil durumu gerçek bir crawl ile (Faz 8, §24) doğrulanacak — bu tur yalnızca rotaların **var olduğunu ve kodda tanımlı olduğunu** doğruluyor, canlı davranışlarını değil.
