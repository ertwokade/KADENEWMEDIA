# KadexAI Master Audit ve Implementasyon Raporu

Tarih: 26 Ağustos 2026
Durum: Kod tamamlandı; production migration ve canlı oturum doğrulaması bekliyor.
Hukuki metinler: **LEGAL REVIEW REQUIRED**

## Yönetici özeti

KadexAI; Next.js 16 App Router, Supabase Auth/Postgres/RLS, çoklu AI sağlayıcı
katmanı, merkezi model router, Shopier imzalı checkout, Vercel dağıtımı,
PostHog consent gate, Sentry ve Upstash tabanlı kota katmanına sahip çalışan bir
üründür. Master görev öncesinde en ciddi ürün boşlukları şunlardı:

1. custom tekliflerin varsayılan ömrü 15 dakika yerine 24 saatti;
2. süresi geçmiş bir order için geç gelen webhook entitlement açabiliyordu;
3. “API hariç / Kendi Anahtarın” paketi satılıyor fakat web BYOK yönetimi yoktu;
4. owner Satış Merkezi gerçek payment ledger yerine localStorage prototipiydi;
5. sosyal medya analizi veri olmayan yerde tahmin üretmeyi açıkça yasaklamıyordu;
6. kamuya açık, indekslenebilir ve abuse-safe bir KadexAI demo/entity sayfası yoktu;
7. feature rollout ve hassas işlem audit trail için merkezi DB kontrolü yoktu.

Bu turda bu yedi boşluğun kod karşılığı tamamlandı. Database migration henüz
production'a uygulanmadığı için BYOK, `expired` statüsü, feature flags ve yeni
audit tablosu canlıda etkinleştirilmedi.

## Mimari envanter

- Frontend: React 19, Next.js 16.3 App Router, TypeScript, Tailwind tabanlı Kade tasarım sistemi.
- Backend: Next Route Handlers ve ayrı FastAPI video/media backend'i.
- Auth: Supabase Auth; proxy kontrolüne ek handler seviyesinde fail-closed auth.
- Veri: Supabase Postgres; user-owned tablolar için RLS, ödeme tablolarında istemci mutation grant'i yok.
- Ödeme: Shopier V2 imzalı form/callback; server-side catalog, idempotent payment event ve entitlement grant.
- AI: OpenAI, Anthropic, Gemini, Groq, Mistral, Cerebras, OpenRouter ve Vercel AI Gateway adaptörleri.
- Router: görev sınıflandırması, kullanılabilir sağlayıcı filtresi ve sıralı fallback.
- Kota: Upstash dağıtık limit; production backend yoksa kapalı düşme, Supabase history sayacı fallback'i.
- Gözlemleme: Sentry error capture ve opt-in PostHog analytics.
- Araçlar: merkezi `TOOL_REGISTRY`, profil gereksinimleri, owner/settings permissions ve history işareti.

## Yapılan

### Security ve ödeme

- Custom offer ömrü sunucuda en fazla 15 dakika ile sınırlandı; istemci daha uzun süre gönderemez.
- `payment_orders.status` için `expired` yaşam döngüsü eklendi.
- Redirect ve webhook expiry kontrolü `grantEntitlementForOrder` çağrısından önce çalışıyor.
- Webhook, kayıtlı order/provider/product/tutar/currency doğrulaması olmadan entitlement açmıyor.
- Tekrarlanmış veya sonuçlanmış order idempotent yanıt alıyor.
- Pending expiry index'i eklendi.

### BYOK

- OpenAI, Anthropic ve Gemini anahtarları için server-only key store eklendi.
- AES-256-GCM encryption-at-rest mevcut `KADE_TOKEN_ENCRYPTION_KEY` mekanizmasını kullanıyor.
- Şifreli blob için anon/authenticated tüm doğrudan tablo yetkileri kaldırıldı.
- API yalnız provider, maskeli ipucu ve tarih döndürüyor; ciphertext/plaintext dönmüyor.
- Save/replace/delete akışları, rate limit, auth, entitlement kontrolü ve audit event eklendi.
- `api_included=false` entitlement aktif olduğunda provider katmanı yalnız kullanıcının BYOK anahtarını kullanıyor; KadexAI anahtarına sessiz fallback yapmıyor.
- `/kadexai/dashboard/api-keys` responsive yönetim ekranı ve sidebar girişi eklendi.

### Commerce ve owner dashboard

