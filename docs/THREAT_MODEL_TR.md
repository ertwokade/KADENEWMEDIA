# Tehdit Modeli (şartname §23)

`docs/07_SECURITY_AUDIT_TR.md`'nin devamı — burada saldırgan senaryoları
ve şartnamenin §23'te zorunlu tuttuğu ~50 maddelik kontrol listesi tek
tek ele alınıyor. Aynı kapsam sınırı geçerli: **kod-seviyesi statik
inceleme, canlı pentest değil** (kök `kademedia` API katmanı).

Hiçbir madde için "hiç açık yok" gibi mutlak iddia kurulmuyor —
şartnamenin kendi §23 kuralı bunu açıkça yasaklıyor.

## Saldırgan senaryoları (kim, ne ister, en olası yol)

| Senaryo | Saldırgan hedefi | En olası yol | Mevcut savunma |
|---|---|---|---|
| Admin panele yetkisiz erişim | Müşteri verisi, içerik kontrolü | Şifre tahmini / oturum çalma | Brute-force rate limit (10/15dk) + `HttpOnly`/`Secure`/`SameSite=Strict` cookie + `session_version` iptali |
| Ödeme tutarını manipüle etme | Ücretsiz/indirimli erişim | Webhook'a sahte `product_price` gönderme | Fiyat sunucu-taraflı sabit katalogdan doğrulanıyor (`validateShopierPayment`), istemci fiyatı yalnızca eşleşme kontrolü için kullanılıyor |
| Webhook replay | Aynı ödemeyle birden fazla paket alma | Aynı webhook body'sini tekrar gönderme | `shopier_order_id` unique index + atomik rezervasyon (`reserveShopierOrder`) |
| Başka bir müşterinin verisine erişim (IDOR) | Veri sızıntısı | `customer-portal` gibi uçlarda ID parametresi değiştirme | Müşteri verisi ID parametresinden değil, oturumdan (`getActiveCustomerSession`) türetiliyor — deneme mümkün ama etkisiz |
| Düşük yetkili admin kullanıcının yetki yükseltmesi | Maliyetli/yetkisiz işlem | UI'da gizli ama API'de açık bir uç bulma | Bu turda tam olarak bu senaryo `chat.js`'te bulundu ve kapatıldı (bkz. docs/07 §2 madde 1) — kalan tüm admin uçları `requirePermission`/`requireAdmin` ile taranıp doğrulandı |
| AI sohbet aracını kötüye kullanma (maliyet istismarı) | Gemini API kotasını tüketme | Otomatik/toplu istek | Public: 20 istek/pencere rate limit + 1000 karakter sınırı; admin: ayrı, daha yüksek ama izin-korumalı kanal |
| Dosya yükleme yoluyla kötü amaçlı içerik | Sunucuda kod çalıştırma / kullanıcıyı kandırma | MIME'ı sahte beyan edip yürütülebilir içerik yükleme | Magic-byte imza doğrulama + 2MB sınır — beyan edilen MIME içerikle eşleşmezse reddediliyor |

## §23 zorunlu kontrol listesi — madde madde durum

Durum değerleri: **Doğrulandı** (kod okunarak kanıtlandı) / **Yapısal N/A** (bu mimaride uygulanabilir bir saldırı yüzeyi yok) / **Doğrulanmadı** (bu turda incelenmedi, gerçek açık listesi).

