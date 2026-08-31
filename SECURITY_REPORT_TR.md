# SECURITY_REPORT_TR.md

Tarih: 22 Temmuz 2026 — Aşama 7-8 (Authentication, admin authorization, API/veritabanı güvenliği)

## Yöntem ve dürüstlük notu

677 birinci taraf dosyanın tamamının satır satır OWASP taraması, bu oturumun kapsamında gerçekçi değil. Bunun yerine **risk bazlı hedefli inceleme** yaptım: authentication/authorization çekirdeği, admin yetkilendirme sınırları, CORS/CSRF/rate-limit altyapısı, ödeme/webhook güvenliği ve tüm birinci taraf kaynak genelinde riskli örüntüler için (dangerouslySetInnerHTML, wildcard CORS, exec/child_process, secret loglama) tarama yaptım. Aşağıdaki bulgular bu incelemeye dayanıyor; incelenmeyen dosyalar için "incelenmedi" diye açıkça belirtiyorum.

## Genel değerlendirme

Legacy backend (`server/api/*` + `api/[...path].js`) ve `apps/kadexai` (`proxy.ts`, Supabase auth) **beklenenden çok daha olgun ve sıkı yazılmış.** Önceki oturumlarda ciddi bir güvenlik sertleştirme çalışması yapılmış olduğu açık. Bulduğum somut, doğru uygulanmış kontroller:

