# 07 — Güvenlik Denetimi (Faz 8 kapsamının kod-seviyesi kısmı, erken başlatıldı)

## Kapsam ve yöntem — dürüstçe belirtilmeli

Bu, şartnamenin istediği **tam OWASP denetiminin tamamı DEĞİL**. Bu bir
**statik kod incelemesi**dir: kaynak kodu okunarak, gerçek canlı ortama karşı
saldırı denemesi (pentest), otomatik tarayıcı (Burp/ZAP/Snyk vb.) veya canlı
trafik analizi YAPILMADAN yürütüldü — çünkü bu oturumda canlı bir dağıtım,
gerçek Supabase kredensiyali veya harici tarama izni yok (bkz.
`docs/BLOCKERS_TR.md` #1). Kapsam yalnızca **kök `kademedia` uygulamasının
`server/api/**` katmanı**dır; `apps/kadeai` ve `apps/studio-web/worker` bu
turda incelenmedi (ayrı bir geçiş gerektirir).

Bu belge Faz 8'in tam kapsamını KAPATMIYOR — yalnızca kod-seviyesinde
doğrulanabilir kısmı erken yürütüldü çünkü ödeme/yetkilendirme
güvenliği şartnamenin kendi önceliklendirme kuralına göre dekoratif
işlerden önce gelmeli.

## 1. Doğrulanan, sağlam bulunan mekanizmalar (kanıt: dosya + davranış)

| Alan | Dosya | Bulgu |
|---|---|---|
| CSRF | `_lib/csrf.js`, `_lib/auth.js` | Çift-gönderim çerez deseni + HMAC imzalı nonce (`verifyCsrfToken`, `crypto.timingSafeEqual`); tüm "unsafe" metodlarda zorunlu, `tests/unit/security.test.js`'te test ediliyor |
| CORS | `_lib/cors.js` | Origin allowlist (`ALLOWED_ORIGINS` env veya sabit prod/local liste) + same-origin kontrolü; izinsiz origin'e `Access-Control-Allow-Origin` hiç yazılmıyor, 403 dönüyor |
| Oturum güvenliği | `_lib/auth.js` | JWT + `session_version` deseni: şifre/rol/izin değişince eski token'lar `sessionVersionMatches()` ile otomatik geçersiz kılınıyor; cookie `HttpOnly`+`SameSite=Strict`+koşullu `Secure` |
| Brute-force koruması | `auth.js` (login) | IP başına 15dk'da 10 deneme (`rateLimitCheck`), aşılırsa 429; bu turda başarısız denemeler ayrıca `type:'security'` ile loglanıyor (Faz 4) |
| Webhook imza doğrulama | `shopier.js` | HMAC-SHA256 + `crypto.timingSafeEqual`; production'da secret eksikse webhook tamamen reddediliyor (`isProductionRuntime()` kontrolü) |
| Ödeme tutarı güvenliği | `_lib/shopierCatalog.js` | Fiyat/ürün/currency **sunucu tarafı sabit katalogdan** doğrulanıyor (`validateShopierPayment`), istemciden gelen `product_price` yalnızca doğrulama için kullanılıyor, asla güven kaynağı değil |
| Webhook idempotency | `shopier.js` | `reserveShopierOrder()` unique-index tabanlı atomik rezervasyon — replay/çift-tıklama paket çoğaltmıyor (`tests/unit/security.test.js`: "atomic replay gate") |
| Dosya yükleme | `_lib/uploadValidation.js` | MIME beyanına güvenmiyor, magic-byte imza kontrolü yapıyor (JPEG/PNG/WebP/GIF/MP4/PDF), 2MB sınır, base64 format kontrolü |
| XSS/HTML sanitizasyon | `_lib/sanitize.js` | `sanitize-html` ile sıkı allowlist (tag/attribute/style/scheme), `javascript:` şeması engelli, linklere otomatik `rel="noopener noreferrer"` |
| Mass assignment | `partners.js` (`sanitizePartnerUpdate`) ve benzer desenler | Yalnızca izin verilen alanlar update objesine kopyalanıyor, `tests/unit/security.test.js`'te doğrulandı |
| Row Level Security | `apps/kadeai/supabase/migrations/202607210001...sql` | Tüm `kade_%` tabloları RLS+FORCE RLS ile korunuyor, `anon`/`authenticated` rollerinden erişim REVOKE edilmiş — yalnızca service-role (backend) erişebilir |
| SQL/kod enjeksiyonu | tüm `server/api/**` | Supabase query builder tutarlı kullanılıyor; `.rpc()`, ham SQL string birleştirme veya `eval`/`new Function` **hiçbir yerde bulunamadı** |
| Seed/bootstrap endpoint | `seed.js` | Production'da varsayılan olarak 404 (yalnızca `SEED_ENDPOINT_ENABLED=true` ile açılıyor), saatte 3 istek sınırı, timing-safe secret karşılaştırma, sahte demo veri eklemiyor |
| Rol/izin modeli | `_lib/auth.js` | `requirePermission`/`requireAdmin` her admin route'unda backend zorunlu (frontend değil) — Faz 4'te doğrulandı, `system-health`/`coupons`/`shopier orders` gibi yeni rotalar da bu desene uydu |

## 2. Bu turda bulunan ve düzeltilen gerçek zayıflıklar

| # | Zayıflık | Dosya | Etki | Düzeltme |
|---|---|---|---|---|
| 1 | `chat.js`'te `adminMode:true` yalnızca "herhangi bir giriş yapmış admin panel kullanıcısı" kontrol ediyordu, `aiContent` iznini kontrol etmiyordu | `server/api/chat.js` | `aiContent:false` olan bir `viewer` rolü, admin panel UI'sını atlayıp doğrudan API çağrısıyla yüksek karakter/token limitli ve public rate-limitinden muaf admin AI kanalını kullanabilirdi (maliyet/kota istismarı; veri sızıntısı değil) | `getAuthorizedUser` yerine `requirePermission(req, res, 'aiContent')` — izole test edildi (401 dönüyor) |
| 2 | `users.js`/`notifications.js` MongoDB→Supabase taşımasında satır şekli dönüştürülmüyordu | `server/api/users.js`, `server/api/notifications.js` | Doğrudan bir güvenlik açığı değil ama **fonksiyonel bir bozulma**: admin kullanıcı düzenle/sil ve aktivite logu zaman damgaları canlıda çalışmıyordu | `mapUser()`/`mapActivityLog()`/`mapNotification()` eklendi (Faz 4) |
| 3 | `logActivity()`'nin iki senkron olmayan kopyası vardı, biri hiç kullanılmıyordu | `server/api/notifications.js` ↔ `_lib/notify.js` | Denetim/audit-log genişletmesi (target_type/target_id) sessizce hiçbir yerde etkili olmuyordu | Tek kaynağa indirgendi, migration uygulanmadan önce de otomatik geri düşen (`42703` fallback) hale getirildi |
| 4 | Shopier iade/chargeback durumu hiçbir yerde ele alınmıyordu | `server/api/shopier.js` | İade edilen bir ödemenin paket erişimi otomatik kapanmıyordu (yalnızca admin panelinden manuel fark edilirse) | Admin-only manuel iade işaretleme akışı + paket otomatik pasifleştirme eklendi (Faz 3) |

## 3. Bu turda incelenmeyen / canlı test gerektiren alanlar (açık)

- **`apps/kadeai` ve `apps/studio-web`/`studio-worker`** — bu denetim yalnızca kök `kademedia` API katmanını kapsadı.
- **Gerçek penetrasyon testi / otomatik tarama** — kod incelemesi false-negative riskini tamamen ortadan kaldırmaz; canlı ortamda bağımsız bir pentest önerilir.
- **BYOK / kullanıcı API anahtarı saklama** — henüz tasarlanmadı bile (bkz. `docs/05` §5) — şifreleme anahtarı yönetimi ayrı, aceleye getirilmemesi gereken bir güvenlik projesi.
- **Rate limit deposunun kalıcılığı** — `_lib/rateLimit.js`'in bellek-içi mi yoksa Supabase-destekli mi olduğu bu denetimde doğrulanmadı; serverless (Vercel) ortamda bellek-içi bir sayaç fonksiyon örnekleri arasında paylaşılmaz, bu gerçek bir etkinlik farkı yaratabilir — Faz 8'in devamında doğrulanmalı.
- **Bağımlılık/tedarik zinciri taraması** (`npm audit`, Dependabot, SBOM) — bu turda çalıştırılmadı.
- **Gizli anahtar rotasyon politikası ve sızıntı taraması** (git geçmişinde secret var mı) — bu turda yapılmadı.
- **Threat model belgesi** (`docs/THREAT_MODEL_TR.md`) — henüz oluşturulmadı, bu denetimin bulguları oraya girdi olarak kullanılmalı.

## 4. Genel değerlendirme

Kök uygulamanın API katmanı, incelenen alanlarda **beklenenin üzerinde
olgun bir güvenlik duruşu** sergiliyor (CSRF/CORS/webhook-imza/RLS/
mass-assignment/dosya-doğrulama hepsi doğru desenlerle uygulanmış). Bu
turda bulunan 4 sorunun 1'i gerçek bir yetki-atlatma açığıydı (chat.js),
3'ü fonksiyonel/veri-tamlığı sorunuydu — hiçbiri veri sızıntısına yol
açmadı ve hepsi bu oturumda düzeltildi. **Bu, "güvenlik denetimi
tamamlandı" anlamına gelmez** — yukarıdaki §3 açık kalan, canlı ortam
veya özel uzmanlık gerektiren maddeler şartnamenin tam kapsamının geri
kalanıdır.
