# DEPLOYMENT_CHECKLIST_TR.md

Tarih: 22 Temmuz 2026

## Ortam ve mimari

- [x] Framework/runtime tespit edildi: kök = Vite 8 + React 19 (legacy), `apps/kadeai` = Next.js 16 App Router, `apps/studio-web`/`studio-worker` = ayrı Kade Studio (kapsam dışı ama not edildi).
- [x] Vercel mimarisi doğrulandı: **tek "services" projesi değil**, iki ayrı Vercel projesi (`kademedia` ana domain + `kade-social-media-ai`/`kadeai.vercel.app`) + rewrite. Bkz. `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`.
- [x] `.env.example` (kök) incelendi — gerçek secret yok, tüm değerler placeholder.
- [ ] `apps/kadeai/.env.example` bu oturumda satır satır incelenmedi (yalnızca `GEMINI_API_KEY` referansı doğrulandı) — sonraki oturumda tamamlanmalı.

## Build / lint / test

- [x] `npm run legacy:lint` — 0 hata
- [x] `npm run legacy:test:unit` — 15/15
- [x] `npm run legacy:build` — başarılı
- [x] `apps/kadeai`: `npm run lint` — 0 hata
- [x] `apps/kadeai`: `npm run typecheck` — 0 hata (bu oturumda düzeltildi)
- [x] `apps/kadeai`: `npm run test:unit` — 22/22
- [ ] `apps/kadeai`: `npm run build` — bu sandbox'ta Google Fonts ağ kısıtı nedeniyle doğrulanamadı; **gerçek Vercel build ortamında ayrıca doğrulanmalı**
- [ ] E2E (Playwright), FastAPI backend testleri, Kade Studio testleri — bu oturumda çalıştırılmadı

## Güvenlik

- [x] Admin/customer authentication server-side doğrulanıyor (bkz. `SECURITY_REPORT_TR.md`)
- [x] CSRF, CORS, rate-limit merkezi olarak uygulanıyor
- [x] `/api/seed` production'da varsayılan kapalı, admin sonrası korumalı
- [x] Client bundle'da secret bulunmadı (kod taramasıyla — `apps/kadeai` kendi `test:bundle-secrets` script'i bu oturumda ayrıca çalıştırılmadı, önerilir)
- [ ] Canlı Supabase RLS matris testi — yapılmadı (erişim yok)
- [ ] Canlı Upstash rate-limit eşzamanlılık testi — yapılmadı (erişim yok)
- [ ] Admin 2FA — yok, ayrı karar gerektiriyor

## Paket/fiyatlandırma

