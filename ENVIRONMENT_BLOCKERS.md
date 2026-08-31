# Environment Blockers

## 1. Browser, Playwright, axe ve Lighthouse

Bağlı browser yok (`[]`). Browser bağlandıktan sonra mevcut manifest ile public Chromium/axe, kritik Firefox/WebKit, tüm viewport ve rol E2E matrisi çalıştırılmalı. Bu denetimde bağımsız bir browser kontrol mekanizmasına geçilmedi.

## 2. Production Upstash

Eksik runtime kanıtı: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Değerler rapora yazılmamalı. Staging'de iki instance üzerinden aynı user/idempotency key ile eşzamanlı istek gönderilip yalnız bir reservation, tutarlı minute/day counter ve 409/429/503 header kontratı doğrulanmalı.

Kod şu anda request-attempt maliyetini minute/day bazında ayırır. Paket bazlı aylık limit, eşzamanlı istek reservation'ı, admin/support override ve provider başarısızlığında güvenli finalize/refund ürün politikası ayrıca tamamlanmalıdır.

## 3. Supabase staging RLS

Local/staging Supabase URL/CLI bağlantısı yok. Hazır statik doğrulama:

```bash
npm --prefix apps/kadexai run audit:supabase
supabase db reset
supabase test db
```

Staging'de migration'lar sırayla uygulanıp anon, User A, User B ve service_role için SELECT/INSERT/UPDATE/DELETE matrisi çalıştırılmalı. Production'a önce backup, sonra staging kanıtı olmadan migration uygulanmamalı.

## 4. Shopier sandbox ve scheduler

Gerçek provider product ID, sandbox credential ve job scheduler yok. `SHOPIER_ENABLED_PRODUCTS` ile yalnız panelde doğrulanan ID'ler açılmalı; TRY/minor amount fixture ile mismatch ve replay tekrarlanmalı. `POST /api/shopier?action=reconcile` yalnız admin+CSRF scheduler çağrısı olarak periyodik kurulmalı.

## 5. Role fixtures ve production passive sampling

Admin/editor/viewer/customer/KadexAI/onboarding/quota durumları için staging hesapları yok. Production'da yalnız GET/HEAD ile CDN header, canonical, redirect ve asset 4xx/5xx örneklenmeli; gerçek form, ödeme veya kullanıcı oluşturma yapılmamalı.
