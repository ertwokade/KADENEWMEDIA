# Operasyon Runbook'u (şartname §32.20)

Bu belge, sistemi işletecek kişi için pratik bir başvuru kaynağıdır —
mimari kararların gerekçesi için `docs/02`, güvenlik denetimi için
`docs/07`/`docs/THREAT_MODEL_TR.md`'ye bakın.

## 1. Dağıtım (Deployment)

- **Platform:** Vercel, proje adı `kadenewmedia` (hesap: `kadeertwo`), git push ile otomatik deploy (`main` dalı → production).
- **Framework Preset:** `vercel.json`'da `"framework": "vite"` **zorunlu** — proje dashboard'undaki Framework Preset ayarı yanlışlıkla "Services" olarak kalırsa (bu, PR #8 denemesinden kalma bir ayardı ve bu oturumda düzeltildi) her deployment 2-3 saniyede başarısız olur. `vercel.json`'daki `framework` alanı bu dashboard ayarını override eder — **bu satırı vercel.json'dan silmeyin.**
- **Build komutu:** `npm run legacy:build` (`vite build` + `index.html`→`app.html` yeniden adlandırma + statik rota üretimi).
- **Sorun giderme:** `npx vercel ls kadenewmedia` ile son deployment'ların durumunu kontrol edin; `● Error` art arda görülüyorsa `npx vercel build` ile yerelde build'i taklit edip hatayı erken yakalayın.
- **apps/kadexai:** Keyubu Windows Server üzerindeki WSL2/Ubuntu ve Docker'da çalışır. `main` dalında `apps/kadexai/**`, `server/**` veya ilgili dağıtım yolları değişince `.github/workflows/deploy-keyubu.yml` tam commit'i otomatik dağıtır. Canlı uç `https://kadexai.kadenewmedia.com/kadexai` adresidir; ana site Vercel'de kalır.

## 2. Ortam değişkenleri (kritik olanlar)

| Değişken | Amaç | Eksikse ne olur |
|---|---|---|
| `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` | Tüm veritabanı erişimi | API tamamen çalışmaz (bkz. blocker #1) |
| `JWT_SECRET` (min 32 karakter) | Admin oturum imzalama | Admin girişi tamamen çalışmaz |
| `SHOPIER_API_KEY`/`SHOPIER_API_SECRET` | Ödeme webhook imza doğrulama | Production'da webhook'lar tamamen reddedilir (güvenlik amaçlı, bkz. `shopier.js`) |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` | Kalıcı/dağıtık rate limit | Bellek-içi yedeğe düşer, brute-force koruması zayıflar (blocker #16) |
| `GEMINI_API_KEY` | Chat/AI içerik özelliği | Public chat "fallback" moduna düşer (hata vermez, sessizce devre dışı) |
| `SMTP_HOST`/`_USER`/`_PASS` | E-posta gönderimi (newsletter, müşteri bildirimleri) | Sessizce başarısız olur, `server.js` başlangıçta konsola uyarı basar |
| `SITE_URL` | Sitemap base URL | Yanlışsa sitemap `kadenewmedia.com`'a düşer (güvenli varsayılan) |
| `SEED_SECRET`/`SEED_ADMIN_PASSWORD`/`SEED_ENDPOINT_ENABLED` | İlk admin kullanıcı oluşturma | `seed.js` production'da varsayılan olarak 404 döner (güvenli) |

**Tam liste için `.env.example`'a bakın.** `system-health` admin
ekranı (`/admin` → Sistem Sağlığı) bu değişkenlerin **yalnızca var/yok
durumunu** canlıda gösterir — gerçek değerleri asla göstermez.

## 3. Veritabanı migrasyonları

Migration dosyaları `apps/kadexai/supabase/migrations/*.sql` — kronolojik
sırayla uygulanmalı. Aşağıdaki üç migration 12 Eylül 2026'da taze şifreli
yedek ve transaction dry-run sonrasında self-hosted üretim PostgreSQL'e
tek transaction olarak uygulandı:

- `202607230001_kademedia_audit_and_quote_states.sql` — teklif durum makinesi + audit log alanları
- `202607230002_kademedia_coupons.sql` — kupon tablosu
- `202607230003_kademedia_shopier_refund_state.sql` — iade durumu

Canlı doğrulamada `kade_coupons`, `kade_activity_log.target_* / before / after`
ve `kade_shopier_orders.refunded_*` alanları ile genişletilmiş durum constraint'i
mevcuttur. Migration'ları rastgele tekrar çalıştırmak yerine önce şemayı ve bu
runbook kaydını kontrol edin.

**Migration uygulama sırası:** Supabase projesindeki SQL editöründen ya
da `supabase db push` ile, dosya adındaki tarih sırasına göre, en
eskiden en yeniye.

## 4. Yaygın arıza senaryoları ve müdahale

| Belirti | Olası neden | İlk adım |
|---|---|---|
| Tüm deployment'lar 2-3 saniyede "Error" | Framework Preset yanlış ayarlı | §1'e bakın — `vercel.json`'da `framework: "vite"` var mı kontrol edin |
| Admin girişi 503 dönüyor | `kade_users` tablosu boş/Supabase erişilemiyor | `seed.js` ile ilk admin oluşturun (`SEED_ENDPOINT_ENABLED=true` gerekir) veya Supabase bağlantısını kontrol edin |
| Shopier webhook'ları 403 dönüyor | `SHOPIER_API_SECRET` eksik/yanlış (production'da imza zorunlu) | Env değişkenini doğrulayın; **asla imza doğrulamasını atlamayın** |
| Aktivite logunda yeni alanlar (target_type vb.) boş kalıyor | Migration #1 uygulanmamış | `logActivity()` zaten geriye dönük uyumlu fallback yapıyor, sistemi bozmaz — migration'ı uygulayın |
| Bir müşteri Shopier panelinden iade aldı ama hâlâ erişimi var | Manuel iade işaretlenmedi | Admin → Ödeme Kayıtları → ilgili siparişi bulup "İade Et" |
| Rate limit "aşıldı" hataları beklenenden sık | Upstash yapılandırılmamış, bellek-içi sayaç her fonksiyon örneğinde sıfırdan başlıyor VEYA tam tersi çok gevşek | Upstash'i provizyon edin (blocker #16) |

## 5. Yedekleme ve kurtarma

- **Veritabanı:** Self-hosted Supabase her gün 02:20 UTC'de şifreli olarak
  `/srv/kade/backups/selfhosted-supabase` altına yedeklenir ve 14 gün tutulur.
  Her pazar son arşiv ayrı/geçici PostgreSQL veritabanına geri yüklenir; tablo
  envanteri üretimle eşleşince geçici veritabanı silinir. 11 Eylül arşiviyle
  123 tablo için gerçek restore doğrulaması başarılıdır. 12 Eylül migration'ı
  öncesinde ayrıca taze şifreli yedek alınmıştır.
- **Kod:** Git (GitHub) — her commit push edildiğinde otomatik yedek.
- **Medya:** Şu an base64 olarak `kade_media`/`kade_link_profiles`
  tablolarında saklanıyor (bkz. `docs/01` bulgusu) — bu, DB backup'ının
  medyayı da kapsadığı anlamına gelir ama ölçeklenebilirlik açısından
  ideal değil, object storage'a taşıma önerilir.
- **Admin panelindeki "Yedekleme" modülü:** Var (`BackupSection`) —
  kapsamı bu oturumda doğrulanmadı, bir sonraki incelemede kontrol edilmeli.

## 6. İzleme (Monitoring)

KadexAI sağlık ucu, Docker healthcheck'leri, cron sonuç günlüğü ve yönetim
bildirim katmanı mevcuttur. Sentry entegrasyonu kodda hazırdır fakat canlıda
`SENTRY_ENABLED=0` ve DSN tanımsızdır; PostHog da kapalıdır. Bu nedenle bağımsız
harici uptime/hata servisi hâlâ yoktur. Sunucu için `/srv/kade/logs/cron.log`,
`/srv/kade/logs/backup.log` ve Docker sağlık durumları; ana site için Vercel
deployment/log ekranı izlenmelidir. Harici izleme hesabı bağlanana kadar bu
durum açık operasyon riski olarak kalır.

## 7. Rutin bakım

- **Bağımlılık güncellemeleri:** `npm audit` periyodik çalıştırılmalı (bu oturumda çalıştırıldı, 2 düşük önem düzeltildi, 1 yüksek önem — yalnızca dev-bağımlılığı `concurrently` etkiliyor — bilinçli ertelendi).
- **Lint/test taban çizgisi:** Legacy ESLint temizdir ve 12 Eylül 2026 itibarıyla 98 birim testi geçer. KadexAI TypeScript/ESLint temizdir ve 265 birim testi geçer.
- **Kupon kullanım sayaçları:** `kade_coupons.used_count` şu an hiçbir yerden otomatik artırılmıyor (checkout'a bağlanmadığı için, bkz. blocker #14) — canlıya alınırsa bu sayaç mantığı da eklenmeli.
