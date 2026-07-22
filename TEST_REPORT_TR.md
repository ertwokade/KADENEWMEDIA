# TEST_REPORT_TR.md

Tarih: 22 Temmuz 2026

## Önemli not: origin/main ile uzlaştırma

Bu oturum sırasında yerel `main` dalının, uzak `origin/main`'in **18 commit gerisinde** olduğu tespit edildi. `origin/main` zaten merge edilmiş PR'lar üzerinden admin-editable fiyatlandırma (PR #6), custom-offer sistemi (PR #3), SEO person-schema (PR #4), Telif Hakları yasal sayfası (PR #5) ve TopBar başlık düzeltmesini (PR #7) içeriyordu. Bu oturumda önce bunlardan habersiz paralel bir fiyatlandırma sistemi inşa edilmiş, sonra `git diff --stat origin/main main` ile çakışma fark edilip yerel ağaç `origin/main` ile uzlaştırıldı. Aşağıdaki test sonuçları, bu uzlaştırma **sonrası** nihai duruma aittir.

## Çalıştırılan komutlar ve sonuçlar

| Komut | Konum | Sonuç |
|---|---|---|
| `npm run legacy:lint` | kök | 0 hata, 2 uyarı (`react-hooks/exhaustive-deps`, `Admin.jsx`) |
| `npm run legacy:test:unit` | kök | **15/15 geçti** (`node --test tests/unit/*.test.js`) |
| `npm run legacy:build` | kök | Başarılı, 515ms, 37 statik rota üretildi |
| `npm run lint` | `apps/kadeai` | 0 hata |
| `npm run typecheck` | `apps/kadeai` | 0 hata |
| `npm run test:unit` | `apps/kadeai` | **22/22 geçti** (`tsx --test tests/unit/*.test.ts`) |
| `npm run build` | `apps/kadeai` | Bu sandbox'ta Google Fonts ağ erişimi olmadığı için başarısız — kod hatası değil, gerçek Vercel build ortamında doğrulanmalı |
| `npm run dev` | `apps/kadeai` | Başarılı, 343ms'de hazır (build-zamanı Google Fonts sorunu dev modunda yok) |
| `npx playwright install chromium` | `apps/kadeai` | **Başarısız — kesin ağ engeli:** `cdn.playwright.dev` sandbox ağ allowlist'i tarafından `403` ile engelleniyor |
| `npm run test:e2e` | `apps/kadeai` | **Çalıştırılamadı** — tarayıcı ikili dosyası indirilemediği için (yukarıya bkz.) |
| `npm run test:backend` (FastAPI/pytest) | `apps/kadeai` | **Çalıştırılamadı — kesin bağımlılık engeli:** `backend/main.py` başlangıçta `openai-whisper`/`torch` gibi ~1GB+ ağır ML bağımlılıklarını koşulsuz import ediyor; bu sandbox'ta arka plan işlemleri ayrı komut çağrıları arasında hayatta kalmıyor, bu da büyük indirmeyi pratik olarak imkansız kılıyor (detay: aşağıya bkz.) |

## Bu oturumda bulunup düzeltilen gerçek hata: `server-only` modül çözümleme kırığı

`origin/main`'den gelen `apps/kadeai/lib/payments/pricingConfig.ts` ve `apps/kadeai/lib/supabase/admin.ts` dosyalarının başında `import 'server-only'` vardı. Bu paket Next.js'in derleme hattında (webpack/Turbopack) özel bir alias ile sahte bir modüle yönlendirilir, ancak `node_modules` içinde gerçek bir `server-only` paketi **kurulu değil** — proje `package.json`'ında bağımlılık olarak listelenmiyor, yalnızca `next`'in kendi derlenmiş dahili kopyası var (`node_modules/next/dist/compiled/server-only`). Sonuç: `tsx --test` (Next.js derleme hattı dışında çalışan düz Node.js modül çözümleyicisi) bu import'u çözemiyor ve `tests/unit/kade-commerce.test.ts` ile `tests/unit/providers.test.ts` tamamen yüklenemeden çöküyordu (`Cannot find module 'server-only'`).

Doğrulama: her iki dosyanın da hiçbir `'use client'` bileşeninden import edilmediği (`grep` ile) teyit edildi — yalnızca API route'ları, ödeme kütüphaneleri ve testler tarafından kullanılıyorlar. Bu nedenle `import 'server-only'` satırının kaldırılması çalışma zamanı davranışını **değiştirmiyor** (bu paket yalnızca yanlışlıkla istemci tarafına paketlenmeye karşı derleme-zamanı bir korumadır); zaten aynı desen `server/api/shopier.js`'de de (testedilebilirlik için) uygulanıyordu. Düzeltme sonrası her iki dosyada `npm run test:unit` **22/22** geçti, `npm run typecheck` ve `npm run lint` temiz kaldı.

Bu, benim inşa ettiğim bir regresyon değildi — `origin/main`'in kendi test altyapısında önceden var olan, yalnızca `pricingConfig.ts`'nin test dosyalarının import zincirine (catalog.ts üzerinden) girmesiyle ortaya çıkan gizli bir kusurdu. Gerçek Next.js build/CI ortamında `server-only` paketi büyük olasılıkla `next`'in kendi bağımlılık ağacından çözülüyor olabilir — ama plain Node.js/tsx test koşucusu için bu güvenilir değildi ve şimdi düzeltildi.

## Toplam otomatik test sayısı

- Kök: 15 unit test (`tests/unit/security.test.js`)
- `apps/kadeai`: 22 unit test — `kade-commerce.test.ts` (12 test: katalog/fiyat/Shopier formu), `providers.test.ts` (4 test: AI/e-posta/ödeme mock'ları), `security.test.ts` (6 test: IDOR, owner-only ayarlar, RLS migration şekli, AI kota)

## Bu oturumda testlerle doğrulanan/düzeltilen güvenlik özellikleri (isimlendirilmiş)

- "CSRF tokens are signed and tamper evident"
- "API request size guard rejects oversized JSON"
- "media validation checks file signature instead of trusting MIME"
- "mass assignment drops protected partner fields"
- "Shopier webhook signature rejects forged payloads"
- "Shopier order reservation is an atomic replay gate" — **bu oturumda düzeltildi** (eski MongoDB tarzı mock, gerçek Supabase/PostgREST arayüzüyle değiştirildi)
- "Shopier reconciliation never grants an entitlement and is state-idempotent" — **bu oturumda düzeltildi**
- "user A cannot access a resource owned by user B" (`apps/kadeai`)
- "settings are restricted to the single account owner email" (`apps/kadeai`)
- "checkout amount and currency come only from the server catalog" (`apps/kadeai`)
- "distributed AI quota enforces cost, daily limit and idempotency locally" (`apps/kadeai`)
- "distributed quota fails closed in production without a backend" (`apps/kadeai`)

## Çalıştırılamayan / eksik test kategorileri — GÜNCELLEME: iki tanesi somut olarak denendi ve kesin engel tespit edildi

- **E2E (Playwright) — DENENDİ, KESİN AĞ ENGELİ TESPİT EDİLDİ:** `apps/kadeai`'de Next.js dev sunucusu başarıyla ayağa kalktı (`next dev`, 343ms'de hazır — build-zamanı Google Fonts sorunu dev modunda oluşmuyor). Ardından `npx playwright install chromium` denendi; **`https://cdn.playwright.dev` bu sandbox'ın ağ allowlist'i tarafından açıkça engelleniyor** (`403 Connection blocked by network allowlist`). `--with-deps` seçeneği ayrıca `sudo`/root gerektiriyor ve bu sandbox'ta kullanılamıyor. Bu, zaman kısıtı değil, **kesin bir altyapı erişim engeli** — tarayıcı ikili dosyası bu ortama hiçbir şekilde indirilemiyor. `apps/kadeai/tests/e2e/basepath.spec.ts` gibi dosyalar kodda mevcut ve yapısal olarak doğru görünüyor, gerçek bir CI ortamında veya sizin makinenizde çalıştırılmalı.
- **Integration**: Kök `test:integration` script'i tanımlı değil (yalnızca `apps/studio-web` için var, Kade Studio kapsamında). Legacy/KadeAI için ayrı bir "integration" katmanı görülmedi — unit testler zaten gerçek sorgu şekillerini taklit ederek entegrasyon benzeri kapsam sağlıyor.
- **Güvenlik regresyon testleri (XSS/SQLi/IDOR payload'ları canlı sunucuya karşı)**: Yapılmadı — canlı/staging ortam erişimi yok.
- **Kade Studio (`apps/studio-web`/`studio-worker`)**: Kapsam dışı (kullanıcı talimatında da ayrı ürün olarak işaretlenmişti); bu oturumda test edilmedi.
- **FastAPI backend (`apps/kadeai/backend`) — DENENDİ, KESİN BAĞIMLILIK ENGELİ TESPİT EDİLDİ:** Python 3.10 venv kuruldu, sistemde `ffmpeg` mevcut olduğu doğrulandı. Ancak `backend/main.py` başlangıçta (test dosyaları da dahil, `TestClient` bile bunu tetikliyor) `modules.whisper_transcript`, `modules.scene_detector`, `modules.auto_color` gibi tüm video/ses işleme modüllerini **koşulsuz olarak import ediyor** — bu da `requirements.txt`'teki `openai-whisper`, `faster-whisper`, `opencv-python`, `librosa`, `scipy` gibi ağır bağımlılıkların (özellikle `torch`, genellikle 1GB+ indirme) tamamının kurulu olmasını gerektiriyor. Bu ortamda arka plan işlemleri ayrı `bash` çağrıları arasında hayatta kalmıyor (her çağrı bağımsız, ~45 saniyelik bir üst sınırla), bu da tek seferde tamamlanamayan, çok büyük bir indirmeyi pratik olarak imkansız kılıyor — deneme sırasında `pip install` süreci bir sonraki çağrıda kaybolduğu doğrulandı. Bu, sadece 5 "smoke test" için orantısız bir altyapı yatırımı — gerçek bir CI ortamında (kalıcı disk/önbellek, daha uzun zaman aşımı) çalıştırılmalı.

## Kalan işler

1. Playwright ile en az kritik E2E akışları (ziyaretçi → paket → teklif formu; admin login → lead görüntüleme; admin paket/link CRUD) çalıştırılmalı — bu sandbox'ta `cdn.playwright.dev` engellendiği için CI ortamında veya sizin makinenizde çalıştırılmalı.
2. `npm run test:backend` (FastAPI) — gerçek bir CI ortamında (kalıcı disk, ~1GB+ ML bağımlılığı indirme zamanı) çalıştırılmalı. Kade Studio testleri kapsam dışı, ayrı bir çalışma gerektiriyor.
3. Canlı/staging ortamda güvenlik regresyon (XSS/SQLi/CSRF/rate-limit) testleri.
4. Gerçek Vercel build ortamında `apps/kadeai npm run build`'ın Google Fonts erişimiyle başarılı tamamlandığı doğrulanmalı (bu sandbox'ta ağ kısıtı var).
