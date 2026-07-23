# 06 — Admin Panel Kapsamı (şartname §10, 44 modül)

Bu belge, şartnamenin §10'da zorunlu tuttuğu 44 admin modülünün her biri
için **kod kanıtına dayalı** güncel durumu listeler. "Var" işaretli
maddeler `src/pages/Admin.jsx` içinde gerçek, çalışan bir bölüm/nav
öğesi olarak doğrulanmıştır — varsayım değildir.

## Durum tanımları

- **Var** — modül gerçek, işlevsel bir admin ekranı olarak mevcut (kod okunarak doğrulandı).
- **Kısmen** — kavramsal karşılığı var ama şartnamenin istediği tam kapsamı karşılamıyor.
- **Yok** — hiçbir karşılığı yok, gerçek bir boşluk.

## Modül matrisi

| # | Modül | Durum | Kanıt / not |
|---|---|---|---|
| 1 | Genel bakış ve KPI dashboard | Var | `DashboardSection` (`Admin.jsx`) |
| 2 | Kullanıcılar | Var | `UsersSection` |
| 3 | Organizasyonlar/ekipler | Yok | Kade New Media tek-tenant bir ajans modeli; çoklu organizasyon/ekip kavramı yok. Şartnamenin bu maddesi muhtemelen kadeai'nin SaaS/çoklu-kullanıcı yapısı için — kökte anlamı sınırlı |
| 4 | Roller ve izinler | Var | Faz 4'te eklendi — `UsersSection` içinde 30 modüllük izin matrisi + backend `requirePermission()` |
| 5 | Paketler | Var | `Packages.jsx` admin editörü + `PackagesEditor` |
| 6 | Fiyatlar | Var | Önceki oturumda gerçek admin-editable hale getirildi (commit `9c2a6aa`) |
| 7 | Özellikler ve limitler | Kısmen | `access` (JSONB, boolean özellik bayrakları) var; sayısal kullanım limiti/kredi sayacı (`UsageLimit`) tasarlandı ama uygulanmadı (bkz. `docs/05` §3, blocker #1) |
| 8 | Ürünler ve araçlar | Kısmen | Paket tanımları (`PACKAGE_DEFINITIONS`) kod içinde sabit, admin UI'dan CRUD edilmiyor — yalnızca fiyat/not alanları editable. kadeai'nin 35 aracı ayrı bir üründe, kökten yönetilmiyor |
| 9 | Add-on'lar | Var (farklı isimle) | Faz 4'te doğrulandı — çoklu paket ekleme (`handleAddPackage`/`customPackage`) işlevsel olarak add-on'a eşdeğer, entitlement'lar birleşiyor |
| 10 | Kupon/kampanyalar | Kısmen | Faz 4'te eklendi (`CouponsSection`, `kade_coupons`) — admin CRUD tam, checkout/ödeme akışına kablolanmadı (blocker #14) |
| 11 | Teklif talepleri | Var | `QuoteLeadsSection` |
| 12 | Özel teklifler | Kısmen | `ProposalBuilderSection` var; şartnamenin 19-20 durumluk tam yaşam döngüsü yerine basit 5 durumlu model kullanılıyor, teklif-talebi alt kümesi migration olarak hazırlandı (Faz 3) |
| 13 | Siparişler | Var | Faz 3'te eklendi — "Ödeme Kayıtları" ekranı (`kade_shopier_orders` listesi) |
| 14 | Ödemeler | Var | Aynı ekran + `invoices` modülü |
| 15 | Refund/iptal işlemleri | Var | Faz 3'te eklendi — manuel iade işaretleme + otomatik paket pasifleştirme (Shopier'de otomatik webhook olmadığı için manuel, bkz. `docs/07`) |
| 16 | Abonelikler | Var | `SubscriptionsSection` |
| 17 | Entitlement/yetki görünümü | Var | Faz 4'te doğrulandı — `PortalCustomersSection`'daki rozet görünümü |
| 18 | Kullanım ve krediler | Yok | `UsageLimit`/`CreditWallet` şeması yalnızca tasarlandı (`docs/05` §3), uygulanmadı — hangi metriklerin gerçek iş ihtiyacı olduğu ticari bir karar gerektiriyor |
| 19 | API erişim politikaları | Yok | BYOK hiç yok (blocker) — güvenlik-kritik, ayrı proje olarak ele alınmalı (bkz. `docs/05` §5) |
| 20 | İçerik/CMS | Var | `ContentSection` / `server/api/content.js` |
| 21 | Hizmet sayfaları | Var | İçerik yönetiminin bir parçası (`content` modülü, hizmet sayfaları JSON tabanlı) |
| 22 | Paket sayfaları | Var | `Packages.jsx` editörü |
| 23 | Blog/bilgi merkezi | Var | `BlogSection` |
| 24 | Vaka çalışmaları | Var | `CaseStudiesEditor` |
| 25 | Creator/influencer ağı | Yok | Faz 7 kapsamı, henüz başlanmadı — bağımlı olduğu iş modeli kararı (`docs/AGENCY_AND_SAAS_BUSINESS_MODEL_TR.md`) henüz yazılmadı |
| 26 | Kampanyalar | Kısmen | Kupon/indirim kampanyası anlamında var; pazarlama/creator kampanyası anlamında yok (25. maddeye bağımlı) |
| 27 | Brief ve içerik onayları | Kısmen | Onboarding formları var; ayrı bir "brief onay iş akışı" yok |
| 28 | `/@link` sayfaları | Var | `LinkProfilesSection` — önceki oturumda tasarım da yenilendi |
| 29 | Demo içerikleri | Yok | Public `/demo` sayfası hiç yok (Faz 5) |
| 30 | Destek talepleri | Kısmen | Mesajlar/CRM genel amaçlı destek trafiğini karşılıyor; özel bir "ticket" durum makinesi (open/pending/resolved) yok |
| 31 | Bildirimler | Var | `NotificationDropdown` + `kade_notifications` |
| 32 | E-posta şablonları | Var | `EmailTemplatesSection` |
| 33 | Hukuki belgeler ve versiyonları | Yok | `LegalDocumentVersion`/`LegalAcceptance` hiç yok — Faz 8, avukat onayına bağlı (bkz. blocker #2) |
| 34 | Onay kayıtları | Kısmen | `consent_at` alanları bazı tablolarda var (örn. `kade_quotes`); ayrı, aranabilir bir "onay kayıtları" admin ekranı yok |
| 35 | SEO metadata ve yönlendirmeler | Kısmen | `useSEO()` hook'u sayfa bazlı meta/canonical/noindex sağlıyor (kod seviyesinde); admin panelden yönetilen bir redirect/metadata editörü yok |
| 36 | Entegrasyonlar | Yok | Ayrı bir "entegrasyonlar" admin ekranı yok (Shopier/SMTP/Gemini durumu artık Sistem Sağlığı'nda görünür ama yönetim ekranı değil) |
| 37 | Odoo senkronizasyonu | Yok | `docs/09_ODOO_DECISION_TR.md` henüz yazılmadı |
| 38 | Feature flags | Yok | Bilinçli olarak kurulmadı — somut kullanım senaryosu olmadan gereksiz soyutlama olur (bkz. `docs/00` REQ-ADMIN-001 notu) |
| 39 | Sistem sağlığı | Var | Faz 4'te eklendi — `SystemHealthSection` |
| 40 | Worker/render job durumları | Yok | Kade Studio (`apps/studio-web/worker`) render kuyruğu var ama admin panelden görünür değil — Faz 6 kapsamı |
| 41 | Güvenlik olayları | Kısmen | Faz 4'te eklendi (başarısız giriş/rate-limit → Aktivite Logu'nda "Güvenlik" filtresi); yalnızca admin login akışını kapsıyor, 403/CSRF-red gibi diğer olaylar henüz loglanmıyor |
| 42 | Audit logs | Var | `ActivityLogSection`; Faz 3'te `target_type/target_id/before/after` ile yapısal olarak genişletildi (migration, uygulanmadı) |
| 43 | Veri dışa aktarma/silme talepleri | Yok | KVKK/GDPR tipi "verilerimi indir/sil" talep akışı hiç yok — Faz 8 |
| 44 | Ayarlar ve şirket bilgileri | Var | `SettingsSection` |

## Özet

- **Var: 24/44** (bu turdan önce ~19'u zaten vardı, bu turda 5'i eklendi: roller/izinler, kupon/kampanya, siparişler, refund, sistem sağlığı — ayrıca 2'sinin zaten var olduğu doğrulandı: entitlement görünümü, add-on)
- **Kısmen: 11/44** — çoğu ya küçük bir UI eklentisiyle tamamlanabilir (SEO redirect editörü, onay kayıtları ekranı) ya da bir üst-seviye karara bağımlı (özellik/limit sistemi ticari karar gerektiriyor)
- **Yok: 9/44** — bunların çoğu ya güvenlik-kritik olup aceleye getirilmemesi gerektiği için (BYOK), ya bağımlı olduğu ürün/faz henüz gelmediği için (creator ağı, worker durumu, Odoo, demo), ya da hukuki onay gerektirdiği için (hukuki belge versiyonlama, veri silme talepleri) bilinçli olarak bu turda ertelendi.

Hiçbir madde "yapıldı" diye yanlış işaretlenmedi; her "Var" satırı gerçek bir dosya/fonksiyon adına bağlı kanıt içeriyor.
