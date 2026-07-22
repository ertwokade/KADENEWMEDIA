# VERCEL_SERVICES_MIGRATION_REPORT_TR.md

Tarih: 22 Temmuz 2026

## Özet karar

Kullanıcı talimatı, kök `vercel.json` içinde bir `"services"` alanı üzerinden **tek Vercel projesinde** `legacy` ve `kadeai` adında iki servisin çalıştığını, bunun `kadirdemirs-patch-3` branch'inde hazırlanıp `PR #8` ile açıldığını varsayıyordu. Bu oturumda kodu ve Vercel'in resmî dokümantasyonunu doğrudan kontrol ettim:

**Vercel'in `vercel.json` şemasında `"services"` diye bir alan yok.** (`https://vercel.com/docs/project-configuration` üzerinden çekilen güncel alan listesi: `$schema, buildCommand, bunVersion, cleanUrls, crons, devCommand, fluid, framework, functions, headers, ignoreCommand, images, installCommand, outputDirectory, public, redirects, bulkRedirectsPath, regions, functionFailoverRegions, rewrites, trailingSlash`.) `framework` alanı tek bir string değer alır — yani **tek bir Vercel projesi aynı anda hem Vite hem Next.js olarak build edilemez.** Vercel'in birden fazla uygulamayı tek çatı altında birleştirmek için sunduğu resmî özelliğin adı **Microfrontends**'tir ve o da her uygulamanın **kendi ayrı Vercel projesi** olmasını, bir `microfrontends.json` ile gruplanmasını gerektirir — yani "tek proje" hiçbir resmî Vercel mekanizmasında yok.

**Sonuç: Kullanıcı talimatındaki "tek Vercel projesi, services mimarisi" hedefi, Vercel'in mevcut ürününde teknik olarak karşılığı olmayan bir hedeftir.** Bunu zorla uygulamaya çalışmak (`vercel.json`'a var olmayan bir `services` alanı eklemek) gerçek bir deploy'da sessizce yok sayılır ya da doğrulama hatası verir; canlıya çıkmaz.

## Mevcut mimari — ve bunun aslında zaten doğru/onaylı olduğu bulgusu

Kod ve `apps/kadeai/DEPLOYMENT.md` incelemesi, kullanıcı talimatındaki anlatının aksine, **bu sorunun daha önceki bir oturumda zaten çözüldüğünü ve doğrulandığını** gösteriyor:

- `apps/kadeai/DEPLOYMENT.md` (satır 5, 7, 15): "İki proje aynı repository'yi kullanır; `kadenewmedia.com` domaini yalnız ana site projesinde kalır... Doğrulanan Vercel düzeni iki ayrı projedir: ana domain `kademedia`, KADE AI upstream `kade-social-media-ai` (`kadeai.vercel.app`)... Ana domain deployment'ı `dpl_3oPjzNezsbf4Zx173qviGebzTaYa`." Belgeye göre `/kadeai/login`, `/kadeai/dashboard`, `/kadeai/api/health` production'da bu düzenle **doğrulanmış.**
- Kök `vercel.json`: `/kadeai` ve `/kadeai/:path*` → `https://kadeai.vercel.app/kadeai` rewrite (dosyada mevcut, bu oturumda değiştirilmedi).
- `apps/kadeai/vercel.json`: `framework: nextjs`, kendi bağımsız build/install komutları — ayrı bir proje olarak deploy edilecek şekilde doğru yapılandırılmış.
- `apps/kadeai/next.config.ts`: `basePath: '/kadeai'` doğru ayarlanmış; CSP, HSTS, COOP/CORP, X-Frame-Options gibi güvenlik başlıkları zaten mevcut.
- `apps/kadeai/lib/appConfig.ts` + `lib/supabase/cookieOptions.ts`: `withBasePath()`/`stripBasePath()` yardımcıları ve Supabase session cookie'si `path: '/kadeai'` ile doğru scope edilmiş; `domain` alanı kasıtlı olarak boş bırakılmış (rewrite şeffaf olduğundan tarayıcı zaten `kadenewmedia.com` görür). Auth callback route'u (`app/auth/callback/route.ts`) yönlendirmeleri hep `withBasePath()` üzerinden yapıyor, kökten (`/login`) sızıntı yok.

