# ROUTE_MATRIX.md — Kade New Media Rota Envanteri

Kaynak: `config/route-manifest.json` (schemaVersion 1, beklenen kayıt sayısı 169, gerçek kayıt sayısı 169) + doğrudan dosya sistemi taraması (`src/pages`, `apps/kadexai/app`, `api/`).

Bu dosya önceki bir oturumda üretilmiş mevcut route manifest üzerine kurulmuştur; sıfırdan yeniden icat edilmemiştir. Sayılar bu oturumda `node` ile doğrudan JSON üzerinden doğrulanmıştır (22 Temmuz 2026).

## Özet

- Toplam rota (manifestte): 169
- Uygulamaya göre: root 79, kadexai 90
- Erişime göre: public 60, private 109
- Türe göre: page 43, dynamic 4, protected 44, api 78
- Manifestte "implemented: false" (yani 404 bekleniyor / sayfa yok) olarak işaretli **6 rota** tespit edildi: `/fiyat-hesaplama`, `/basin`, `/neden-biz`, `/referans-programi`, `/podcast-webinar`, `/bulten-arsivi`, ayrıca `/blog/:slug` ve `/partnerler/:id` dinamik rotaları da "implemented: false".
- Ek olarak legacy Vercel fonksiyonları (manifest dışı, `api/` dizini): `api/[...path].js` (tek catch-all handler), `api/sitemap.js`

## root (legacy Vite/React sitesi, kadenewmedia.com) — 79 rota

| Rota | Tip | Erişim | Roller | Uygulanmış mı | Beklenen HTTP |
|---|---|---|---|---|---|
| / | page | public | anonymous | Evet | 200 |
| /hakkimizda | page | public | anonymous | Evet | 200 |
| /hizmetler | page | public | anonymous | Evet | 200 |
| /new-media-ajansi | page | public | anonymous | Evet | 200 |
| /iletisim | page | public | anonymous | Evet | 200 |
| /paketler | page | public | anonymous | Evet | 200 |
| /partnerler | page | public | anonymous | Evet | 200 |
| /kariyer | page | public | anonymous | Evet | 200 |
| /portfolio | page | public | anonymous | Evet | 200 |
| /ekip | page | public | anonymous | Evet | 200 |
| /basari-hikayeleri | page | public | anonymous | Evet | 200 |
| /kvkk | page | public | anonymous | Evet | 200 |
| /gizlilik | page | public | anonymous | Evet | 200 |
| /cerez-politikasi | page | public | anonymous | Evet | 200 |
| /admin | page | private | admin | Evet | 200 |
| /sss | page | public | anonymous | Evet | 200 |
| /referanslar | page | public | anonymous | Evet | 200 |
| /tesekkur | page | public | anonymous | Evet | 200 |
| /teklif-al | page | public | anonymous | Evet | 200 |
| /giris | page | public | anonymous | Evet | 200 |
| /giris/danismanlik | page | public | anonymous | Evet | 200 |
| /musteri-panel | page | private | customer | Evet | 200 |
| /fiyat-hesaplama | page | public | anonymous | **HAYIR** | 404 |
| /basin | page | public | anonymous | **HAYIR** | 404 |
| /neden-biz | page | public | anonymous | **HAYIR** | 404 |
| /referans-programi | page | public | anonymous | **HAYIR** | 404 |
| /podcast-webinar | page | public | anonymous | **HAYIR** | 404 |
| /bulten-arsivi | page | public | anonymous | **HAYIR** | 404 |
| /links | page | public | anonymous | Evet | 308 (dış yönlendirme) |
| /kadelinks | page | public | anonymous | Evet | 308 (dış yönlendirme) |
| /blog | dynamic | public | anonymous | Evet | 200 |
| /blog/:slug | dynamic | public | anonymous | **HAYIR** | 404 |
| /partnerler/:id | dynamic | public | anonymous | **HAYIR** | 404 |
| /teklif-al?paket=:paketId | dynamic | public | anonymous | Evet | 200 |
| /hizmetler/sosyal-medya-yonetimi | page | public | anonymous | Evet | 200 |
| /hizmetler/icerik-uretimi | page | public | anonymous | Evet | 200 |
| /hizmetler/reklam-yonetimi | page | public | anonymous | Evet | 200 |
| /hizmetler/video-produksiyon | page | public | anonymous | Evet | 200 |
| /hizmetler/strateji-danismanlik | page | public | anonymous | Evet | 200 |
| /hizmetler/web-sitesi-tasarimi | page | public | anonymous | Evet | 200 |
| /organizasyon-kiti | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/plan/fractional-new-media-director | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/medya-yol-haritasi | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/yonetim-toplantilari | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/ekip-surecler | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/stratejik-kararlar | protected | private | customer | Evet | 200 |
| /organizasyon-kiti/notlar | protected | private | customer | Evet | 200 |
| /kade-kit-business | protected | private | customer | Evet | 200 |
| /proje-takip | protected | private | customer | Evet | 200 |
| /api/auth | api | public | anonymous | Evet | 200 |
| /api/auth/login | api | public | anonymous | Evet | 200 |
| /api/auth/change-password | api | private | customer | Evet | 200 |
| /api/blog | api | public | anonymous | Evet | 200 |
| /api/calendar-invite | api | private | customer | Evet | 200 |
| /api/chat | api | private | customer | Evet | 200 |
| /api/client | api | private | customer | Evet | 200 |
| /api/contact | api | public | anonymous | Evet | 200 |
| /api/content | api | private | customer | Evet | 200 |
| /api/crm | api | private | customer | Evet | 200 |
| /api/customer-auth | api | public | anonymous | Evet | 200 |
| /api/customer-portal | api | private | customer | Evet | 200 |
| /api/customers | api | private | customer | Evet | 200 |
| /api/media | api | private | customer | Evet | 200 |
| /api/messages | api | private | customer | Evet | 200 |
| /api/newsletter | api | public | anonymous | Evet | 200 |
| /api/notifications | api | private | customer | Evet | 200 |
| /api/ops | api | private | customer | Evet | 200 |
| /api/partners | api | public | anonymous | Evet | 200 |
| /api/proposals | api | private | customer | Evet | 200 |
| /api/referrals | api | private | customer | Evet | 200 |
| /api/reminders | api | private | customer | Evet | 200 |
| /api/seed | api | public | anonymous | Evet | 200 |
| /api/shopier | api | public | anonymous | Evet | 200 |
| /api/sitemap | api | public | anonymous | Evet | 200 |
| /api/subscriptions | api | private | customer | Evet | 200 |
| /api/surveys | api | private | customer | Evet | 200 |
| /api/tasks | api | private | customer | Evet | 200 |
| /api/users | api | private | customer | Evet | 200 |
| /sitemap.xml | api | public | anonymous | Evet | 200 |

