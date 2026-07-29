# Tüm Rotalar — `/` ile başlayan her şey

Koddan doğrudan çıkarıldı (`src/App.jsx`, `scripts/generate-static-routes.mjs`,
`server/api/sitemap.js`, `public/robots.txt`, `vercel.json`, `api/[...path].js`,
`apps/kadeai/app/**`, `apps/studio-web/app/**`).
Dinamik segmentler (`:handle`, `:slug`, `:id`, `[projectId]`, `[exportId]`) gerçek değerlerle çalışır.

**Son güncelleme:** 28 Temmuz 2026 — teknik SEO düzeltmeleri sonrası, canlıda doğrulandı.

> **Önemli:** Aşağıda listelenmeyen her `/` isteği artık **HTTP 404** döner.
> Daha önce `vercel.json`'daki blanket rewrite yüzünden bilinmeyen tüm URL'ler
> HTTP 200 + ana sayfa canonical'ı veriyordu; sonsuz duplicate URL alanı
> oluşuyor ve site indekslenemiyordu.

---

## 1) Kök Site — İndekslenen Sayfalar (20)

Hepsi ön-render'lı, tek ve doğru canonical'a sahip, `sitemap.xml` içinde.

| Yol | Açıklama |
|---|---|
| `/` | Ana sayfa (React — `src/pages/Home.jsx`, build'de ön-render edilir) |
| `/hakkimizda` | Hakkımızda |
| `/hizmetler` | Hizmetler listesi |
| `/new-media-ajansi` | New Media ajansı |
| `/paketler` | Hizmet kapsamları |
| `/sss` | Sık sorulan sorular |
| `/ekip` | Ekip |
| `/kariyer` | Kariyer |
| `/iletisim` | İletişim |
| `/teklif-al` | Teklif alma formu |
| `/kvkk` | KVKK aydınlatma metni |
| `/gizlilik` | Gizlilik politikası |
| `/cerez-politikasi` | Çerez politikası |
| `/telif-haklari` | Telif hakları |
| `/hizmetler/sosyal-medya-yonetimi` | Hizmet detayı |
| `/hizmetler/icerik-uretimi` | Hizmet detayı |
| `/hizmetler/reklam-yonetimi` | Hizmet detayı |
| `/hizmetler/video-produksiyon` | Hizmet detayı |
| `/hizmetler/strateji-danismanlik` | Hizmet detayı |
| `/hizmetler/web-sitesi-tasarimi` | Hizmet detayı |

## 2) Kök Site — Herkese Açık ama `noindex`

İçerik doğrulanana kadar indekslenmiyor. `follow` bilinçli: link değeri detay
sayfalarına aksın diye. Sitemap'te **yer almazlar** (aksi halde Search Console
"Submitted URL marked 'noindex'" hatası verir).

| Yol | Robots |
|---|---|
| `/blog` | `noindex, follow` |
| `/portfolio` | `noindex, follow` |
| `/partnerler` | `noindex, follow` |
| `/referanslar` | `noindex, follow` |
| `/basari-hikayeleri` | `noindex, follow` |

## 3) Kök Site — Özel Alanlar (robots.txt'de engelli + `noindex`)

