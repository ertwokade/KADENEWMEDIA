# KadexAI Production Deployment

## Monorepo kaynağı

KadexAI kaynak kodu ana siteyle birlikte `kadirdemirs/kademedia` GitHub deposunda `apps/kadexai` dizinindedir. Git tabanlı deployment ayarlanırken ana site Vercel projesinin Root Directory değeri `.`, KadexAI Vercel projesinin Root Directory değeri `apps/kadexai` olmalıdır. İki proje aynı repository’yi kullanır; `kadenewmedia.com` domaini yalnız ana site projesinde kalır.

Hedefler `/kadexai/login`, `/kadexai/dashboard` ve `/kadexai/api/health` production’da çalışıyor. KadexAI upstream `kadexai.vercel.app`, ana domain rewrite `kadenewmedia.com/kadexai` üzerinden doğrulandı. Ana site `/` rotası deployment öncesi ve sonrası 200 ve aynı title ile çalıştı.

## Kök neden ve doğru routing

2026-07-17 salt-okunur kontrolde production `/kadexai/dashboard` ve `/kadexai/api/health` isteklerini aynı statik `app.html` dosyasına düşürüyordu. Bunun nedeni KadexAI server build’i yerine SPA fallback/rewrite çalışmasıdır. Next uygulaması `output: standalone` ve `basePath: /kadexai` ile server olarak çalıştırılmalı; `/kadexai/api/*` hiçbir zaman statik fallback’e bağlanmamalıdır.

Nginx için mevcut ana siteye eklenebilecek dar örnekler `deploy/nginx-kadexai.conf` ve FastAPI ayrımı için `deploy/nginx-kadexai-fastapi.conf` dosyalarındadır. `nginx -t` geçmeden reload yapmayın. Ana domain başka Vercel projesindeyse domaini ikinci projeye bağlamayın; ana projede yalnız `/kadexai/:path*` rewrite kullanın.

Doğrulanan Vercel düzeni iki ayrı projedir: ana domain `kademedia`, KadexAI upstream `kade-social-media-ai` (`kadexai.vercel.app`). Ana site yedeğindeki `integrate-kadexai-route` branch’inde `f106176` commit’i yalnız `/kadexai` yollarını upstream’e yönlendirir ve SPA fallback’ten önce çalışır. Ana domain deployment’ı `dpl_3oPjzNezsbf4Zx173qviGebzTaYa`; önceki rollback deployment’ı `dpl_ARME46afvFHRuHMKc3AXLPyjRgTR`.

## Next.js production

1. Deployment secret kasasına `.env.example` değişkenlerini girin.
2. `npm ci && npm run verify` çalıştırın.
3. `npm run start` ile standalone server’ı çalıştırın.
4. Proxy yalnız `/kadexai` yolunu bu upstream’e yönlendirsin; `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` ve gerçek IP başlıklarını korusun.
5. API istekleri için SPA fallback kuralı bulunmadığını doğrulayın.

Sentry source map upload yalnız `SENTRY_ENABLED=1`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` ve `SENTRY_PROJECT` ile build sırasında etkinleşir. Yükleme sonrası browser sourcemap dosyaları silinir.

## Supabase ve auth paneli

Staging ve production schema/data/roles backup’ları alındı; README’deki dört migration dry-run sonrası sırayla uygulandı. İki geçici gerçek test hesabıyla staging ve production SELECT/INSERT/UPDATE/DELETE izolasyonu 20/20 doğrulandı. Production browser auth hem doğrudan upstream hem ana domain üzerinde geçti. Geçici kullanıcılar test sonunda silindi.

- Site URL: `https://kadenewmedia.com/kadexai`
- Redirect allow-list: `https://kadenewmedia.com/kadexai/auth/callback`
- Recovery callback: callback üzerinden `/kadexai/reset-password?recovery=1`
- Logout URL: `https://kadenewmedia.com/kadexai/login`
- Development callback: yalnız gerekiyorsa `http://127.0.0.1:3000/kadexai/auth/callback`

Management API üzerinden production Site URL ve redirect allow-list bu değerlerle güncellendi ve tekrar okunarak doğrulandı.

