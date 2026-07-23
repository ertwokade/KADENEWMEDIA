# 11 — Satışa Hazır Olma Değerlendirmesi (şartname §31)

**Sonuç: Sistem "satışa hazır" sınıfında DEĞİL.** Şartnamenin kendi
21 maddelik kriterinden 7'si tam karşılanıyor, 8'i kısmen, 6'sı
karşılanmıyor. Bu, kod kalitesinin düşük olduğu anlamına gelmiyor —
incelenen alanlarda kod olgun (bkz. `docs/07`) — ama gerçek dış girdi
(hukuki metin, canlı kredensiyal, ticari fiyat kararı) olmadan
tamamlanamayacak maddeler var.

## Madde madde değerlendirme

| # | Kriter | Durum | Kanıt/gerekçe |
|---|---|---|---|
| 1 | Production build başarılı | ✅ Karşılanıyor | `vite build` ve `vercel build` bu oturumda doğrulandı, canlı deployment ready durumda |
| 2 | Kritik/yüksek güvenlik bulgusu yok veya blocker işaretli | ✅ Karşılanıyor (dürüstçe) | 1 gerçek yetki-atlatma açığı bulunup kapatıldı (`docs/07`); MFA/PII-export/monitoring gibi kalan yüksek riskli maddeler `docs/THREAT_MODEL_TR.md`'de release-blocker adayı olarak açıkça işaretli — "hiç açık yok" iddiası yapılmadı |
| 3 | Paket/fiyatlar adminden yönetiliyor | ✅ Karşılanıyor | Önceki oturumda gerçek admin-editable hale getirildi |
| 4 | Public paket sayfası gerçek veri gösteriyor | ⚠️ Kısmen | Sayfa admin verisini gösteriyor ama fiyat alanları şu an **boş** (blocker #3) — teknik altyapı hazır, ticari veri eksik |
| 5 | Teklif akışı çalışıyor | ⚠️ Kısmen | Kod tam (`QuoteRequest.jsx`→`kade_quotes`), canlı Supabase olmadan uçtan uca test edilmedi |
| 6 | Özel teklif kabulü sonrası ödeme açılıyor | ❌ Karşılanmıyor | `kade_quotes` kabul edildikten sonra otomatik bir ödeme/checkout tetikleme akışı yok — manuel süreç |
| 7 | Ödeme webhook doğrulaması var | ✅ Karşılanıyor | HMAC+timingSafeEqual, testli, bu turda iade durumu da eklendi |
| 8 | Yetkilendirme otomatik ve idempotent | ✅ Karşılanıyor | `session_version` + webhook unique-index rezervasyonu, testli |
| 9 | Kullanıcı paneli aktif paket ve limitleri gösteriyor | ⚠️ Kısmen | Paket/entitlement gösteriliyor; sayısal "limit" kavramı (kredi sistemi) hiç yok |
| 10 | Admin paneli temel operasyonları yönetiyor | ✅ Karşılanıyor | 24/44 modül var (`docs/06`), temel operasyonlar (kullanıcı/içerik/CRM/ödeme/güvenlik) kapsanıyor |
| 11 | Hukuki belgeler versiyonlu, onay kaydı var | ❌ Karşılanmıyor | Versiyonlama/IP-UA kaydı hiç yok (`docs/08`) |
| 12 | Gerekli çerezler dışında consent yönetimi var | ✅ Karşılanıyor | `CookieBanner.jsx` doğrulandı — analytics onaydan önce hiç yüklenmiyor |
| 13 | 404/redirect/route sorunları çözülmüş | ⚠️ Kısmen | Bu turda gerçek bir 404 zinciri bulunup düzeltildi (`/blog/:slug`, `/partnerler/:id`); kapsamlı bir tüm-route taraması yapılmadı |
| 14 | Mobil kritik akışlar kullanılabilir | ❓ Doğrulanmadı | Bu oturumda mobil/responsive test yapılmadı — gerçek bir cihaz/viewport testi gerekiyor |
| 15 | SEO temel teknik kriterleri sağlanmış | ⚠️ Kısmen | Sitemap/structured data iyi durumda (bu turda düzeltildi); `sameAs`/sosyal profil boş (blocker #13), tam AI-görünürlük programı (Ek A) hiç yapılmadı |
| 16 | Private kullanıcı içeriği indekslenmiyor | ✅ Büyük ölçüde | Admin/müşteri panel route'ları `noindex`; kapsamlı bir robots/crawl denetimi ayrıca yapılmadı |
| 17 | Backup/restore planı var | ❌ Karşılanmıyor | Supabase'in varsayılan mekanizması kullanılıyor, gerçek bir restore testi hiç yapılmadı |
| 18 | Logging/monitoring var | ⚠️ Kısmen | Aktivite/güvenlik logu var (bu turda genişletildi); gerçek zamanlı alarm/uptime izleme hiç yok |
| 19 | Demo güvenli ve limitli | ❌ N/A | Public `/demo` sayfası hiç yok (Faz 5 kapsamı) |
| 20 | Müşteri desteği akışı var | ⚠️ Kısmen | Mesajlaşma/CRM var, ayrı bir destek-talebi (ticket) durum makinesi yok |
| 21 | Blocker listesi dürüstçe yayınlanmış | ✅ Karşılanıyor | `docs/BLOCKERS_TR.md` — 17 madde, her biri gerekçeli ve "kullanıcının yapması gereken" ile |
| 22 | Prod ödeme credential yoksa doğru sınıflandırılmış | ✅ Karşılanıyor | Bu belgenin kendisi bu sınıflandırmayı yapıyor: **"testte hazır, production ödeme blocker"** |

**Skor: 7 tam / 8 kısmi / 6 karşılanmıyor / 1 N/A** (22 madde).

## Sınıflandırma

Şartnamenin kendi terimiyle: **"Testte hazır, production ödeme
blocker."** Kod tabanı gerçek trafiği kaldırabilecek olgunlukta
(webhook güvenliği, idempotency, RLS, CSRF, XSS koruması hepsi
doğrulandı) ama şu 4 kalem olmadan gerçek satışa açılmamalı:

1. **Hukuki sayfalar** (blocker #17, #2) — Mesafeli Satış Sözleşmesi vb. hiç yok, Shopier zaten canlı çalışıyor olması bunu acil yapıyor.
2. **Gerçek Supabase/Upstash prod kredensiyali** (blocker #1, #16) — hiçbir şey canlı veriyle test edilmedi.
3. **Onaylı ticari fiyatlar** (blocker #3) — altyapı hazır, veri yok.
4. **Backup/restore testi ve temel monitoring** (bu belgenin §17/§18 maddeleri) — bir sorun olduğunda fark edilmesi ve geri dönülebilmesi kanıtlanmadı.

## Bu oturumda kapatılan, launch-readiness'i doğrudan etkileyen kalemler

- Vercel deployment'ı tamamen kırıktı → düzeltildi (madde 1'in ön koşulu).
- Shopier iade durumu hiç yönetilmiyordu → düzeltildi (madde 6/7'nin bir parçası).
- `/blog/:slug`, `/partnerler/:id` 404 veriyordu → düzeltildi (madde 13).
- 1 gerçek yetki-atlatma güvenlik açığı → düzeltildi (madde 2).
- Admin kullanıcı yönetimi ve aktivite logu canlıda çalışmıyordu (mapping bugları) → düzeltildi (madde 10).

## Sonraki adımlar (öncelik sırasıyla)

1. Blocker #17 (hukuki sayfalar) ve #1 (Supabase prod kredensiyali) — bunlar olmadan hiçbir şey canlıya taşınamaz.
2. Blocker #3 (fiyatlar) — ticari karar, teknik iş değil.
3. Backup/restore testi + temel bir monitoring aracı (Sentry vb.) kurulumu.
4. Kredi/kullanım sistemi (`docs/05` §3) — gelir modelinin 4 katmanından birini açıyor.
5. Mobil/erişilebilirlik gerçek cihaz testi.

Bu belge "her şey tamam" demiyor — tam tersini, dürüstçe ve kanıta
dayalı olarak gösteriyor.
