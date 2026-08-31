# Production Release Checklist

Denetim tarihi: 19 Temmuz 2026

`BLOCKER` maddeleri tamamlanmadan production’a çıkılmamalı. Bu belge secret değerlerini içermez.

## 1. Zorunlu release kapıları

- [x] Root `npm run lint`
- [x] Root `npm run test:unit` — 11/11
- [x] Root `npm run build` — 536 module, 37 static route entry
- [x] Root 38 mevcut route HTTP smoke — 38/38 status 200
- [x] KadexAI `npm run lint`
- [x] KadexAI `npm run typecheck`
- [x] KadexAI `npm run test:unit` — 7/7
- [x] KadexAI `npm run build` — 41 static page üretimi tamamlandı
- [x] Root ve KadexAI `npm audit --omit=dev --audit-level=moderate` — 0 vulnerability
- [ ] **BLOCKER:** Uygulama içi tarayıcı bağlanarak Playwright E2E, console, responsive viewport ve axe testi çalıştırılsın.
- [ ] **BLOCKER:** `python3` ortamına backend requirements + pytest kurularak `apps/kadexai/backend/tests` çalıştırılsın.

## 2. Environment değişkenleri

### Root/Vercel — zorunlu

- [ ] `NODE_ENV=production`
- [ ] `SITE_URL=https://kadenewmedia.com`
- [ ] `MONGODB_URI` production database ve TLS ile
- [ ] `JWT_SECRET` en az 32 karakter, rastgele, secret manager’da
- [ ] `ALLOWED_ORIGINS=https://kadenewmedia.com` ve yalnız gereken preview origin’leri
- [ ] **BLOCKER:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] `CRON_SECRET` veya kullanılan cron signature secret
- [ ] SMTP kullanılıyorsa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`
- [ ] AI admin özelliği açıksa server-side `GEMINI_API_KEY`
- [ ] `UNSUBSCRIBE_SECRET` ayrı random secret veya bilinçli JWT fallback kararı
- [ ] GA kullanılıyorsa `VITE_GA_ID`; Data API için server-side GA4 service account değişkenleri
- [ ] `SEED_ENDPOINT_ENABLED=false`; seed secret/password production’da yalnız geçici bootstrap ihtiyacında

### Root Shopier — yalnız ödeme açılacaksa

- [ ] **BLOCKER:** `SHOPIER_API_SECRET` gerçek merchant secret ile secret manager’da
- [ ] Webhook URL: `https://kadenewmedia.com/api/shopier`
- [ ] Provider panelindeki signature formatı staging/sandbox payload ile doğrulandı
- [ ] **BLOCKER:** `product_reference`, fiyat ve currency server catalog eşleşmesi tamamlandı
- [ ] Unknown, duplicate ve partial order reconciliation runbook’u hazır

### KadexAI — zorunlu

- [ ] `NEXT_PUBLIC_BASE_PATH=/kadexai`
- [ ] `NEXT_PUBLIC_APP_URL=https://kadenewmedia.com/kadexai`
- [ ] `NEXT_PUBLIC_SITE_URL=https://kadenewmedia.com`
- [ ] Supabase URL + anon key; service role yalnız server secret olarak
- [ ] En az bir production AI provider server-side key’i; `AI_PROVIDER_MODE=live`
- [ ] `KADE_DISABLE_AUTH=0`
- [x] Settings owner davranışı için kodda sabit marka hesabı doğrulandı: `thekademedia@gmail.com`
- [ ] Owner modu gerekiyorsa `NEXT_PUBLIC_KADE_OWNER_MODE=1` ve `KADE_OWNER_EMAIL(S)` tutarlı
- [ ] Telemetry yalnız onay ve veri işleme kararıyla enable edilir

### KadexAI payment — varsayılan kapalı

- [ ] **BLOCKER:** Migration doğrulanana kadar `PAYMENT_PROVIDER=disabled`
- [ ] Sandbox dışı deployment’ta `PAYMENT_SANDBOX_ENABLED=0`
- [ ] `PAYMENT_WEBHOOK_SECRET` secret manager’da ve rotate planı var
- [ ] `SUPABASE_SERVICE_ROLE_KEY` yalnız server runtime’da; client bundle’a girmiyor

## 3. Database ve migration

- [ ] Production MongoDB backup/snapshot alındı.
- [ ] `users.username` ve `shopier_orders.shopierOrderId` unique index’leri doğrulandı.
- [ ] `sessionVersion` olmayan legacy kullanıcılar `0` kabulüyle uyumlu; password/role değişiminde increment doğrulandı.
- [ ] **BLOCKER:** Supabase staging backup alındı.
- [ ] `apps/kadexai/supabase/migrations/202607170001_security_hardening.sql` gözden geçirildi/uygulandı.
- [ ] `apps/kadexai/supabase/migrations/202607170002_explicit_rls_and_payments.sql` staging’de uygulandı.
- [ ] RLS policy’leri iki ayrı test kullanıcıyla pozitif/negatif test edildi.
- [ ] Payment tablolarında user idempotency ve event unique constraint doğrulandı.
- [ ] Migration rollback SQL/runbook staging’de denendi.