Payment webhook için server-only `SUPABASE_SERVICE_ROLE_KEY` gerekir. Bu değer client’a veya `NEXT_PUBLIC_` değişkenine konmamalıdır.

## FastAPI deployment

`backend/Dockerfile` Python 3.11, non-root kullanıcı, FFmpeg, healthcheck ve iki Uvicorn worker içerir. Production’da en az 32 karakterlik `KADE_BACKEND_TOKEN`, açık `KADE_ALLOWED_ORIGINS=https://kadenewmedia.com` ve kalıcı/onaylı `KADE_MEDIA_ROOT` zorunludur. FastAPI genel internete açılmamalı; Next server `KADE_FASTAPI_BASE_URL` üzerinden iç ağdan erişmelidir.

2026-07-17’de `kade-fastapi:20260717` image’ı başarıyla build edildi. Container smoke testinde `/health` 200, tokensız korumalı uç 401 ve geçerli internal token sonrası eksik YouTube provider yapılandırması 503 verdi. Image non-root `kade` kullanıcısıyla çalışır. Mevcut medya/ML bağımlılıkları image’ı büyüttüğü için registry öncesi boyut optimizasyonu önerilir.

FastAPI için dış container hosting erişimi bulunmadığından image production hosta gönderilmedi. Vercel’de `KADE_FASTAPI_BASE_URL`/`KADE_BACKEND_TOKEN` tanımlı değildir; FastAPI gerektiren özellikler fail-closed kalır.

```powershell
docker build -t kade-fastapi ./backend
docker run --rm -p 127.0.0.1:8472:8472 --env-file backend/.env kade-fastapi
```

## E-posta, ödeme ve telemetri

- Resend: domain/sender doğrulandıktan sonra `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`. Kod testi sırasında gerçek e-posta gönderilmedi.
- Ödeme: migration uygulanıp merchant callback sözleşmesi resmi Shopier dokümanına göre tamamlanana kadar `PAYMENT_PROVIDER=disabled`. `mock` yalnız sandbox için; production’da ayrıca `PAYMENT_SANDBOX_ENABLED=1` ister. Gerçek tahsilat yapılmadı.
- Sentry: varsayılan kapalı; PII, cookie, authorization, prompt ve içerik alanları filtrelenir.
- PostHog: varsayılan kapalı; kullanıcı izin banner’ında kabul etmedikçe başlamaz. Autocapture, pageview ve session recording kapalıdır. KVKK/aydınlatma metni hukuk sorumlusu tarafından onaylanmalıdır.

## Production smoke checklist

- `GET /kadexai/api/health` → JSON, `application/json`, HTML değil.
- `GET /kadexai/dashboard` anonim → `/kadexai/login` redirect.
- `GET /kadexai/api/profile` anonim → 401.
- Login → dashboard; login olmuş kullanıcı login sayfasından dashboard’a yönlenir.
- Logout → cookie/session sonlanır; back/reload dashboard içeriği göstermez.
- Recovery bağlantısı → callback session; süresi dolmuş link açık hata verir; başarı login’e yönlenir.
- Kullanıcı A, B’nin satır ID’leriyle CRUD yapamaz.
- CSS/JS/logo `/kadexai/_next` ve `/kadexai/brand` altında yüklenir.
- FastAPI `/health` 200; korumalı endpoint token olmadan 401/503.

## Rollback

1. Yeni upstream’i durdurun ve yalnız eklenen `/kadexai` rewrite/location kuralını geri alın; ana `/` kuralına dokunmayın.
2. Önceki doğrulanmış Git commit/tag’i deploy edin.
3. Dosya geçişi için `C:\Users\Kadir Demir\Desktop\KadeBusiness\kademedia_backup_20260717_104653` yedeği korunuyor.
4. Production DB migration’ını otomatik downgrade etmeyin; `_audit/supabase_production_pre_migration_20260717_134930*` backup setini ve onaylı bakım planını kullanın.
5. Ana site `/`, login, dashboard redirect ve health’i yeniden test edin.