- [ ] **YENİ, ÖNCELİKLİ BULGU — legacy `/paketler` admin editörü canlı sayfadan kopuk (dead CMS):** `Admin.jsx`'teki "💰 Paketler" sekmesi (`PackagesEditor`) verileri `content.packages` anahtarı altında kaydediyor ve ad TR/EN, açıklama TR/EN, **fiyat TRY/USD**, özellikler, öne çıkarma alanlarını sunuyor — ama gerçek canlı `/paketler` sayfası (`src/pages/Packages.jsx`) bu veriyi **hiç okumuyor.** Sayfa, `src/data/packages.js`'teki statik `PACKAGE_SCOPES` sabitini kullanıyor; bu dosyanın kod içi yorumu açıkça şunu belirtiyor: *"Single source of truth for the /paketler page content — used by the live page and scripts/generate-static-routes.mjs for the static prerender."* Canlı sayfa **kasıtlı olarak hiçbir fiyat göstermiyor** — yalnızca kapsam/özellik listesi ve "Teklif al" CTA'sı var; SSS bölümünde de "Fiyatlar neden listelenmiyor?" sorusuna "Hizmet bedeli kanal, üretim adedi, reklam operasyonu ve teslim kapsamına göre değişir. KDV ve ek maliyetler yazılı teklifte ayrıca belirtilir." cevabı veriliyor. Yani mevcut ürün kararı **kasıtlı olarak quote-only (fiyatsız) bir tasarım** — bu, kullanıcı talimatındaki "uydurma/doğrulanamayan fiyat yayınlama" riskinden tamamen kaçınan, savunulabilir bir yaklaşım. Admin panelindeki "Paketler" sekmesi ise bu tasarımdan habersiz, muhtemelen daha eski bir tasarımdan kalma **ölü/yanıltıcı bir form** — admin buraya fiyat girse bile hiçbir yere yansımıyor. **Bu, blockir bir değil ama admin'i yanıltan gerçek bir bug'dır.** Bu oturumda bilinçli olarak DEĞİŞTİRİLMEDİ çünkü iki olası düzeltme yönü var ve hangisinin doğru olduğu bir ürün/hukuki karardır: (a) ölü formu kaldırıp yalnızca kapsam/özellik alanlarını (fiyatsız) canlı `PACKAGE_SCOPES`'a bağlamak, ya da (b) kasıtlı fiyatsız tasarımdan vazgeçip gerçek, canlı-düzenlenebilir fiyat gösterimine dönmek. İkinci seçenek mevcut hukuki/ticari korumayı (KDV/ek maliyet belirsizliğinden kaçınma) ortadan kaldırır — bu yüzden sizin onayınız olmadan seçilmedi.
- [ ] Kullanıcı talimatındaki genişletilmiş alanlar (aktif/pasif, sıralama, KDV dahil/hariç, aylık/tek seferlik/özel teklif tipi, dahil platformlar, revizyon sayısı, sözleşme süresi vb.) yukarıdaki bulgu netleşmeden anlamsız — önce (a)/(b) kararı verilmeli.
- [x] `apps/kadeai` fiyatlandırması admin panelinden düzenlenebiliyor: `GET/PUT /kadeai/api/payments/admin/pricing` (`KADEAI_ADMIN_API_SECRET` header ile sunucu-sunucu yetkilendirme), dedike `kadeai_pricing_overrides` tablosu (RLS zorunlu, `anon`/`authenticated`'dan tüm erişim `REVOKE` edilmiş), bellek-içi TTL cache (`pricingConfig.ts`). Bu sistem `origin/main`'de zaten mevcuttu (PR #6, bu oturumdan önce merge edilmiş) — bu oturumda bağımsız olarak paralel bir sürüm inşa edilmiş, ardından `git diff --stat origin/main main` ile çakışma fark edilince kendi versiyonum tamamen bırakılıp origin'in versiyonu benimsendi. Detay için "Bu oturumdaki gerçek katkı" bölümüne bakın.
- [x] Onaylı fiyat verisi mevcut (kod içinde: 499/999/1999 TL taban fiyatlar, KadeAI; legacy'de admin panelinden girilen fiyatlar) ama **bu fiyatların ticari olarak son onaylı olup olmadığı bu oturumda doğrulanamadı** — kullanıcı teyidi gerekiyor.

## Lead/teklif ve /links

- [x] Lead/teklif formu (`/teklif-al`, `server/api/*`) ve admin lead listesi (`QuoteLeadsSection`) mevcut.
- [x] `/@handle` altında gerçek, admin-yönetilebilir link-in-bio sistemi var (`LinkProfilesSection`, drag-drop/aktif-pasif/ikon desteği görüldü).
- [ ] `/links` ve `/kadelinks` hâlâ Kadir Demir'in kişisel sitesine (`kadirardademir.com/links`) yönlendiriyor — bunun kasıtlı mı yoksa değiştirilmesi mi gerektiği **kullanıcı onayı gerektiriyor**, bu oturumda değiştirilmedi.

## AI entegrasyonu

- [x] Gemini API key yalnızca sunucuda, iki ayrı entegrasyon (legacy `chat.js`, KadeAI `provider.ts`) incelendi, ikisi de güvenli.
- [ ] `@google/generative-ai` → `@google/genai` göçü yapılmadı (öneri olarak not edildi).
- [ ] Yapısal (Zod) lead-sınıflandırma/paket-önerisi özelliği yok.

## SEO/erişilebilirlik/performans

- [ ] Bu oturumda ayrı bir SEO/GEO/AI-görünürlük çalışması **yapılmadı** — bu, kullanıcı talimatının kendisinde ayrı ve çok büyük bir alt görev olarak tanımlanmış (17 ek belge, 150+ canlı AI sorgusu, rakip analizi). Bu oturumda gerekli araçlara (ChatGPT/Gemini/Grok/Perplexity hesapları, Google Search Console/Business Profile erişimi) erişim yok. Ayrı bir oturum/ekip gerektirir.

## Bu oturumdaki gerçek katkı (origin/main uzlaştırması sonrası)

Bu oturumda yerel `main`'in `origin/main`'in **18 commit gerisinde** olduğu tespit edildi. `origin/main` zaten merge edilmiş PR'lar üzerinden admin-editable fiyatlandırma (PR #6), custom-offer sistemi (PR #3), SEO person-schema (PR #4), Telif Hakları yasal sayfası (PR #5) ve TopBar başlık düzeltmesini (PR #7) içeriyordu. Bunlardan habersiz paralel bir fiyatlandırma sistemi inşa edilmişti; çakışma fark edilince o iş tamamen bırakıldı ve yerel ağaç `origin/main` ile uzlaştırıldı. Bu oturumun **gerçek, tekilleşmemiş** katkısı şudur:

1. `tests/unit/security.test.js`: İki Shopier testi (`reserveShopierOrder`, `reconcileShopierOrders`), MongoDB'den Supabase'e geçişten kalan eski/bozuk mock'larla yazılmıştı — Supabase/PostgREST arayüzünü doğru taklit eden mock'larla yeniden yazıldı.
2. `apps/kadeai/lib/payments/pricingConfig.ts` ve `apps/kadeai/lib/supabase/admin.ts`: `origin/main`'in kendi test altyapısında önceden var olan bir kusur düzeltildi — `import 'server-only'` satırı, `tsx --test` altında `Cannot find module 'server-only'` hatasıyla `kade-commerce.test.ts`/`providers.test.ts`'in tamamen yüklenmesini engelliyordu. Satır kaldırıldı (her iki dosyanın da hiçbir istemci bileşeninden import edilmediği doğrulandı), `apps/kadeai npm run test:unit` 22/22 geçer hale geldi.
3. `.gitignore`: `node_modules_*` ve `_tmp_*` desenleri eklendi (bu sandbox'ın FUSE bağlı klasöründe kalan bozuk geçici dosyaları işaret etmek için).
4. 8 Türkçe denetim belgesi (bu dosya dahil) + `ROUTE_MATRIX.md` + `AUDIT_CHECKLIST.md`.

## Git / sürüm kontrolü

- [x] Yukarıdaki değişiklikler `origin/main`'in tepesi (`6fef74f`, PR #7 merge commit'i) üzerine yerel olarak commit edildi.
- [ ] **Bu sandbox'ta GitHub kimlik bilgisi yok** — commit'ler yalnızca yerelde, gerçek `.git` deponuza senkronize edildi. GitHub'a push işlemini siz kendi makinenizden yapmalısınız (`git push origin main` veya uygun branch).
- [x] `kadirdemirs-patch-3` branch'i ve `PR #8` bu oturumda bulundu ve incelendi (`remotes/origin/pr/8` = `remotes/origin/kadirdemirs-patch-3`, commit `b538cbe`) — içeriği geçersiz bir `vercel.json` "services" şeması, merge edilmemesi öneriliyor (bkz. `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`).

## Rollback

- Bu oturumda hiçbir veritabanı migration'ı çalıştırılmadı veya değiştirilmedi — rollback gerektiren bir değişiklik yok.
- Kod değişiklikleri commit halinde; `git revert <commit-sha>` ile geri alınabilir.

## Ortamınızda elle yapmanız gerekenler

1. `kademedia` klasöründeki `node_modules_corrupt_20260722` dizinini, `_tmp_8_...` ile başlayan 2 dosyayı, `.git/index.lock`, `.git/HEAD.lock` ve `.git/objects/*/tmp_obj_*` dosyalarını Dosya Gezgini'nden silin (bu sandbox'ta FUSE kısıtı nedeniyle silinemedi).
2. `PR #8`/`kadirdemirs-patch-3`'ü, `vercel.json`'daki geçersiz "services" şeması nedeniyle merge etmeden kapatmayı değerlendirin (bkz. `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`).
3. Yerel commit'leri `git log`/`git diff origin/main` ile inceleyip GitHub'a push edin (bu sandbox'tan push edilemedi — kimlik bilgisi yok).