**Dikkat — `/api/seed`:** Manifestte "public / anonymous" olarak işaretli bir seed endpointi görünüyor. Bu isimlendirme tipik olarak veritabanı tohumlama/test amaçlı bir endpointi işaret eder ve production'da genel erişime açık olması güvenlik riskidir. Bu endpoint güvenlik denetimi aşamasında öncelikli olarak incelenecek (kod, `server.js` / `api/[...path].js` içinde aranacak).

## kadexai (apps/kadexai, /kadexai altında Next.js) — 90 rota

| Rota | Tip | Erişim | Roller | Uygulanmış mı | Beklenen HTTP |
|---|---|---|---|---|---|
| /kadexai | page | public | anonymous | Evet | 200 |
| /kadexai/auth | page | public | anonymous | Evet | 200 |
| /kadexai/auth/callback | page | public | anonymous | Evet | 307 |
| /kadexai/login | page | public | anonymous | Evet | 200 |
| /kadexai/logout | page | public | anonymous | Evet | 200 |
| /kadexai/onboarding | page | private | authenticated | Evet | 200 |
| /kadexai/reset-password | page | public | anonymous | Evet | 200 |
| /kadexai/dashboard | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/ab-test | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/ai-thumbnail | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/analytics | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/bio-link | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/bulk | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/calendar | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/carousel | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/clickbait-detector | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/clip-generator | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/collab-mail | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/comment-analysis | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/competitor | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/content-plan | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/description | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/dubbing | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/faq | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/hashtag | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/history | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/hook | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/ideas | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/operations | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/performance | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/quote-extractor | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/retention-analysis | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/settings | protected | private | **owner:thekademedia@gmail.com (hardcoded)** | Evet | 200 |
| /kadexai/dashboard/shopier | protected | private | configured-owner | Evet | 200 |
| /kadexai/dashboard/social-audit | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/templates | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/text-generator | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/thread | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/title | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/trends | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/viral-score | protected | private | authenticated | Evet | 200 |
| /kadexai/dashboard/youtube-seo | protected | private | authenticated | Evet | 200 |
| /kadexai/api/assistant | api | private | authenticated | Evet | 200 |
| /kadexai/api/auth/logout | api | private | authenticated | Evet | 200 |
| /kadexai/api/auth/password | api | public | anonymous | Evet | 200 |
| /kadexai/api/auth/recovery | api | public | anonymous | Evet | 200 |
| /kadexai/api/auth/recovery-session | api | public | anonymous | Evet | 200 |
| /kadexai/api/auth/update-password | api | private | authenticated | Evet | 200 |
| /kadexai/api/backend/health | api | private | authenticated | Evet | 200 |
| /kadexai/api/calendar | api | private | authenticated | Evet | 200 |
| /kadexai/api/config | api | private | authenticated | Evet | 200 |
| /kadexai/api/env-status | api | private | **owner:thekademedia@gmail.com (hardcoded)** | Evet | 200 |
| /kadexai/api/health | api | public | anonymous | Evet | 200 |
| /kadexai/api/history | api | private | authenticated | Evet | 200 |
| /kadexai/api/image | api | private | authenticated | Evet | 200 |
| /kadexai/api/operations-state | api | private | authenticated | Evet | 200 |
| /kadexai/api/packages | api | private | authenticated (kodda `dynamic=force-dynamic`, salt-okunur GET) | Evet | 200 |
| /kadexai/api/payments/checkout | api | private | authenticated | Evet | 200 |
| /kadexai/api/payments/status | api | private | authenticated | Evet | 200 |
| /kadexai/api/payments/webhook | api | public | anonymous (imzalı webhook) | Evet | 200 |
| /kadexai/api/profile | api | private | authenticated | Evet | 200 |
| /kadexai/api/templates | api | private | authenticated | Evet | 200 |
| /kadexai/api/transcribe | api | private | authenticated | Evet | 200 |
| /kadexai/api/youtube/comments | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/analytics | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/bio-link | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/bulk | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/carousel | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/clickbait-detector | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/clips | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/collab-mail | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/comment-analysis | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/competitor | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/content-plan | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/description | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/faq | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/hashtag | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/hook | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/ideas | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/performance | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/quote-extractor | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/retention-analysis | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/social-audit | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/text-generator | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/thread | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/title | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/translate | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/trends | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/tts | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/viral-score | api | private | authenticated | Evet | 200 |
| /kadexai/api/generate/youtube-seo | api | private | authenticated | Evet | 200 |

