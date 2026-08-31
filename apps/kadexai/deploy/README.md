# KadexAI production kurulumu

Uygulama `https://kadenewmedia.com/kadexai` altında SSR çalışan bir Next.js servisidir. Nginx ana siteyi sunmaya devam eder; yalnızca `/kadexai` ve altı `127.0.0.1:3000` servisine gider.

## Kurulum

1. Node.js 22 LTS ve Nginx kur.
2. `.env.example` dosyasını sunucuda `.env.production` olarak kopyala; Supabase ve en az bir AI sağlayıcısını doldur. Secret değerleri git'e ekleme.
3. Supabase SQL Editor içinde `supabase/migrations/202607160001_kadexai_profiles_and_runs.sql` ve ardından `supabase/migrations/202607170001_security_hardening.sql` dosyasını kontrollü biçimde çalıştır. Önce staging yedeği al ve iki kullanıcıyla RLS izolasyonunu doğrula.
4. Supabase Authentication > URL Configuration içinde Site URL'yi `https://kadenewmedia.com/kadexai`, redirect allow-list değerlerini `https://kadenewmedia.com/kadexai/auth/callback` ve `https://kadenewmedia.com/kadexai/reset-password` yap.
5. `npm ci && npm run verify` çalıştır.
6. `npm run start` komutunu systemd/PM2 ile `127.0.0.1:3000` üzerinde çalıştır veya Dockerfile'ı kullan.
7. `nginx-kadexai.conf` içeriğini mevcut `kadenewmedia.com` HTTPS server bloğuna ekle. Dosyadaki `map` yönergesini Nginx `http {}` seviyesine ekle.
8. `nginx -t` başarılıysa `systemctl reload nginx` çalıştır.

## Docker

Build-time public Supabase değerleri build argümanı olarak verilmelidir:

```bash
docker build -t kadexai \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY .
docker run --env-file .env.production -p 127.0.0.1:3000:3000 --restart unless-stopped --name kadexai kadexai
```

## Kontrol ve işletim

- Health: `curl -i https://kadenewmedia.com/kadexai/api/health`
- Log: systemd için `journalctl -u kadexai -f`; Docker için `docker logs -f kadexai`.
- Güncelleme: yeni commit'te `npm ci`, migration, `npm run verify`, servis restart, health kontrolü.
- Rollback: önceki git tag/commit'e dön, `npm ci && npm run build`, servisi restart et. Migration'lar ileri uyumlu ve idempotent tutulur; veri tabanında geri alma işlemini yedekten ve ayrı bakım planıyla yap.
- SSL/HSTS ana sitenin mevcut HTTPS server bloğunda yönetilir. Uygulama için ayrı, çakışan bir server bloğu açma.
- `/kadexai` dışındaki istekleri bu servise yönlendirme; ana site route'ları mevcut handler'da kalmalıdır.

Service worker scope'u `/kadexai/` ile sınırlıdır. Kullanıcı API yanıtları `private, no-store` döner; offline içerik önbelleği yapılmaz.
