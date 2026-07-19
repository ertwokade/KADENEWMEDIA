# Fix Summary

- 169 rotalı `config/route-manifest.json`, kaynak doğrulayıcı ve JSON runtime sonuç üreticisi eklendi.
- Alt sayfalara route-specific raw HTML/nav/H1/açıklama fallback'i verildi; homepage tek H1 ve `kadenewmedia.com` canonical/iç linkleri düzeltildi.
- Shopier için server-owned internal/provider ID, TRY minor amount, entitlement, quota, duration, enabled alanlı katalog eklendi.
- Geçersiz/disabled/amount/currency webhook entitlement vermeden reddediliyor; atomik reservation korunuyor.
- Shopier uzlaştırma mevcut entitlement'ı idempotent bağlar, yoksa `needs_review`; otomatik hak vermez.
- KadeAI production AI kotası Upstash REST + atomik Lua minute/day/cost/idempotency modeline taşındı; servis yoksa fail-closed 503.
- Bundle secret testi üç sentetik canary zorunlu kılıyor ve root dist ile KadeAI static/HTML/RSC build çıktısını tarıyor.
- FastAPI Python 3.12 izole ortamı kuruldu; sync işler thread'e taşındı, bounded timeout, content-type, no-store/nosniff ve redacted health eklendi.
- Supabase migration sırası, explicit RLS ve grant kontrol scripti eklendi.
- Regresyonlar 15 root + 10 KadeAI + 5 FastAPI teste çıkarıldı.

Commit, push, merge, release ve deploy yapılmadı.
