# Security Checklist

Denetim tarihi: 19 Temmuz 2026

İşaretler: `[x]` kaynak ve test ile doğrulandı, `[-]` kısmi veya production doğrulaması gerekli, `[ ]` eksik/bloker.

## OWASP Top 10 (2021)

- [x] A01 Broken Access Control — root admin API’lerinde DB-backed kullanıcı/rol/permission; KadeAI proxy + handler auth; Supabase sorgularında `user_id`; ayarlar yalnız `thekademedia@gmail.com`.
- [-] A01 — production Supabase RLS/payment migration’larının gerçekten uygulanmış olduğu staging ve production üzerinde doğrulanmalı.
- [x] A02 Cryptographic Failures — JWT secret minimum 32 karakter, HttpOnly/Secure/SameSite cookie, timing-safe webhook/CSRF karşılaştırması, şifreler bcrypt cost 12.
- [-] A02 — gerçek secret rotasyonu ve secret manager kullanımı deployment kontrolüdür; repoda doğrulanamaz.
- [x] A03 Injection — Mongo ObjectId/type kontrolleri, mutable-field allowlist’leri, HTML sanitization ve strict YouTube ID parsing mevcut.
- [-] A03 — tüm legacy admin koleksiyonları için schema-level Mongo validation bulunmuyor.
- [x] A04 Insecure Design — payment idempotency, server-side KadeAI product catalog, fail-closed auth config, seed production kapısı.
- [-] A04 — root Shopier fiyat/paket eşlemesi provider sözleşmesine göre server kataloğuyla ayrıca doğrulanmalı.
- [x] A05 Security Misconfiguration — güvenlik başlıkları, no-store API/dashboard, CORS allowlist, `.env.example`, production seed 404.
- [-] A05 — root CSP halen `unsafe-inline` ve geniş `connect-src https:` kullanıyor; nonce/hash geçişi test edilmeden sıkılaştırılmadı.
- [x] A06 Vulnerable Components — root ve KadeAI production dependency audit: 0 bilinen vulnerability.
- [-] A06 — düzenli CI audit/Dependabot benzeri süreç repository’de zorunlu kapı değil.
- [x] A07 Identification and Authentication Failures — rate limit, generic recovery yanıtı, session expiration, password/role değişiminde sessionVersion iptali, logout cookie temizliği.
- [-] A07 — distributed rate limiting KadeAI’de yok; root’ta production için Upstash yapılandırılması zorunlu.
- [x] A08 Software and Data Integrity Failures — Shopier HMAC, KadeAI raw-body webhook signature ve event idempotency.
- [-] A08 — root Shopier crash sonrası manuel reconciliation ihtiyacı ve catalog price doğrulaması kalıyor.
- [-] A09 Security Logging and Monitoring — hata yanıtları generic, provider body/stack sızıntıları azaltıldı; Sentry/PostHog opt-in.
- [ ] A09 — merkezi audit log, alarm eşikleri, PII redaction politikası ve incident alerting doğrulanmadı.
- [x] A10 SSRF — YouTube endpoint’i yalnız doğrulanmış video ID ile Google API’ye gider; kullanıcı URL’sine doğrudan fetch yok.

## OWASP API Security Top 10 (2023)

- [x] API1 BOLA — KadeAI history/templates/calendar/payment sorguları authenticated user ID ile filtreleniyor; RLS ayrıca tanımlı.
- [x] API2 Broken Authentication — server-side session validation, recovery güvenliği ve owner-only proxy kontrolleri.
- [x] API3 Broken Object Property Level Authorization — blog/partner/customer update alanlarında allowlist; role/plan gibi alanlar istemciden kör alınmıyor.
- [-] API4 Unrestricted Resource Consumption — root global body caps, upload limits, AI prompt/token caps ve timeouts var.
- [ ] API4 — KadeAI dağıtık rate limit/kredi ledger atomik kota sistemi production ölçeği için eksik.
- [x] API5 Broken Function Level Authorization — root permission/admin matrisi; KadeAI settings owner-only server proxy.
- [x] API6 Unrestricted Access to Sensitive Business Flows — login/recovery/seed/AI rate limit; payment idempotency.
- [-] API6 — root serverless rate limit Upstash olmadan instance-local kalır.
- [x] API7 SSRF — remote URL yüzeyi sınırlı ve YouTube ID doğrulanıyor.
- [x] API8 Security Misconfiguration — method allowlist, CSRF/origin, no-store ve security headers.
- [-] API9 Improper Inventory Management — `ROUTE_AUDIT.md` oluşturuldu; 8 envanter sayfası `NOT IMPLEMENTED`.
- [x] API10 Unsafe Consumption of APIs — AI timeout/max retry, generic downstream errors, Google/AI endpoint allowlist’leri.

## Projeye özgü kontroller

### Authentication, authorization ve tenant izolasyonu

- [x] Admin JWT yalnız HttpOnly cookie’den okunuyor; Authorization header fallback yok.
- [x] CSRF double-submit token imzalı ve mutating root API’lerde zorunlu; public action’lar dar allowlist.
- [x] KadeAI mutating API origin kontrolü proxy seviyesinde.
- [x] Admin kullanıcı silme/rol/permission/password değişikliği eski session’ları iptal ediyor.
- [x] Customer password değişimi ve login sessionVersion kullanıyor.
- [x] KadeAI settings UI/API yalnız `thekademedia@gmail.com`.
- [x] KadeAI owner/dashboard erişimi yalnız UI gizlemeye dayanmıyor; proxy server-side uygular.
- [-] Gerçek Supabase kullanıcılarıyla A/B tenant E2E testi tarayıcı/auth fixture olmadığı için çalıştırılamadı.

