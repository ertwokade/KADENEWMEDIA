# 01 — Mevcut Durum Denetimi (Faz 0/1)

Tarih: 23 Temmuz 2026. Bu belge hem bu oturumda taze doğrulanan komutları hem de
20–22 Temmuz tarihli önceki denetim turlarının (kökte duran `AUDIT_REPORT.md`,
`ROUTE_AUDIT.md`, `FULL_SITE_AUDIT.md`, `SECURITY_REPORT_TR.md` vb.) hâlâ geçerli
bulgularını konsolide eder. Çelişki olduğunda bu oturumda taze doğrulanan sonuç
esas alınmıştır.

---

## Ek B — Başlangıç karar listesi (şartname §Ek B)

- **Ana uygulama(lar):** Üç ayrı uygulama tek repoda: (1) kök — Vite 8 + React 19 SPA + Express 5 API (`server.js`, `api/[...path].js`), (2) `apps/kadeai` — Next.js 16 App Router, (3) `apps/studio-web`/`apps/studio-worker` — ayrı bir video-editör ürünü ("Kade Studio", bu şartnamenin kapsamı dışında görünüyor, ayrıca değerlendirilmeli).
- **Public domain:** `kadenewmedia.com` (kök uygulama, statik `site.html`/`app.html` ikili yapı).
- **Admin rotası:** `/admin` (kök uygulama, React SPA içinde, ~8300 satırlık `src/pages/Admin.jsx`).
- **Kullanıcı paneli rotası:** `/musteri-panel` (kök, `CustomerPortal.jsx`) + `apps/kadeai/app/dashboard/**` (ayrı, kapsamlı bir dashboard — 30+ alt sayfa).
- **Mevcut ödeme sağlayıcısı:** Shopier (hem kök `server/api/shopier.js` hem `apps/kadeai/lib/payments/shopierProvider.ts` — iki bağımsız entegrasyon).
- **Auth sağlayıcısı:** Kök: özel bcrypt+JWT (admin + müşteri, iki ayrı cookie: `kade_admin_session`, `kade_customer_session`). `apps/kadeai`: Supabase Auth (`@supabase/ssr`).
- **Veritabanı/ORM:** Her ikisi de **Supabase (Postgres)**, ORM yok (doğrudan `@supabase/supabase-js` client). Kök uygulama bu oturumda MongoDB'den Supabase'e taşındı (bkz. bu konuşmanın önceki turları, commit `0a722cb`) — **aynı Supabase projesi** `apps/kadeai` ile paylaşılıyor, tablo adları `kade_*` önekiyle ayrıştırılmış.
- **Storage:** Ayrı bir object storage yok; medya/link-profili fotoğrafları base64 olarak doğrudan Postgres satırında tutuluyor (`kade_media.data`, `kade_link_profiles.photo`) — küçük ölçekte çalışır ama büyümez, bkz. bulgular.
- **Deployment:** Vercel, iki ayrı proje (kök `kademedia` + `kadeai.vercel.app`), `vercel.json` rewrite ile `/kadeai/**` ikinci projeye yönlendiriliyor. **Bu mimari önceki oturumda Vercel'in resmî dokümantasyonundan doğrulandı ve doğru bulundu** — `vercel.json`'da "services" adlı tek-proje alanı yok, `kadirdemirs-patch-3`/PR #8 dalındaki aksi yöndeki değişiklik geçersiz şema içeriyor, merge edilmemesi öneriliyor (bkz. `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`).
- **Eski 26 Haziran sürümünün konumu:** `../kademedia_backup_20260717_104653` klasöründeki git geçmişinde commit `960370f` ("remove: exit intent popup kaldırıldı", 2026-06-26). Ayrı bir worktree'de (`../kademedia-26-haziran`) izole çalıştırıldı — bkz. `docs/LEGACY_PAGE_GAP_ANALYSIS_TR.md`.
- **`/@link` mevcut izleri:** Sistem zaten var ve çalışıyor — `/:handle` rotası (`@` ile başlayan segment), `src/pages/LinkProfile.jsx`, admin tarafında `LinkProfilesSection` (CRUD, aktif/pasif, ikon, vurgu rengi). Şartnamedeki UTM/sıralama/tema/yayın zaman aralığı/moderasyon gibi genişletilmiş özellikler henüz yok.
- **Odoo mevcut mu:** Hayır, hiçbir entegrasyon veya bağımlılık izi yok.
- **Mevcut paket/fiyat veri kaynağı:** Kök sitede karışık: `/paketler` sayfası statik `src/data/packages.js` (3 kapsam, fiyatsız) + admin'den girilen fiyat override'ı (bu oturumda wire edildi, commit `9c2a6aa`). `apps/kadeai` tarafında gerçek DB-backed fiyatlandırma var: `lib/payments/pricingConfig.ts` + `kadeai_pricing_overrides` tablosu + admin API (`/api/payments/admin/pricing`).
- **Kritik blockerlar:** Bkz. `docs/BLOCKERS_TR.md`.

