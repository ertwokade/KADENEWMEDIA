# AUDIT_CHECKLIST.md — Kade New Media / Kade Studio / KadeAI Denetim Envanteri

Son güncelleme: 22 Temmuz 2026 (Aşama 1 — ilk envanter)

## Önemli not: Bu görevin gerçek boyutu hakkında dürüst değerlendirme

Bu repo, tek bir küçük site değil, **üç ayrı ürünü** aynı monorepo altında barındırıyor:

1. **Kök dizin (legacy)** — Vite + React 19 ile yazılmış `kadenewmedia.com` pazarlama sitesi + Express tabanlı `server/api/*` (Vercel'de `api/[...path].js` catch-all üzerinden servis ediliyor). ~158 kaynak dosyası (`src/`) + 41 backend dosyası (`server/`).
2. **`apps/kadeai`** — Next.js 16 App Router ile yazılmış, `/kadeai` altında çalışan bir **içerik/operasyon paneli** (sosyal medya AI araçları, ödeme/paket sistemi, Supabase auth). ~344 dosya. Kullanıcı talimatındaki "ödeme ve fiyatlandırma uygulaması" tanımı kısmen doğru — ödeme burada var, ama uygulamanın asıl işi 30'dan fazla AI içerik üretim aracı (başlık, hashtag, klip üretici, YouTube SEO, vb.).
3. **`apps/studio-web` + `apps/studio-worker` + `packages/*`** — Kullanıcı talimatında hiç bahsedilmeyen, ayrı bir **video düzenleme stüdyosu** ("Kade Studio"): timeline editörü, FFmpeg export, PostgreSQL/Drizzle, Redis/BullMQ, MinIO, Docker Compose. ~122 dosya.

Toplam birinci taraf dosya sayısı (node_modules/.next/dist hariç): **yaklaşık 677 dosya** (158 + 344 + 38 + 28 + 56 + 41 + 2 + 8 + kök seviye dosyalar). Bu, "satır satır" gerçek bir güvenlik + işlevsellik + SEO + metin + test denetiminin tek oturumda bitirilebilecek bir iş olmadığı anlamına geliyor; kullanıcı talimatının kendisi de 18 aşamalı bir sıra tanımlıyor. Bu belge, o çok aşamalı çalışmanın **canlı envanteridir** — her dosya tek seferde değil, ilgili aşama gerçekten o dosyaya dokunduğunda "İncelendi" olarak işaretlenecektir. Şu an itibarıyla çoğu dosya "İncelenecek" durumundadır; bunu "İncelendi, sorun bulunmadı" gibi göstermek yanlış güven verir.

Ayrıca repoda **daha önceki oturumlardan kalma kapsamlı denetim belgeleri zaten var** (aşağıda listelendi). Bunlar sıfırdan yok sayılmayacak, bu oturumda doğrulanıp güncellenecek.

## Repoda halihazırda bulunan önceki denetim belgeleri (bu çalışmadan önce mevcuttu)

| Dosya | İçerik | Durum |
|---|---|---|
| `AUDIT_REPORT.md` (32 KB) | Önceki tam site denetimi | İncelenecek — bu oturumun bulgularıyla çapraz doğrulanacak |
| `FULL_SITE_AUDIT.md` | Site geneli denetim | İncelenecek |
| `ROUTE_AUDIT.md` (42 KB) + `ROUTE_TEST_RESULTS.json` (91 KB) | Rota bazlı test sonuçları | İncelenecek — `config/route-manifest.json` ile tutarlılığı kontrol edilecek |
| `SECURITY_CHECKLIST.md` (9 KB) | Güvenlik kontrol listesi | İncelenecek — bu oturumdaki OWASP taramasının temeli olacak |
| `SECURITY_RETEST.md` | Yeniden test sonuçları | İncelenecek |
| `ACCESSIBILITY_REPORT.md` | Erişilebilirlik | İncelenecek |
| `PERFORMANCE_REPORT.md` | Performans | İncelenecek |
| `RELEASE_CHECKLIST.md` (8 KB) | Release kriterleri | İncelenecek — final rapor ile birleştirilecek |
| `CONTENT_REQUIRED.md` | Eksik içerik listesi | İncelenecek — "sahte fiyat/metin uydurma" kuralına uygunluk kontrol edilecek |
| `ENVIRONMENT_BLOCKERS.md` | Bu ortamda test edilemeyen alanlar (browser, Upstash, Supabase staging, Shopier sandbox, rol fixture'ları) | **Geçerli — bu oturumda da aynı kısıtlar geçerli** |
| `FIX_SUMMARY.md` | Önceki oturumda yapılan düzeltmeler özeti | Geçerli, aşağıda özetlendi |
| `apps/kadeai/SECURITY_AUDIT.md`, `SECURITY.md`, `PRODUCTION_READINESS_REPORT.md`, `MIGRATION_REPORT.md` | KadeAI'a özel denetim/güvenlik/prod-hazırlık belgeleri | İncelenecek |
| `apps/kadeai/_audit/` | Denetim script/çıktıları dizini | İncelenecek |

Önceki oturumda (bkz. `FIX_SUMMARY.md`) yapılmış ama **commit/push/merge/deploy edilmemiş** işler: 169 rotalı route-manifest + doğrulayıcı, sayfa bazlı SEO fallback'leri, Shopier server-owned katalog + idempotent webhook + uzlaştırma, KadeAI production AI kotasının Upstash Lua tabanlı atomik modele taşınması, bundle-secret tarayıcısı, FastAPI sertleştirmesi, Supabase migration/RLS script'leri, 30 yeni test. **Bu çalışmanın gerçekten `main`'e ulaşıp ulaşmadığı `git log` ile ayrıca doğrulanmalı** (git log'da bununla eşleşen "Supabase migration" ve "sanitize-html" commit'leri görüldü, ama Shopier/Upstash/bundle-secret commit'leri bu oturumda henüz teyit edilmedi).

## Aşama 1 — Dizin/modül seviyesi envanter (dosya bazlı ayrıntı sonraki aşamalarda doldurulacak)

| Alan | Yol | Dosya sayısı | Durum |
|---|---|---|---|
| Legacy sayfalar (React Router) | `src/pages/` | 36 sayfa bileşeni | İncelenecek — Aşama 4/11 |
| Legacy bileşenler | `src/components/` | dahil (158 içinde) | İncelenecek |
| Legacy Express API (kaynak) | `server/api/*.js` (auth, blog, contact, crm, customers, shopier, seed, shortLinks, sitemap, users, vb. 27 dosya) | 41 | İncelenecek — Aşama 2/6, `server/api/seed.js` öncelikli (bkz. ROUTE_MATRIX.md notu) |
| Legacy API giriş noktaları (Vercel) | `api/[...path].js` (152 satır), `api/sitemap.js` | 2 | İncelenecek — Aşama 2 |
| Kök build/config | `vite.config.js`, `vercel.json`, `eslint.config.js`, `tsconfig.base.json`, `.env.example`, `docker-compose.yml` | ~10 | İncelendi (bu oturumda okundu) — vercel.json'daki Vercel Services çelişkisi ROUTE_MATRIX.md'de raporlandı |
| KadeAI Next.js route handler'ları | `apps/kadeai/app/api/**/route.ts` | 51 | İncelenecek — Aşama 2/9, öncelik: `payments/*`, `auth/*` |
| KadeAI dashboard sayfaları | `apps/kadeai/app/dashboard/**/page.tsx` | 37 | İncelenecek — Aşama 4 |
| KadeAI ödeme/katalog mantığı | `apps/kadeai/lib/payments/` (catalog.ts okundu) | İncelenecek | `catalog.ts` İncelendi (bu oturumda okundu) — fiyatlar kodda sabit, admin düzenleme endpointi yok |
| KadeAI backend (FastAPI, medya servisi) | `apps/kadeai/backend/` | çok sayıda | İncelenecek — Aşama 2 |
| KadeAI Supabase migration'ları | `apps/kadeai/supabase/` | İncelenecek | İncelenecek — Aşama 2/12, ENVIRONMENT_BLOCKERS.md'de staging erişimi yok olarak işaretli |
| KadeAI test dosyaları | `apps/kadeai/tests/` | İncelenecek | İncelenecek — Aşama 15 |
| Kade Studio web | `apps/studio-web/` | 38 | İncelenecek — kullanıcı talimatı kapsamında değil ama "birinci taraf kod" olduğu için Aşama 2 güvenlik taramasına dahil edilecek |
| Kade Studio worker | `apps/studio-worker/` | 28 | İncelenecek |
| Paylaşılan paketler | `packages/*` (editor-core, shared, db) | 56 | İncelenecek |
| Kök testler | `tests/` | 2 | İncelenecek — Aşama 15, mevcut kapsam çok dar görünüyor |
| Scriptler | `scripts/` (route audit, production audit dahil) | 8 | İncelendi (bir kısmı, `package.json` script referanslarıyla) |
| Marka/SEO varlıkları | `brand/`, `seo/`, `fonts/`, `img/`, `public/` | İncelenecek | İncelenecek — Aşama 10/14 |
| Kök seviye tek dosyalar | `index.html`, `script.js`, `styles.css`, `kade-shared.css`, `website-base.css`, `server.js` (41 satır), `seed-db.js`, `pageVs.json`, `ui-state.json`, `_diag.mjs`, `_on.mjs`, `_t.mjs` | 12 | İncelenecek — `seed-db.js` ve `_diag.mjs`/`_on.mjs`/`_t.mjs` isimleri debug/geçici script izlenimi veriyor, kullanıcı talimatındaki "geçici çözüm/debug erişimi bırakma" kuralı gereği öncelikli incelenecek |

## Bu oturumda incelenemeyen alanlar ve nedeni

| Alan | Neden incelenemedi |
|---|---|
| `pnpm install` / tam build-lint-test çalıştırması | Bağlı klasör (Windows mount üzerinden) `pnpm` store işlemlerinde `EPERM: operation not permitted` hatası verdi (geçici dosya silinemedi). Kök `node_modules` zaten mevcut ama `eslint` paketi kurulu değil çıktı — üç farklı lockfile (`bun.lock`, `package-lock.json`, `pnpm-lock.yaml`) aynı anda repoda, bu da paket yöneticisi tutarsızlığına işaret ediyor ve ayrıca raporlanacak. |
| GitHub PR durumu (`PR #8`, branch `kadirdemirs-patch-3`) | **Güncelleme: bulundu ve incelendi** (bkz. `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`) — daha kapsamlı bir `git branch -a -v` taramasında `remotes/origin/kadirdemirs-patch-3` ve `remotes/origin/pr/8` bulundu. Tek içerik farkı `vercel.json`'daki geçersiz `"services"` şeması; merge edilmemesi öneriliyor. |
| Canlı Vercel proje/ortam değişkenleri, preview deployment testi | Bu ortamda Vercel dashboard/CLI erişimi yok. |
| Gerçek AI görünürlük testleri (ChatGPT, Claude, Gemini, Grok, Perplexity üzerinde 150+ sorgu) | Bu ortamda bu sistemlere hesap/API erişimi yok; toplu scraping kullanım koşullarını ihlal eder. |
| Supabase staging RLS testleri, Upstash canlı doğrulaması, Shopier sandbox | `ENVIRONMENT_BLOCKERS.md`'de zaten işaretli, bu oturumda da geçerli. |

## Öncelikli bulgu: legacy `/paketler` admin editörü ölü/kopuk CMS

`Admin.jsx`'teki "💰 Paketler" sekmesi (fiyat TRY/USD dahil) `content.packages`'a yazıyor, ama canlı `/paketler` sayfası (`src/pages/Packages.jsx`) bunu okumuyor — statik `src/data/packages.js`'ten (`PACKAGE_SCOPES`) besleniyor ve kasıtlı olarak fiyat göstermiyor (quote-only tasarım, KDV/ek maliyet belirsizliğinden kaçınmak için). Detay ve önerilen iki düzeltme yönü: `DEPLOYMENT_CHECKLIST_TR.md` → "Paket/fiyatlandırma" bölümü.

## Sonraki adım

Aşama 2'den itibaren (build/lint/test başlangıç ölçümü tamamlandıktan sonra) her dosya, ilgili çalışma aşamasında gerçekten açılıp incelendiğinde bu tabloya satır bazında "İncelendi, sorun bulunmadı" / "İncelendi, düzeltildi" / "İncelendi, yeniden yapılandırıldı" olarak işlenecektir.
