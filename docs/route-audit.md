# Kade New Media rota ve SEO denetimi

Tarih: 28 Temmuz 2026
Kapsam: legacy Vite/React sitesi, production-benzeri yerel build ve `https://kadenewmedia.com`

## Sonuç

Yerel yayın adayı 38 rota giriş dosyası üretir; 20 indekslenebilir rota,
canonical/robots/sitemap değişmezleri ve bilinmeyen rota 404 davranışı otomatik
testten geçer. Yayın adayı Vercel production'a dağıtıldı ve
`https://kadenewmedia.com` alan adına bağlandı. Aşağıdaki canlı sonuçlar
deployment sonrasında yeniden ölçüldü.

## Routing ve build mimarisi

| İstek türü | Production davranışı | Kaynak |
|---|---|---|
| `/` | Build'de ön-render edilmiş React sayfası | `src/pages/Home.jsx`, `scripts/generate-static-routes.mjs` |
| Bilinen public/korumalı rota | Build sırasında üretilmiş `route/index.html` | `scripts/generate-static-routes.mjs` |
| Blog, partner, kısa link, profil ve hata dinamik rotaları | `app.html` React kabuğu | `vercel.json` rewrite listesi |
| `/sitemap.xml` | Serverless sitemap handler | `server/api/sitemap.js` |
| `/kadirdemir` | 308 → `/@kadirdemir` | `vercel.json` |
| `/links`, `/kadelinks/**` | 308 → `https://kadirardademir.com/links` | `vercel.json` |
| Diğer URL | HTTP 404, `public/404.html` | Blanket SPA rewrite yok |

`npm run legacy:build` önce snapshot font/ağ temizliğini çalıştırır, Vite
bundle'ını üretir, `index.html` dosyasını dinamik kabuk olarak `app.html`
adıyla saklar ve 38 rota için statik giriş üretir. Playwright artık Vite dev
server yerine `scripts/serve-dist.mjs` ile bu production davranışını test eder.

## İndekslenen 20 rota

Ana sayfa ile şu 19 rota sitemap'te ve `index, follow` durumundadır:

`/hakkimizda`, `/hizmetler`, `/new-media-ajansi`, `/paketler`, `/sss`,
`/ekip`, `/kariyer`, `/iletisim`, `/teklif-al`, `/kvkk`, `/gizlilik`,
`/cerez-politikasi`, `/telif-haklari` ve altı `/hizmetler/:slug` sayfası.

Herkese açık arşiv rotaları `/blog`, `/portfolio`, `/partnerler`,
`/referanslar`, `/basari-hikayeleri` indeks dışıdır fakat yerel yayın adayında
bağlantı taramasını korumak için `noindex, follow` kullanır.

`/admin`, müşteri panelleri, giriş ve Organizasyon Kiti rotaları `noindex`
olmakla birlikte `robots.txt` içindeki `Disallow` kurallarıyla da kapsanır.
`app.html` doğrudan taramaya kapalıdır. *(Eskiden aynı listede yer alan
`site.html` snapshot'ı 29 Tem 2026'da kaldırıldı.)*

## Canlı Playwright denetimi

Denetim 51 rotayı mobil 390×844, tablet 768×1024 ve masaüstü 1440×900
viewport'larında açtı: toplam 153 sayfa ölçümü. API yazma istekleri tarayıcıda
204 ile kesildi; production'a veri yazılmadı. 286 pageview/heartbeat/yazma
isteğinin engellendiği rapora kaydedildi.

| Ölçüm | Canlı sonuç |
|---|---:|
| Yatay taşma | 0 / 153 |
| Console/page error görülen sayfa | 15 / 153 |
| Network hata görülen sayfa | 6 / 153 |
| Kırık görsel görülen sayfa | 0 / 153 |
| Poppins dışı sayfa | 0 / 153 |
| `robots.txt`, `sitemap.xml` | HTTP 200 |
| Kalıcı redirect kontrolleri | 308, hedefler doğru |
| Bilinmeyen sabit rota | HTTP 404 |

Deployment sonrası bulgular:

- QWeather 403 isteği ve tarayıcıya gömülü anahtar kaldırıldı; audit sırasında
  üçüncü taraf hava durumu ağ hatası oluşmadı.
- Tüm 153 ölçümde hesaplanan font Poppins; eski font URL'leri 404, aktif
  self-hosted Poppins dosyaları 200 döndü.
- `/blog` ve diğer public arşivler hydration sonrasında da
  `noindex, follow` olarak kaldı.
- `/partnerler/flavora` dahil hiçbir ölçümde kırık görsel görülmedi.
- 15 console/page-error kaydı beklenen test kapsamından gelir: üç ana sayfa
  ölçümündeki vendored snapshot React hydration `#418` uyarısı, altı geçersiz
  profil/kısa-link 404 kaydı ve altı gerçek 404 rota kaydı. Hydration hatasının
  kaynak Next projesi bu repoda bulunmadığından minified snapshot'a müdahale
  edilmedi.

Tam ham çıktı: [live-route-audit.json](./live-route-audit.json)

## Yerel yayın adayı doğrulaması

- `node scripts/verify-seo-invariants.mjs`: başarılı.
- `node scripts/verify-poppins.mjs`: 20/20 rota Poppins, Türkçe glifler dahil.
- Bilinmeyen rota ve geçersiz sabit hizmet rotası: gerçek HTTP 404.
- Public noindex rotalar: hydration sonrasında da `noindex, follow`.
- Redirect hedef ve status'ları: otomatik E2E testinde başarılı.
- 390 px kritik rotalarda yatay taşma testi: başarılı.

## Kalan mimari sınırlama

`/blog/:slug`, `/partnerler/:id`, `/@:handle` ve `/s/:slug` statik hosting
rewrite'ı nedeniyle önce HTTP 200 `app.html` kabuğu alır. Kayıt bulunamadığında
React ekranda 404/noindex gösterebilir, fakat HTTP status sonradan 404'e
çevrilemez. Canlı denetimde geçersiz blog, partner ve profil örnekleri bu
nedenle HTTP 200 döndü; aynı sonuç üç viewport'ta geçersiz kısa-link
örneğinde de doğrulandı.

Gerçek HTTP 404 için dinamik veriyi isteğin sunucu tarafında çözen SSR,
middleware/edge function veya build sırasında bilinen slug'lar için ayrı statik
rota üretimi gerekir. Bu, mevcut Vite statik hosting mimarisini değiştiren bir
iş olduğundan bu turda varsayımla uygulanmadı. Kararlı bir geçerli kısa-link
fixture'ı paylaşılmadığı için gerçek redirect sonucu production'da
doğrulanmadı; admin CRUD/API yolu test kapsamındadır.
