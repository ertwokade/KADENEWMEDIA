# KADE AI Production Hazırlık Raporu

Tarih: 2026-07-17. Supabase staging/production migration ve RLS, Vercel production deploy, `/kadeai` routing ve gerçek production auth doğrulandı. Gerçek recovery e-posta teslimi, dış FastAPI host, ücretli AI çağrısı ve gerçek ödeme yapılmadı.

## 1. Tespit edilen kök nedenler

- Production `/kadeai/*` trafiği güncel Next standalone server’a değil statik SPA fallback’e gidiyor; bu yüzden API health HTML, anonim dashboard ise 200 dönüyor.
- E-posta, ödeme ve telemetry provider katmanları yoktu.
- RLS’nin önemli kısmı güvenli olsa da bazı tablolarda geniş `FOR ALL` politikaları vardı.
- FastAPI için container/deployment ve otomatik smoke paketi yoktu.
- Parola recovery formu query parametresine güveniyor, callback sonrası session varlığını ayrıca kontrol etmiyordu.

## 2. Değiştirilen dosyalar

- Routing/security: `next.config.ts`, `proxy.ts`, `instrumentation*.ts`, `sentry.*.config.ts`, `app/global-error.tsx`.
- Auth: `app/reset-password/page.tsx`, `app/api/auth/recovery-session/route.ts`.
- Services: `lib/ai/mockProvider.ts`, `lib/email/*`, `lib/payments/*`, `lib/analytics/client.ts`, `lib/observability/*`, `lib/backend/client.ts`.
- APIs: `app/api/payments/*`, `app/api/backend/health/route.ts`.
- Data: `supabase/migrations/202607170002_explicit_rls_and_payments.sql`, `202607170003_explicit_table_grants.sql`.
- FastAPI: `backend/Dockerfile`, `.dockerignore`, `requirements.txt`, `tests/*`, `main.py`.
- Tests/scripts/docs: `tests/unit/*`, `tests/e2e/basepath.spec.ts`, `scripts/check-client-secrets.mjs`, `scripts/validate-env.mjs`, `.env.example`, README/deployment/security raporları.

## 3. Yapılan teknik değişiklikler

- Sentry Next config, client/server/edge init, source map silme, error boundary ve API capture eklendi.
- PostHog yalnız production + env enable + kullanıcı izniyle çalışıyor; autocapture/session replay kapalı.
- Resend HTTP provider, development log provider ve tekrar kullanılabilir/HTML-escape eden şablonlar eklendi.
- AI mock provider eklendi; production mock reddediliyor; mevcut timeout/retry/rate limit/server-key yapısı korundu.
- Provider-bağımsız payment interface, server katalog fiyatı, checkout/status/webhook API, HMAC mock, idempotent event ledger eklendi.
- Dashboard/API cache `private, no-store`; recovery session doğrulaması ve başarılı reset sonrası login yönlendirmesi eklendi.
- FastAPI container, production env gate, Next internal health client ve ayrık proxy örneği eklendi.

## 4. Güvenlik iyileştirmeleri

- Client’tan tutar/user_id kabul edilmiyor; sahiplik session ve RLS ile kuruluyor.
- Payment event tablosu anon/authenticated rollerine kapalı; yalnız imzası doğrulanan server webhook’u service role ile günceller.
- Telemetry’de user/cookie/auth/token/password/prompt/content alanları filtreleniyor.
- Secret bundle taraması gerçek yapılandırılmış server secret değerlerini yazdırmadan `.next/static` içinde arıyor.
- Startup env doğrulaması auth ve en az bir AI provider için fail-closed.
- FastAPI production token uzunluğu, CORS allow-list, auth, body/rate ve media-root sınırı zorlanıyor.

## 5. Oluşturulan migration’lar

Dört migration staging ve production projelerine backup/dry-run sonrasında sırayla uygulandı. `202607170002` açık per-operation RLS ve ödeme/event izolasyonunu; `202607170003` restore/yeni proje Data API grant eşitliğini least-privilege biçimde uygular.

## 6. Çalıştırılan testler ve sonuçları

