# KadexAI env değişkenleri — `kadeertwo/kadenewmedia` projesine girilecek

Vercel → Project Settings → Environment Variables. Hepsi **Production + Preview**.

> Değerleri ben giremiyorum (API anahtarı/token alanlarına yazmam kapalı).
> Aşağıdaki liste, hangi anahtarın nereden alınacağını gösteriyor.

## A. Bunlar OLMADAN BUILD PATLAR

`apps/kadexai/scripts/validate-env.mjs` bunları zorunlu tutuyor:

| Anahtar | Nereden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/public) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `OPENAI_API_KEY` | platform.openai.com |
| `GROQ_API_KEY` | console.groq.com |
| `MISTRAL_API_KEY` | console.mistral.ai |
| `CEREBRAS_API_KEY` | cloud.cerebras.ai |
| `OPENROUTER_API_KEY` | openrouter.ai/keys |
| `GEMINI_API_KEY` | ✅ projede zaten var |

## B. Çalışma anında gerekenler

`KADEXAI_ADMIN_API_SECRET` · `KADE_TOKEN_ENCRYPTION_KEY` (BYOK şifrelemesi — kaybolursa
kayıtlı anahtarlar çözülemez) · `KADE_OWNER_EMAIL` veya `KADE_OWNER_EMAILS` ·
`NEXT_PUBLIC_APP_URL` · `NEXT_PUBLIC_SITE_URL` · `GOOGLE_OAUTH_CLIENT_ID` ·
`GOOGLE_OAUTH_CLIENT_SECRET` · `GOOGLE_OAUTH_REDIRECT_URI` · `RESEND_API_KEY` ·
`YOUTUBE_API_KEY` · `PAYMENT_PROVIDER` · `PAYMENT_WEBHOOK_SECRET`

Sentry: `SENTRY_DSN` · `NEXT_PUBLIC_SENTRY_DSN` · `SENTRY_ORG` · `SENTRY_PROJECT` · `SENTRY_AUTH_TOKEN`
PostHog: `NEXT_PUBLIC_POSTHOG_KEY` · `POSTHOG_HASH_SECRET` · `NEXT_PUBLIC_POSTHOG_ENABLED=1`

## C. Ana siteden gelenler — projede ZATEN VAR

`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `JWT_SECRET` · SMTP\* · SHOPIER\* ·
`UPSTASH_REDIS_REST_*` · `CRON_SECRET` · GA4

## D. GİRİLMEYECEK

- `NEXT_PUBLIC_BASE_PATH` — varsayılan `/kadexai` zaten doğru, elle girilirse bozulur.
- `KADE_DISABLE_AUTH` — yalnız yerel geliştirme içindir.
- `AI_PROVIDER_MODE` — production'da `mock` reddedilir.

## E. Bu turda eklenen yeni değişkenler (üçü de OPSİYONEL)

| Anahtar | Tanımsızsa ne olur |
|---|---|
| `KADE_USD_TRY_RATE` | Admin panelinde brüt marj "hesaplanamadı" yazar |
| `AI_MODEL_RATES_JSON` | Koddaki varsayılan fiyat tablosu kullanılır |
| `KADEXAI_ENFORCE_TOKEN_QUOTA` | Kota ölçülür ama kimse kesilmez (önerilen: şimdilik girme) |
