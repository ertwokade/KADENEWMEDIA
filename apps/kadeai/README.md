# KADE AI

KADE AI, Next.js 16 App Router ve React 19 ile geliştirilmiş içerik/operasyon panelidir. Web uygulamasının tamamı `/kadeai` base path altında çalışır; auth ve veri katmanı Supabase, ayrı medya servisi FastAPI kullanır.

## Local development

Gereksinimler: Node.js 22 LTS+, npm ve FastAPI için Python 3.11.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Login: `http://127.0.0.1:3000/kadeai/login`. `KADE_DISABLE_AUTH=1` yalnız development ortamında geçerlidir ve production’da yok sayılır.

## Doğrulama komutları

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:backend
npm run build
npm run test:bundle-secrets
npm run start
npm run test:e2e
npm audit --audit-level=high
python -m pip_audit -r backend/requirements.txt
```

`npm run start`, zorunlu auth/AI değişkenlerini doğrular ve standalone build’i başlatır. Gerçek secret değerleri hiçbir test çıktısında yazdırılmaz.

## Mimari

- UI/API: Next.js App Router, Route Handlers ve `proxy.ts`.
- Auth/session: Supabase SSR cookie akışı; dashboard hem proxy hem server layout ile korunur.
- Veri: Supabase Postgres ve RLS. Client sorguları session kullanıcısını esas alır.
- AI: server-only çoklu provider servisi; testte `AI_PROVIDER_MODE=mock` kullanılabilir, production mock’u reddeder.
- E-posta: `lib/email` altında provider arayüzü, Resend HTTP adaptörü ve development log/mock modu.
- Ödeme: provider-bağımsız arayüz, mock provider, sipariş/event modeli ve imzalı/idempotent webhook. Shopier gerçek işlemi merchant sözleşmesi doğrulanana kadar bilinçli olarak reddeder.
- Telemetri: Sentry client/server/edge ve PostHog; ikisi de env ile kapalıdır. PostHog ayrıca kullanıcı izni olmadan başlamaz.
- Backend: `backend/main.py` FastAPI giriş noktası; bearer token, CORS allow-list, rate/body limit ve media-root sınırı uygular.
- Desktop: Electron gerçekten package scriptlerinde ve `electron/main.js` ile kullanıldığı için tutulmuştur.

## Supabase migration sırası

Staging ve production’a backup alınarak, dry-run sonrasında şu sırayla uygulanmıştır:

1. `supabase/schema.sql`
2. `supabase/migrations/202607160001_kadeai_profiles_and_runs.sql`
3. `supabase/migrations/202607170001_security_hardening.sql`
4. `supabase/migrations/202607170002_explicit_rls_and_payments.sql`
5. `supabase/migrations/202607170003_explicit_table_grants.sql`

`202607170002`, kullanıcı tablolarındaki genel `FOR ALL` politikalarını açık SELECT/INSERT/UPDATE/DELETE politikalarına ayırır; ödeme siparişlerini kullanıcıya bağlar ve doğrulanmış webhook event tablosunu client rollerine kapatır. `202607170003`, restore edilmiş ve yeni Supabase projelerinde Data API yetkilerini aynı least-privilege sözleşmesine getirir; satır izolasyonu RLS tarafından uygulanmaya devam eder.

## FastAPI

```powershell
python -m pip install -r backend/requirements.txt
$env:KADE_BACKEND_TOKEN='at-least-32-random-characters'
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8472
```

Health: `GET http://127.0.0.1:8472/health`. Container için `backend/Dockerfile`; production komutu `uvicorn main:app --host 0.0.0.0 --port 8472 --workers 2 --proxy-headers --forwarded-allow-ips '*'`.

## Manuel gerçek AI testi — maliyet uyarısı

Bu çalışma gerçek provider çağrısı yapmadı. Aşağıdaki işlem provider kotası/ücreti tüketebilir; yalnız billing limiti olan test hesabı ve geçici session ile çalıştırılmalıdır:

```powershell
curl.exe -X POST https://kadenewmedia.com/kadeai/api/generate/title `
  -H "Content-Type: application/json" -H "Cookie: <TEST_SESSION_COOKIE>" `
  -d '{"prompt":"Kısa bir test başlığı","model":"auto","maxTokens":32}'
```

Kurulum ve rollback ayrıntıları için [DEPLOYMENT.md](DEPLOYMENT.md), güvenlik sınırları için [SECURITY.md](SECURITY.md) ve doğrulanmış sonuçlar için [PRODUCTION_READINESS_REPORT.md](PRODUCTION_READINESS_REPORT.md) dosyalarına bakın.
