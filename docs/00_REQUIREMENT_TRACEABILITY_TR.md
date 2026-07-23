# 00 — Gereksinim İzlenebilirlik Matrisi

Kaynak: `CLAUDE_CODE_KADE_MASTER_PROMPT_TR.md` (kök dizin, 2809 satır) ve Ek A/Ek B.

**Granülerlik notu:** Şartname yüzlerce atomik madde içeriyor (ör. Ek A tek başına
150+ maddelik bir SEO/AI-görünürlük programı). Her tek cümleye ayrı kimlik vermek
matrisin kendisini kullanılamaz hale getirir. Bu yüzden kimlikler, şartnamenin kendi
bölüm numaralarıyla (§3–§35, Ek A, Ek B) hizalı **özellik grubu** seviyesinde
verildi. Bir özellik grubu geliştirme aşamasına geçtiğinde, o grup alt gereksinimlere
bölünüp yeni alt kimlikler (`REQ-COMMERCE-002a` gibi) bu tabloya eklenecek.

Bu belge **canlı bir belgedir** — her fazda güncellenecek, geçmiş durumlar silinmeyecek.

## Durum tanımları

Bekliyor · İnceleniyor · Uygulanıyor · Test ediliyor · Tamamlandı · Kısmen tamamlandı · Blocker · Uygun bulunmadı

---

## Faz 0/1 kapsamındaki gereksinimler (bu turda işlendi)

| Kimlik | Gereksinim | Durum | İlgili rota/modül | Değişen dosyalar | Test kanıtı | Blocker | Not |
|---|---|---|---|---|---|---|---|
| REQ-CODE-000 | §1.1 Gereksinim izlenebilirlik belgesi | Tamamlandı | docs/ | docs/00_REQUIREMENT_TRACEABILITY_TR.md | Bu dosyanın varlığı | — | İlk zorunlu adım |
| REQ-CODE-001 | §4.1 Repo/stack/env envanteri | Tamamlandı | tüm repo | docs/01_CURRENT_STATE_AUDIT_TR.md | Bkz. Faz 0 raporu | — | |
| REQ-CODE-002 | §4.1 Baseline lint/typecheck/test/build | Tamamlandı | root + apps/kadeai | — | root lint 26 hata/7 uyarı (önceden var), root test 15/15, root build ✓, kadeai lint 0, typecheck 0, test 23/23, build ✓ | — | Komut çıktıları docs/01'de |
| REQ-CODE-003 | §4.2 Kod kalitesi denetimi (ölü kod, hardcoded veri, N+1, vb.) | Kısmen tamamlandı | tüm repo | docs/01_CURRENT_STATE_AUDIT_TR.md | Statik inceleme, önceki 20/22 Temmuz denetim raporlarıyla çapraz kontrol | — | Tam satır-satır denetim Faz 2+'da derinleşecek |
| REQ-CODE-004 | §4.2 Güvenlik bulguları (ilk tarama) | Kısmen tamamlandı | server/api, apps/kadeai | docs/01_CURRENT_STATE_AUDIT_TR.md | Statik inceleme | — | Ayrıntılı OWASP taraması §23 kapsamında Faz 8'de |
| REQ-CODE-005 | §4.3 Tüm `/` rota envanteri | Tamamlandı | src/App.jsx, apps/kadeai/app | docs/03_ROUTE_INVENTORY_TR.md | Route dosyaları elle+grep ile çıkarıldı | — | |
| REQ-LEGACY-001 | §5 26 Haziran eski sürümü bul, izole çalıştır, karşılaştır | Tamamlandı | kademedia_backup_20260717_104653 git geçmişi | docs/LEGACY_PAGE_GAP_ANALYSIS_TR.md | Worktree'de çalıştırıldı, ekran görüntüleriyle karşılaştırıldı | — | |
| REQ-CODE-006 | §1.2 Blocker yönetimi altyapısı | Tamamlandı | — | docs/BLOCKERS_TR.md | Belgenin varlığı | — | |