- localStorage prototipi kaldırıldı; Satış Merkezi gerçek payment ledger ve entitlement verisini okuyor.
- Kullanıcı, aktif özel teklifini Paketler sayfasında “Size Özel Teklif” olarak görüyor.
- Owner kayıtlı kullanıcı için 15 dakikalık özel Shopier order oluşturabiliyor.
- Kullanıcı, aktif abonelik, MRR, ARR, 7/30 günlük satış, pending/failed/expired metrikleri eklendi.
- Custom offer ve pricing değişiklikleri yeni platform audit trail'e yazılıyor.

### Social Media Analyst

- Verilmeyen metrik, oran, rakip sonucu ve trendin uydurulması prompt seviyesinde yasaklandı.
- Eksik kanıtlar API response ve UI uyarısında açıkça gösteriliyor.
- Followers/growth/impressions/reach/engagement/click/save/comment/share, format,
  best/worst post, timing, theme, hashtag, caption, competitor, trend ve anomaly
  alanları yalnız mevcut veriye göre değerlendiriliyor.
- Çıktı performans özeti, sorun/fırsat, strateji, caption, test zamanı ve 30 günlük takvim içeriyor.

### Feature controls ve audit

- Admin-only, beta-only, selected user, tier ve deterministic percentage rollout alanlarını destekleyen `feature_flags` tablosu eklendi.
- Merkezi `isFeatureEnabled()` resolver eklendi.
- Hassas işlemler için service-role-only `platform_audit_events` tablosu ve server helper eklendi.
- Sır/token/API key audit metadata veya analytics properties içine yazılmıyor.

### Demo, SEO ve GEO

- `/kadexai-demo` kamuya açık, SSR/SSG, indekslenebilir ürün demo sayfası eklendi.
- Demo gerçek API çağırmıyor, sosyal hesap bağlamıyor, veri uydurmuyor ve tarayıcı başına günlük 3 örnekle sınırlı.
- SoftwareApplication, Offer ve FAQPage JSON-LD eklendi.
- Canonical, title, description ve OpenGraph eklendi.
- `robots.txt`, `sitemap.xml` ve `llms.txt` KadexAI public entity tanımıyla güncellendi.
- Private dashboard/API/onboarding rotaları crawler'lardan ayrıca kapatıldı.

### Privacy analytics

Event sözlüğüne signup, demo_started, package_viewed, checkout_started,
checkout_completed, quote_requested, custom_offer_viewed,
subscription_activated, tool_used, churn, upgrade ve downgrade eklendi.
Autocapture/session recording kapalı; analytics yalnız açık kullanıcı rızasıyla çalışıyor.

## Test sonuçları

- TypeScript: geçti.
- ESLint: hata yok; görev öncesinden kalan tek kullanılmayan import uyarısı var.
- Unit: 76/76 geçti.
- Route manifest: 212/212 uygulandı; eksik, duplicate, stale veya envanter dışı rota yok.
- SEO invariants: 27 indekslenebilir sayfa, noindex/robots, sitemap ve rewrite kontrollerinin tamamı geçti.
- Security regression: custom offer TTL/expiry ordering ve BYOK ciphertext exposure testleri geçti.
- Next production build: geçti; `/kadexai-demo`, `/kadexai/dashboard/api-keys`,
  `/kadexai/api/provider-keys`, owner/offers API rotaları build manifestinde.

## Database migration

Hazır migration'lar:

1. `202608260003_expired_payment_orders.sql`
2. `202608260004_user_provider_keys.sql`
3. `202608260005_platform_controls.sql`

Production uygulaması bu turda tamamlanamadı: yerel Supabase CLI proje linki ve
access token yok; Chrome browser extension bağlantısı da kullanılamadı. Vercel
secret'larını topluca yerel dosyaya çekmek güvenlik denetimi tarafından
engellendi ve bu kontrol aşılmadı. Migration uygulanana kadar yeni BYOK API
fail-closed kalır; expired webhook entitlement açmaz.

## Legal değerlendirme

Mevcut public sayfalar: Gizlilik, KVKK, Çerez Politikası ve Telif Hakları.
KadexAI ödeme/abonelik ürünü için ayrıca Kullanım Koşulları, Üyelik Sözleşmesi,
Mesafeli Satış, Ön Bilgilendirme, İade/İptal, Dijital Hizmet Şartları, Ticari
Elektronik İleti, API Kullanım, AI Kullanım ve Fikri Mülkiyet politikalarının
Türkiye'de yetkili hukuk danışmanı tarafından hazırlanması/doğrulanması gerekir.

**LEGAL REVIEW REQUIRED:** Otomatik yenileme, cayma hakkı, anında ifa edilen
dijital hizmet onayı, KVKK veri işleyen rolleri, üçüncü taraf AI sağlayıcılarına
veri aktarımı ve BYOK sorumluluk sınırları yayımdan önce incelenmelidir.