## 4. Domain, cookie, CORS ve proxy

- [ ] `kadenewmedia.com` TLS sertifikası ve HSTS doğrulandı.
- [ ] Admin/customer cookie’leri production’da `Secure; HttpOnly` (auth), `SameSite=Strict`, beklenen Path ile geliyor.
- [ ] Supabase cookie scope `/kadexai` deployment davranışıyla uyumlu.
- [ ] Vercel `/kadexai/:path*` rewrite hedefi doğru ve base path iki kez eklenmiyor.
- [ ] CORS yalnız production domain ve bilinçli preview domain’lerini kabul ediyor.
- [ ] Mutating API’lerde cross-origin negatif test 403.
- [ ] `/admin`, `/musteri-panel`, KadexAI dashboard ve tüm API response’larında no-store doğrulandı.
- [ ] Root CSP report-only staging gözlemiyle daraltma planı çıkarıldı.

## 5. Route, SEO ve içerik kararı

- [x] Sitemap private/auth/dashboard/API route içermiyor.
- [x] Sitemap canonical origin `SITE_URL` üzerinden güvenli normalize ediliyor.
- [ ] **İş kararı:** `/fiyat-hesaplama`, `/basin`, `/neden-biz`, `/referans-programi`, `/podcast-webinar`, `/bulten-arsivi` yayınlanacaksa page/metadata/content tamamlanmalı.
- [ ] **İş kararı:** `/blog/:slug` ve `/partnerler/:id` gerçek doğrulanmış içerik modeliyle uygulanmalı veya route envanterinden çıkarılmalı.
- [x] Admin içindeki kırık `/referans-programi` canlı linki kaldırıldı ve yayınlanmadı etiketi kondu.
- [ ] Public blog/partner detayları açılırsa canonical, OG, noindex/404 ve encoded/çok uzun parametre testleri eklenmeli.

## 6. Privacy, monitoring ve operasyon

- [ ] **İş/hukuk kararı:** consent öncesi internal pageview/heartbeat visitor ID davranışı onaylanmalı veya consent sonrasına taşınmalı.
- [ ] Log retention, erişim, PII redaction ve silme prosedürü tanımlı.
- [ ] Sentry/PostHog enable edilirse consent, sampling ve server/client secret sınırları doğrulandı.
- [ ] Auth failure, 429, webhook invalid signature ve payment reconciliation alarmları var.
- [ ] On-call kişi, incident iletişim kanalı ve secret rotation runbook’u belli.
- [ ] Database restore ve webhook replay-safe recovery staging’de prova edildi.

## 7. Deployment ve rollback

1. Release commit/tag oluştur; build artifact hash’ini kaydet.
2. Database backup al ve migration checksum’larını kaydet.
3. Önce preview/staging deploy et; anonymous, customer, admin, owner rol matrisi smoke testini çalıştır.
4. Payment provider kapalıyken ana site + KadexAI health/auth/data akışlarını doğrula.
5. Production deploy et; `/`, `/giris`, `/admin`, `/kadexai/login`, private dashboard redirect ve health endpoint’lerini kontrol et.
6. Error/latency/auth failure metriklerini en az bir tam iş döngüsü izle.
7. Rollback gerekirse önce önceki deployment artifact’ına dön; migration geri dönüşü yalnız hazırlanmış rollback ve backup ile uygula.
8. Webhook sırasında rollback yapılırsa duplicate event/order kayıtlarını silme; reconciliation ile tamamla.

## Release kararı

## 19 Temmuz 2026 release kapısı retesti

- [x] Root lint, 15 unit test ve production build.
- [x] KadexAI lint, type-check, 10 unit test ve production build.
- [x] FastAPI Python 3.12 izole ortam ve 5 pytest.
- [x] 169 route manifest doğrulaması; 44 pasif runtime PASS, 0 FAIL.
- [x] Her iki npm dependency ağacında 0 vulnerability.
- [x] Üç sentetik canary ile bundle secret taraması.
- [x] Shopier katalog, amount/currency ve uzlaştırma kod/testleri.
- [x] Dağıtık production kota helper'ı ve fail-closed testleri.
- [ ] Browser/Chromium/Firefox/WebKit, responsive ve axe — BLOCKED_BY_ENVIRONMENT.
- [ ] Staging admin/customer/KadexAI rol fixture'ları — BLOCKED_BY_ENVIRONMENT.
- [ ] Production Upstash bağlantısı ve multi-instance canary — BLOCKED_BY_ENVIRONMENT.
- [ ] Staging Supabase migration/RLS matrisi — BLOCKED_BY_ENVIRONMENT.
- [ ] Shopier sandbox ürün ID ve scheduler doğrulaması — BLOCKED_BY_ENVIRONMENT.

Karar: **CONDITIONAL GO**. Yukarıdaki dış ortam kapıları tamamlanmadan deploy yok.

Şu an: **NO-GO / koşullu**. Kod build ve unit seviyesinde sağlıklı; fakat görsel/E2E tarayıcı testi, FastAPI test ortamı, production rate-limit doğrulaması, Supabase migration kanıtı ve ödeme catalog/reconciliation maddeleri tamamlanmadan tam production-ready sayılmamalı.