- **JWT tabanlı admin session'ı**, DB'deki `session_version` ile her istekte yeniden doğrulanıyor (`server/api/_lib/auth.js`) — parola/rol değişince eski token'lar otomatik geçersiz oluyor (session revocation). Secret uzunluğu 32+ karakter zorunlu, yoksa uygulama başlamıyor.
- **Cookie'ler**: `HttpOnly`, `SameSite=Strict`, production'da `Secure` — hem admin (`kade_admin_session`) hem müşteri (`kade_customer_session`) oturumları için.
- **CSRF**: HMAC imzalı double-submit token (`createCsrfToken`/`verifyCsrfToken`, `timingSafeEqual` ile karşılaştırma), `api/[...path].js` dispatcher'ında merkezi olarak, yalnızca açıkça listelenmiş public POST action'ları (`login`, `register`, `newsletter`, Shopier webhook vb.) hariç tüm mutasyonlarda zorunlu.
- **CORS**: Wildcard yok. Origin allowlist (`kadenewmedia.com`, `www.kadenewmedia.com`, `.com.tr` varyantları), same-origin kontrolü, `Vary: Origin` başlığı doğru.
- **Rate limiting**: Upstash Redis varsa onunla, production'da Redis yapılandırılmış ama erişilemezse **fail-closed** (istek reddediliyor, açık bırakılmıyor) — doğru güvenlik kararı. Admin login, müşteri login/register, seed, chat gibi hassas uçlarda ayrı ayrı uygulanmış.
- **`/api/seed`** (ilk şüphem buydu): Production'da `SEED_ENDPOINT_ENABLED=true` olmadan 404 dönüyor, saatte 3 istekle sınırlı, `timingSafeEqual` ile secret karşılaştırması yapıyor, ve **veritabanında zaten bir kullanıcı varsa** ek olarak admin yetkisi istiyor — yani ilk kurulumdan sonra arka kapı olarak kullanılamaz. Sağlam.
- **`server/api/users.js`**: Tüm metodlar `requireAdmin` şart koşuyor, rol allowlist'i (`admin/editor/viewer`) sunucu tarafında doğrulanıyor, **kendini silme engelleniyor**, parola/rol/izin değişikliğinde `session_version` artırılarak diğer oturumlar düşürülüyor.
- **Shopier webhook** (`server/api/shopier.js`): HMAC imza doğrulaması `timingSafeEqual` ile, sipariş rezervasyonu Postgres unique index (`kade_shopier_orders_order_id_uidx`) üzerinden atomik replay koruması, fiyat/ürün sunucu tarafında `shopierCatalog.js`'den doğrulanıyor (istemciden gelen fiyata güvenilmiyor).
- **`apps/kadexai/proxy.ts`**: Auth eksikse API rotaları için JSON 401/403, sayfalar için `/login` yönlendirmesi — kullanıcı talimatının özellikle sorduğu "yetkisiz API çağrısı HTML'e mi düşüyor" sorusunun cevabı: **hayır, doğru JSON dönüyor.** Supabase env değişkenleri eksikse korumalı rotalar **fail-closed** (503/login'e yönlendirme, açık bırakma yok). Mutasyon isteklerinde origin allowlist kontrolü var. AI uçları için kullanıcı bazlı dağıtık kota (`distributedRateLimit`, idempotency key desteğiyle).
- Genel kod taramasında (kaynak dosyalar, `node_modules` hariç) **`dangerouslySetInnerHTML` kullanımı bulunamadı**, **wildcard CORS (`origin: '*'`) bulunamadı**, **sunucu tarafında kullanıcı girdisiyle `exec`/`child_process` çalıştıran bir yer bulunamadı** (tespit edilen `exec` çağrıları ya regex `.exec()` ya da tarayıcı içi FFmpeg.wasm — sunucu komut enjeksiyonu riski yok).

## Bu oturumda düzeltilen somut sorunlar

1. **Orta risk — test kapsam boşluğu:** `tests/unit/security.test.js`'deki Shopier replay-koruması ve uzlaştırma testleri, MongoDB'den Supabase'e geçiş sonrası güncellenmemiş mock'lar yüzünden başarısızdı. Gerçek kod doğruydu ama bu kritik güvenlik özelliği **otomatik olarak doğrulanamıyordu.** Düzeltildi, 15/15 test geçiyor.
2. **Düşük risk — hijyen:** `.gitignore`'a `node_modules_*` ve `_tmp_*` eklendi; bu oturumda ortaya çıkan bozuk `node_modules_corrupt_20260722` dizini ve iki `_tmp_8_...` dosyası önceden gitignore kapsamı dışındaydı, yanlışlıkla commit edilebilirdi.

## Bu oturumda incelenemeyen / doğrulanamayan alanlar

- **Canlı Supabase RLS testi** (anon/User A/User B/service_role matrisi) — staging DB erişimi yok. `apps/kadexai/supabase/migrations/202607170002_explicit_rls_and_payments.sql` gibi migration dosyaları statik olarak okunabilir durumda ama gerçek DB'ye karşı çalıştırılıp doğrulanmadı.
- **Canlı Upstash rate-limit testi** (iki instance, eşzamanlı istek) — `ENVIRONMENT_BLOCKERS.md`'de zaten işaretli, bu oturumda da geçerli.
- **Brute-force/credential-stuffing'in gerçek trafikte davranışı** — kod seviyesinde rate limit var, canlı yük testi yapılmadı.
- **`apps/kadexai/backend` (FastAPI medya servisi)** ve **Kade Studio (`apps/studio-web`/`studio-worker`)** — bu oturumda yalnızca dosya envanteri çıkarıldı, satır satır güvenlik taraması yapılmadı (kullanıcı talimatının orijinal kapsamı dışında ama "birinci taraf kod" olarak ileride ele alınmalı).
- **İki faktörlü doğrulama (2FA) admin için henüz yok.** Mevcut JWT+session-version modeli sağlam ama 2FA altyapısı kurulmadı; kullanıcı talimatı bunu "gerekli görülürse" olarak işaretlemişti — admin hesap sayısı ve tehdit modeline göre ayrı bir karar gerektirir.
- **`server/api/_lib/uploadValidation.js`, `requestLimits.js`, `csrf.js`, `validation.js`** dosyaları testler üzerinden dolaylı doğrulandı (`tests/unit/security.test.js` bunları çağırıyor ve geçiyor) ama satır satır ayrıca okunmadı.

## Risk özeti

| Seviye | Sayı | Not |
|---|---|---|
| Kritik | 0 | Bu oturumda bulunmadı |
| Yüksek | 0 | Bu oturumda bulunmadı |
| Orta | 1 (düzeltildi) | Shopier güvenlik testlerinin bozuk mock'ları |
| Düşük | 1 (düzeltildi) | .gitignore hijyeni |
| İyileştirme/gelecek çalışma | 3 | Admin 2FA yok, canlı RLS/rate-limit testi yapılmadı, FastAPI backend + Kade Studio ayrı güvenlik taraması bekliyor |

Bu, "tüm açıklar kapatıldı" anlamına gelmez — yalnızca bu oturumda incelenen alanlarda kritik/yüksek seviye bulgu çıkmadığı, bulunanların düzeltildiği ve incelenemeyen alanların açıkça listelendiği anlamına gelir.