Bu, **rewrite tabanlı iki-proje mimarisinin uydurma bir çözüm değil, Vercel'in bu tam senaryo için resmi olarak desteklediği ve önerdiği standart yöntem** olduğunu doğruluyor: statik/Vite bir ana site + ayrı bir Next.js uygulamasını tek görünür domain altında birleştirmenin gerçek yolu budur.

## Branch ve PR durumu — GÜNCELLEME: branch bulundu, incelendi

Önceki bir taslakta bu branch "bulunamadı" olarak işaretlenmişti; daha kapsamlı bir `git branch -a -v` taraması sonrasında **branch gerçekten mevcut ve bu sandbox'ın git önbelleğinde bulundu** (`remotes/origin/kadirdemirs-patch-3` ve `remotes/origin/pr/8` — ikisi de aynı commit'e, `b538cbe`'ye işaret ediyor, yani bu gerçekten GitHub'da açılmış bir PR #8'in dalı). İçeriği incelendi:

- `main`'e göre TEK içerik farkı: kök `vercel.json`. Diğer commit'ler (`Add title prop to TopBar component` x2) zaten `main`'e PR #7 ile ayrı bir şekilde merge edilmiş, `codex/pr8-hardening` dalında da aynı değişiklik tekrar var (muhtemelen `main`'in bu dala sonradan merge edilmesinden).
- Bu dalın `vercel.json`'ı **gerçekten** `"services":{"legacy":{...},"kadeai":{...}}` yapısını ve `"destination":{"service":"kadeai"}` şeklinde rewrite hedefleri kullanıyor — yani kullanıcı talimatındaki anlatı doğru bir GitHub dalına dayanıyordu.
- **Ancak bu yapılandırma Vercel'in resmî şemasında geçersiz.** `https://vercel.com/docs/project-configuration` üzerinden çekilen güncel (son güncelleme: 2026-06-16) tam alan listesinde `services` yok: yalnızca `$schema, buildCommand, bunVersion, cleanUrls, crons, devCommand, fluid, framework, functions, headers, ignoreCommand, images, installCommand, outputDirectory, public, redirects, bulkRedirectsPath, regions, functionFailoverRegions, rewrites, trailingSlash`. Vercel'in çoklu-uygulama birleştirme için resmî ürünü **Microfrontends**'tir (`https://vercel.com/docs/microfrontends`, ayrıca doğrulandı) ve o da ayrı bir `microfrontends.json` dosyası + **her uygulamanın kendi ayrı Vercel projesi olmasını** gerektiriyor — `vercel.json` içine gömülü tek-proje `services` alanı diye bir mekanizma yok.
- **Sonuç: `kadirdemirs-patch-3`/`PR #8`'deki `vercel.json` değişikliği, Vercel'e deploy edildiğinde muhtemelen ya sessizce yok sayılır ya da build/route çözümleme hatası verir — mevcut, doğrulanmış iki-proje+rewrite mimarisini bozmadan bu dalı `main`'e merge etmemenizi öneririm.** Branch adı (`codex/pr8-hardening`) ve commit mesajları, bunun bir AI kodlama ajanı tarafından, gerçek Vercel şemasına karşı doğrulanmadan üretilmiş olabileceğini düşündürüyor.
- Kayda değer yan bulgu: bu dalın `vercel.json`'ında `/links` ve `/kadelinks` için `kadirardademir.com/links`'e kalıcı (permanent) redirect **açıkça tanımlı**. Bu, canlı kod tabanındaki (`src/App.jsx`'teki `ExternalRedirect`) davranışla tutarlı — yani bu yönlendirmenin kazara değil, iki ayrı yerde bağımsız olarak tekrarlanan **kasıtlı bir ürün kararı** olduğuna dair ek kanıt. Yine de nihai onay sizin kararınız (bkz. `AUDIT_CHECKLIST.md`).
- `/kadeai/api/payments/admin/pricing` endpoint'i bu dalda da mevcut — ama bu, dala özgü bir ekleme değil, zaten `main`'de PR #6 ile önceden var olan `pricingConfig.ts`/route.ts dosyalarının aynısı (bkz. yukarıdaki bölümler).

## Bu oturumda yapılan değişiklikler

1. `tests/unit/security.test.js` — Shopier replay-koruması ve uzlaştırma testleri, Mongo yerine gerçek Supabase sorgu arayüzünü taklit edecek şekilde yeniden yazıldı (üretim kodu değişmedi).
2. `apps/kadeai/lib/payments/pricingConfig.ts`, `apps/kadeai/lib/supabase/admin.ts` — `origin/main`'in kendi test altyapısında var olan bir `server-only` modül çözümleme kusuru düzeltildi (detay: `TEST_REPORT_TR.md`).
3. `.gitignore` — sandbox'a özgü geçici dosya desenleri eklendi.

`vercel.json` (ne kökte ne `apps/kadeai`'de) **değiştirilmedi** — zaten doğru ve production'da doğrulanmış durumda; `kadirdemirs-patch-3`'teki geçersiz "services" şemasına geçirmek mevcut, çalışan yapılandırmayı bozardı.

Not: Bu oturumda ayrıca, `origin/main`'in 18 commit önde olduğu keşfedilmeden önce bağımsız bir admin-editable fiyatlandırma sistemi inşa edilmiş, sonra çakışma fark edilince tamamen geri alınmıştı — bkz. `DEPLOYMENT_CHECKLIST_TR.md`'deki "Bu oturumdaki gerçek katkı" bölümü.

## Bu oturumda doğrulanabilenler ve doğrulanamayanlar

| Kontrol | Sonuç |
|---|---|
| Kök `npm run legacy:build` | Başarılı |
| `apps/kadeai` `npm run typecheck` | Başarılı |
| `apps/kadeai` `npm run lint`, `test:unit` | Başarılı (0 hata, 22/22 test) |
| `apps/kadeai` `npm run build` | Bu sandbox'ta Google Fonts ağ erişimi olmadığı için başarısız — kod hatası değil, ortam kısıtı |
| `kadirdemirs-patch-3`/`PR #8` var mı | **Evet, doğrulandı** — bu sandbox'ın git önbelleğinde bulundu ve incelendi (yukarıya bakın) |
| Preview deployment / gerçek Vercel build testi | **Yapılamadı** — bu ortamda Vercel dashboard/CLI erişimi yok |
| Cookie/redirect path doğrulaması | Statik kod incelemesiyle doğru görünüyor (yukarıda ayrıntılı); canlı ortamda doğrulanmadı |
| Eski ayrı `kadeai` Vercel projesinin custom domain/webhook/cron bağımlılıkları | **İncelenemedi** — Vercel dashboard erişimi yok |

## Öneri

1. Mevcut iki-proje + rewrite mimarisini koruyun; bu zaten doğru ve önceden doğrulanmış.
2. **`kadirdemirs-patch-3`/`PR #8`'i `vercel.json` değişikliğiyle birlikte `main`'e merge ETMEYİN** — geçersiz `services` şeması mevcut çalışan yapılandırmayı bozar. Dilerseniz o daldaki `vercel.json` dışındaki hiçbir değişiklik zaten yok, yani pratikte bu PR'ın alınacak bir faydası kalmıyor; kapatılması önerilir.
3. `/links`/`/kadelinks` yönlendirmesinin kasıtlı olduğu artık iki bağımsız kaynaktan doğrulandı; yine de nihai onayı siz verin.
4. İsteğe bağlı, daha ileri seviye: Vercel'in resmi **Microfrontends** özelliğine geçiş değerlendirilebilir (birleşik gözlemlenebilirlik, routing yönetimi, Vercel Toolbar); bu da yine iki ayrı proje gerektirir, `services` gibi tek-proje modeli değildir.

## Ortam notu — sizin müdahalenizi gerektiren dosyalar

Bu oturumda `kademedia` klasöründeki şu dosyalar silinemedi (`Operation not permitted` — bu sandbox'ın bağlı klasör üzerinde silme izni yok, yalnızca üzerine yazma): `node_modules_corrupt_20260722/`, `_tmp_8_563226f5ca805587f44775d1d339371c`, `_tmp_8_636aaa54d53780e21bbda5aa571ade95`, `.git/index.lock`, `.git/HEAD.lock`, `.git/objects/*/tmp_obj_*`. Bunları kendi bilgisayarınızdan (Dosya Gezgini) silmeniz gerekiyor; aksi halde bir sonraki `git`/`pnpm` işlemi yine kilitlenebilir.