---

## 1. Repo ve stack envanteri

| Katman | Bulgu |
|---|---|
| Paket yöneticisi | **Tutarsız**: kökte `bun.lock`, `package-lock.json`, `pnpm-lock.yaml` üçü birden mevcut. `npm run` script'leri çalışıyor (bu oturumda kullanıldı) ama hangisinin "gerçek" kaynak olduğu belirsiz. **Karar gerekiyor, düzeltilmedi.** |
| Workspace | `pnpm-workspace.yaml` var → `apps/*`, muhtemelen `packages/*` de dahil (editor-core paketi `npm run test:unit` script'inde görüldü). |
| Kök framework | Vite 8, React 19, React Router 7, Express 5 |
| `apps/kadeai` framework | Next.js 16 (App Router, Turbopack) |
| `apps/studio-web`/`studio-worker` | Ayrı bir video editör ürünü, PostgreSQL/Drizzle, Redis/BullMQ, MinIO, Docker — **bu şartnamenin §17 (ChatCut alternatifi) ile çakışabilir, mimari karar gerektirir** |
| CI/CD | Görünür bir GitHub Actions/CI pipeline yok — build/test/deploy Vercel'in otomatik entegrasyonuna bağlı, PR bazlı preview var. |
| Test altyapısı | Kök: `node --test` (native Node test runner, 15 test). `apps/kadeai`: aynı desen (`tsx --test`, 23 test). E2E altyapısı **yok** (Playwright kurulu ama proje testleri için bir E2E suite tespit edilmedi). |
| Cron | Vercel Cron: `0 6 * * *` → `/api/reminders?action=check` (günlük hatırlatıcı gönderimi). Başka cron yok. |
| E-posta | Nodemailer + SMTP (`SMTP_HOST/USER/PASS` env), kök uygulamada `messages.js`, `client.js`, `calendar-invite.js`, `reminders.js` içinde kullanılıyor. |
| Analytics | GA4 (`gtag`, `VITE_GA_ID` fallback ile hardcoded bir ID var — **hardcoded fallback ID kod incelemesi gerektirir**), kendi first-party pageview/traffic-source/ai-usage tabloları (`kade_pageviews`, `kade_traffic_sources`, `kade_ai_usage`). `apps/kadeai`'de ayrıca Sentry + PostHog. |
| AI sağlayıcıları | Kök: yalnızca Gemini (`server/api/chat.js`, model adı kodda sabit — şartname §26/Faz'daki "model adını merkezi config'e bağla" kuralına aykırı, **bulgu**). `apps/kadeai`: çoklu sağlayıcı, merkezi `lib/ai/provider.ts` üzerinden (`claude`/`gpt4o`/`gemini`), CLAUDE.md'de bu zorunlu kural olarak yazılı. |
| Feature flag | Görünür bir feature flag sistemi yok. |

## 2. Baseline kalite kapıları (bu oturumda taze çalıştırıldı)

| Komut | Sonuç |
|---|---|
| `npm run legacy:lint` (kök) | **26 hata, 7 uyarı** — hepsi `src/pages/Admin.jsx` içinde, bu oturumun değişikliklerinden bağımsız (satır aralıkları çapraz kontrol edildi). En sık: `react-hooks/purity` (`Date.now()` render sırasında çağrılıyor). |
| `npm run legacy:test:unit` (kök) | **15/15 geçti** (Shopier replay/reconciliation, CSRF, mass-assignment, sitemap, session-revocation testleri dahil) |
| `npm run legacy:build` (kök) | **Başarılı** |
| `apps/kadeai` `npm run lint` | **0 hata** |
| `apps/kadeai` `npm run typecheck` | **0 hata** |
| `apps/kadeai` `npm run test:unit` | **23/23 geçti** (RLS migration, idempotency, IDOR, AI kota, ödeme imza doğrulama testleri dahil) |
| `apps/kadeai` `npm run build` | **Başarılı** — önceki denetim turunda ağ kısıtı (Google Fonts) nedeniyle doğrulanamamıştı, bu oturumda ağ erişimi vardı ve build tamamlandı. |

**Sonuç: build/lint/test baseline'ı sağlıklı.** Kritik/derleme-kıran bir sorun yok; lint hataları kozmetik/pre-existing.

## 3. Kod kalitesi — ilk bulgular (§4.2)

Tam satır-satır denetim bu turun kapsamı dışında (Faz 2+'da derinleşecek); aşağıdakiler bu oturumda ve önceki turlarda doğrulanmış somut bulgular:

| Bulgu | Önem | Konum | Not |
|---|---|---|---|
| 3 paralel lockfile | Düşük | kök | Karar gerektirir, hangisi source-of-truth belirlenmeli |
| `Date.now()` render sırasında çağrılıyor | Düşük | `Admin.jsx:4995` civarı | React purity kuralı ihlali, lint zaten yakalıyor |
| Gemini model adı sabit kod | Düşük | `server/api/chat.js` | Şartname §9'daki "model adını env/config'e bağla" kuralına aykırı |
| Legacy `/paketler` admin editörü canlı sayfadan kopuktu | **Düzeltildi** | `Admin.jsx`, `Packages.jsx` | Bu oturumda (commit `9c2a6aa`) admin fiyat alanı gerçekten canlıya bağlandı; isim/açıklama kürate statik içerik olarak kalıyor (bkz. gerekçe o commit'te) |
| Medya/fotoğraf base64 olarak DB'de | Orta | `kade_media`, `kade_link_profiles` | Ölçeklenmez, object storage'a taşıma önerilir (Faz 2/3 mimari kararı) |
| İki bağımsız Shopier entegrasyonu | Orta | kök + `apps/kadeai` | Kod tekrarı + iki ayrı webhook secret yönetimi riski, birleştirme değerlendirilmeli |
| Kök API'de bazı route'lar birbirini tekrarlıyor | Düşük | `crm.js`↔`tasks.js`/`proposals.js`, `client.js`↔`subscriptions.js`/`surveys.js` | Bilinçli olarak MongoDB→Supabase taşımasında korundu (davranış değişikliği riski almamak için), refactor Faz 2'de değerlendirilebilir |
| GA4 ID kodda hardcoded fallback | Düşük | `src/App.jsx:191` | `VITE_GA_ID` yoksa gerçek bir ID'ye fallback ediyor — production/test karışma riski, incelenmeli |

## 4. Ödeme/yetkilendirme mevcut durumu (§8, §23 için ön bilgi)

- Kök Shopier entegrasyonu: webhook imza doğrulaması (HMAC-SHA256), atomik sipariş rezervasyonu (unique constraint + duplicate-webhook koruması), idempotent tamamlama — bu oturumda Supabase'e taşındı ve canlı testle doğrulandı (bkz. konuşma geçmişi, `reserveShopierOrder`/`reconcileShopierOrders`).
- `apps/kadeai` Shopier entegrasyonu: ayrı, kendi imza doğrulaması ve idempotency testleri var (23 testin bir kısmı bunu kapsıyor).
- **Her iki tarafta da entitlement/yetkilendirme backend seviyesinde uygulanıyor** (frontend-only kontrol değil) — `requirePermission`/`requireAdmin` (kök), RLS + `requirePermission` benzeri kontroller (kadeai).
- Şartname §8'in istediği tam granüler `Entitlement`/`UsageLimit`/`CreditWallet`/`BYOK` veri modeli **henüz yok** — mevcut sistem paket bazlı `access` JSON alanıyla daha basit bir model kullanıyor. Bu, Faz 2/3'te ele alınacak en büyük mimari fark.

## 5. Admin panel mevcut kapsamı (§10 için ön bilgi)

Mevcut `Admin.jsx` (~8300 satır) zaten ~30 fonksiyonel bölüm içeriyor: dashboard, kullanıcılar, mesajlar/CRM, teklifler (proposals), abonelikler, anketler, referanslar, hatırlatıcılar, medya, partnerler, blog, link profilleri, kısa linkler, site içeriği, paketler/fiyatlandırma (bu oturumda düzeltildi), ayarlar, aktivite logu, yedekleme, e-posta şablonları, push bildirimleri, onboarding formları, faturalar, müşteri profilleri. Şartnamedeki 44 modülün ~20'si zaten bir ölçüde karşılığı var; kalan ~24'ü (roller/izinler ekranı, add-on'lar, kupon/kampanya, entitlement görünümü, API erişim politikaları, creator ağı, feature flags, sistem sağlığı, worker/render job durumu, güvenlik olayları vb.) **henüz yok** — Faz 4 kapsamında.

## 6. Bilinen mimari gerilim noktaları

1. **Üç ürün, tek repo:** Kade New Media (ajans+ticaret), Kade AI (apps/kadeai, tool platformu), Kade Studio (apps/studio-web/worker, video editör). Şartname §17 yeni bir "ChatCut alternatifi" video editör istiyor — **Kade Studio'nun bu ihtiyacı zaten karşılayıp karşılamadığı ilk incelenmesi gereken soru**, aksi halde dördüncü bir video editör inşa edilmiş olur.
2. **İki Shopier entegrasyonu, iki auth sistemi, iki Supabase kullanım deseni** aynı üst markanın altında — konsolidasyon kararı gerekiyor ama şartnamenin "mevcut mimariyi anlamadan değiştirme" kuralı gereği bu turda dokunulmadı.
