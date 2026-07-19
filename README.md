# Kade Media Monorepo

Kade Media ana sitesi ve KADE AI uygulaması bu tek GitHub deposunda birlikte tutulur.

## Uygulamalar

| Uygulama | Kaynak dizin | Production adresi | Teknoloji |
| --- | --- | --- | --- |
| Kade Media | repository kökü | `https://kadenewmedia.com` | React 19, Vite 8, Express/Vercel Functions |
| KADE AI / Content AI | `apps/kadeai` | `https://kadenewmedia.com/kadeai` | Next.js 16, Supabase, FastAPI |

Giriş yönlendirmesi:

- `/giris`: çalışma alanı seçimi
- `/giris/danismanlik`: Kade Media danışmanlık/müşteri girişi
- `/kadeai/login`: Content AI girişi

## Gereksinimler

- Node.js 20 veya güncel LTS
- npm
- KADE AI backend testleri için Python 3.11+
- İsteğe bağlı FastAPI container çalıştırması için Docker

## Temiz kurulum

Ana site:

```bash
npm ci
```

KADE AI:

```bash
npm ci --prefix apps/kadeai
```

Gerçek ortam değerlerini yalnız yerel `.env` dosyalarında veya deployment platformunun secret kasasında tutun. Şablonlar kökteki `.env.example` ve `apps/kadeai/.env.example` dosyalarındadır.

## Development

```bash
# Ana site
npm run dev

# Ana sitenin yerel API servisi
npm run dev:api

# KADE AI
npm run dev:kadeai
```

## Doğrulama ve build

```bash
# İki frontend uygulamasını build et
npm run build:all

# Ana site lint + build ve KADE AI tam verify zinciri
npm run verify:all

# KADE AI backend testleri
npm run test:backend:kadeai
```

## Deployment

Tek GitHub deposu kullanılmasına rağmen uygulamalar bağımsız build edilir:

- Ana site Vercel projesi: Root Directory `.`
- KADE AI Vercel projesi: Root Directory `apps/kadeai`
- Ana sitenin `vercel.json` dosyası yalnız `/kadeai` yollarını KADE AI upstream’ine yönlendirir.
- `kadenewmedia.com` domainini ikinci projeye ayrıca bağlamayın.

Ayrıntılar için `apps/kadeai/DEPLOYMENT.md` ve `apps/kadeai/SECURITY.md` dosyalarını inceleyin.

## Repository güvenliği

- `.env`, API anahtarı, token ve database dump dosyalarını commit etmeyin.
- KADE AI Supabase migrationları `apps/kadeai/supabase/migrations` altındadır.
- Production veritabanı migrationlarını staging backup ve doğrulama olmadan çalıştırmayın.
- Güvenlik raporları ve uygulama belgeleri `apps/kadeai` altında tutulur.