## Sonraki fazlarda işlenecek gereksinim grupları (bu turda BAŞLANMADI — "Bekliyor")

| Kimlik | Gereksinim (şartname bölümü) | Durum | Not |
|---|---|---|---|
| REQ-DESIGN-001 | §6 Tasarım sistemi ve tokenlar, ortak bileşenler | Bekliyor | Faz 2 |
| REQ-DESIGN-002 | §6.2 Referans ürün (rekt/YouMind/ChatCut) fikir değerlendirmesi | Bekliyor | Faz 2, `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md` |
| REQ-CONTENT-001 | §7 Marka metinleri, misyon/vizyon, marka adı tutarlılığı | Bekliyor | Faz 2/8 |
| REQ-COMMERCE-001 | §8.1 Ticari veri modeli (Product/Plan/Price/Entitlement/Order/...) | Bekliyor | Faz 2/3 — en büyük mimari karar |
| REQ-COMMERCE-002 | §8.2 Haftalık/aylık/yıllık/tek seferlik/özel dönem desteği | Bekliyor | Faz 3 |
| REQ-COMMERCE-003 | §8.3 Özellik/limit matrisi (admin yönetilebilir) | Bekliyor | Faz 3 |
| REQ-COMMERCE-004 | §8.4 API anahtarı modelleri (yok/dahil/BYOK/hibrit) | Bekliyor | Faz 3 |
| REQ-COMMERCE-005 | §8.5 Özel teklif durum makinesi (draft→...→completed) | Kısmen tamamlandı | Faz 3 — `kade_quotes` için teklif-talebi alt kümesi (draft/requested/reviewing/offered/revised/accepted/rejected/expired/cancelled) migration olarak hazırlandı, geriye dönük uyumlu CHECK eklendi; ödeme/sipariş durumları kasıtlı olarak `kade_shopier_orders`'da ayrı tutuluyor; migration canlıya henüz uygulanmadı (bkz. BLOCKERS #1) |
| REQ-COMMERCE-006 | §8.6 Ödeme güvenliği (webhook, idempotency, fiyat snapshot) | Bekliyor | Faz 3 — kritik, kısmen apps/kadeai'de mevcut (bkz. docs/01) |
| REQ-COMMERCE-007 | §8.7 Otomatik/granüler entitlement sistemi | Bekliyor | Faz 3 |
| REQ-USER-001 | §9 Teklif alma ve satış hunisi (genişletilmiş form + admin lead pipeline) | Bekliyor | Faz 3/4 |
| REQ-ADMIN-001 | §10 Admin panelini 44 modüllü ürün yönetim merkezine dönüştürme | Kısmen tamamlandı | Faz 4 — mevcut admin ~30 fonksiyonel bölüm içeriyor (bkz. docs/01); bu turda roller/izinler, sistem sağlığı modülleri eklendi, entitlement görünümünün zaten var olduğu doğrulandı (aşağıya bkz.), kalan ~20 modül (kupon/kampanya, add-on, API erişim politikaları/BYOK, creator ağı, worker/render job durumu vb.) açık. **Feature flags modülü bilinçli olarak bu turda kurulmadı**: şu an hiçbir kod yolu koşullu bir flag'e bağlı değil, somut bir kullanım senaryosu olmadan bir flag sistemi kurmak şartnamenin kendi "gereksiz soyutlama ekleme" kuralına aykırı olur — ilk gerçek ihtiyaç (örn. kademeli bir özellik rollout'u) doğduğunda birlikte kurulmalı |
| REQ-ADMIN-003 | §10 Sistem sağlığı paneli (DB bağlantısı, env durumu) | Tamamlandı | Faz 4 — yeni `server/api/system-health.js` (admin-only) + `SystemHealthSection`: Supabase bağlantı/gecikme, Node/uptime, 10 kritik env değişkeninin yalnızca var/yok durumu. Gerçek değerler hiçbir zaman döndürülmüyor. Auth'suz istekte 401 döndüğü izole test edildi |
| REQ-ADMIN-005 | §10 Kupon/kampanya yönetimi | Kısmen tamamlandı | Faz 4 — `kade_coupons` migration (`202607230002_...sql`, uygulanmadı), saf/test edilmiş doğrulama mantığı (`_lib/coupons.js`, 9 unit test) ve tam admin CRUD (`server/api/coupons.js` + `CouponsSection`) eklendi. **Bilinçli olarak checkout/ödeme akışına (Shopier) kablolanmadı** — bu, canlı webhook testi gerektiren ödeme-kritik bir değişiklik, admin UI'da açıkça uyarı gösteriliyor |
| REQ-ADMIN-004 | §10 Müşteri entitlement görünümü | Tamamlandı (önceden mevcuttu) | Faz 4'te doğrulandı — `PortalCustomersSection` zaten `buildEntitlementsFromPackages()` çıktısını rozet olarak gösteriyordu, ek iş gerekmedi |
| REQ-ADMIN-002 | §10 Roller/izinler yönetim ekranı (modül bazlı izin matrisi) | Tamamlandı | Faz 4 — backend (`kade_users.permissions`, `requirePermission()`) zaten mevcuttu ama admin UI'da izin matrisi hiç yoktu; bu turda `UsersSection`'a 30 modüllük checkbox izin grid'i eklendi (`src/pages/Admin.jsx`), rol değişince varsayılan izinlere sıfırlanıyor, mevcut izinler korunuyor. Ayrıca `server/api/users.js`'te bulunan gerçek bir regresyon düzeltildi: MongoDB→Supabase taşımasında `mapUser()` eklenmemişti, bu yüzden GET/POST yanıtları `_id`/`createdAt` yerine ham `id`/`created_at` dönüyordu ve admin kullanıcı tablosu (düzenle/sil) canlıda çalışmazdı |
| REQ-USER-002 | §11 Müşteri paneli (22 modül) | Bekliyor | Faz 4 |
| REQ-USER-003 | §12 `/@link` modülü (public+admin+kullanıcı) | Bekliyor | Faz 4 — mevcut `/@handle` sistemiyle kısmen örtüşüyor, bkz. docs/01 |
| REQ-USER-004 | §13 Public `/demo` sayfası | Bekliyor | Faz 5 |
| REQ-TOOLS-001 | §14 Kade Creator Studio (YouMind benzeri özgün workspace) | Bekliyor | Faz 5 — yeni ürün, haftalar sürer |
| REQ-TOOLS-002 | §15 Genel sosyal medya araçları (17 araç) | Bekliyor | Faz 5 — apps/kadeai'de kısmen mevcut (bkz. docs/01) |
| REQ-TOOLS-003 | §16 Kişisel sosyal medya analizcisi | Bekliyor | Faz 5 |
| REQ-VIDEO-001 | §17 ChatCut alternatifi AI video editör | Bekliyor | Faz 6 — yeni ürün, `docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md` önce gerekli |
| REQ-COMMERCE-008 | §18 Creator/influencer ve kampanya yönetimi | Bekliyor | Faz 7 |
| REQ-COMMERCE-009 | §19 Ajans+SaaS iş modeli belgesi | Bekliyor | Faz 7, `docs/AGENCY_AND_SAAS_BUSINESS_MODEL_TR.md` |
| REQ-ODOO-001 | §20 Odoo değerlendirmesi ve karar | Bekliyor | Faz 7, `docs/09_ODOO_DECISION_TR.md` |
| REQ-LEGAL-001 | §21 Fikri mülkiyet ve içerik koruma sistemi | Bekliyor | Faz 8 |
| REQ-LEGAL-002 | §22 Hukuki yükümlülükler (KVKK, e-ticaret, tüketici, mesafeli satış, telif) | Bekliyor | Faz 8 — **hukukçu onayı gerektirir, bkz. BLOCKERS** |
| REQ-SEC-001 | §23 Kapsamlı güvenlik denetimi (OWASP tam liste) | Bekliyor | Faz 8, `docs/07_SECURITY_AUDIT_TR.md`, `docs/THREAT_MODEL_TR.md` |
| REQ-SEC-002 | §22 Admin panelinde "güvenlik olayları" görünümü | Kısmen tamamlandı | Faz 4 — genel Aktivite Logu zaten vardı ama başarısız giriş denemesi/rate-limit tetiklenmesi gibi güvenlik olayları hiç loglanmıyordu. `server/api/auth.js`'e başarısız giriş (`bilinmeyen kullanıcı`/`yanlış şifre`) ve rate-limit-aşıldı olayları için `type: 'security'` logActivity çağrıları eklendi; `Admin.jsx` Aktivite Logu'na "Güvenlik" filtre sekmesi eklendi. Kapsamı sınırlı (yalnızca admin login akışı) — 403/CSRF-red gibi diğer olay türleri henüz kapsanmıyor |
| REQ-SEO-000 | §24 404/redirect/route bütünlüğü | Bekliyor | Faz 8 |
| REQ-MOBILE-001 | §25 Mobil, erişilebilirlik, performans | Bekliyor | Faz 8 |
| REQ-SEO-001…017 | Ek A — SEO/AEO/GEO/AI görünürlüğü (17 alt belge) | Bekliyor | Faz 8 — **150+ canlı AI sorgusu ve API/hesap erişimi gerektiriyor, bkz. BLOCKERS** |
| REQ-CODE-007 | §27 Analytics event şeması | Bekliyor | Faz 4 |
| REQ-CODE-008 | §28 Bildirimler ve operasyon | Bekliyor | Faz 4 |
| REQ-CODE-009 | §29 Veri/migration/audit log standardı | Kısmen tamamlandı | Faz 2/3/4 — `kade_activity_log`'a `target_type/target_id/before/after` kolonları migration olarak hazırlandı (`202607230001_...sql`); `logActivity()` bu alanları destekleyecek şekilde genişletildi ve migration uygulanana kadar `42703` hatasını yakalayıp otomatik olarak eski alan setiyle geri düşüyor (log yazımı hiç kesilmiyor, bkz. BLOCKERS #1). Faz 4'te ayrıca gerçek bir kod tekrarı bulundu ve giderildi: `server/api/notifications.js` içinde `logActivity`'nin bu güncellemeyi hiç görmeyen, senkron olmayan ikinci bir kopyası vardı — tüm çağrı noktaları aslında o kopyayı kullanıyordu, tek kaynak `_lib/notify.js` oldu. Mevcut ~40 çağrı noktasının `targetType/targetId` ile zenginleştirilmesi kısmi (yalnızca `users.js`/`auth.js` bu turda güncellendi), kalanı düşük öncelikli takip işi |
| REQ-CODE-010 | §30 Otomatik test senaryoları (ticaret/yetki/route/mobil/video/@link) | Bekliyor | Faz 9 |
| REQ-LAUNCH-001 | §31 Satışa hazır olma kriterleri — final değerlendirme | Bekliyor | Faz 9 |

---

## Kullanıcının bu oturumdaki doğrudan talebi

| Kimlik | Talep | Durum | Not |
|---|---|---|---|
| REQ-LAUNCH-002 | "CLAUDE_CODE_KADE_MASTER_PROMPT_TR.md'yi bağlayıcı şartname kabul et, önce Faz 0 ve Faz 1'i uygula" | Uygulanıyor | Bu belge + docs/01, docs/03, docs/BLOCKERS, docs/LEGACY_PAGE_GAP_ANALYSIS bu talebin karşılığıdır |

Ek B (başlangıç karar listesi) → `docs/01_CURRENT_STATE_AUDIT_TR.md` içinde dolduruldu.