| Yol | Açıklama |
|---|---|
| `/admin` | Admin paneli (oturum korumalı) |
| `/giris` | Giriş hub'ı |
| `/giris/danismanlik` | Danışmanlık girişi |
| `/musteri-panel` | Müşteri paneli |
| `/proje-takip` | Proje takip (müşteri korumalı) |
| `/kade-kit-business` | Kade Kit Business |
| `/tesekkur` | Teşekkür / dönüşüm sayfası |
| `/organizasyon-kiti` | Organizasyon Kiti (guard'lı) |
| `/organizasyon-kiti/medya-yol-haritasi` | Bölüm |
| `/organizasyon-kiti/yonetim-toplantilari` | Bölüm |
| `/organizasyon-kiti/ekip-surecler` | Bölüm |
| `/organizasyon-kiti/stratejik-kararlar` | Bölüm |
| `/organizasyon-kiti/notlar` | Bölüm |
| `/organizasyon-kiti/plan/fractional-new-media-director` | Plan sayfası |

## 4) Kök Site — Dinamik Rotalar (ön-render yok, SPA çözer)

| Yol | Açıklama | Kayıt yoksa |
|---|---|---|
| `/blog/:slug` | Blog yazı detayı | `noindex` |
| `/partnerler/:id` | Partner detayı | `noindex` |
| `/hizmetler/:slug` | 6 gerçek slug ön-render'lı | **404** |
| `/@:handle` | Link-in-bio profil sayfası | `noindex` |
| `/:handle` | `@` ile başlamıyorsa NotFound | `noindex` |
| `/s/:slug` | Kısa link çözücü (robots.txt'de engelli) | — |

## 5) Kök Site — Hata & Bakım Ekranları

robots.txt'de engelli. `*` (bilinmeyen rota) artık sunucu tarafında gerçek 404 döner.

| Yol | Açıklama |
|---|---|
| `/401` | Yetkisiz |
| `/403` | Erişim engellendi |
| `/429` | Çok fazla istek |
| `/bakim` | Bakım sayfası |

## 6) Kök Site — Yönlendirmeler (sunucu tarafı)

| Yol | Hedef | Tip |
|---|---|---|
| `/kadirdemir` | `/@kadirdemir` | 301 |
| `/links` | `kadirardademir.com/links` | 301 |
| `/kadelinks` | `kadirardademir.com/links` | 301 |
| `/kadelinks/:path*` | `kadirardademir.com/links` | 301 |
| `www.kadenewmedia.com` | `kadenewmedia.com` | 308 |
| `http://` | `https://` | 308 |

## 7) Kök Site — Özel Uç Noktalar

| Yol | Açıklama |
|---|---|
| `/robots.txt` | Statik |
| `/sitemap.xml` | → `/api/sitemap` (25 URL: 20 statik + 5 partner detayı) |
| `/kadeai` | → `kadeai.vercel.app` (rewrite, `noindex`) |
| `/api/*` | robots.txt'de engelli |

## 8) Kök Site — API Uçları (`/api/*`)

| Yol | İşlev |
|---|---|
| `/api/auth` | Admin girişi / oturum / CSRF / şifre değiştirme |
| `/api/customer-auth` | Müşteri kayıt / giriş / oturum |
| `/api/customer-portal` | Müşteri paneli verisi |
| `/api/customers` | Müşteri yönetimi (admin) |
| `/api/users` | Kullanıcı yönetimi (admin) |
| `/api/shopier` | Ödeme webhook + sipariş listesi + iade (bu oturumda genişletildi) |
| `/api/coupons` | Kupon/kampanya CRUD (bu oturumda eklendi) |
| `/api/system-health` | Sistem sağlığı (bu oturumda eklendi) |
| `/api/blog` | Blog CRUD + public liste |
| `/api/partners` | Partner CRUD + public liste |
| `/api/content` | Site içeriği / CMS |
| `/api/media` | Medya kütüphanesi |
| `/api/linkprofiles` | Link profilleri |
| `/api/shortlinks` | Kısa linkler |
| `/api/crm` | CRM |
| `/api/proposals` | Teklifler |
| `/api/subscriptions` | Abonelikler |
| `/api/surveys` | Anketler |
| `/api/referrals` | Referanslar |
| `/api/reminders` | Hatırlatıcılar (cron: günlük 06:00) |
| `/api/tasks` | Görevler |
| `/api/client` | Müşteri kaynakları (subscriptions/surveys) |
| `/api/ops` | Teklif talebi / fatura / onboarding / e-posta şablonu / ayarlar |
| `/api/messages` | Mesajlar |
| `/api/contact` | İletişim formu |
| `/api/newsletter` | Newsletter (contact → action) |
| `/api/notifications` | Bildirimler + aktivite logu |
| `/api/calendar-invite` | Takvim daveti (ICS) |
| `/api/chat` | AI sohbet / içerik üretimi (Gemini) |
| `/api/sitemap` | Dinamik sitemap üretimi |
| `/api/seed` | İlk admin oluşturma (prod'da varsayılan kapalı) |

---

## 9) Kade AI — Sayfalar (`kadenewmedia.com/kadeai/*`)

| Yol | Açıklama |
|---|---|
| `/kadeai` | Ana sayfa |
| `/kadeai/login` · `/kadeai/logout` · `/kadeai/auth` · `/kadeai/auth/callback` | Kimlik |
| `/kadeai/onboarding` | Onboarding |
| `/kadeai/reset-password` | Şifre sıfırlama |
| `/kadeai/dashboard` | Panel ana sayfası |

**Dashboard araçları** (`/kadeai/dashboard/*`):
`ab-test` · `ai-thumbnail` · `analytics` · `bio-link` · `bulk` · `calendar` · `carousel` · `clickbait-detector` · `clip-generator` · `collab-mail` · `comment-analysis` · `competitor` · `content-plan` · `description` · `dubbing` · `faq` · `hashtag` · `history` · `hook` · `ideas` · `operations` · `packages` · `performance` · `quote-extractor` · `retention-analysis` · `settings` · `shopier` · `social-audit` · `templates` · `text-generator` · `thread` · `title` · `trends` · `video-factory` · `viral-score` · `youtube-seo`

## 10) Kade AI — API Uçları (`/kadeai/api/*`)

| Grup | Yollar |
|---|---|
| Kimlik | `/kadeai/api/auth/logout` · `/auth/password` · `/auth/recovery` · `/auth/recovery-session` · `/auth/update-password` |
| Üretim (AI) | `/kadeai/api/generate/{analytics, bio-link, bulk, carousel, clickbait-detector, clips, collab-mail, comment-analysis, competitor, content-plan, description, faq, hashtag, hook, ideas, performance, quote-extractor, retention-analysis, social-audit, text-generator, thread, title, translate, trends, tts, viral-score, youtube-seo}` |
| Ödeme | `/kadeai/api/payments/{checkout, status, webhook}` · `/payments/shopier/redirect` · `/payments/admin/custom-offer` · `/payments/admin/pricing` |
| Medya | `/kadeai/api/{image, video, transcribe}` |
| Diğer | `/kadeai/api/{assistant, calendar, config, env-status, health, history, operations-state, packages, profile, templates}` · `/backend/health` · `/youtube/comments` |

---

## 11) Kade Studio (`apps/studio-web` — ayrı ürün, ayrı domain)

**Sayfalar:** `/` · `/login` · `/projects/new` · `/editor/[projectId]`

**API:** `/api/auth/login` · `/api/health` · `/api/projects` · `/api/projects/[projectId]` · `/api/projects/[projectId]/{commands, exports, history, versions}` · `/api/exports/[exportId]/download` · `/api/uploads/{complete, presign}`
