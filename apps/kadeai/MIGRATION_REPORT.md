# KADE AI Geçiş Kaydı

## Kapsam

- Kaynak: `C:\Users\Kadir Demir\Desktop\KadeBusiness\KADE-ALL-IN-ONE`
- Hedef: `C:\Users\Kadir Demir\Desktop\KadeBusiness\kademedia`
- Dal: `security-hardening-kadeai`
- Kaynak başlangıç commit’i: `65851` ile başlayan commit
- Yedek: `C:\Users\Kadir Demir\Desktop\KadeBusiness\kademedia_backup_20260717_104653`

## Güvenli geçiş

Mevcut hedef körlemesine ezilmedi; zaman damgalı yedek alındı. Kaynak `.git` ve gizli dosyalar korunarak, `node_modules`, `.next` ve geçici çıktılar hariç kopyalandı. Hedefte lockfile ile temiz kurulum/test yapıldı. Kaynak klasör silinmedi.

## Doğrulanan durum

- Baseline commit: `f20719817716`; sonraki production-readiness değişiklikleri aynı dalda.
- npm clean install/audit: başarılı, final audit 0 açık.
- lint/typecheck/build: başarılı.
- Unit: 6/6; FastAPI pytest: 2/2; gerçek FastAPI HTTP health: 200 JSON.
- Playwright: 38/38 (Chromium desktop + Pixel 7).
- Local Next: login 200; health `ok`, JSON/application-json; anonymous dashboard login’e redirect.
- Client bundle: yapılandırılmış server secret değerleri bulunmadı.
- Python requirements audit: 0 bilinen açık.
- Docker Desktop 4.82.0 kuruldu; `kade-fastapi:20260717` image build edildi ve gerçek container HTTP/auth smoke testi geçti.
- `kade-social-media-ai` Vercel preview build’i READY oldu; preview runtime Vercel Deployment Protection arkasında kaldı.
- Ana domain kaynak yedeğinde `/kadeai` için dar Vercel rewrite hazırlandı ve build/lint geçen `integrate-kadeai-route` / `f106176` teslim noktası oluşturuldu.
- Aktif Supabase staging projesi linklendi; migration öncesi schema/data/roles dump’ları ve SHA-256 özetleri alındı.
- Dört migration staging’e sırayla uygulandı; local/remote migration listesi eşleşti ve `db lint` sıfır hata verdi.
- İki geçici kullanıcıyla gerçek password login/logout ve A/B RLS CRUD testi 20/20; Chromium login/logout/back testi 1/1 geçti. Geçici kullanıcılar silindi.
- KADE AI klasörünün yerel Vercel bağlantısı yanlış ana site projesinden ayrılarak `kade-social-media-ai` projesine düzeltildi.
- Doğrulanmış staging Supabase env’iyle Vercel preview build READY oldu (`dpl_44HXaE9zHVMFZsas4KBWjdXbW79N`); runtime Deployment Protection arkasında kaldı.

- Production `KADE Project` yeniden etkinleştirildi; schema/data/roles backup’ları ve SHA-256 özetleri alındı.
- Dört migration production’a dry-run sonrasında uygulandı. Restore edilmiş projenin eksik Data API GRANT farkı `202607170003_explicit_table_grants.sql` ile staging-first düzeltilerek production RLS testi 20/20 geçirildi.
- Supabase Site URL/redirect allow-list production `/kadeai` değerleriyle Management API üzerinden güncellendi ve doğrulandı.
- KADE AI production upstream ve ana domain rewrite deployment’ları READY; ana `/` korunarak `/kadeai` smoke ve gerçek auth akışı geçti.

Eksik kalanlar: erişilebilir mailbox ile recovery teslim doğrulaması, dış FastAPI container host, gerçek ödeme/telemetry ve maliyetli AI provider çağrısıdır.