## Kullanıcı talimatındaki "Vercel birleştirme" anlatısıyla kod arasındaki fark — GÜNCEL DURUM

Kullanıcı talimatı; kök `vercel.json` içinde "Vercel Services" mimarisi (`legacy` + `kadexai` servisleri), `kadirdemirs-patch-3` branch'i, `PR #8`, ve `/kadexai/api/payments/admin/pricing` endpointinin var olduğunu ve kısmen tamamlandığını varsayıyordu. Bu oturumda önce yüzeysel bir `git branch -a` taraması bu branch'i bulamamıştı; daha kapsamlı bir tarama (`git branch -a -v`, uzak dallar dahil) ve bir üst-oturum-önbelleğinden (`origin/pr/8`) sonucu **branch bulundu ve incelendi**:

- `main`'deki `vercel.json` içinde `"services"` anahtarı **yok** — mevcut, production'da çalışan yapı `/kadexai` isteklerini ayrı bir Vercel projesine (`https://kadexai.vercel.app`) `rewrite` eden klasik iki-proje yapılandırması.
- **`kadirdemirs-patch-3`/`PR #8` gerçekten mevcut** (`remotes/origin/kadirdemirs-patch-3` = `remotes/origin/pr/8`, aynı commit `b538cbe`). İçeriği: `main`'e göre TEK farkı kök `vercel.json`'ı `"services":{"legacy":{...},"kadexai":{...}}` yapısına çeviriyor. **Bu şema Vercel'in resmî dokümantasyonunda (`https://vercel.com/docs/project-configuration`, son güncelleme 2026-06-16) doğrulanmış tam alan listesinde yok** — geçersiz bir yapılandırma. Detaylı analiz ve öneri: `VERCEL_SERVICES_MIGRATION_REPORT_TR.md`.
- `apps/kadexai/app/api/payments/admin/pricing` **artık kodda mevcut** — ama bu, `kadirdemirs-patch-3`'e özgü bir ekleme değil; `main`'de zaten önceden merge edilmiş PR #6'nın parçası (`pricingConfig.ts` + dedike `kadexai_pricing_overrides` tablosu). `kadirdemirs-patch-3` bu dosyaları `main`'den miras alıyor, kendi başına eklemiyor.

Sonuç: kullanıcı talimatındaki anlatı GitHub'da gerçek bir dala dayanıyordu, ama o daldaki asıl değişiklik (vercel.json'ın "services" şemasına çevrilmesi) teknik olarak geçersiz ve merge edilmemeli.