- ESLint: geçti, 0 hata/uyarı.
- TypeScript: geçti.
- Unit: 6/6 geçti (AI mock, email mock/XSS escape, payment imza/idempotency, A/B ownership, RLS statik sözleşme).
- Playwright: 38/38 geçti; Chromium desktop + Pixel 7.
- Production build: geçti, 41 static page üretildi; ödeme/backend API rotaları build manifestinde.
- Client bundle secret: geçti; 5 yapılandırılmış secret kontrol edildi, sızıntı yok.
- npm audit: 0 açık.
- FastAPI pytest: 2/2 geçti.
- FastAPI gerçek local HTTP smoke: `/health` 200 JSON.
- FastAPI Docker image: `kade-fastapi:20260717` başarıyla build edildi; non-root `kade` kullanıcısı doğrulandı. Container smoke testinde health 200, anonim korumalı uç 401 ve geçerli internal token ile eksik provider yapılandırması 503 verdi.
- pip-audit requirements: bilinen açık yok.
- Local Next smoke: `/kadeai/api/health` 200, `application/json`, `status=ok`; dashboard anonimi login’e yönlendi; browser console 0 hata.
- Vercel preview: `kade-social-media-ai` projesinde build READY oldu (`dpl_3DUpUcqDXqzcoyL6XWhReAfygKjx`). Preview Deployment Protection nedeniyle uygulama rotalarının tarayıcı smoke testi Vercel giriş ekranını aşamadı.
- Ana domain projesi için yalnız `/kadeai` ve `/kadeai/:path*` rewrite’larını ekleyen `integrate-kadeai-route` branch’i ve `f106176` commit’i hazırlandı; ana site build/lint geçti, deploy edilmedi.
- Supabase staging: migration list local/remote üçü de eşleşti; `db lint` sıfır şema hatası verdi. Migration öncesi schema/data/roles dump’ları `_audit` altında alındı ve SHA-256 özetleri doğrulandı.
- Gerçek Supabase A/B testi: 20/20 geçti. İki geçici kullanıcıyla password login, kendi profili/state/content CRUD, çapraz kullanıcı SELECT/UPDATE/INSERT/DELETE reddi ve logout doğrulandı; kullanıcılar test sonunda silindi.
- Gerçek browser auth: Chromium’da login → dashboard, oturumlu login redirect, logout, API 401, back/reload ve anonim dashboard redirect akışı 1/1 geçti; geçici kullanıcı silindi.
- Son Vercel preview build READY: `dpl_44HXaE9zHVMFZsas4KBWjdXbW79N`. Preview Supabase env’i doğrulanmış staging projesine taşındı; Deployment Protection nedeniyle public runtime yerine Vercel login görüldü.
- Production Supabase restore edildi; schema/data/roles backup seti ve SHA-256 özetleri doğrulandı. Dört migration uygulandı, lint geçti ve production A/B RLS testi 20/20 oldu.
- KADE AI production upstream READY ve `kadeai.vercel.app` aliasında çalışıyor. Ana site deployment’ı `dpl_3oPjzNezsbf4Zx173qviGebzTaYa`; yalnız `/kadeai` rewrite’ı etkin.
- `kadenewmedia.com/` 200 ve önceki title ile korundu. `/kadeai/login` 200, logo yüklü, health 200 JSON `ok`, anonim dashboard login redirect, console 0 hata.
- Ana domain üzerinde gerçek password login → dashboard → logout → API 401 → back/reload koruması 1/1 geçti; geçici kullanıcı silindi.

## 7. Başarısız veya çalıştırılamayan testler

- İlk pip-audit denemeleri Python 3.14 ile eski Whisper/NumPy metadata build’i nedeniyle çalışmadı; uyumlu güncellemelerden sonra final audit geçti.
- TestClient, Starlette’in gelecekte `httpx2` kullanacağına dair tek deprecation uyarısı verdi; testler geçti.
- Gerçek recovery e-postası henüz doğrulanmadı; erişilebilir bir test posta kutusu gerekiyor.
- FastAPI image local Docker’da doğrulandı ancak dış production container host erişimi yok.

## 8. Production’a uygulanması gereken manuel işlemler

Production DB, Next deployment, auth config, reverse proxy ve smoke tamamlandı. Kalan manuel işlemler: erişilebilir test mailbox ile recovery teslimi; dış container host sağlanırsa FastAPI image publish/deploy ve internal URL/token tanımı; isteğe bağlı Sentry/PostHog/payment provider açılışları.

## 9. Gerekli environment variable’lar

Zorunlu: Supabase URL/anon key ve en az bir server AI key. Production public URL/base path önerilir. FastAPI için base URL/token; Resend, payment, Sentry ve PostHog yalnız ilgili özellik açılırsa gerekir. Tam, public/private ayrımı `.env.example` içindedir.

## 10. Supabase panelinde yapılması gerekenler

Staging ve production’da dört migration uygulandı; gerçek A/B RLS testleri geçti. Production Site URL ve callback/recovery allow-list’i Management API üzerinden `/kadeai` ile güncellendi ve yeniden okunarak doğrulandı.

## 11. Hosting/reverse proxy üzerinde yapılması gerekenler

Ana domainin ayrı `kademedia` Vercel projesinde olduğu doğrulandı. SPA fallback’ten önce yalnız `/kadeai` ve `/kadeai/:path*` isteklerini `kade-social-media-ai` upstream’ine gönderen rewrite production’a alındı. Ana domain ikinci projeye bağlanmadı ve ana `/` smoke testiyle korundu.

## 12. Henüz doğrulanamayan maddeler

Gerçek recovery e-posta teslimi, dış FastAPI production bağlantısı, gerçek provider AI çıktısı/maliyeti, gerçek Shopier callback sözleşmesi, Sentry source-map upload ve PostHog event teslimi doğrulanmadı. Production domain, auth ve RLS doğrulandı. Preview runtime Deployment Protection arkasında; production runtime public URL’de doğrulandı.

## 13. Riskler ve rollback adımları

- In-memory rate limit çoklu instance için ortak değildir; ölçeklemede paylaşımlı store gerekir.
- Legacy operations kit nedeniyle CSP’de `unsafe-inline` kalır.
- Shopier adapter gerçek merchant sözleşmesi incelenene kadar fail-closed; ödeme production’da kapalı kalmalıdır.
- Python medya stack’i büyük ve container build süresi/CPU-RAM kapasitesi staging’de ölçülmelidir.
- Docker image yaklaşık 9.66 GB sanal boyuttadır; production registry öncesi CPU-only PyTorch/medya bağımlılığı optimizasyonu değerlendirilmelidir.
- Rollback: ana siteyi `dpl_ARME46afvFHRuHMKc3AXLPyjRgTR` deployment’ına promote ederek `/kadeai` rewrite’ını geri alın; KADE upstream için önceki Vercel deployment’ını promote edin. DB’yi otomatik downgrade etmeyin; production pre-migration dump setini ve `kademedia_backup_20260717_104653` yedeğini koruyun.