| Madde | Durum | Not |
|---|---|---|
| Auth bypass | Doğrulandı | `requireAuth`/`getAuthorizedUser` her admin uçta zorunlu; `chat.js` istisnası bulunup kapatıldı |
| Broken access control / RBAC | Doğrulandı | `requirePermission(permission, {write})` deseni tutarlı; Faz 4'te roller/izinler UI'sı da eklendi |
| IDOR/BOLA | Doğrulandı (kök API için) | Müşteri-taraflı uçlar oturumdan türetiyor; admin uçları `requirePermission` ile korunuyor. `apps/kadeai` bu turda incelenmedi |
| Tenant izolasyonu | Yapısal N/A | Kök uygulama tek-tenant (tek ajans); çoklu-tenant izolasyonu kadeai'nin RLS'inde (bu turda incelenmedi) |
| Session güvenliği | Doğrulandı | JWT + `session_version`, `HttpOnly`+`SameSite=Strict`+koşullu `Secure` |
| Password policy | Doğrulandı | Min 12 karakter zorunlu (`users.js`/`seed.js`), bcrypt cost 12 |
| MFA/2FA | Doğrulanmadı — Yok | Hiç yok, şartname §11'de müşteri paneli için "2FA seçeneği" istiyor — açık bir boşluk |
| Account enumeration | Doğrulandı | Login hatası her zaman jenerik "Geçersiz kullanıcı adı veya şifre" — kullanıcı var/yok ayrımı yapmıyor |
| Brute force/rate limit | Doğrulandı | Login 10/15dk, chat 20/pencere, seed 3/saat — Upstash yapılandırılmazsa bellek-içi yedeğe düşüyor (blocker #16) |
| CSRF | Doğrulandı | Çift-gönderim çerez + imzalı nonce, testli |
| XSS | Doğrulandı | `sanitize-html` sıkı allowlist, React'in kendi JSX escaping'i varsayılan |
| SQL/NoSQL injection | Doğrulandı | Supabase query builder tutarlı, ham SQL/`.rpc()` yok |
| Command injection | Yapısal N/A | Hiçbir yerde `child_process`/shell çağrısı yok (kök API'de) |
| SSRF | Yapısal N/A (kök) | Sunucu yalnızca sabit, kod-içi URL'lere (`generativelanguage.googleapis.com`) istek atıyor; kullanıcıdan gelen bir URL'ye sunucu-taraflı fetch yapan hiçbir uç yok |
| Path traversal | Yapısal N/A | Dosya sistemi yolu kullanıcı girdisinden inşa edilmiyor (medya base64/DB'de, dosya sistemine yazma yok) |
| Open redirect | Yapısal N/A | Hiçbir uçta `res.redirect()` veya kullanıcı-kontrollü `Location` header yok; kısa linkler yalnızca admin-taraflı hedef URL'ler (public oluşturamaz) |
| Clickjacking | Doğrulandı | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (server.js) |
| CORS | Doğrulandı | Origin allowlist + same-origin kontrolü, izinsiz origin'e credential göndermiyor |
| CSP | Doğrulandı | `server.js`'te tanımlı, `'unsafe-inline'` script-src'de var (React/GA için) — ideal değil ama izlenebilir |
| Security headers | Doğrulandı | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` mevcut |
| Secret exposure | Doğrulandı (kısmi) | `.env.example`'da gerçek secret yok; `system-health` yalnızca var/yok döndürüyor. Git geçmişinde secret sızıntısı taraması bu turda YAPILMADI |
| Loglara hassas veri yazılması | Doğrulandı | `logActivity` çağrıları şifre/token içermiyor; hata logları `err.message` ile sınırlı (stack trace/gövde dökümü yok) |
| File upload / MIME spoofing | Doğrulandı | Magic-byte doğrulama, MIME beyanına güvenmiyor |
| Zip bomb/large file | Doğrulandı (kısmi) | 2MB medya sınırı var; genel JSON body sınırı (`requestLimits.js`) var. Sıkıştırılmış dosya açma (decompression bomb) senaryosu yok çünkü hiçbir yerde arşiv açma yapılmıyor |
| Media parser/FFmpeg izolasyonu | Yapısal N/A (kök) | Kök API'de FFmpeg/medya işleme yok — bu risk Kade Studio'da (`apps/studio-worker`), bu turda incelenmedi |
| Webhook spoofing | Doğrulandı | HMAC-SHA256 + `timingSafeEqual`, production'da secret zorunlu |
| Payment amount tampering | Doğrulandı | Sunucu-taraflı sabit katalog, istemci fiyatı asla güven kaynağı değil |
| Replay attack | Doğrulandı | Webhook idempotency (unique index + atomik rezervasyon), CSRF nonce tek kullanımlık değil ama oturuma bağlı imzalı |
| Race condition | Doğrulandı (webhook) | `reserveShopierOrder` unique-constraint tabanlı atomik — eşzamanlı çift-webhook testle doğrulandı (`tests/unit/security.test.js`) |
| Mass assignment | Doğrulandı | `sanitizePartnerUpdate` ve benzeri allowlist desenleri, testli |
| Prototype pollution | Yapısal N/A | `JSON.parse` sonrası hiçbir yerde kullanıcı objesi doğrudan `Object.assign`/spread ile prototip zincirine erişilebilir bir hedefe yazılmıyor; Supabase insert/update payload'ları alan-bazlı allowlist'ten geçiyor |
| Dependency vulnerabilities | Doğrulandı, kısmen düzeltildi | `npm audit` çalıştırıldı: 2 düşük önem (`body-parser` DoS, `dompurify` bypass) `npm audit fix` ile düzeltildi. 1 yüksek önem (`shell-quote`, yalnızca `--force` ile ve yalnızca dev-bağımlılığı `concurrently`'yi kıran bir yükseltmeyle düzeltilebiliyor) bilinçli olarak ertelendi — production runtime'ı etkilemiyor, yalnızca yerel geliştirme script orkestrasyonunda kullanılıyor |
| Supply chain | Doğrulanmadı | SBOM/lockfile bütünlük taraması yapılmadı |
| Unsafe deserialization | Yapısal N/A | Yalnızca `JSON.parse` kullanılıyor (güvenli), `eval`/`vm`/özel deserializer yok |
| Email template injection | Doğrulandı | `client.js`'teki e-posta gönderiminde `escapeHtml`/`cleanHeader` (CRLF header injection'a karşı) kullanılıyor |
| CSV injection | Yapısal N/A | Hiçbir CSV export özelliği yok |
| Stored prompt injection | Doğrulandı (kısmi) | `chat.js` sistem promptu "fiyat/istatistik uydurma" talimatı içeriyor ama kullanıcı mesajı formatı serbest metin olarak modele geçiyor — bu, tasarım gereği (bir sohbet botu) ve düşük risk (yalnızca kendi konuşmasını etkiler, başka kullanıcıyı etkilemez, DB'ye yazılmıyor) |
| AI tool abuse / API cost abuse | Doğrulandı | Rate limit + karakter/token sınırları (public vs admin ayrı) |
| Rate limit bypass | Doğrulandı (kısmi) | IP bazlı; `X-Forwarded-For` güvenilir proxy arkasında doğru çalışır ama sahte header ile bypass teorik olarak mümkün (Vercel'in kendi header'ları güvenilir kabul ediliyor) — Vercel dışı bir ortamda bu varsayım geçersiz olur |
| Bot scraping/credential stuffing | Doğrulandı (kısmi) | Login rate limit var; CAPTCHA/bot-tespiti yok — düşük hacimli bir ajans sitesi için orantılı ama not edilmeli |
| PII export/delete güvenliği | Doğrulanmadı — Yok | KVKK "verilerimi indir/sil" akışı hiç yok (docs/06 madde 43) |
| Backup encryption ve restore testi | Doğrulanmadı | Supabase'in kendi backup mekanizması kullanılıyor (varsayım); şifreleme/restore testi bu turda doğrulanmadı |
| Monitoring ve alarm | Doğrulanmadı | Gerçek zamanlı alarm (Sentry/PagerDuty vb.) bu turda tespit edilmedi — yalnızca `console.error` var |

## Öncelikli, henüz kapatılmamış maddeler (release blocker adayları)

Şartname "kritik ve yüksek bulguları release blocker kabul et" diyor.
Bu listeden gerçek risk taşıyanlar:

1. **MFA/2FA yok** — admin hesapları için orta-yüksek risk (yalnızca şifre).
2. **`npm audit`/bağımlılık taraması hiç yapılmadı** — bilinmeyen risk, ucuz ve hızlı kapatılabilir.
3. **PII export/delete akışı yok** — KVKK uyumluluğu için gerekli, hukuki blocker (#2) ile bağlantılı.
4. **Monitoring/alarm yok** — bir ihlal olsa fark edilmesi yalnızca manuel log incelemesine bağlı.

Bunlardan #2 (bağımlılık taraması) bu oturumda yapıldı — 2 düşük önem
düzeltildi, 1 yüksek önem (yalnızca dev-bağımlılığı etkiliyor) bilinçli
olarak ertelendi.
