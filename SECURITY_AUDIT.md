# KADE AI Güvenlik Denetimi

Denetim: 2026-07-17. Kapsam Next.js/Supabase/FastAPI, OWASP sınıfları, tedarik zinciri, local/remote production, gerçek Supabase staging ve production RLS ile browser smoke testleridir.

## Envanter

- Next.js 16.2.10 App Router, React 19.2.4, npm lockfile.
- Supabase Auth/Postgres/RLS; server cookie ve çift katmanlı route koruması.
- Server-only Groq/Cerebras/OpenRouter/Mistral/Anthropic/OpenAI/Gemini yönlendirmesi.
- Modüler Resend/log email; provider-neutral mock/Shopier payment sınırı.
- Sentry client/server/edge; izinli ve minimal PostHog.
- Ayrı FastAPI 0.139.2 servisi ve Electron desktop kabuğu.

## Düzeltilen bulgular

- Genel RLS yazma politikaları explicit SELECT/INSERT/UPDATE/DELETE politikalarına ayrıldı; ödeme verisi sahipliği ve event isolation hazırlandı.
- Password reset sayfası callback query’sine ek olarak server recovery session doğruluyor; süresi dolmuş link fail-closed.
- Ödeme fiyatı server katalogda; signature, unique event ve idempotency ile replay engelleniyor. Shopier gerçek işlem sözleşmesi eksikken reddediliyor.
- Telemetry secret/PII filtresi, global error boundary ve API exception capture eklendi; gerçek event gönderimi kapalı.
- Email HTML escape, idempotency ve timeout eklendi; development log’u alıcıyı redakte ediyor.
- FastAPI production env/token/CORS doğrulaması, non-root Dockerfile ve gerçek HTTP smoke eklendi.
- Staging ve production’da dört migration uygulandı; migration list/lint doğrulandı. Restore production’da eksik authenticated Data API yetkileri explicit table GRANT migration’ıyla least-privilege düzeltildi. İki kullanıcıyla gerçek RLS CRUD izolasyonu iki ortamda 20/20, production browser login/logout/back akışı hem upstream hem ana domainde geçti.
- Vercel env aktarımında PowerShell BOM kaynaklı bozuk anon/service key tespit edildi; byte-safe senkronizasyon script’i eklendi ve uzak auth 401’den 200’e getirildi.
- Dashboard/API responses no-store; client bundle gerçek secret değerleriyle otomatik taranıyor.

## Tedarik zinciri

- `npm audit --audit-level=high`: 0 açık.
- `pip-audit -r backend/requirements.txt`: 0 bilinen açık.
- Python güvenlik güncellemeleri: FastAPI/Starlette, Pydantic settings, multipart, Whisper, NumPy/SciPy/OpenCV/SceneDetect ve test araçları uyumlu sürümlere sabitlendi; kullanılmayan `python-jose`/`passlib` kaldırılarak fix’i olmayan ECDSA alt bağımlılığı çıkarıldı.
- Electron gerçekten package scripts/config/main process tarafından kullanılıyor; electron-builder bu nedenle tutuldu. Deprecated alt bağımlılıklar runtime doğrudan bağımlılığı değildir ve zorla major upgrade yapılmadı.

## Kalan riskler

- Gerçek recovery e-posta teslimi, maliyetli AI provider çağrısı, payment ve telemetry event teslimi doğrulanmadı.
- FastAPI Docker doğrulandı ancak dış production container host erişimi olmadığı için Next production’a bağlanmadı.
- Rate limit process belleğindedir; yatay ölçeklemede paylaşımlı store gerekir.
- Legacy operations kit nedeniyle CSP production’da `unsafe-inline` içerir; `unsafe-eval` içermez.
- Shopier adapter merchant API/callback sözleşmesi resmi dokümanla doğrulanana kadar production’da kullanılamaz.
- Preview Deployment Protection arkasında kalır; production smoke doğrudan `kadenewmedia.com/kadeai` üzerinde yapılmıştır.

## Doğrulama özeti

Lint/typecheck/build geçti; unit 6/6, FastAPI 2/2, Playwright 38/38 geçti. Production Next health JSON 200/application-json; anonymous dashboard login’e yönlendi; logo yüklendi ve browser console temiz. Production A/B RLS 20/20 ve uzak browser auth 1/1 geçti. Client bundle secret taraması ve npm/pip audit geçti.
