# Güvenlik Politikası

## Desteklenen sürüm

Yalnız `security-hardening-kadeai` dalındaki ve ana dala alındıktan sonra en son doğrulanmış release desteklenir. Eski desktop/deployment paketleri güncel sayılmaz.

## Güvenlik bildirimi

Secret değerini public issue, ekran görüntüsü veya sohbet içinde paylaşmayın. Hosting/Git yöneticisine özel kanaldan etkilenen commit/rota, tekrar adımları, beklenen/gözlenen davranış ve güvenli proof-of-concept gönderin. Kuruluşun doğrulanmış güvenlik e-postası henüz eklenmediği için bu belge sahte adres yayımlamaz.

## Secret yönetimi

- Gerçek değerler `.env.local`, deployment secret vault veya onaylı secret manager’da tutulur; Git’e girmez.
- Service-role, AI, ödeme, e-posta, backend token ve private key değerleri `NEXT_PUBLIC_` öneki alamaz.
- Şüpheli sızıntıda anahtarı sağlayıcı panelinden revoke/rotate edin; sonra Git/log geçmişini inceleyin.
- Log/telemetry’de parola, cookie, bearer token, OAuth token, e-posta, tam prompt veya içerik gövdesi tutulmaz.
- Electron secret’ları `safeStorage` kullanır; güvenli şifreleme yoksa düz metin kayıt reddedilir.

## Production varsayımları

- HTTPS zorunludur; auth redirect allow-list yalnız bilinen local/production adreslerini içerir.
- `202607170001_security_hardening.sql` ve `202607170002_explicit_rls_and_payments.sql` önce staging’de uygulanmış ve iki kullanıcıyla RLS doğrulanmıştır.
- Reverse proxy yalnız `/kadeai` yolunu Next server’a yollar; API’yi SPA fallback’e düşürmez.
- FastAPI public feature servisi değildir; güçlü `KADE_BACKEND_TOKEN`, dar CORS ve onaylı media root ile iç ağda çalışır.
- Tek-process rate limit yatay ölçeklemede yeterli değildir; çok instance için paylaşımlı store gerekir.
- Payment ve telemetry env ile açıkça etkinleştirilmedikçe kapalı kalır; PostHog ayrıca kullanıcı izni ister.

## Güvenli geliştirme

Her değişiklikte `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:backend`, production build, bundle secret taraması, Playwright, `npm audit` ve `pip-audit` çalıştırılır. Migration’lar backup sonrası önce staging’de A/B negatif testlerle doğrulanır.