### Input, dosya ve içerik güvenliği

- [x] Root API default 1 MiB; chat 64 KiB; Shopier 128 KiB; media 3 MiB request cap.
- [x] Root media decoded max 2 MiB ve JPEG/PNG/WebP/GIF/MP4/PDF magic signature kontrolü.
- [x] KadeAI transcribe max 25 MiB, MIME + magic signature + timeout.
- [x] Public blog sorgusu draft ve gelecek tarihli yazıları dışlar.
- [x] Blog/partner mutasyonları mutable-field allowlist kullanır.
- [x] Sitemap XML escaping ve güvenli HTTP(S) canonical origin normalization.
- [-] MongoDB collection-level JSON schema validation yok; uygulama validasyonu ana katman.

### Payment ve webhook

- [x] Root Shopier webhook HMAC timing-safe doğrulama production’da zorunlu.
- [x] Root Shopier `platform_order_id` unique index + entitlement öncesi atomic reservation.
- [x] KadeAI checkout server product catalog kullanır ve idempotency user-bound.
- [x] KadeAI webhook raw body signature ve unique event ID kullanır.
- [ ] Root Shopier ürün fiyatı/currency server kataloğuyla karşılaştırılmalı.
- [ ] Prepared payment/RLS migration staging backup ile uygulanıp doğrulanmalı.
- [ ] Root Shopier `processing`/partial failure siparişleri için reconciliation job/runbook eklenmeli.

### Secrets, privacy ve browser policy

- [x] Tracked gerçek `.env` yok; yalnız açıklamalı example dosyaları var.
- [x] Regex secret taramasında yalnız placeholder private-key metinleri bulundu.
- [-] KadeAI bundle secret kontrolü geçti ancak boş ortam nedeniyle 0 yapılandırılmış canary secret taradı.
- [x] GA script consent kabulünden sonra yükleniyor.
- [-] Root internal pageview/heartbeat analytics consent öncesi sessionStorage visitor ID üretiyor; KVKK ürün/hukuk kararı gerekli.
- [x] HSTS, nosniff, referrer, permissions, frame policy mevcut.
- [-] Root CSP nonce/hash ve dar domain allowlist’e geçirilmeli; önce third-party envanteriyle staging testi gerekli.

### Abuse, logging ve operasyon

- [x] Root Upstash yapılandırıldığında persistent rate limit; backend erişilemezse production’da fail-closed.
- [ ] Production root deployment’ta Upstash değişkenlerinin gerçekten mevcut olduğu doğrulanmalı.
- [ ] KadeAI in-memory rate limiter distributed store’a taşınmalı.
- [-] Error responses stack/provider secret döndürmüyor; ancak merkezi structured audit trail ve PII mask audit’i tamamlanmadı.
- [x] `/api/seed` production’da `SEED_ENDPOINT_ENABLED=true` olmadıkça 404; secret + rate limit + sonraki çalışmalarda admin gerekir.

## Otomatik güvenlik doğrulamaları

## 19 Temmuz 2026 retest

- [x] Shopier signature, atomik rezervasyon, server-owned fiyat/currency ve disabled ürün doğrulaması.
- [x] Shopier uzlaştırma yalnız mevcut entitlement'ı doğruluyor; otomatik entitlement vermiyor ve tekrar çalıştırma idempotent.
- [x] Draft/future blog filtresi, sessionVersion iptali, CSRF imzası, 64 KiB body limiti, MIME magic-byte, SVG/HTML reddi, mass assignment ve no-store regresyon testleri.
- [x] KadeAI dağıtık kota production'da Upstash yoksa 503 fail-closed; minute/day/cost/idempotency atomik Lua akışında.
- [x] Üç canary olmadan bundle testi başarısız; üç sentetik canary root dist, KadeAI static/HTML/RSC çıktılarında bulunmadı.
- [x] Supabase migration sırası ve nihai explicit RLS/grant statik doğrulaması PASS.
- [ ] Upstash gerçek multi-instance yarış testi — BLOCKED_BY_ENVIRONMENT.
- [ ] Supabase User A/User B/service-role canlı RLS matrisi — BLOCKED_BY_ENVIRONMENT.
- [ ] Browser tabanlı cookie/back-cache/CSP ve rol bazlı E2E — BLOCKED_BY_ENVIRONMENT.

- [x] Root 11 unit test: CSRF, session revocation, request caps, upload signature, webhook signature/idempotency gate, sitemap, public blog filter.
- [x] KadeAI 7 unit test: ownership negatif testi, settings owner, RLS text guard, webhook signature/idempotency, provider/email mock.
- [x] Root ve KadeAI dependency audit: 0 vulnerability.
- [x] Root lint/build ve KadeAI lint/typecheck/build başarılı.
- [ ] KadeAI Playwright E2E/axe: uygulama içi tarayıcı bağlı değil.
- [ ] FastAPI pytest: sistemde `python` ve `pytest` hazır değil.
