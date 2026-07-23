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
| REQ-DESIGN-002 | §6.2 Referans ürün (rekt/YouMind/ChatCut) fikir değerlendirmesi | Tamamlandı | `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md` — 3 site canlı incelendi (WebFetch), 15 fikir "doğrudan değer/MVP sonrası/gereksiz/hukuki riskli" olarak sınıflandırıldı. Ortak sonuç: kredi/kullanım bazlı erişim modeli ve tek-akışlı çoklu-format üretim pazar standardı — bu, bağımsız olarak zaten tespit edilmiş `docs/05` UsageLimit önceliğini doğruladı. Hiçbir metin/görsel kopyalanmadı |
| REQ-CONTENT-001 | §7 Marka metinleri, misyon/vizyon, marka adı tutarlılığı | Bekliyor | Faz 2/8 |
| REQ-COMMERCE-001 | §8.1 Ticari veri modeli (Product/Plan/Price/Entitlement/Order/...) | Bekliyor | Faz 2/3 — en büyük mimari karar |
| REQ-COMMERCE-002 | §8.2 Haftalık/aylık/yıllık/tek seferlik/özel dönem desteği | Bekliyor | Faz 3 |
| REQ-COMMERCE-003 | §8.3 Özellik/limit matrisi (admin yönetilebilir) | Bekliyor | Faz 3 |
| REQ-COMMERCE-004 | §8.4 API anahtarı modelleri (yok/dahil/BYOK/hibrit) | Bekliyor | Faz 3 |
| REQ-COMMERCE-005 | §8.5 Özel teklif durum makinesi (draft→...→completed) | Kısmen tamamlandı | Faz 3 — `kade_quotes` için teklif-talebi alt kümesi (draft/requested/reviewing/offered/revised/accepted/rejected/expired/cancelled) migration olarak hazırlandı, geriye dönük uyumlu CHECK eklendi; ödeme/sipariş durumları kasıtlı olarak `kade_shopier_orders`'da ayrı tutuluyor; migration canlıya henüz uygulanmadı (bkz. BLOCKERS #1) |
| REQ-COMMERCE-006 | §8.6 Ödeme güvenliği (webhook, idempotency, fiyat snapshot, iade) | Kısmen tamamlandı | Faz 3 — webhook imza/idempotency/fiyat-snapshot zaten sağlamdı (docs/01). Bu turda gerçek bir boşluk kapatıldı: iade/chargeback durumu hiçbir yerde ele alınmıyordu. Kök tarafında Shopier'in otomatik iade webhook'u olmadığı doğrulanıp manuel admin-iade akışı (`?action=orders`/`?action=refund`, migration, "Ödeme Kayıtları" ekranı) eklendi. `apps/kadeai` tarafı hâlâ açık (blocker #15) |
| REQ-COMMERCE-007 | §8.7 Otomatik/granüler entitlement sistemi | Bekliyor | Faz 3 |
| REQ-USER-001 | §9 Teklif alma ve satış hunisi (genişletilmiş form + admin lead pipeline) | Bekliyor | Faz 3/4 |
| REQ-ADMIN-001 | §10 Admin panelini 44 modüllü ürün yönetim merkezine dönüştürme | Kısmen tamamlandı | Tam 44 modülün kod-kanıtlı matrisi artık `docs/06_ADMIN_PANEL_SCOPE_TR.md`'de: **24/44 Var, 11/44 Kısmen, 9/44 Yok**. Bu turda 5 yeni modül eklendi (roller/izinler, kupon/kampanya, siparişler, refund, sistem sağlığı) + 2 modülün zaten var olduğu doğrulandı (entitlement görünümü, add-on). Kalan "Yok" maddeleri güvenlik-kritik (BYOK), bağımlı-faz (creator ağı→Faz7, worker durumu→Faz6) veya hukuki-onay (belge versiyonlama, veri silme talebi) gerektirdiği için bilinçli ertelendi — detay ve gerekçe `docs/06`'da satır satır |
| REQ-ADMIN-003 | §10 Sistem sağlığı paneli (DB bağlantısı, env durumu) | Tamamlandı | Faz 4 — yeni `server/api/system-health.js` (admin-only) + `SystemHealthSection`: Supabase bağlantı/gecikme, Node/uptime, 10 kritik env değişkeninin yalnızca var/yok durumu. Gerçek değerler hiçbir zaman döndürülmüyor. Auth'suz istekte 401 döndüğü izole test edildi |
| REQ-ADMIN-005 | §10 Kupon/kampanya yönetimi | Kısmen tamamlandı | Faz 4 — `kade_coupons` migration (`202607230002_...sql`, uygulanmadı), saf/test edilmiş doğrulama mantığı (`_lib/coupons.js`, 9 unit test) ve tam admin CRUD (`server/api/coupons.js` + `CouponsSection`) eklendi. **Bilinçli olarak checkout/ödeme akışına (Shopier) kablolanmadı** — bu, canlı webhook testi gerektiren ödeme-kritik bir değişiklik, admin UI'da açıkça uyarı gösteriliyor |
| REQ-ADMIN-004 | §10 Müşteri entitlement görünümü | Tamamlandı (önceden mevcuttu) | Faz 4'te doğrulandı — `PortalCustomersSection` zaten `buildEntitlementsFromPackages()` çıktısını rozet olarak gösteriyordu, ek iş gerekmedi |
| REQ-ADMIN-006 | §10 Add-on yönetimi | Tamamlandı (önceden mevcuttu, farklı isimle) | Faz 4'te doğrulandı — `kade_customer_packages` zaten bir müşteriye BİRDEN FAZLA paket/özel paket eklemeye izin veriyor (`handleAddPackage`'daki `customPackage` seçeneği) ve `buildEntitlementsFromPackages()` tüm aktif paketlerin `access` alanlarını birleştiriyor; bu, işlevsel olarak add-on sistemiyle aynı sonucu veriyor. Ayrı bir add-on veri modeli kurmak mevcut mekanizmayla veri/mantık tekrarı yaratırdı, bu yüzden kurulmadı |
| REQ-ADMIN-002 | §10 Roller/izinler yönetim ekranı (modül bazlı izin matrisi) | Tamamlandı | Faz 4 — backend (`kade_users.permissions`, `requirePermission()`) zaten mevcuttu ama admin UI'da izin matrisi hiç yoktu; bu turda `UsersSection`'a 30 modüllük checkbox izin grid'i eklendi (`src/pages/Admin.jsx`), rol değişince varsayılan izinlere sıfırlanıyor, mevcut izinler korunuyor. Ayrıca `server/api/users.js`'te bulunan gerçek bir regresyon düzeltildi: MongoDB→Supabase taşımasında `mapUser()` eklenmemişti, bu yüzden GET/POST yanıtları `_id`/`createdAt` yerine ham `id`/`created_at` dönüyordu ve admin kullanıcı tablosu (düzenle/sil) canlıda çalışmazdı |
| REQ-USER-002 | §11 Müşteri paneli (22 modül) | Bekliyor | Faz 4 |
| REQ-USER-003 | §12 `/@link` modülü (public+admin+kullanıcı) | Bekliyor | Faz 4 — mevcut `/@handle` sistemiyle kısmen örtüşüyor, bkz. docs/01 |
| REQ-USER-004 | §13 Public `/demo` sayfası | Bekliyor | Faz 5 |
| REQ-TOOLS-001 | §14 Kade Creator Studio (YouMind benzeri özgün workspace) | Bekliyor | Faz 5 — yeni ürün, haftalar sürer |
| REQ-TOOLS-002 | §15 Genel sosyal medya araçları (17 araç) | Bekliyor | Faz 5 — apps/kadeai'de kısmen mevcut (bkz. docs/01) |
| REQ-TOOLS-003 | §16 Kişisel sosyal medya analizcisi | Bekliyor | Faz 5 |
| REQ-VIDEO-001 | §17 ChatCut alternatifi AI video editör | Bekliyor | Faz 6 — yeni ürün, `docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md` önce gerekli |
| REQ-COMMERCE-008 | §18 Creator/influencer ve kampanya yönetimi | Bekliyor | Faz 7 |
| REQ-COMMERCE-009 | §19 Ajans+SaaS iş modeli belgesi | Tamamlandı | `docs/AGENCY_AND_SAAS_BUSINESS_MODEL_TR.md` — 10 gelir katmanının 6'sı zaten destekleniyor, 4'ü (kredi paketi, creator campaign fee, white-label, şablon/dijital ürün) gerçek talep olmadan kod yazılmadı. En kritik 2 boşluk önceliklendirildi: iptal akışı+politika sayfası, kredi/kullanım limiti sistemi |
| REQ-ODOO-001 | §20 Odoo değerlendirmesi ve karar | Tamamlandı | `docs/09_ODOO_DECISION_TR.md` — karar: **kurulmayacak**. Mevcut CRM/teklif/fatura/abonelik sistemleri operasyonel ihtiyacı zaten karşılıyor, şartnamenin kendi 6 ön-koşulundan ilki (gerçek operasyonel fayda) bile sağlanmadığı için diğerleri değerlendirilmedi. Yeniden açılma koşulları (gerçek muhasebe/e-fatura zorunluluğu, creator-ağı ölçeği, proje-yönetimi ihtiyacı) belgede net |
| REQ-LEGAL-001 | §21 Fikri mülkiyet ve içerik koruma sistemi | Bekliyor | Faz 8 |
| REQ-LEGAL-002 | §22 Hukuki yükümlülükler (KVKK, e-ticaret, tüketici, mesafeli satış, telif) | Kısmen tamamlandı | `docs/08_LEGAL_COMPLIANCE_CHECKLIST_TR.md` tamamlandı — 19 public hukuki sayfa maddesinin tam envanteri (4 var/onay bekliyor, 15 hiç yok), onay-sistemi teknik denetimi, admin hukuki modülü boşluğu netleştirildi. **En kritik somut boşluk:** Mesafeli Satış Sözleşmesi/Ön Bilgilendirme/Cayma-İptal-İade sayfaları hiç yok ama Shopier ile gerçek satış zaten canlı. Hukuki metin yazımı/onayı hâlâ hukukçu gerektiriyor (blocker #2) |
| REQ-SEC-001 | §23 Kapsamlı güvenlik denetimi (OWASP tam liste) | Kısmen tamamlandı | Faz 8'in kod-seviyesi kısmı erken başlatıldı — `docs/07_SECURITY_AUDIT_TR.md` yalnızca kök `kademedia` API katmanının statik kod incelemesini kapsıyor (canlı pentest değil). 1 gerçek yetki-atlatma açığı bulunup düzeltildi (`chat.js` `adminMode` bypass). `apps/kadeai`/`apps/studio-web`, canlı pentest, bağımlılık taraması, `docs/THREAT_MODEL_TR.md` hâlâ açık |
| REQ-SEC-002 | §22 Admin panelinde "güvenlik olayları" görünümü | Kısmen tamamlandı | Faz 4 — genel Aktivite Logu zaten vardı ama başarısız giriş denemesi/rate-limit tetiklenmesi gibi güvenlik olayları hiç loglanmıyordu. `server/api/auth.js`'e başarısız giriş (`bilinmeyen kullanıcı`/`yanlış şifre`) ve rate-limit-aşıldı olayları için `type: 'security'` logActivity çağrıları eklendi; `Admin.jsx` Aktivite Logu'na "Güvenlik" filtre sekmesi eklendi. Kapsamı sınırlı (yalnızca admin login akışı) — 403/CSRF-red gibi diğer olay türleri henüz kapsanmıyor |
| REQ-SEO-000 | §24 404/redirect/route bütünlüğü | Kısmen tamamlandı | **Gerçek bir bulgu:** `/blog/:slug` ve `/partnerler/:id` route'ları kayıtlıydı ama bileşenleri (`BlogDetail.jsx`/`PartnerDetail.jsx`) tamamen `<NotFound/>` döndüren stub'dı — sitemap'in (Faz 3'te) ürettiği TÜM blog/partner URL'leri 404 veriyordu. Bu turda her iki sayfa gerçek CMS API'lerine bağlanıp düzeltildi (bkz. `docs/ANALYTICS_EVENT_SCHEMA_TR.md`). Genel bir 404/redirect taraması (tüm route'lar, harici bağlantılar) hâlâ yapılmadı |
| REQ-MOBILE-001 | §25 Mobil, erişilebilirlik, performans | Bekliyor | Faz 8 |
| REQ-SEO-001…017 | Ek A — SEO/AEO/GEO/AI görünürlüğü (17 alt belge) | Bekliyor | Faz 8 — **150+ canlı AI sorgusu ve API/hesap erişimi gerektiriyor, bkz. BLOCKERS** |
| REQ-CODE-007 | §27 Analytics event şeması | Kısmen tamamlandı | `docs/ANALYTICS_EVENT_SCHEMA_TR.md` — 10 event'in tam kataloğu, onay-kapılı gönderim doğrulandı (consent olmadan hiçbir event gitmiyor, çift katman). 8 event'ten yalnızca 2'si gerçekten çağrılıyordu; bu turda `package_click`/`blog_read`/`case_study_view` bağlandı. Kalan `cta_click`/`whatsapp_click`/`audit_start`/`map_directions` bilinçli olarak bağlanmadı (gerçek bir CTA haritası olmadan mekanik ekleme gürültü yaratır) |
| REQ-CODE-008 | §28 Bildirimler ve operasyon | Bekliyor | Faz 4 |
| REQ-CODE-009 | §29 Veri/migration/audit log standardı | Kısmen tamamlandı | Faz 2/3/4 — `kade_activity_log`'a `target_type/target_id/before/after` kolonları migration olarak hazırlandı (`202607230001_...sql`); `logActivity()` bu alanları destekleyecek şekilde genişletildi ve migration uygulanana kadar `42703` hatasını yakalayıp otomatik olarak eski alan setiyle geri düşüyor (log yazımı hiç kesilmiyor, bkz. BLOCKERS #1). Faz 4'te ayrıca gerçek bir kod tekrarı bulundu ve giderildi: `server/api/notifications.js` içinde `logActivity`'nin bu güncellemeyi hiç görmeyen, senkron olmayan ikinci bir kopyası vardı — tüm çağrı noktaları aslında o kopyayı kullanıyordu, tek kaynak `_lib/notify.js` oldu. Mevcut ~40 çağrı noktasının `targetType/targetId` ile zenginleştirilmesi kısmi (yalnızca `users.js`/`auth.js` bu turda güncellendi), kalanı düşük öncelikli takip işi |
| REQ-CODE-010 | §30 Otomatik test senaryoları (ticaret/yetki/route/mobil/video/@link) | Bekliyor | Faz 9 |
| REQ-LAUNCH-001 | §31 Satışa hazır olma kriterleri — final değerlendirme | Tamamlandı | `docs/11_LAUNCH_READINESS_TR.md` — 22 madde tek tek değerlendirildi: 7 tam, 8 kısmi, 6 karşılanmıyor, 1 N/A. Sınıflandırma: **"Testte hazır, production ödeme blocker"** (şartnamenin kendi terimiyle). "Satışa hazır" iddiası yapılmadı — 4 kritik eksik (hukuki sayfalar, prod kredensiyal, onaylı fiyat, backup/monitoring testi) net biçimde önceliklendirildi |

---

## Kullanıcının bu oturumdaki doğrudan talebi

| Kimlik | Talep | Durum | Not |
|---|---|---|---|
| REQ-LAUNCH-002 | "CLAUDE_CODE_KADE_MASTER_PROMPT_TR.md'yi bağlayıcı şartname kabul et, önce Faz 0 ve Faz 1'i uygula" | Uygulanıyor | Bu belge + docs/01, docs/03, docs/BLOCKERS, docs/LEGACY_PAGE_GAP_ANALYSIS bu talebin karşılığıdır |

Ek B (başlangıç karar listesi) → `docs/01_CURRENT_STATE_AUDIT_TR.md` içinde dolduruldu.