## Rekt.work kamuya açık analiz

Kaynak: [Rekt Agency public site](https://rekt.work/), 26 Ağustos 2026.

Kamuya açık site; influencer discovery/matching, brief ve onay koordinasyonu,
platform-native üretim, campaign analytics, real-time dashboard, sentiment/UGC
ölçümü ve ambassador süreçlerini anlatıyor. Bunlar doğrulanmış public pazarlama
iddialarıdır; arka uç uygulama biçimi ve model kalitesi doğrulanmış değildir.

KadexAI için öneri:

- Creator/brand matching: fayda yüksek, veri ve ayrımcılık riski orta, zorluk yüksek.
- Brief → approval → production pipeline: mevcut Operations/KadeSearch yapısıyla uyumlu, zorluk orta.
- Campaign measurement dashboard: Social Analyst için doğal genişleme, zorluk orta.
- Influencer network marketplace: operasyonel ve hukuki kapsamı büyük, zorluk/maliyet yüksek.

**REQUIRES OWNER APPROVAL:** Rakipten esinlenmiş creator marketplace veya
matching ürünü otomatik uygulanmadı. Önce lisanslı veri kaynağı, rıza/iletişim
kuralları, scoring açıklanabilirliği ve bütçe onayı gerekir.

## “Kendi modelimiz” fizibilitesi

Resmi kaynaklar:

- [Meta Llama getting started](https://ai.meta.com/llama/get-started/)
- [NVIDIA NIM prerequisites and sizing](https://docs.nvidia.com/nim/large-language-models/1.11.0/getting-started.html)
- [OpenAI API platform](https://openai.com/api/)
- [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

NVIDIA'nın resmi boyutlandırma örnekleri 8B sınıfı için yaklaşık 15 GB, 70B
sınıfı için yaklaşık 131 GB model belleği gösteriyor; işletim sistemi,
container, KV cache ve concurrency ayrıca kapasite ister. Bu nedenle mevcut
KadexAI hacminde self-hosted foundation model, operasyon ve GPU maliyetini
artırırken ürün kalitesini otomatik yükseltmez.

Önerilen sıra:

1. Mevcut çoklu API modelleri + KadexAI router/orchestration (şu anki mimari).
2. RAG + memory + tool permission + eval seti.
3. Yeterli etiketli veri oluşursa dar görev fine-tune/adapter deneyi.
4. Ancak ölçülmüş maliyet/latency/privacy ihtiyacı kanıtlarsa open-weight self-host pilotu.

**REQUIRES OWNER APPROVAL:** Foundation model eğitimi, open-weight self-host,
GPU cluster, NIM/enterprise lisansı, yüksek maliyetli fine-tuning veya büyük
mimari değişiklik uygulanmadı.

## Kalan ürün boşlukları

- Paket isimleri/özellikleri hâlâ tam CRUD DB-driven değil; fiyat override DB-driven.
- Usage ledger token maliyetini tüm sağlayıcılarda ortak para birimine dönüştürmüyor.
- Tool-to-tool orchestration için registry var fakat kullanıcıya açık DAG/workflow builder yok.
- Public legal sayfa seti ödeme ürünü için eksik ve hukuki inceleme bekliyor.
- Programmatic SEO için thin-content üretmeden tool/use-case içerik editoryal planı gerekiyor.
- MRR/ARR ürün bazında yaklaşık normalize ediliyor; refund/churn muhasebe doğrulaması ayrıca gerekli.
- Demo limiti tarayıcı tarafında; ücretli model çağırmadığı için maliyet abuse riski yok. Gelecekte gerçek AI demo açılırsa server-side distributed quota şart.

## Owner approval gereken konular

1. Creator marketplace / AI influencer matching.
2. Competitor Watch için dış veri sağlayıcısı ve bütçe.
3. Foundation model, self-hosted open-weight model veya GPU altyapısı.
4. Yüksek maliyetli yeni SaaS/provider entegrasyonları.
5. Shopier'in değiştirilmesi veya ikinci ödeme sağlayıcısı.
6. Büyük paket kataloğu/abonelik mimarisi migrasyonu.
7. Hukuki metinlerin production yayını.

---

# İkinci tur — kalan boşlukların kapatılması (26 Ağustos 2026)

Yukarıdaki "Kalan ürün boşlukları" listesinin kod karşılığı bu turda tamamlandı.

## §32 Kullanım ve maliyet takibi

**Bulunan problem:** Token kullanımı `/api/history` gövdesiyle TARAYICIDAN
bildiriliyordu. Kullanıcı `tokens_used` alanını istediği değerle gönderebilir,
hiç göndermemeyi de seçebilirdi. Kota ve brüt marj hesabı bu yüzden
güvenilir değildi.

**Çözüm:** Kayıt `generateContent()` içine, yani tüm AI çağrılarının tek geçtiği
noktaya alındı. Sağlayıcı yanıtındaki gerçek token sayımından üretiliyor ve
service-role ile `ai_usage_events` tablosuna yazılıyor. Yeni bir generate rotası
eklendiğinde muhasebe kendiliğinden geliyor.

- Tüm sağlayıcılarda input/output token ayrımı yakalandı (Gemini daha önce hiç
  token bildirmiyordu).
- `lib/ai/pricing.ts`: model başına USD tarife; **bilinmeyen model için maliyet
  `null`**, sıfır değil — aksi halde brüt marj olduğundan iyi görünürdü.
  `AI_MODEL_RATES_JSON` ile deploy'suz güncellenebilir.
- BYOK çağrısı KadexAI maliyetine yazılmaz, kullanıcının kotasını da yemez.
- Kota toplaması Postgres fonksiyonuna alındı (`ai_usage_summary`); kontrol her
  AI çağrısından önce çalıştığı için satır çekip uygulamada toplamak sıcak yolu
  yavaşlatıyordu.
- Kota **zorlaması varsayılan olarak kapalı** (`KADEXAI_ENFORCE_TOKEN_QUOTA=1`
  ile açılır): mevcut ücretsiz kullanıcıları bir anda kesmemek için bilinçli
  karar. Ölçüm ve gösterim zorlamadan bağımsız çalışıyor.
- `/kadexai/dashboard/admin` → toplam maliyet, model/paket/kullanıcı kırılımı,
  gelir ve brüt marj. **Marj yalnızca `KADE_USD_TRY_RATE` tanımlıysa** hesaplanır;
  kur uydurulmaz, tanımsızsa gerekçesiyle "hesaplanamadı" gösterilir.

## §33 Entitlement motoru

`canUse(feature)` / `getLimit(key)` merkezi katmanı eklendi (`lib/entitlement.ts`).
Saf kurallar `lib/payments/planRules.ts` içinde — `server-only` bağımlılığı
olmadığı için test edilebiliyor. `api` özelliği features dizisinden değil
`api_included` alanından okunuyor (BYOK paketlerinde kritik).

## §15–16 Teklif akışı

`kadexai_quote_requests` + 8 durumlu pipeline (Yeni → … → Tamamlandı).
Kullanıcı `/kadexai/dashboard/quote`'tan talep gönderiyor; sahip
`/kadexai/dashboard/admin` → Teklif Talepleri'nden durumu yürütüyor ve
"Ödeme Oluştur" ile 15 dakikalık özel Shopier siparişi üretiyor.
`status` ve `payment_order_id` istemciden ASLA alınmıyor; yazma tamamen
service-role.

## §25 Admin CMS

`kadexai_content_blocks` + `lib/cms/defaults.ts`. Frontend koddaki varsayılanları
taban alır, DB override'ı üzerine biner — **tablo boşken veya erişilemezken
sayfa yine eksiksiz render olur**. Şemayı kod belirler: bilinmeyen alanlar
yazılmaz, tip uyuşmazlığı varsayılanı bozmaz. `/kadexai-demo` ISR (5 dk) ile
yayında; kaydetme `revalidatePath` çağırıyor.

## §13 Paket adı ve özellik CRUD

`kadexai_pricing_overrides`'a `tier_labels` ve `tier_features` eklendi. Fiyatla
aynı senkron cache deseni korundu — checkout/webhook asenkron olmadı.
**Boş özellik listesi reddediliyor:** yanlışlıkla temizlenen bir paket, satın
alan kullanıcıyı yetkisiz bırakırdı.

## §8 Tool-to-tool orchestration

Least-privilege çekirdek: pipeline'lar **sunucuda sabit**, istemci yalnız
pipeline kimliği seçiyor. Bir adım yalnızca kendisinden hemen sonraki adımı
tetikleyebiliyor (atlama, geri dönüş, kendini çağırma yasak). Her adımda
yetki → doğrulama → kota → timeout → çalıştırma → loglama → audit.
Bir adım düşerse zincir DURUYOR; yarım bağlamla uydurma çıktı üretilmiyor.
İlk akış: İçerik Sprinti (trend → rakip → plan → başlık → hashtag).

## §5 Yasal metin altyapısı

**Metin üretilmedi.** Şartnamenin "hukuki içerik konusunda varsayım yapma"
kuralı gereği yalnız altyapı kuruldu: 13 zorunlu belgenin registry'si,
sürümlü `legal_documents` tablosu, değiştirilemez `legal_consents` onay kanıtı,
kamuya açık `/kadexai/legal/[slug]` (yalnız yayınlanmış metin; taslak 404),
ve admin editörü.

Checkout'a ödeme öncesi onay kontrolü eklendi. **Yayınlanmış ve onay bayrağı
açık metin yokken liste boştur ve akış değişmez** — hukuk danışmanı metinleri
yayınladığı anda zorunluluk kendiliğinden devreye girer. Onay, metnin
SÜRÜMÜYLE saklanıyor: kullanıcının tam olarak neyi kabul ettiği geriye dönük
kanıtlanabilir.

## §37 Performans / ölçeklenebilirlik

**Bulunan hata:** `createDynamicOffer` kullanıcıyı `listUsers()` ile arıyordu;
parametresiz çağrı YALNIZCA ilk sayfayı (varsayılan 50 kayıt) döner.
51. kullanıcıdan sonrası için teklif oluşturmak "hesap bulunamadi" hatasına
düşecekti. Sayfalama eklendi (1000'lik sayfa, 20 sayfa tavanı).

Ayrıca: satış merkezi tüm entitlement tablosunu okuyordu → aktif + süresi
geçmemiş filtresi ve limit; kota toplaması DB fonksiyonuna alındı.

## §36 Analytics

Sözlükte tanımlı olup hiç tetiklenmeyen olaylar tespit edildi. Bağlananlar:
`signup`, `checkout_completed`, `subscription_activated`, `upgrade`, `downgrade`
(webhook'ta, gerçek grant sonrası; yön tespiti INSERT'ten önce yapılıyor —
sonrasında her satın alma "renewal" görünürdü), `quote_requested`.

`ai_request_completed/failed` **bilinçli olarak bağlanmadı**: her AI çağrısında
ek HTTP isteği sıcak yolu yavaşlatır ve maliyet doğurur; aynı veri zaten
`ai_usage_events` defterinde tutuluyor. Gerekçe kod içinde yazılı.

## Test sonuçları (bu tur)

| | Öncesi | Sonrası |
|---|---|---|
| KadexAI unit | 76 | **116** |
| Ana site unit | 80 | **80** |
| KadexAI typecheck / lint | geçti | **geçti** |
| Route manifest | 212 | **224**, eksik/duplicate yok |
| SEO invariants | geçti | **geçti** |
| Bundle secret taraması | geçti | **geçti** (3 canary) |
| Next production build | geçti | **geçti** |
| `legacy:build` | — | **geçti** |

## Yeni migration'lar (production'a UYGULANMADI)

```
202608260006_ai_usage_ledger.sql        ai_usage_events + ai_usage_summary()
202608260007_kadexai_quote_requests.sql  teklif pipeline'ı
202608260008_kadexai_content_blocks.sql  CMS
202608260009_legal_documents.sql        yasal metin + onay kanıtı
202608260010_pricing_labels_features.sql paket adı/özellik override
```

Uygulanana kadar: kullanım defteri ve maliyet paneli "henüz etkin değil" der,
teklif/CMS/yasal uçları 503 döner, paket adları koddaki varsayılanlarda kalır.
Hiçbiri mevcut akışı kırmaz.

## Yeni environment variable'lar (tamamı OPSİYONEL)

| Değişken | Tanımsızsa |
|---|---|
| `KADE_USD_TRY_RATE` | Brüt marj "hesaplanamadı" gösterilir |
| `AI_MODEL_RATES_JSON` | Koddaki varsayılan tarife tablosu kullanılır |
| `KADEXAI_ENFORCE_TOKEN_QUOTA` | Kota ölçülür ama kimse kesilmez |

## Hâlâ kapanmayan konular

- **Yasal metinlerin kendisi** — LEGAL REVIEW REQUIRED, altyapı hazır.
- **`churn` olayı** — abonelik süresi dolduğunda tetiklenmesi için zamanlanmış
  iş ve tekrar tetiklenmeyi önleyecek durum takibi gerekiyor; yarım
  bırakmamak için bu turda yapılmadı.
- **Programmatic SEO** — thin-content üretmeden ilerlemek editoryal plan
  gerektiriyor (ürün kararı).
- **Refund/churn muhasebe doğrulaması** — MRR/ARR hâlâ yaklaşık normalize.
- **Fiyat tablosunun doğruluğu** — sağlayıcı fiyat sayfalarıyla karşılaştırılmalı.
