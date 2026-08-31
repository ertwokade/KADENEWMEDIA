# CLAUDE CODE ANA UYGULAMA PROMPTU — KADE NEW MEDIA + KadexAI

## 0. Görevin niteliği

Bu görev yalnızca tasarım düzeltme, birkaç sayfa ekleme veya öneri raporu hazırlama görevi değildir. Mevcut kod tabanını baştan sona denetleyerek Kade New Media ve KadexAI ekosistemini teknik, ticari, hukuki, güvenlik, SEO, mobil kullanılabilirlik ve satış operasyonu bakımından üretime ve gerçek satışa hazır hâle getireceksin.

Çalışma boyunca bütün açıklamalarını, ilerleme bildirimlerini, raporları, görev listelerini, commit açıklamalarını ve kullanıcıya sunduğun sonuç özetlerini Türkiye Türkçesiyle yaz. Kod içindeki mevcut İngilizce isimlendirmeyi sırf Türkçeleştirmek için bozma; fakat kullanıcıya yönelik metinler doğal Türkçe olmalı.

Kullanıcıya gizli düşünce zinciri sunma. Bunun yerine her aşamada doğrulanabilir bir işlem özeti ver:

- Ne inceledin?
- Ne buldun?
- Neyi değiştirdin?
- Hangi dosyalara dokundun?
- Nasıl test ettin?
- Sonuç ne oldu?
- Hangi gerçek engeller kaldı?

Görevleri atlama, sessizce kapsam dışına çıkarma veya “sonra yapılır” diyerek kapatma. Yapılamayan her maddeyi açık bir blocker olarak kaydet ve devam edebildiğin diğer işleri tamamla.

---

## 1. Bağlayıcı çalışma kuralları

### 1.1 Gereksinim izlenebilirliği

İlk iş olarak repo kökünde `docs/00_REQUIREMENT_TRACEABILITY_TR.md` oluştur. Bu belgedeki her kullanıcı isteğine benzersiz bir kimlik ver:

- `REQ-CODE-*`
- `REQ-DESIGN-*`
- `REQ-COMMERCE-*`
- `REQ-ADMIN-*`
- `REQ-USER-*`
- `REQ-TOOLS-*`
- `REQ-VIDEO-*`
- `REQ-SEO-*`
- `REQ-LEGAL-*`
- `REQ-SEC-*`
- `REQ-MOBILE-*`
- `REQ-LEGACY-*`
- `REQ-ODOO-*`
- `REQ-LAUNCH-*`

Her gereksinim için şu alanları tut:

| Kimlik | Gereksinim | Durum | İlgili rota/modül | Değişen dosyalar | Test kanıtı | Blocker | Not |
|---|---|---|---|---|---|---|---|

İzin verilen durumlar:

- Bekliyor
- İnceleniyor
- Uygulanıyor
- Test ediliyor
- Tamamlandı
- Kısmen tamamlandı
- Blocker
- Uygun bulunmadı

Bir gereksinimi yalnızca kodu, veritabanı değişikliği, yetkilendirme, hata durumları, testleri ve kullanıcı akışı birlikte tamamlandıysa “Tamamlandı” olarak işaretle. Sadece arayüz çizmek tamamlanmış sayılmaz.

### 1.2 Güvenli çalışma

- Mevcut çalışan sistemi yıkma.
- Önce Git durumunu, aktif branch’i, son commitleri ve çalışma ağacını incele.
- Kullanıcının mevcut değişikliklerini silme, resetleme veya ezme.
- Büyük değişiklikleri mantıksal, geri alınabilir adımlara böl.
- Veri kaybına yol açabilecek migration üretme; gerekiyorsa backfill ve rollback planı oluştur.
- Production veritabanında doğrudan deneme yapma.
- Gerçek ödeme çekme; test/sandbox ortamı kullan.
- Gerçek API anahtarlarını loglama, istemciye gönderme veya repoya yazma.
- Mevcut mimariyi anlamadan framework, veritabanı, kimlik doğrulama sistemi veya deployment sağlayıcısını değiştirme.
- Yeni bağımlılık eklemeden önce mevcut araçlarla çözülebilir mi kontrol et.
- Gereksiz mikroservis, mesaj kuyruğu, Odoo veya ağır altyapı ekleme. Her önemli mimari karar için gerekçe yaz.

### 1.3 Blocker yönetimi

Kimlik bilgisi, şirket bilgisi, ödeme sağlayıcı hesabı, vergi bilgisi, doğrulanmış sosyal medya hesabı, gerçek müşteri sonucu veya hukukçu onayı eksikse çalışmayı durdurma. Şunları yap:

1. Güvenli adapter veya test modu oluştur.
2. Yapılandırmayı ortam değişkenlerine bağla.
3. Sahte kurumsal veri uydurma.
4. Arayüzde production’a yanlış bilgi çıkmasını engelle.
5. Eksik bilgiyi `docs/BLOCKERS_TR.md` içinde açıkça kaydet.
6. Kullanıcının tamamlaması gereken adımları net olarak yaz.

### 1.4 Kalite kapıları

Her ana aşamanın sonunda mevcut stack’e uygun komutları çalıştır:

- bağımlılık kurulumu doğrulaması
- lint
- format kontrolü
- typecheck
- unit test
- integration test
- E2E test
- production build
- migration dry-run veya test migration
- route crawl
- kırık link kontrolü
- güvenlik taraması
- Lighthouse veya eşdeğer performans kontrolü

Mevcut projede bu altyapı yoksa, projeyi şişirmeden asgari ama gerçek bir test altyapısı kur. Testi geçmeyen işi tamamlandı olarak raporlama.

---

## 2. Çalışma iletişimi

Uzun süre sessiz kalma. Her anlamlı aşamada aşağıdaki kısa Türkçe formatı kullan:

```text
[AŞAMA X — Başlık]
Amaç: ...
Bulgu: ...
Yapılan: ...
Doğrulama: ...
Kalan: ...
```

Komut satırı çıktısını gereksiz yere dökme. Önemli hata, uyarı ve test sonucunu özetle. “Her şey tamam” gibi kanıtsız ifadeler kullanma.

---

## 3. Proje bağlamı ve temel hedef

Kade New Media yalnızca bir ajans sitesi olmayacak. Aşağıdaki gelir modellerini tek, tutarlı ve yönetilebilir ekosistemde birleştirecek:

1. Ajans hizmetleri
2. Sabit paketler
3. Haftalık, aylık ve yıllık abonelikler
4. Kişiye veya kuruma özel teklif ve paketler
5. Kredi/kullanım bazlı AI araçları
6. API erişimli ve API erişimsiz paketler
7. Kullanıcının kendi API anahtarını getirdiği BYOK seçenekleri
8. Kade tarafından sağlanan API kredisi içeren seçenekler
9. Tek seferlik dijital ürün veya proje siparişleri
10. Creator/influencer kampanyaları
11. White-label ve ajans/kurumsal hesap seçenekleri
12. Gelecekte marketplace veya partner satışı için genişleyebilir yapı

Ana hedef: Siteyi ve paneli gerçek kullanıcının güvenle paket seçebildiği, teklif alabildiği, ödeme yapabildiği, satın aldığı yetkilere otomatik eriştiği, kullanımını takip ettiği ve gerektiğinde destek aldığı satışa hazır bir ürüne dönüştürmek.

---

## 4. Önce mevcut durumu eksiksiz keşfet

Kod yazmadan önce aşağıdakileri çıkar ve `docs/01_CURRENT_STATE_AUDIT_TR.md` dosyasına kaydet:

### 4.1 Repo ve stack envanteri

- Monorepo veya tek uygulama yapısı
- Tüm `package.json`, lockfile ve workspace tanımları
- Framework ve sürümler
- Vite/Next.js/React/Vue veya diğer uygulamalar
- Backend framework’ü
- Veritabanı ve ORM
- Auth sistemi
- Mevcut ödeme entegrasyonu
- Dosya/object storage
- Queue/worker sistemi
- E-posta/SMS sistemi
- Analytics
- Deployment ve Vercel ayarları
- Domain ve alt domain eşleşmeleri
- Ortam değişkenleri
- CI/CD
- Test altyapısı
- Admin ve kullanıcı paneli rotaları
- Public site rotaları
- API rotaları
- Cron işleri
- Feature flag sistemi
- Logging ve monitoring
- Kullanılan AI sağlayıcıları

### 4.2 Kod kalitesi denetimi

Bütün kodu yalnızca dosya adına bakarak değil, bağımlılık ve çağrı akışlarıyla incele. Şunları tespit et:

- Ölü kod
- Kullanılmayan bileşenler
- Yinelenen bileşenler
- Tutarsız tasarım sistemleri
- Hardcoded fiyatlar, paketler ve metinler
- Hardcoded rol/yetki kontrolleri
- Güvensiz API anahtarı kullanımı
- Hatalı environment fallback’leri
- İstemciye sızan sırlar
- Eksik error boundary
- Sessizce yutulan hatalar
- N+1 sorgular
- Yavaş sorgular
- Eksik indexler
- Yarış koşulları
- Idempotency eksikleri
- Çok kiracılı yapı varsa tenant izolasyon sorunları
- Yetkisiz nesne erişimi
- Eksik input doğrulaması
- Dosya upload riskleri
- Webhook doğrulama eksikleri
- Eksik audit log
- Broken routes
- 404/500/soft 404
- Mobil taşma sorunları
- Erişilebilirlik sorunları
- SEO render sorunları

Her bulguya önem seviyesi ver: Kritik, Yüksek, Orta, Düşük.

### 4.3 Rota envanteri

`docs/03_ROUTE_INVENTORY_TR.md` oluştur. Uygulamadaki `/` ile başlayan bütün rotaları otomatik ve manuel olarak çıkar:

- Public
- Auth
- Müşteri paneli
- Admin
- API
- Callback
- Webhook
- Preview/test
- Legacy
- Redirect
- 404’e düşen
- Yetim rota

Her rota için şunları yaz:

- Amaç
- Kim erişebilir
- HTTP durumu
- Canonical/index durumu
- Mobil durumu
- Veri kaynağı
- Tasarım uyumu
- Hata durumu
- Yapılacak işlem

Hiçbir `/` rotasını “muhtemelen kullanılmıyor” diyerek atlama.

---

## 5. 26 Haziran tarihli eski KadeMedia dosyasını kurtarma ve karşılaştırma

Kullanıcının belirttiği 26 Haziran tarihli eski KadeMedia/kademedia/kadenewmedia dosyasını proje, disk, arşiv, branch, tag, backup veya komşu klasörlerde ara. Tarihin yılı belirsizse dosya metadata’sı ve Git geçmişiyle en olası sürümü tespit et. Bulduğun adayları silmeden raporla.

### Zorunlu süreç

1. Eski sürümü ayrı worktree, branch, klasör veya izole çalışma ortamında çalıştır.
2. Kurulum ve build hatalarını giderirken orijinal dosyayı bozma.
3. Eski sürümdeki bütün rotaları, sayfaları, içerikleri, assetleri, animasyonları ve bileşenleri çıkar.
4. Mevcut sürümle karşılaştır.
5. `docs/LEGACY_PAGE_GAP_ANALYSIS_TR.md` oluştur.
6. Eksik ama hâlâ gerekli sayfaları güncel mimariye taşı.
7. Eski tasarımı körlemesine geri getirme; güncel `kadenewmedia.com` ana sayfa tasarım diliyle yeniden uygula.
8. Aynı işlevin daha güncel sürümü varsa duplicate oluşturma.
9. Eski güvenlik açığını, bağımlılığı veya hardcoded secret’ı taşımama.
10. Her taşınan sayfa için kaynak rota → yeni rota eşlemesi ve test kanıtı yaz.

Eski dosya bulunamazsa en az üç farklı arama yöntemi dene ve blocker olarak kanıtla.

---

## 6. Tasarım sistemi ve bütün rotaların görsel birliği

`https://kadenewmedia.com` ana sayfasındaki mevcut marka dili, tipografi yaklaşımı, hareket hissi, boşluk kullanımı ve görsel karakter bu proje için birincil tasarım referansıdır. Ana sayfayı olduğu gibi bırakmak zorunda değilsin; ancak bütün diğer sayfalar onunla aynı tasarım ailesinden görünmeli.

### 6.1 Yapılacaklar

- Mevcut ana sayfanın design tokenlarını çıkar.
- Renkler, tipografi, grid, spacing, radius, shadow, border, icon ve motion tokenları oluştur.
- Ortak `Layout`, `Header`, `Footer`, `Section`, `Container`, `Button`, `Card`, `Form`, `Modal`, `Toast`, `Table`, `Tabs`, `EmptyState`, `Skeleton`, `ErrorState` bileşenleri oluştur veya birleştir.
- Public site, admin ve müşteri panelinin aynı marka ailesinde fakat kullanım amacına uygun ayrı yoğunluk seviyeleri olsun.
- Bütün rotalarda header/footer/nav tutarlı çalışsın.
- Animasyonlar performanslı, erişilebilir ve `prefers-reduced-motion` uyumlu olsun.
- Mobilde yatay taşma, küçük tıklama alanı, sabit eleman çakışması, modal taşması, tablo kullanılamazlığı ve keyboard sorunlarını bitir.
- Formlarda loading, success, error, retry ve validation durumları olsun.
- Boş veri durumlarında örnek veya yönlendirme göster.
- Dark/light tema varsa bütün sayfalarda tutarlı çalışsın.
- 404, 403, 401, 429, 500 ve bakım sayfalarını aynı tasarım sistemiyle oluştur.

### 6.2 Referans siteler

Aşağıdaki siteleri benchmark olarak incele, fakat metinlerini, görsel kimliklerini, animasyonlarını, özel kodlarını, vaka çalışmalarını veya arayüzlerini kopyalama:

- `https://rekt.work/`
- `https://youmind.com/tr-TR`
- `https://chatcut.io/`

Stratejik olarak değerlendirilecek fikirler:

- Rekt: creator ağı, kampanya akışı, hizmet süreci, ölçüm panosu, creator–marka eşleştirme, vaka sunumu ve white-label modeli.
- YouMind: proje çalışma alanı, kaynak toplama, marka hafızası, yeniden kullanılabilir beceriler/şablonlar, prompt kütüphanesi ve metin–görsel–video–web üretimini tek akışta birleştirme.
- ChatCut: konuşmalı video düzenleme, transkript üzerinden kurgu, otomatik altyazı, highlight/sessizlik/filler temizliği, motion graphic, B-roll önerisi ve kredi bazlı kullanım modeli.

Her benchmark fikri için `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md` içinde şu kararı ver:

- Kade’ye doğrudan değer katar
- MVP sonrası düşünülmeli
- Gereksiz/uygunsuz
- Hukuki veya mali riskli

---

## 7. Marka metinleri, misyon, vizyon ve içerik dili

Site içindeki bütün metinleri denetle. Marka adını ve ürün ilişkilerini tutarlı hâle getir:

- Kade New Media: ana marka/ajans
- KadexAI: ürün ailesi veya platform; gerçek şirket statüsü doğrulanmadan ayrı şirket gibi sunma
- Kade Media/Kademedia/Kadenewmedia varyasyonları: SEO amaçlı görünür metin içinde spam yapmadan entity eşlemesi

Doğrulanmamış kurucu, ekip, müşteri, ödül, sonuç veya başarı uydurma.

### Oluşturulacak içerikler

- Net ana sayfa değer önerisi
- Misyon
- Vizyon
- Marka prensipleri
- Hizmet yaklaşımı
- AI ve insan kontrolünün rolleri
- Ajans + araç platformu konumlandırması
- “Neden Kade?” bölümü
- Çalışma süreci
- Paket açıklamaları
- SSS
- Güvenlik ve gizlilik mesajları
- Teklif süreci
- Demo açıklaması
- Müşteri paneli onboarding metinleri
- Admin boş durum ve yardım metinleri

Jenerik “dijitalde fark yaratın” türü tekrarları azalt; süreç, çıktı, süre, kapsam, limit ve sorumlulukları somut anlat.

---

## 8. Ticari veri modeli: paket, fiyat, teklif, sipariş ve yetkilendirme

Fiyatlar ve paket özellikleri frontend içinde hardcoded kalmayacak. Admin panelinden yönetilen, versiyonlanan ve public sitede güvenli biçimde yayımlanan merkezi bir ticari katalog oluştur.

### 8.1 Temel varlıklar

Mevcut modele uyarlayarak en az şu kavramları destekle:

- Product
- Service
- Tool
- Plan
- Price
- BillingInterval
- Feature
- FeatureValue
- UsageLimit
- CreditWallet
- AddOn
- Coupon/Promotion
- TaxConfiguration
- Currency
- CustomOffer
- OfferLine
- QuoteRequest
- Order
- OrderLine
- Payment
- Refund
- Subscription
- SubscriptionChange
- Entitlement
- APIAccessPolicy
- UserApiCredential/BYOK
- InvoiceReference
- LegalDocumentVersion
- LegalAcceptance
- ProvisioningJob
- UsageEvent
- AuditLog

### 8.2 Paket dönemleri

Paketler en az şu periyotları desteklemeli:

- Haftalık
- Aylık
- Yıllık
- Tek seferlik
- Kişiye özel dönem

Dönem ve yenileme mantığını ödeme sağlayıcısının tek özelliğine bağlama. Sağlayıcı haftalık aboneliği desteklemiyorsa uygulama katmanında açık ve güvenli bir model kur veya bu kombinasyonu admin tarafından devre dışı bırak.

### 8.3 Özellik matrisi

Her paket için admin tarafından yönetilebilen özellik matrisi oluştur:

- Araç erişimi
- Kullanıcı/ekip üyesi sayısı
- Proje sayısı
- Depolama limiti
- Aylık/haftalık kredi
- Video dakika limiti
- Render çözünürlüğü
- Export watermark durumu
- Sosyal hesap sayısı
- Rapor sayısı
- İçerik üretim limiti
- API erişimi var/yok
- Dahil API kredisi
- BYOK izni
- Öncelikli destek
- White-label
- Ajans hizmeti kapsamı
- Revizyon hakkı
- Onboarding
- SLA

Public fiyat kartları bu gerçek veriden beslensin. Gizli veya taslak paketler sitede görünmesin.

### 8.4 API anahtarları

Paketleri açıkça ayır:

1. API erişimi yok
2. Kade kredisi/API maliyeti pakete dahil
3. Kullanıcı kendi anahtarını getirir (BYOK)
4. Hibrit kullanım

Kurallar:

- Master/provider anahtarını istemciye verme.
- Kullanıcı anahtarını şifreli sakla.
- Anahtarı loglama veya admin listesinde düz metin gösterme.
- Anahtar testini güvenli backend endpoint’i üzerinden yap.
- Sağlayıcı bazlı limit ve maliyet takibi yap.
- Kredi bittiğinde beklenmedik fatura üretme; açık davranış ve uyarı göster.

### 8.5 Kişiye özel paket ve ödeme akışı

Kişiye özel paket yalnızca form gönderimi olarak kalmayacak. Zorunlu durum makinesi:

```text
draft
→ requested
→ reviewing
→ offered
→ revised
→ accepted
→ payment_pending
→ paid
→ provisioning
→ active
```

Alternatif durumlar:

```text
expired, rejected, cancelled, payment_failed, provisioning_failed,
past_due, suspended, refunded, partially_refunded, completed
```

Akış:

1. Kullanıcı ihtiyaç formunu doldurur.
2. Sistem otomatik ön değerlendirme yapabilir; kesin fiyatı yanlış vaat etmez.
3. Admin kapsam, süre, fiyat, vergiler, özellikler, limitler ve sözleşme belgeleriyle özel teklif hazırlar.
4. Kullanıcı teklif detayını hesabında görür.
5. Kullanıcı teklifi kabul eder ve gerekli sözleşme/onayları ayrı ayrı verir.
6. Yalnızca kabul edilen teklif için ödeme ekranı açılır.
7. Ödeme webhook ile doğrulanır.
8. Idempotent provisioning işlemi başlar.
9. Satın alınan paket/özellik/limitler otomatik `Entitlement` olarak atanır.
10. Başarılı ekranı yalnızca doğrulanmış ödeme sonrası gösterilir.
11. E-posta ve panel bildirimi gönderilir.
12. Fatura/referans bilgisi kaydedilir.
13. Başarısız provisioning retry edilir ve admin alarmı oluşur.

### 8.6 Ödeme güvenliği

- Ödeme sağlayıcısı için adapter katmanı oluştur.
- Mevcut sağlayıcı varsa sebepsiz değiştirme.
- Webhook imzasını doğrula.
- Idempotency key kullan.
- Tutarı istemciden gelen değere güvenerek çekme; sunucudaki fiyat snapshot’ını kullan.
- Sipariş ve fiyat snapshot’ı sakla.
- Çifte ödeme ve çifte yetki verme testleri yaz.
- Başarısız ödeme, 3DS/callback, timeout, refund ve chargeback durumlarını ele al.
- Kredi kartı verisini sistemde tutma.
- Test ve production anahtarlarını ayır.
- Admin fiyat değişikliğinin mevcut aboneliklere etkisini açıkça tanımla.

### 8.7 Otomatik yetkilendirme

Ödeme sonrası erişim yalnızca kullanıcı rolünü “premium” yapmakla çözülmeyecek. Granüler entitlement sistemi kur:

- Hangi ürüne erişebilir?
- Hangi araçlara erişebilir?
- Hangi limitte kullanabilir?
- Ne zamana kadar?
- Hangi organizasyon için?
- Hangi add-on’lar aktif?
- API erişimi var mı?
- Export/watermark hakkı ne?

Yetkilendirmeyi hem frontend görünürlüğünde hem backend işlem seviyesinde uygula. Backend kontrolü zorunludur.

---

## 9. Teklif alma ve satış hunisi

Public sitede basit iletişim formundan daha güçlü teklif sistemi kur:

- Hizmet veya ürün seçimi
- Marka/şirket bilgisi
- Hedefler
- Kanallar
- Bütçe aralığı
- İstenen başlangıç tarihi
- İçerik hacmi
- Video/prodüksiyon ihtiyacı
- AI araç ihtiyacı
- API/BYOK tercihi
- Ekip büyüklüğü
- Dosya ekleme
- KVKK aydınlatması
- Ticari ileti izni ayrı ve opsiyonel

Admin tarafında:

- Lead pipeline
- Lead sahibi
- Durum
- Etiket
- Not
- Aktivite geçmişi
- Teklif üretimi
- Teklif versiyonları
- Son kullanma tarihi
- Kabul/red kaydı
- Ödeme bağlantısı
- Hatırlatma
- Odoo/CRM senkronizasyon durumu

Spam koruması, rate limit ve sunucu tarafı doğrulama ekle.

---

## 10. Admin panelini eksiksiz ürün yönetim merkezine dönüştür

Admin panelini yalnızca birkaç CRUD ekranı olarak ele alma. Rol tabanlı, audit loglu ve üretim operasyonuna uygun hâle getir.

### Zorunlu admin modülleri

1. Genel bakış ve KPI dashboard
2. Kullanıcılar
3. Organizasyonlar/ekipler
4. Roller ve izinler
5. Paketler
6. Fiyatlar
7. Özellikler ve limitler
8. Ürünler ve araçlar
9. Add-on’lar
10. Kupon/kampanyalar
11. Teklif talepleri
12. Özel teklifler
13. Siparişler
14. Ödemeler
15. Refund/iptal işlemleri
16. Abonelikler
17. Entitlement/yetki görünümü
18. Kullanım ve krediler
19. API erişim politikaları
20. İçerik/CMS
21. Hizmet sayfaları
22. Paket sayfaları
23. Blog/bilgi merkezi
24. Vaka çalışmaları
25. Creator/influencer ağı
26. Kampanyalar
27. Brief ve içerik onayları
28. `/@link` sayfaları
29. Demo içerikleri
30. Destek talepleri
31. Bildirimler
32. E-posta şablonları
33. Hukuki belgeler ve versiyonları
34. Onay kayıtları
35. SEO metadata ve yönlendirmeler
36. Entegrasyonlar
37. Odoo senkronizasyonu
38. Feature flags
39. Sistem sağlığı
40. Worker/render job durumları
41. Güvenlik olayları
42. Audit logs
43. Veri dışa aktarma/silme talepleri
44. Ayarlar ve şirket bilgileri

### Admin kalite kuralları

- Yetki matrisi olmadan kritik işlem gösterme.
- Fiyat, refund, rol, entitlement, hukuki belge ve API ayarı değişikliklerini audit logla.
- Toplu işlemlerde onay ve sonuç raporu göster.
- Kritik silme yerine soft delete veya arşivleme kullan.
- Arama, filtre, sıralama ve pagination ekle.
- Mobilde temel admin işlevleri kullanılabilir olsun.
- Yetkisiz direct URL erişimini backend’de engelle.
- Hassas veriyi maskeli göster.

---

## 11. Satın alan kullanıcı için güçlü müşteri paneli

Admin panelinin “satın alan kullanıcı versiyonu” ayrı ve güvenli müşteri deneyimi olmalı.

### Zorunlu kullanıcı paneli modülleri

- Ana dashboard
- Aktif paket ve dönem
- Kalan kredi/limit
- Kullanım grafikleri
- Satın alınan araçlar
- Projeler ve çalışma alanları
- İçerik üretimleri
- Sosyal medya analizleri
- Video projeleri/renderlar
- Dosya/asset kütüphanesi
- Özel teklifler
- Sipariş geçmişi
- Ödemeler ve fatura referansları
- Abonelik değiştirme/iptal talebi
- Add-on satın alma
- API/BYOK ayarları
- Ekip üyeleri ve roller
- Bildirimler
- Destek talepleri
- Hukuki onay geçmişi
- Veri indirme/silme talepleri
- Profil ve güvenlik
- Aktif oturumlar
- 2FA seçeneği

Onboarding sırasında satın alınan pakete göre kişiye özel başlangıç adımları göster.

---

## 12. `/@link` modülü

Kullanıcının “adminde `/@link` kısmı yok” ifadesini, link-in-bio/mini landing page sistemi olarak değerlendir. Önce kodda mevcut niyeti doğrula; farklı bir anlam taşıyorsa mevcut mimariye göre uyarlayıp raporla.

### Public rota

- Tercihen `/@{slug}` biçiminde
- Benzersiz kullanıcı/marka slug’ı
- Özel başlık, bio, avatar/logo
- Sosyal bağlantılar
- CTA butonları
- Tema
- Özel domain geleceğine uygun yapı
- Görüntülenme ve tıklama analitiği
- UTM desteği
- SEO/index ayarı
- Şikâyet/report bağlantısı
- Güvenli external link davranışı

### Admin tarafı

- Bütün link sayfalarını görme
- Kullanıcı/organizasyon eşlemesi
- Slug yönetimi
- Moderasyon
- Tema/şablon yönetimi
- Yasaklı slug listesi
- Abuse/phishing kontrolü
- Analytics
- Suspend/restore

### Kullanıcı tarafı

- Sürükle-bırak veya sıralama
- Yayında/taslak
- Önizleme
- Mobil görünüm
- Link bazlı analytics
- Paket limitleri
- Premium tema veya özel domain entitlement’ı

Slug çakışması, reserved paths, XSS, phishing, zararlı URL ve open redirect risklerini test et.

---

## 13. Demo sayfası

Public bir `/demo` alanı oluştur. Amaç kullanıcıya değer göstermek ve satış hunisine taşımaktır.

- Gerçek müşteri verisi kullanma.
- Örnek/sentetik veri olduğunu açıkça belirt.
- Maliyetli AI çağrılarını limitsiz açma.
- Rate limit ve captcha/risk kontrolü uygula.
- Girişsiz küçük demo, hesap açınca daha geniş demo modeli kur.
- Demo çıktılarında gerektiğinde watermark kullan.
- Demo sonrasında uygun paket ve teklif CTA’sı göster.
- Demo analytics ve dönüşüm eventlerini ölç.
- Demo rotasını SEO açısından kontrollü yönet.

Demo; en az içerik fikri, hook analizi veya sosyal medya raporu örneği göstermeli. Video editör MVP hazırsa küçük örnek proje de sunabilir.

---

## 14. Kade Creator Studio — YouMind benzeri fakat özgün üretim çalışma alanı

Kopya bir ürün yapma. Kade’nin ajans ve marka yönetimi odağına uygun özgün “Creator Studio/Workspace” tasarla.

### Temel kavramlar

- Workspace
- Project
- Brand Kit
- Sources
- Notes
- Assets
- Conversations/Tasks
- Reusable Skills
- Prompt Templates
- Output Versions
- Approval Workflow
- Team Comments
- Export History

### Özellikler

- Kullanıcının marka tonu, hedef kitlesi, yasaklı ifadeleri ve örnek içeriklerini “Brand Memory” olarak yönetmesi
- URL, metin, doküman, video transcripti ve görsel kaynak ekleme
- Kaynakların projeyle ilişkilendirilmesi
- Metin, brief, script, görsel brief, sunum taslağı, video planı ve web sayfası taslağı üretimi
- Çıktıların sürümlenmesi
- İnsan onayı olmadan otomatik yayın yapmama
- Yeniden kullanılabilir beceri/iş akışı şablonları
- Prompt kütüphanesi
- Takım içi yorum ve onay
- Paket limitleri ve kredi maliyeti görünürlüğü
- Kaynak gösterimi ve hallüsinasyon uyarıları

Kullanıcı içeriğini model eğitimi için kullanma varsayımı yapma. Kullanılan sağlayıcının veri politikasını admin entegrasyon ekranında açıkça yönet.

---

## 15. Genel sosyal medya araçları

YouTube, Instagram, TikTok ve uygun olduğunda LinkedIn/X için ortak araç merkezi oluştur. Araçları birbirinden kopuk sayfalar değil, ortak proje ve marka hafızası kullanan modüller olarak tasarla.

### Zorunlu ilk araç seti

1. Metin ve caption oluşturucu
2. İçerik fikri oluşturucu
3. Hook oluşturucu ve hook analizi
4. Script oluşturucu
5. Başlık ve thumbnail metni analizi
6. Platforma göre yeniden yazma
7. Uzun içerikten kısa içerik çıkarma
8. İçerik takvimi oluşturucu
9. Hashtag/anahtar kelime önerisi
10. CTA oluşturucu
11. Marka tonu kontrolü
12. Rakip içerik teması analizi — yalnızca izin verilen/public verilerle
13. Video açıklaması ve bölümleme
14. Shorts/Reels/TikTok varyasyon üretimi
15. İçerik kalite kontrol listesi
16. Yayın öncesi risk/telif/marka kontrolü
17. İçerik performansı sonrası öneri

### “İçerik neden izlenir veya izlenmez?” aracı

Bu araç kesin viral olma tahmini vermeyecek. Açıklanabilir bir değerlendirme sistemi kur:

- İlk 1–3 saniye hook gücü
- Konu netliği
- Hedef kitle uyumu
- Merak boşluğu
- Tempo
- Görsel değişim sıklığı
- Ses/altyazı okunabilirliği
- Video uzunluğu
- Değer vaadi
- Duygusal tetikleyici
- Tekrar/paylaşım/kaydetme potansiyeli
- CTA uyumu
- Platform format uyumu
- Başlık/thumbnail uyumu
- Önceki hesap verileriyle ilişki

Sonuç:

- Tahmini skor
- Skoru etkileyen nedenler
- Riskler
- Somut düzeltme önerileri
- Alternatif hook/script
- Güven seviyesi
- “Bu sonuç garanti değildir” açıklaması

Gerçek performans verisi varsa model/heuristic geri bildirimiyle iyileştir; kişisel veriyi veya platform kurallarını ihlal eden scraping yapma.

---

## 16. Kişisel sosyal medya analizcisi

Kullanıcının yetki verdiği sosyal hesaplar için kişisel analiz paneli oluştur. Resmî API ve izinli veri erişimini tercih et. Yetkisiz scraping, parola isteme veya platform şartlarını ihlal etme.

### Desteklenecek analiz başlıkları

- Hesap büyümesi
- Erişim/gösterim
- İzlenme süresi
- Retention eğrisi mümkünse
- Etkileşim oranı
- Kaydetme/paylaşma
- Takipçi dönüşümü
- En iyi içerikler
- En zayıf içerikler
- Format karşılaştırması
- Konu kümesi karşılaştırması
- Yayın günü/saat analizi
- Hook analizi
- Video süresi analizi
- Caption/başlık analizi
- Platformlar arası karşılaştırma
- Hedef KPI ilerlemesi
- Anomali tespiti
- Haftalık/aylık aksiyon planı

### Raporlama

- Verinin hangi kaynaktan geldiğini göster.
- Eksik metrikleri uydurma.
- API kapsamı nedeniyle alınamayan alanları açıkla.
- “Neden?” açıklamasını korelasyon olarak sun; kanıtlanamayan nedensellik iddiası kurma.
- PDF/CSV export düşün; mevcut artifact altyapısına göre uygula.
- Ajans hesabında birden fazla müşteri/marka için tenant izolasyonu uygula.

---

## 17. ChatCut alternatifi: özgün AI video editör

Evet, teknik olarak benzer problem alanında özgün bir ürün yapılabilir; ancak tek sprintte ChatCut’ın bütün kapsamını kopyalamaya çalışma. Önce feasibility, mimari ve maliyet raporu oluştur:

`docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md`

### 17.1 MVP kapsamı

- Video upload/import
- Güvenli multipart upload
- Transkripsiyon
- Transcript tabanlı kesme
- Sessizlik tespiti
- Filler kelime tespiti
- Tekrarlanan take önerisi
- Highlight önerisi
- Otomatik altyazı
- Altyazı stilleri
- 9:16, 1:1, 16:9 dönüşümü
- Basit crop/reframe
- Logo/watermark
- Intro/outro/CTA şablonları
- Basit B-roll önerisi
- Prompt ile edit talebi
- Manuel timeline düzeltmesi
- Render job queue
- İlerleme durumu
- Retry/cancel
- Export ve paket limitleri
- Proje kaydı
- Kullanım kredisi

### 17.2 Sonraki aşama

- AI motion graphics
- Otomatik chapter kartları
- Grafik ve veri overlay’leri
- AI B-roll üretimi
- AI görsel üretimi
- Lisans durumu açık müzik üretimi veya lisanslı müzik entegrasyonu
- Referans görselle tutarlı video üretimi
- Çok kullanıcılı yorum/onay
- NLE export seçenekleri
- Agent/plugin entegrasyonu

### 17.3 Teknik zorunluluklar

- Ağır render işlemlerini web request içinde yapma.
- Queue/worker ve job state kullan.
- FFmpeg veya uygun medya işleme katmanını izole et.
- CPU/GPU maliyetini usage metriklerine bağla.
- Dosyaları private storage’da tut.
- Signed URL kullan.
- Dosya türü, boyutu ve süre limitlerini doğrula.
- Zararlı dosya ve parser risklerini ele al.
- Render worker’ı sandbox/izole çalıştır.
- Kullanıcı projesi arasında dosya erişimini test et.
- Fail/retry/idempotency tasarla.
- Kullanılan AI servislerinin maliyetini admin panelinde görünür kıl.

### 17.4 Telif ve lisans

- Kullanıcı upload ettiği içeriğin haklarına sahip olduğunu kabul etmeli.
- Üçüncü taraf müzik, stock, font ve template lisanslarını takip et.
- “Royalty-free” ifadesini kanıtsız kullanma.
- AI üretiminin lisans ve kullanım şartlarını sağlayıcı bazında belgeleyip admin tarafından güncellenebilir yap.
- Takedown/şikâyet süreci kur.

ChatCut’ın isim, marka, metin, görünüm veya proprietary iş akışını kopyalama.

---

## 18. Creator/influencer ve kampanya yönetimi

Rekt benzeri değerlerden ilhamla fakat özgün bir creator network ve campaign ops sistemi tasarla.

### Creator profili

- Platform hesapları
- Kategori/niche
- Takipçi ve erişim metrikleri
- Hedef kitle demografisi — yalnızca izinli veri
- Ücret aralığı
- Marka güvenliği notları
- Önceki kampanyalar
- İçerik örnekleri
- İletişim durumu
- Sözleşme/dosya kayıtları
- Uygunluk ve takvim
- Doğrulama durumu

### Kampanya akışı

```text
lead → discovery → brief → creator shortlist → approval → contracting
→ production → content review → publish → tracking → reporting → completed
```

- AI destekli eşleştirme yalnızca karar desteği olsun.
- Eşleştirme nedenlerini açıklayabilsin.
- Creator brief
- İçerik onay/revizyon
- Teslim tarihleri
- UTM/promo kod
- Metrik toplama
- ROI/ROAS ve dönüşüm raporu
- Marka ve creator tarafı görünümü
- White-label rapor
- Gerçek zamanlı veya periyodik dashboard

Sahte creator, sahte metrik, sahte müşteri veya doğrulanmamış sonuç yayınlama.

---

## 19. Ajans + tool satan iş modeli

`docs/AGENCY_AND_SAAS_BUSINESS_MODEL_TR.md` oluştur ve uygulama mimarisini şu katmanları destekleyecek şekilde kur:

### Gelir katmanları

- Ajans retainer paketleri
- Proje bazlı hizmet
- Tool aboneliği
- Kredi paketi
- Add-on
- Creator campaign management fee
- Enterprise özel teklif
- White-label/reseller
- Eğitim/danışmanlık
- Şablon ve dijital ürün — gerçekten sunulacaksa

### Paket ailesi önerisi

İsimleri admin değiştirilebilir yap. Örnek yapı:

- Başlangıç
- Büyüme
- Pro
- Creator
- Agency
- Enterprise/Özel

Her ailede haftalık/aylık/yıllık seçenek zorunlu olmak zorunda değildir; ticari olarak anlamsız kombinasyonları sırf gereksinim var diye açma. Ancak veri modeli hepsini desteklemeli ve admin etkinleştirebilmelidir.

### Satış prensipleri

- Hizmet bedeli ve medya/API/üçüncü taraf maliyetini ayır.
- Paket kapsamını belirsiz bırakma.
- Limit aşımı davranışını açıkla.
- Otomatik yenileme varsa görünür kıl.
- İptal akışını saklama.
- Özel teklif ile public paket arasında tutarlı entitlement kullan.
- Kullanıcıyı istemediği üst pakete manipülatif dark pattern ile itme.

---

## 20. Odoo değerlendirmesi ve olası kurulum

Odoo’yu sırf kullanıcı adı geçti diye sisteme ekleyip yeni karmaşa üretme. Önce `docs/09_ODOO_DECISION_TR.md` içinde karar analizi yap.

### Değerlendirilecek alanlar

- CRM ve lead pipeline
- Teklif/satış siparişi
- Faturalama entegrasyonu
- Abonelik
- Proje yönetimi
- Helpdesk
- E-posta otomasyonu
- Creator/vendor yönetimi
- Muhasebe süreçleri
- Türkiye yerelleştirmesi ihtiyacı
- Mevcut sistemle veri sahipliği
- Lisans ve operasyon maliyeti
- Backup ve güncelleme yükü

### Karar kuralları

Odoo yalnızca şu durumda kur:

- Gerçek operasyonel fayda sağlıyor.
- Mevcut panelle rol çakışması net çözülmüş.
- Hangi sistemin source of truth olduğu yazılmış.
- Senkronizasyon yönü ve hata yönetimi belirlenmiş.
- Kimlik doğrulama ve yetki güvenli.
- Deployment/backup planı var.

Kurulum uygunsa önce staging’de Docker veya mevcut altyapıya uygun güvenli yöntemle kur. Production’a taşımadan önce:

- SSO veya güvenli ayrı giriş
- Least privilege API kullanıcısı
- Webhook/job retry
- Sync audit log
- Müşteri/lead/teklif eşleme
- Secret yönetimi
- Backup/restore testi

Uygun değilse kurma; bunun yerine mevcut admin panelinde gerekli CRM fonksiyonlarını tamamla ve gerekçeyi yaz.

---

## 21. Fikri mülkiyet ve içerik koruma sistemi

“İçerik hiç çalınamaz” gibi teknik olarak garanti edilemeyen vaat kurma. Katmanlı caydırma, erişim kontrolü, delillendirme ve hukuki süreç oluştur.

### Public site içeriği

- Telif bildirimi
- Kullanım lisansı
- İzinsiz yeniden yayınlama ve ticari kullanım koşulları
- Kaynak gösterme kuralları
- Takedown/ihlal bildirim kanalı
- Yayın tarihi ve içerik sahibi
- Orijinal içerik hash/provenance kaydı uygun olduğunda
- Görsellerde gerektiğinde görünür veya görünmez watermark

### Kullanıcı/KadexAI içeriği

- Private-by-default storage
- Kısa süreli signed URL
- Tenant/object-level authorization
- Export erişim kontrolü
- Preview watermark
- Download audit log
- Rate limit
- Anti-enumeration
- Noindex/private cache headers
- Kişisel proje URL’lerinin tahmin edilemez kimlikleri
- Kullanıcı verisini public bucket’a koymama
- Prompt/workflow mantığını server tarafında tutma
- Model/provider anahtarlarını server tarafında tutma
- Abuse ve bulk extraction tespiti
- Hesap kapatıldığında retention politikası

### İçerik benzerliği ve delil

Makul ise:

- Perceptual hash
- Dosya checksum
- Oluşturma zamanı
- Versiyon geçmişi
- Export manifesti
- Model/provider ve kaynak metadata’sı
- Kullanıcının hak beyanı

Bu verileri kullanıcıyı gereksiz izlemek için değil, sahiplik ve güvenlik amacıyla sınırlı tut.

---

## 22. Hukuki yükümlülükler ve site/panel entegrasyonu

Bu bölüm yazılım uygulamasıdır, hukuk danışmanlığı değildir. Güncel Türkiye mevzuatını resmî kaynaklardan doğrula ve yayımlanmadan önce yetkin hukukçu incelemesi gerektiren metinleri açıkça işaretle. Hukuki şirket bilgisi uydurma.

### En az değerlendirilecek düzenlemeler

- 6698 sayılı Kişisel Verilerin Korunması Kanunu ve güncel ikincil düzenlemeler
- 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun
- 6502 sayılı Tüketicinin Korunması Hakkında Kanun
- Mesafeli Sözleşmeler Yönetmeliği
- Ticari İletişim ve Ticari Elektronik İletiler düzenlemeleri/İYS
- ETBİS yükümlülüğü uygulanıyorsa
- 5846 sayılı Fikir ve Sanat Eserleri Kanunu
- Vergi/fatura/e-belge yükümlülükleri için mali müşavir doğrulaması
- Yurt dışına veri aktarımı ve kullanılan AI/cloud sağlayıcıları
- Çerezler ve consent yönetimi

### Public hukuki sayfalar

- Kullanım Koşulları
- Gizlilik Politikası
- KVKK Aydınlatma Metni
- Çerez Politikası
- Çerez Tercih Merkezi
- Mesafeli Satış/Hizmet Sözleşmesi
- Ön Bilgilendirme Formu
- Cayma/İptal/İade Politikası
- Abonelik ve otomatik yenileme koşulları
- Dijital içerik/hizmetin ifasına ilişkin gerekli açık bilgilendirme ve onaylar
- Fikri Mülkiyet ve Telif Politikası
- Kullanıcı İçeriği ve Lisans Koşulları
- Kabul Edilebilir Kullanım Politikası
- AI Kullanım ve Çıktı Politikası
- API Kullanım Koşulları
- Takedown/İhlal Bildirim Prosedürü
- Veri Sahibi Başvuru Formu
- Kurumsal bilgiler/iletişim
- SLA veya destek koşulları paket gerektiriyorsa

### Onay sistemi

- Aydınlatma metni ile açık rıza/onayları aynı checkbox’a sıkıştırma.
- Zorunlu sözleşme kabulü ile opsiyonel ticari ileti iznini ayır.
- Belge versiyonu, timestamp, kullanıcı, IP/user-agent gibi hukuken ve gizlilik açısından gerekli minimum ispat verisini kaydet.
- Kullanıcı kabul ettiği belgenin kopyasına panelden ulaşabilsin.
- Belge değişirse hangi değişiklikte yeniden onay gerektiğini yönet.
- Önceden işaretli checkbox kullanma.
- Gerekli olmayan çerezleri onaydan önce çalıştırma.
- Red seçeneğini gizleme veya zorlaştırma.

### Admin hukuki modülü

- Belge oluşturma/taslak/yayın
- Versiyonlama
- Yürürlük tarihi
- Dil
- Yeniden onay zorunluluğu
- Onay kayıtları
- Veri talepleri
- İhlal bildirimleri
- Takedown talepleri
- Saklama süresi ayarları
- Dışa aktarma
- Audit log

`docs/08_LEGAL_COMPLIANCE_CHECKLIST_TR.md` içinde her maddeyi “uygulanıyor/uygulanmıyor/hukukçu doğrulaması gerekli” olarak işaretle.

---

## 23. Güvenlik açıklarını bitirme

“Hiç açık kalmadı” gibi mutlak iddia kurma. Risk bazlı güvenlik denetimi yap, kritik ve yüksek bulguları release blocker kabul et.

`docs/07_SECURITY_AUDIT_TR.md` ve `docs/THREAT_MODEL_TR.md` oluştur.

### Zorunlu kontroller

- Auth bypass
- Broken access control
- RBAC/ABAC
- IDOR/BOLA
- Tenant izolasyonu
- Session güvenliği
- Password policy
- MFA/2FA opsiyonu
- Account enumeration
- Brute force/rate limit
- CSRF
- XSS
- SQL/NoSQL injection
- Command injection
- SSRF
- Path traversal
- Open redirect
- Clickjacking
- CORS
- CSP
- Security headers
- Secret exposure
- Loglara hassas veri yazılması
- File upload
- MIME spoofing
- Zip bomb/large file
- Media parser/FFmpeg izolasyonu
- Webhook spoofing
- Payment amount tampering
- Replay attack
- Race condition
- Mass assignment
- Prototype pollution
- Dependency vulnerabilities
- Supply chain
- Unsafe deserialization
- Email template injection
- CSV injection
- Stored prompt injection
- AI tool abuse
- API cost abuse
- Rate limit bypass
- Bot scraping ve credential stuffing
- PII export/delete güvenliği
- Backup encryption ve restore testi
- Monitoring ve alarm

### Güvenlik uygulamaları

- Güvenli cookie ayarları
- CSRF stratejisi
- Input schema validation
- Output encoding
- Parameterized queries
- Short-lived tokens
- Refresh token rotation uygun olduğunda
- Secret manager/env validation
- Structured audit logs
- PII redaction
- Per-route rate limit
- IP ve kullanıcı bazlı abuse sinyalleri
- Admin için daha güçlü oturum politikası
- Kritik işlem re-authentication
- Dependency pinning ve update planı
- SAST/dependency scan
- E2E yetki testleri

Bulgu kapatıldığında yeniden test yap ve kanıtla.

---

## 24. 404, redirect ve bütün `/` rotaları

- Gerçek 404 sayfası doğru HTTP 404 dönsün.
- SPA fallback her bilinmeyen URL’ye 200 döndürmesin.
- Soft 404’leri düzelt.
- Yetkisiz sayfa 404/403 stratejisini güvenlik ve UX’e göre belirle.
- Trailing slash tutarlılığı sağla.
- Büyük/küçük harf ve Türkçe karakter davranışını test et.
- Eski URL’ler için 301 haritası oluştur.
- Redirect chain ve loop bırakma.
- Admin/login/API/callback rotalarını indeksleme dışı tut.
- Preview domainleri noindex yap.
- Sitemap’e yalnızca canonical başarılı public URL koy.
- Internal linklerin tümünü crawl ederek doğrula.

`docs/SEO_REDIRECT_MAP_TR.md` ve route test raporu oluştur.

---

## 25. Mobil sürüm, erişilebilirlik ve performans

Mobil öncelikli düzelt:

- 320px’den büyük ekranlara kadar kritik akışlar
- Paket karşılaştırma
- Teklif formu
- Checkout
- Login/register
- Admin tabloları
- Kullanıcı dashboard
- `/@link` editörü
- Creator Studio
- Video upload ve proje durumu

### Erişilebilirlik

- Klavye navigasyonu
- Focus görünürlüğü
- Form label/error ilişkisi
- Dialog focus trap
- Semantik başlıklar
- Alt metin
- Renk kontrastı
- Reduced motion
- Screen reader isimleri
- Skip link
- Table/card responsive alternatifi

### Performans

- LCP, INP, CLS
- Bundle analizi
- Route-level code splitting
- Büyük asset optimizasyonu
- Responsive image
- Font loading
- Video lazy load
- API caching
- DB query optimizasyonu
- Render/hydration hataları
- Üçüncü taraf script kontrolü

Kritik içerikleri performans için gizleme veya client-side render’a mahkûm etme.

---

## 26. SEO, AEO, GEO ve AI görünürlüğü

Bu ana promptun sonundaki `EK A — SEO, AEO, GEO, yapay zekâ görünürlüğü ve rakip otoritesi şartnamesi` bağlayıcıdır. İçindeki hiçbir maddeyi özetlendiği için atlama.

### Zorunlu entegrasyon

1. Ek A’daki her maddeyi `REQ-SEO-*` olarak traceability belgesine aktar.
2. İstenen 17 SEO/AI görünürlük belgesini oluştur.
3. Public sayfaların server-rendered/prerendered anlamlı HTML durumunu doğrula.
4. Admin, kullanıcı, ödeme ve API alanlarını indeksleme dışı tut.
5. Marka entity tutarlılığını kur.
6. Paket ve fiyat verilerini crawl edilebilir public sayfalara doğru biçimde yansıt.
7. Gerçek olmayan hizmet, müşteri, yorum, ekip, veri veya vaka üretme.
8. AI görünürlük testlerinde sistemlerin kullanım şartlarını ihlal etme.
9. SEO ile içerik koruma arasında denge kur: public pazarlama içeriği crawl edilebilir, kullanıcıya özel içerik private olmalı.
10. Güncel crawler dokümantasyonunu resmî kaynaklardan doğrula.

Mevcut SEO promptu yalnızca rapor üretmek için kullanılmayacak; uygun teknik ve içerik değişiklikleri gerçekten koda uygulanacak.

---

## 27. Analytics, ölçümleme ve satış olayları

Mevcut analytics yapısını incele ve gizlilik uyumlu event şeması kur:

- package_view
- pricing_interval_change
- quote_started
- quote_submitted
- offer_viewed
- offer_accepted
- checkout_started
- payment_succeeded
- payment_failed
- entitlement_provisioned
- signup_completed
- onboarding_completed
- demo_started
- demo_completed
- tool_used
- credit_low
- add_on_viewed
- subscription_changed
- subscription_cancel_requested
- support_created
- link_page_view
- link_click
- case_study_view
- contact_click

PII’yi analytics eventlerine gelişigüzel gönderme. Event adları ve parametreleri `docs/ANALYTICS_EVENT_SCHEMA_TR.md` içinde belgelenmeli.

---

## 28. Bildirimler ve operasyon

- Transactional e-posta altyapısını doğrula.
- Teklif, ödeme, provisioning, kredi azalması, abonelik yenileme, başarısız ödeme ve destek bildirimleri oluştur.
- Ticari ileti ile zorunlu hizmet bildirimini ayır.
- Template’leri admin tarafından yönetilebilir yaparken injection riskini önle.
- E-posta gönderiminde retry ve bounce/log yönetimi kur.
- Gerekirse in-app notification center oluştur.

---

## 29. Veri, migration ve audit log

- Yeni şemayı mevcut DB’ye uyumlu tasarla.
- Migration’ları küçük ve geri alınabilir tut.
- Paket/fiyat hardcode verisini seed/backfill ile DB’ye taşı.
- Production seed’i yanlışlıkla demo veriyle doldurma.
- Fiyat snapshot’larını geçmiş siparişlerde koru.
- Audit log append-only yaklaşımına yakın tasarla.
- Hassas alan değişikliklerinde actor, action, target, before/after özeti, timestamp ve request correlation sakla; gereksiz PII tutma.
- Veri retention ve silme politikasını hukuki ayarlarla uyumlu yap.

---

## 30. Test senaryoları

En az aşağıdaki senaryoları otomatik test et:

### Ticaret

- Admin paket oluşturur, public sitede görünür.
- Pasif paket görünmez.
- Haftalık/aylık/yıllık fiyat doğru hesaplanır.
- API dahil/dahil değil matrisi doğru görünür.
- Özel teklif yalnızca doğru kullanıcıya görünür.
- Teklif kabul edilmeden ödeme açılamaz.
- Tutar istemciden değiştirilse de sunucu doğru tutarı kullanır.
- Aynı webhook iki kez gelirse iki kez yetki verilmez.
- Başarısız ödeme yetki vermez.
- Başarılı ödeme doğru entitlement verir.
- Refund/suspend davranışı politikasına uygun çalışır.
- Paket süresi bitince erişim doğru değişir.

### Yetki

- Müşteri admin sayfasına erişemez.
- Bir tenant diğerinin proje, dosya, teklif ve link sayfasını düzenleyemez.
- API erişimi olmayan paket endpoint’i kullanamaz.
- BYOK anahtarı düz metin okunamaz.
- Admin kritik işlem audit log üretir.

### Route/SEO

- Bilinmeyen public rota gerçek 404.
- Eski URL doğru 301.
- Admin/login noindex.
- Canonical doğru.
- Sitemap yalnızca public canonical URL’leri içerir.
- Public kritik içerik HTML’de mevcut.

### Mobil/UX

- Paket seçimi ve checkout mobilde tamamlanır.
- Teklif formu keyboard ile kullanılabilir.
- Modal/tablolar taşmaz.
- Error/loading/empty state görünür.

### Video ve dosya

- Yetkisiz dosya indirme engellenir.
- Signed URL süresi dolar.
- Büyük/yanlış MIME upload reddedilir.
- Render job retry ve cancel çalışır.
- Kredi yetersizliği doğru ele alınır.

### `/@link`

- Reserved slug alınamaz.
- Zararlı URL veya script engellenir.
- Başka kullanıcı sayfası değiştirilemez.
- Tıklama analitiği PII sızdırmaz.

---

## 31. Satışa hazır olma kriterleri

Site ancak aşağıdaki koşullar kanıtlandığında “satışa hazır” sınıfına alınabilir:

- Production build başarılı
- Kritik ve yüksek güvenlik bulgusu kalmamış veya açıkça release blocker
- Paket/fiyatlar adminden yönetiliyor
- Public paket sayfası gerçek veriyi gösteriyor
- Teklif akışı çalışıyor
- Özel teklif kabulü sonrası ödeme açılıyor
- Ödeme webhook doğrulaması var
- Yetkilendirme otomatik ve idempotent
- Kullanıcı paneli aktif paketi ve limitleri gösteriyor
- Admin paneli temel operasyonları yönetiyor
- Hukuki belgeler versiyonlu ve onay kaydı var
- Gerekli çerezler dışında consent yönetimi var
- 404/redirect/route sorunları çözülmüş
- Mobil kritik akışlar kullanılabilir
- SEO temel teknik kriterleri sağlanmış
- Private kullanıcı içeriği indekslenmiyor
- Backup/restore planı var
- Logging/monitoring var
- Demo güvenli ve limitli
- Müşteri desteği akışı var
- Blocker listesi dürüstçe yayınlanmış
- Gerçek ödeme sağlayıcı production credential’ı yoksa sistem “testte hazır, production ödeme blocker” diye sınıflandırılmış

---

## 32. Zorunlu dokümantasyon çıktıları

SEO ekindeki belgelere ek olarak en az şunları oluştur:

1. `docs/00_REQUIREMENT_TRACEABILITY_TR.md`
2. `docs/01_CURRENT_STATE_AUDIT_TR.md`
3. `docs/02_ARCHITECTURE_DECISIONS_TR.md`
4. `docs/03_ROUTE_INVENTORY_TR.md`
5. `docs/04_DESIGN_SYSTEM_TR.md`
6. `docs/05_COMMERCE_AND_ENTITLEMENT_TR.md`
7. `docs/06_ADMIN_PANEL_SCOPE_TR.md`
8. `docs/07_SECURITY_AUDIT_TR.md`
9. `docs/08_LEGAL_COMPLIANCE_CHECKLIST_TR.md`
10. `docs/09_ODOO_DECISION_TR.md`
11. `docs/10_CHATCUT_ALTERNATIVE_FEASIBILITY_TR.md`
12. `docs/11_LAUNCH_READINESS_TR.md`
13. `docs/LEGACY_PAGE_GAP_ANALYSIS_TR.md`
14. `docs/REFERENCE_PRODUCT_GAP_ANALYSIS_TR.md`
15. `docs/AGENCY_AND_SAAS_BUSINESS_MODEL_TR.md`
16. `docs/ANALYTICS_EVENT_SCHEMA_TR.md`
17. `docs/THREAT_MODEL_TR.md`
18. `docs/BLOCKERS_TR.md`
19. `docs/CHANGELOG_IMPLEMENTATION_TR.md`
20. `docs/OPERATIONS_RUNBOOK_TR.md`

Doküman yazıp uygulama yapmamak kabul edilmez. Her doküman ilgili kod değişiklikleri ve test kanıtlarıyla bağlantılı olmalı.

---

## 33. Uygulama sırası

Aşağıdaki sıraya mümkün olduğunca uy:

### Faz 0 — Güvenli başlangıç

- Git/repo/env envanteri
- Build ve test baseline
- Requirement ledger
- Blocker listesi

### Faz 1 — Kod, rota ve legacy denetimi

- Kod kalite/güvenlik bulguları
- Bütün rota envanteri
- 26 Haziran eski sürüm karşılaştırması
- Kritik crash/404/build sorunları

### Faz 2 — Temel mimari

- Tasarım sistemi
- Auth/role/tenant modeli
- Product/plan/price/entitlement modeli
- Audit log
- Legal versioning

### Faz 3 — Ticaret

- Public paketler
- Teklif
- Özel teklif
- Checkout/payment adapter
- Webhook
- Provisioning
- Abonelik ve kredi

### Faz 4 — Paneller

- Admin modülleri
- Müşteri paneli
- `/@link`
- Destek ve bildirim

### Faz 5 — Araçlar

- Creator Studio
- Metin/hook/script araçları
- İçerik izlenir/izlenmez analizi
- Kişisel sosyal medya analizcisi
- Demo

### Faz 6 — Video editör MVP

- Feasibility
- Upload/transcript/edit/caption/render
- Usage credit ve güvenlik

### Faz 7 — Creator ve ajans operasyonu

- Creator network
- Campaign ops
- White-label raporlama
- Odoo kararı/entegrasyonu

### Faz 8 — Hukuk, güvenlik, SEO, mobil

Bu başlıklar en sona bırakılacak “temizlik” değildir; önceki fazlarda uygulanır, bu fazda bütünsel doğrulama yapılır.

### Faz 9 — Release

- Full regression
- Security retest
- SEO crawl
- Lighthouse/mobile
- Migration plan
- Backup/restore
- Operations runbook
- Launch readiness raporu

Kritik güvenlik ve ödeme altyapısı çözülmeden dekoratif özelliklere öncelik verme.

---

## 34. Son cevap formatı

Çalışma sonunda Türkçe ve kanıta dayalı final raporu ver:

### 1. Genel sonuç

Şunlardan yalnızca biri:

- Satışa hazır
- Test ortamında hazır, production entegrasyonları bekliyor
- Temel sistem hazır, kritik blockerlar var
- Satışa hazır değil

### 2. Tamamlanan gereksinimler

Kimlikleri ve test kanıtlarıyla.

### 3. Kısmen tamamlananlar

Eksik kısmı ve nedeni.

### 4. Blockerlar

Kullanıcıdan gereken bilgi/erişim ve net adımlar.

### 5. Değişen dosyalar ve migrationlar

Özet.

### 6. Test sonuçları

Komut, sonuç, başarısız test varsa nedeni.

### 7. Güvenlik durumu

Kritik/yüksek/orta/düşük kalan bulgular.

### 8. Hukuki durum

Teknik olarak uygulananlar ve hukukçu/mali müşavir doğrulaması gerekenler.

### 9. SEO/AI görünürlük durumu

Ek A’daki sınıflandırmayla.

### 10. Deployment ve rollback

Kesin adımlar.

### 11. Son izlenebilirlik matrisi

Kullanıcının ilk mesajındaki hiçbir talep satırsız kalmayacak.

---

## 35. Kesin yasaklar

- Görevleri sessizce atlamak
- Sadece rapor yazıp kodu uygulamamak
- Sadece UI yapıp backend/yetki/test bırakmak
- Sahte müşteri, yorum, metrik, ekip veya vaka üretmek
- Rakip siteleri kopyalamak
- Production secret uydurmak
- Gerçek ödeme çekmek
- Güvenlik kontrolünü devre dışı bırakıp “çalışıyor” demek
- TypeScript/linters/testleri `any`, ignore veya disable ile susturmak
- Hatalı endpoint’i görünmez yapmak
- Kullanıcının mevcut değişikliklerini silmek
- Private kullanıcı içeriğini public/indexlenebilir yapmak
- Kredi kartı verisi saklamak
- Açık rıza ile aydınlatmayı tek zorunlu onay hâline getirmek
- Kullanıcıyı abonelik iptalinden caydıran dark pattern
- AI aracına viral olma veya satış garantisi verdirmek
- İçeriğin “asla çalınamayacağını” vaat etmek
- Odoo’yu gerekçesiz kurmak
- Eski KadeMedia kodunu güvenlik denetimi olmadan taşımak

---

# EK A — SEO, AEO, GEO, YAPAY ZEKÂ GÖRÜNÜRLÜĞÜ VE RAKİP OTORİTESİ ŞARTNAMESİ

Aşağıdaki şartnamenin tamamı bağlayıcıdır. Her maddeyi görev defterine aktar, uygula, test et ve raporla.

SEO, AEO, GEO, yapay zekâ görünürlüğü ve rakip otoritesi görevi
Bu projede yalnızca klasik Google SEO çalışması yapmayacaksın.
Kade New Media için aşağıdaki alanların tamamını kapsayan bütünleşik bir organik görünürlük sistemi kuracaksın:
•	Teknik SEO
•	Yerel SEO
•	İçerik SEO
•	Programatik olmayan ölçeklenebilir içerik mimarisi
•	Semantic SEO
•	Entity SEO
•	Answer Engine Optimization — AEO
•	Generative Engine Optimization — GEO
•	AI Search Optimization
•	Google AI Overviews ve AI Mode görünürlüğü
•	ChatGPT arama ve kaynak görünürlüğü
•	Claude web search görünürlüğü
•	Gemini görünürlüğü
•	Grok görünürlüğü
•	Perplexity ve benzeri cevap motorlarında görünürlük
•	Dijital PR
•	Marka otoritesi
•	Üçüncü taraf doğrulama ve atıf kazanımı
•	Google Business Profile ve yerel işletme görünürlüğü
•	Video SEO
•	Görsel SEO
•	Sosyal medya arama optimizasyonu
•	Dönüşüm odaklı SEO
•	Ölçümleme ve AI görünürlük takibi
Ana hedef, Kade New Media’nın yalnızca Google’da sıralama alması değildir.
Hedef, kullanıcıların Google’da veya yapay zekâ sistemlerinde aşağıdaki gibi sorular sorduğunda Kade New Media’nın uygun durumlarda güvenilir bir seçenek, kaynak veya öneri adayı hâline gelmesidir:
•	Türkiye’de iyi bir sosyal medya ajansı hangisi?
•	İstanbul’da sosyal medya ajansı önerir misin?
•	Markam için SEO ajansı arıyorum.
•	Küçük işletmeler için dijital pazarlama ajansı öner.
•	New media ajansı öner.
•	Yapay zekâ kullanan pazarlama ajansları hangileri?
•	AI marketing ajansı öner.
•	Sosyal medya yönetimi yapan ajanslar hangileri?
•	Reels ve video içerik üreten ajans öner.
•	İçerik üretim ajansı öner.
•	SEO ve sosyal medyayı birlikte yöneten ajans var mı?
•	E-ticaret markaları için sosyal medya ajansı öner.
•	Türkiye’de kreatif new media ajansları hangileri?
•	Hypers benzeri new media ajansları hangileri?
•	Hypers alternatifi ajans öner.
•	Hypers ile benzer hizmet veren ajanslar hangileri?
•	Yeni nesil dijital ajans öner.
•	İstanbul’da AI destekli içerik ajansı var mı?
•	Markam için sosyal medya, reklam ve SEO’yu birlikte yönetecek ajans arıyorum.
•	Uygun fiyatlı sosyal medya yönetimi yapan profesyonel ajans hangisi?
•	Kurumsal sosyal medya yönetimi için hangi ajansla çalışmalıyım?
Bununla birlikte hiçbir arama motorunda, yapay zekâ sisteminde veya sorguda birincilik ve önerilme garantisi verme.
Yapılacak çalışma; Kade New Media’nın teknik olarak erişilebilirliğini, marka otoritesini, konu otoritesini, kanıtlanabilir uzmanlığını ve alıntılanma ihtimalini artırmalıdır.
Rakip benchmark görevi
Hypers’ı doğrudan new media rakibi ve kalite benchmarkı olarak incele.
Sadece Hypers ile sınırlı kalma. Güncel arama sonuçlarında ve yapay zekâ cevaplarında Kade New Media ile aynı pazarda görünen en az 15 gerçek rakibi tespit et.
Rakipleri şu segmentlere ayır:
•	New media ajansları
•	Sosyal medya ajansları
•	SEO ajansları
•	Dijital pazarlama ajansları
•	Kreatif ajanslar
•	Influencer marketing ajansları
•	Video ve içerik üretim ajansları
•	AI marketing ajansları
•	Performans pazarlama ajansları
•	Entegre hizmet veren ajanslar
•	İstanbul merkezli ajanslar
•	Türkiye geneline hizmet veren ajanslar
Her rakip için izin verilen ve herkese açık veriler üzerinden şunları analiz et:
•	Marka konumlandırması
•	Ana sayfa mesajı
•	Hizmet kategorileri
•	Hedef müşteri profili
•	Organik görünürlük
•	Sıralama aldığı ticari sorgular
•	İçerik kümeleri
•	Hizmet sayfası derinliği
•	Vaka çalışmaları
•	Portfolyo sunumu
•	Referanslar
•	Kurucu ve ekip görünürlüğü
•	LinkedIn varlığı
•	YouTube varlığı
•	Instagram ve TikTok görünürlüğü
•	Basın ve yayın atıfları
•	Üçüncü taraf ajans profilleri
•	Backlink kalitesi
•	Marka arama hacmi
•	Google Business Profile görünürlüğü
•	Schema kullanımı
•	AI sistemlerinde önerilip önerilmediği
•	AI cevaplarında hangi kaynaklarla desteklendiği
•	Güçlü tarafları
•	Zayıf tarafları
•	Kade New Media’nın ayrışabileceği alanlar
Rakibin metinlerini, tasarımını, vaka çalışmalarını veya marka kimliğini kopyalama.
Rakip analizini stratejik boşlukları tespit etmek için kullan.
Aşağıdaki dosyayı oluştur:
COMPETITOR_AUTHORITY_ANALYSIS_TR.md
AI görünürlük başlangıç ölçümü
Çalışmaya başlamadan önce Kade New Media’nın mevcut AI görünürlüğünü ölç.
En az şu sistemleri değerlendir:
•	ChatGPT
•	Claude
•	Gemini
•	Grok
•	Perplexity
•	Google AI Overviews veya AI Mode erişilebiliyorsa
•	Bing Copilot veya güncel karşılığı erişilebiliyorsa
Otomatik sorgulama sistemlerin kullanım koşullarını ihlal ediyorsa toplu scraping yapma. İzin verilen API, tarayıcı testi veya kontrollü manuel değerlendirme kullan.
Testlerde en az 150 farklı kullanıcı sorgusu oluştur.
Sorguları şu gruplara ayır:
•	Genel ajans önerileri
•	Sosyal medya ajansı önerileri
•	SEO ajansı önerileri
•	AI marketing ajansı önerileri
•	New media ajansı önerileri
•	Video ve Reels ajansı önerileri
•	İstanbul odaklı öneriler
•	Türkiye odaklı öneriler
•	Küçük işletme odaklı öneriler
•	Kurumsal marka odaklı öneriler
•	E-ticaret odaklı öneriler
•	Bütçe odaklı öneriler
•	Hizmet karşılaştırmaları
•	Hypers alternatifleri
•	Rakip karşılaştırmaları
•	Problem odaklı sorular
•	Bilgilendirici sorular
•	Satın alma niyeti yüksek sorular
Her test için aşağıdaki bilgileri kaydet:
•	Test tarihi ve saati
•	Kullanılan sistem
•	Kullanılan model veya ürün adı
•	Kullanılan dil
•	Kullanıcının yaklaşık konumu
•	Oturum açık veya kapalı durumu
•	Sorgunun tam metni
•	Kade New Media’dan bahsedilip bahsedilmediği
•	Öneri listesindeki konumu
•	Hangi rakiplerin önerildiği
•	Kaynak veya alıntı gösterilip gösterilmediği
•	Kullanılan kaynak domainleri
•	Kade New Media hakkındaki bilginin doğru olup olmadığı
•	Yanlış veya eski bilgi bulunup bulunmadığı
•	Markanın hangi özelliklerle tanımlandığı
•	Sonucun tekrarlandığında değişip değişmediği
Aynı sorgunun sonucunu kesin ve kalıcı sıralama gibi yorumlama. Üretken yapay zekâ cevaplarının değişken olabileceğini raporda açıkça belirt.
Başlangıç raporunu şu dosyada oluştur:
AI_VISIBILITY_BASELINE_TR.md
AI görünürlüğü başarı metrikleri
Aşağıdaki metrikleri başlangıç, 30 gün, 60 gün ve 90 gün karşılaştırması için tanımla:
•	Brand mention rate
•	Recommendation rate
•	Citation rate
•	Correct citation rate
•	Top-three inclusion rate
•	Competitor share of voice
•	Unprompted brand recall
•	Branded query growth
•	Non-branded organic impressions
•	Ticari sorgulardaki ortalama konum
•	AI sistemlerinden gelen referral trafiği
•	AI referral dönüşüm oranı
•	Organik lead sayısı
•	Organik teklif formu tamamlama oranı
•	Marka adı arama artışı
•	Google Business Profile etkileşimleri
•	Vaka çalışması görüntülenmeleri
•	Hizmet sayfasından teklif dönüşümü
Sadece sıralama ölçme. Görünürlük, güvenilirlik, atıf, trafik ve satış etkisini birlikte ölç.
Crawler ve yapay zekâ erişim denetimi
robots.txt, HTTP başlıkları, CDN, firewall, Vercel yapılandırması ve güvenlik middleware’lerini incele.
Güncel resmî dokümantasyonu kontrol ederek aşağıdaki crawler kategorilerini birbirinden ayır:
•	Geleneksel arama motoru crawler’ları
•	AI destekli arama crawler’ları
•	Kullanıcı isteği üzerine sayfa getiren botlar
•	Model eğitimi amacıyla kullanılan crawler’lar
•	Güvenlik veya preview sistemleri
•	Sosyal medya link preview botları
Aşağıdaki sistemlerin güncel resmî crawler dokümantasyonlarını doğrula:
•	Google
•	Bing
•	OpenAI
•	Anthropic
•	Perplexity
•	xAI
•	Apple
•	Meta
•	Diğer önemli cevap motorları
Arama ve öneri görünürlüğü için gerekli crawler erişimi yanlışlıkla kapatılmışsa düzelt.
Model eğitimi izni ile arama görünürlüğü iznini aynı şey kabul etme. Her bot için işletme sahibinin tercihlerini ayrı değerlendir.
Şunları kontrol et:
•	robots.txt
•	X-Robots-Tag
•	Sayfa bazlı robots meta etiketi
•	noindex
•	nofollow
•	nosnippet
•	max-snippet
•	noarchive
•	Canonical
•	Firewall bot engelleri
•	Vercel security kuralları
•	Rate limit kuralları
•	Cloud veya CDN bot koruması
•	JavaScript gerektiren içerikler
•	Login arkasına yanlışlıkla alınmış public içerikler
•	Botlara boş HTML gönderilmesi
•	Bot ve kullanıcı arasında yanıltıcı cloaking
Kritik hizmet ve bilgi sayfalarının HTML içinde anlamlı içerikle render edildiğini doğrula.
Botlara farklı ve yanıltıcı içerik gösterme.
llms.txt veya benzeri deneysel dosyaları zorunlu bir sıralama faktörü olarak kabul etme. Güncel resmî destek bulunuyorsa yardımcı keşif dosyası olarak değerlendir; temel SEO ve içerik çalışmasının yerine kullanma.
Aşağıdaki dosyayı oluştur:
AI_CRAWLER_ACCESS_REPORT_TR.md
Marka entity sistemi
Kade New Media’yı web genelinde tutarlı, ayırt edilebilir ve doğrulanabilir bir marka entity’si hâline getir.
Önce doğrulanmış marka bilgilerini tespit et:
•	Resmî marka adı
•	Ticari unvan
•	Kurucu veya kurucular
•	Ekip
•	Kuruluş tarihi
•	Merkez veya hizmet bölgesi
•	Telefon
•	E-posta
•	Resmî domain
•	Logo
•	Sosyal medya hesapları
•	Hizmet alanları
•	Çalışılan sektörler
•	Gerçek müşteri ve projeler
•	Basın görünürlüğü
•	Ödüller ve sertifikalar
•	İş ortaklıkları
Doğrulanamayan bilgi uydurma.
Site genelinde marka adının yazımını standartlaştır.
Örneğin aşağıdaki varyasyonlardan hangisinin resmî olduğunu belirle:
•	Kade New Media
•	Kade Media
•	Kade Newmedia
•	KADE
•	KadexAI
•	Kade Digital
Birincil marka ile ürün isimlerinin ilişkisini açıkça tanımla.
apps/kadexai uygulamasının ayrı bir şirket mi, ürün mü veya Kade New Media hizmeti mi olduğunu kullanıcıya ve arama motorlarına anlaşılır biçimde göster.
Marka entity sayfası veya güçlü bir “Hakkımızda” sayfası oluştur. Bu sayfa şunları açıklamalıdır:
•	Kade New Media nedir?
•	Hangi hizmetleri verir?
•	Kimler tarafından yönetilir?
•	Hangi müşterilere hizmet verir?
•	Hangi şehir veya bölgelerde çalışır?
•	Çalışma modeli nedir?
•	Diğer ajanslardan nasıl ayrılır?
•	Yapay zekâyı hangi süreçlerde kullanır?
•	İnsan kontrolü ve yaratıcı ekip hangi aşamalarda devrededir?
•	İletişim ve teklif süreci nasıl işler?
Ana sayfada ve uygun sayfalarda doğrulanmış bilgilerle Organization yapılandırılmış verisi kullan.
Uygunsa şu bağlantıları sameAs ile ilişkilendir:
•	LinkedIn şirket sayfası
•	Instagram
•	YouTube
•	TikTok
•	X
•	Facebook
•	Behance
•	Dribbble
•	Google Business Profile ile ilişkili resmî sayfalar
•	Güvenilir ajans dizinleri
•	Kurucu profilleri
•	Basın profilleri
Sahte veya kontrol edilmeyen profilleri ekleme.
Marka entity çalışmasını şu dosyada raporla:
BRAND_ENTITY_MAP_TR.md
Kurucu ve uzman profilleri
Yapay zekâ sistemlerinin yalnızca marka adını değil, markanın arkasındaki gerçek uzmanları da anlayabilmesi için doğrulanmış kişi profilleri oluştur.
Her gerçek uzman için ihtiyaca göre:
•	Ad soyad
•	Görev
•	Uzmanlık alanları
•	Deneyim
•	Yazdığı içerikler
•	Katıldığı projeler
•	Sosyal profil bağlantıları
•	Konuşmalar
•	Röportajlar
•	Sertifikalar
•	Gerçek yayınlar
kullan.
Sahte ekip üyesi, sahte uzmanlık veya üretilmiş biyografi ekleme.
Blog içeriklerinde gerçek yazar göster. “Admin” veya “Kade Ekibi” gibi belirsiz yazarları mümkün olduğunca azalt.
Yazar sayfalarında uygun Person veya ProfilePage verisi kullanmayı değerlendir.
Her içerikte:
•	Yazar
•	Kontrol eden uzman
•	İlk yayın tarihi
•	Güncelleme tarihi
•	Kaynaklar
•	İlgili hizmet
•	İlgili vaka çalışması
alanlarını destekle.
Hizmet taksonomisi ve landing page mimarisi
Tek bir “Hizmetler” sayfasıyla bütün anahtar kelimelerde görünmeye çalışma.
Her temel hizmet için benzersiz ve derin bir landing page oluştur.
Asgari hizmet mimarisini gerçek hizmet kapsamına göre değerlendir:
Sosyal medya
•	Sosyal medya ajansı
•	Sosyal medya yönetimi
•	Kurumsal sosyal medya yönetimi
•	Instagram yönetimi
•	TikTok yönetimi
•	LinkedIn yönetimi
•	YouTube içerik yönetimi
•	Sosyal medya stratejisi
•	Sosyal medya içerik üretimi
•	Sosyal medya tasarımı
•	Topluluk yönetimi
•	Sosyal medya raporlama
•	E-ticaret sosyal medya yönetimi
SEO
•	SEO ajansı
•	Kurumsal SEO
•	Teknik SEO
•	İçerik SEO
•	Local SEO
•	E-ticaret SEO
•	SEO danışmanlığı
•	SEO analizi
•	SEO uyumlu içerik üretimi
•	Site taşıma SEO danışmanlığı
•	Uluslararası SEO
•	JavaScript SEO
•	Yapay zekâ arama görünürlüğü danışmanlığı
İçerik ve prodüksiyon
•	İçerik üretim ajansı
•	Reels çekimi
•	TikTok video üretimi
•	Ürün video çekimi
•	Sosyal medya video prodüksiyonu
•	Kreatif içerik üretimi
•	Fotoğraf çekimi
•	Marka filmi
•	Kısa video stratejisi
•	UGC içerik üretimi
•	Creator içerik üretimi
•	İçerik takvimi hazırlama
Reklam ve performans
•	Meta Ads yönetimi
•	Google Ads yönetimi
•	TikTok Ads yönetimi
•	Performans pazarlama
•	Remarketing
•	Reklam kreatifi üretimi
•	Landing page optimizasyonu
•	Dönüşüm optimizasyonu
•	Kampanya raporlama
AI ve yeni medya
•	AI marketing ajansı
•	Yapay zekâ ajansı
•	Yapay zekâ destekli içerik üretimi
•	AI pazarlama otomasyonu
•	AI chatbot kurulumu
•	Gemini entegrasyonu
•	Marka için özel AI iş akışları
•	Yapay zekâ destekli sosyal medya yönetimi
•	AI ile lead sınıflandırma
•	AI ile içerik planlama
•	AI destekli müşteri iletişimi
•	Generative Engine Optimization
•	Answer Engine Optimization
•	AI görünürlük danışmanlığı
Strateji ve marka
•	Dijital pazarlama stratejisi
•	New media stratejisi
•	Marka iletişim stratejisi
•	İçerik stratejisi
•	Kreatif strateji
•	Kampanya stratejisi
•	Dijital marka danışmanlığı
•	Rakip analizi
•	Hedef kitle analizi
Gerçekte sunulmayan bir hizmet için yalnızca trafik kazanmak amacıyla sayfa oluşturma.
Her hizmet sayfası benzersiz olmalıdır.
Şehir veya sektör adı değiştirerek yüzlerce kopya sayfa oluşturma.
Hizmet sayfası içerik standardı
Her önemli hizmet sayfasında ihtiyaca göre şunlar bulunmalıdır:
•	Açık H1
•	Kısa ve somut değer önerisi
•	Hizmetin ne olduğu
•	Kimler için uygun olduğu
•	Hangi sorunları çözdüğü
•	Teslim edilen çıktılar
•	Sürecin adımları
•	Kullanılan araçlar
•	Kullanılan AI ve insan kontrolü
•	Paket veya fiyat bilgisi
•	Başlangıç süresi
•	Revizyon sistemi
•	Raporlama yöntemi
•	Gerçek proje örnekleri
•	Kanıtlanabilir sonuçlar
•	İlgili ekip üyesi
•	Sık sorulan sorular
•	İlgili hizmetler
•	İlgili blog içerikleri
•	Teklif CTA’sı
•	Telefon veya WhatsApp CTA’sı mevcutsa güvenli entegrasyon
•	Breadcrumb
•	Güncelleme tarihi
•	Kaynak ve kanıtlar
Metinleri yalnızca kelime sayısını artırmak amacıyla uzatma.
Her sayfa belirli bir arama niyetini tam olarak karşılamalıdır.
Sektör bazlı çözüm sayfaları
Gerçek deneyim ve hizmet kapasitesi bulunuyorsa sektör bazlı çözüm sayfaları oluştur:
•	E-ticaret markaları
•	Restoran ve kafeler
•	Oteller ve turizm
•	Sağlık markaları
•	Güzellik ve bakım
•	Gayrimenkul
•	Eğitim kurumları
•	Teknoloji şirketleri
•	SaaS şirketleri
•	Kişisel markalar
•	İçerik üreticileri
•	Perakende markaları
•	Moda markaları
•	Otomotiv
•	B2B şirketleri
•	Yerel işletmeler
Her sektör sayfasında yalnızca sektör adını değiştiren aynı metni kullanma.
Şunları sektör özelinde açıkla:
•	Sektörün pazarlama sorunları
•	Uygun kanal seçimi
•	İçerik formatları
•	Ölçülecek KPI’lar
•	Riskler ve mevzuat gereksinimleri
•	Örnek çalışma planı
•	Uygun hizmetler
•	Gerçek vaka çalışmaları
Gerçek deneyim yoksa “bu sektörde uzmanız” iddiası kullanma.
Yerel SEO
Gerçek fiziksel adres veya doğrulanmış hizmet bölgesi varsa yerel SEO altyapısını kur.
Google Business Profile için şunları denetle:
•	İşletme adı
•	Ana kategori
•	İkincil kategoriler
•	Adres
•	Hizmet bölgesi
•	Telefon
•	Web sitesi
•	Çalışma saatleri
•	Hizmetler
•	Açıklama
•	Fotoğraflar
•	Logo
•	Soru ve cevaplar
•	Mesajlaşma veya teklif özellikleri
•	UTM parametreleri
•	Yorum yanıt süreci
İşletme adını anahtar kelimelerle doldurma.
Sahte ofis, sanal adres veya hizmet verilmeyen şehir için yerel profil oluşturma.
Gerçek hizmet bölgesine göre İstanbul ve uygun ilçeler için içerik stratejisi geliştir. Ancak yalnızca şehir adını değiştirerek doorway page oluşturma.
Yerel sayfalar gerçekten farklı ve yararlı bilgi içermelidir:
•	Bölgeye özgü çalışma biçimi
•	Ulaşılabilirlik
•	Yerel projeler
•	Yerel müşteri ihtiyaçları
•	Gerçek etkinlik veya iş birlikleri
•	İletişim seçenekleri
Tutarlı NAP verisi sağla:
•	Name
•	Address
•	Phone
Bütün güvenilir platformlarda marka bilgilerini aynı tut.
Yapılandırılmış veri sistemi
Sayfanın gerçek içeriğine uygun JSON-LD yapılandırılmış verileri uygula.
İhtiyaca göre değerlendir:
•	Organization
•	LocalBusiness
•	En doğru uygulanabilir alt işletme türü
•	WebSite
•	WebPage
•	AboutPage
•	ContactPage
•	Service
•	Offer
•	Product
•	Person
•	ProfilePage
•	Article
•	BlogPosting
•	VideoObject
•	ImageObject
•	BreadcrumbList
•	FAQPage
•	ItemList
Yalnızca schema.org içinde bulunması, Google’ın ilgili schema türünü özel arama özelliği olarak desteklediği anlamına gelmez. Buna rağmen doğru entity ilişkilendirmesi için uygun genel schema kullanılabilir.
Şu kurallara uy:
•	Schema görünür sayfa içeriğiyle aynı olmalı
•	Sahte yorum ekleme
•	Sahte puan ekleme
•	Sahte müşteri sayısı ekleme
•	Gösterilmeyen fiyatı schema içinde verme
•	Hizmet verilmeyen konumu ekleme
•	Başka kurumun ödülünü veya üyeliğini sahiplenme
•	Aynı entity için çelişkili ID üretme
•	Site genelinde tutarlı @id sistemi kullan
•	sameAs alanını doğrulanmış profillerle sınırla
•	Rich Results Test ile doğrula
•	Schema Markup Validator ile doğrula
•	Server-rendered çıktıyı kontrol et
Schema yalnızca görünürlük uygunluğu sağlar; görünürlük garantisi olarak raporlama.
İçerik otoritesi ve bilgi merkezi
Kade New Media’yı yalnızca hizmet satan değil, new media, sosyal medya, SEO ve AI marketing konularında özgün bilgi üreten bir kaynak hâline getir.
Konu kümeleri oluştur:
Sosyal medya konu kümesi
•	Sosyal medya stratejisi
•	Instagram büyümesi
•	TikTok stratejisi
•	LinkedIn B2B içerikleri
•	İçerik takvimi
•	Topluluk yönetimi
•	Sosyal medya KPI’ları
•	Raporlama
•	Reels üretimi
•	Sosyal medya ajansı seçimi
•	Ajans fiyatlandırması
•	İçerik onay süreçleri
SEO konu kümesi
•	Teknik SEO
•	İçerik SEO
•	Local SEO
•	E-ticaret SEO
•	JavaScript SEO
•	Core Web Vitals
•	Site taşıma
•	SEO ajansı seçimi
•	SEO fiyatlandırması
•	SEO raporlama
•	Google güncellemeleri
•	AI arama optimizasyonu
AI marketing konu kümesi
•	AI marketing nedir?
•	AI içerik üretimi
•	Gemini entegrasyonu
•	AI chatbot
•	Prompt yönetimi
•	AI ile içerik takvimi
•	AI ile lead sınıflandırma
•	AI kullanım güvenliği
•	AI ve insan editörlüğü
•	Marka dilinin yapay zekâyla korunması
•	AI arama sonuçlarında görünürlük
•	AEO ve GEO
•	ChatGPT’te marka görünürlüğü
•	Claude’da marka görünürlüğü
•	Gemini’da marka görünürlüğü
New media konu kümesi
•	New media nedir?
•	New media ajansı ne yapar?
•	Geleneksel ajans ile new media ajansı farkı
•	Creator economy
•	Influencer marketing
•	Topluluk tabanlı pazarlama
•	Kısa video ekonomisi
•	Sosyal commerce
•	Dijital kültür ve trendler
•	Marka topluluğu oluşturma
Her içerik için:
•	Birincil arama niyeti
•	İkincil sorgular
•	Hedef okuyucu
•	İçerik sahibi
•	Uzman incelemesi
•	Gerçek örnek
•	Özgün görüş
•	Kaynaklar
•	Yayın tarihi
•	Güncelleme tarihi
•	İlgili hizmet
•	İlgili vaka çalışması
•	Dönüşüm CTA’sı
•	İç bağlantılar
•	Schema türü
belirle.
Yalnızca AI ile seri biçimde yüzeysel blog üretme.
Alıntılanabilir içerik üretimi
AI sistemlerinin ve yayınların kullanabileceği özgün kaynaklar oluştur.
Öncelik ver:
•	Özgün sektör araştırmaları
•	Anonimleştirilmiş kampanya verileri
•	Türkiye sosyal medya kullanım analizleri
•	Ajans fiyatlandırma rehberleri
•	Benchmark raporları
•	Kontrol listeleri
•	Şablonlar
•	Hesaplama araçları
•	Karşılaştırma tabloları
•	Terim sözlüğü
•	Gerçek vaka çalışmaları
•	Uzman görüşleri
•	Yöntem açıklamaları
•	Veri toplama metodolojisi
•	Tarihli trend raporları
•	Sık güncellenen istatistik sayfaları
•	Kullanıcıların kaynak gösterebileceği tanımlar
Veri kaynağını ve metodolojiyi açıkça belirt.
Üçüncü taraf verisini kendine ait araştırma gibi sunma.
İstatistikleri kaynaksız kullanma.
Eski istatistikleri güncelmiş gibi gösterme.
İçeriğin başında soruya kısa ve doğrudan cevap ver; devamında kanıt, yöntem, örnek ve sınırlamaları açıkla.
AI cevabı kazanmak amacıyla anlamsız şekilde her paragrafı soru-cevap biçimine sokma.
Vaka çalışmaları
Vaka çalışmaları marka otoritesinin ana parçalarından biri olmalıdır.
Her gerçek vaka çalışmasında şu alanları destekle:
•	Müşteri veya anonim müşteri tanımı
•	Sektör
•	Başlangıç durumu
•	Problem
•	Hedef
•	Uygulanan hizmetler
•	Strateji
•	Zaman çizelgesi
•	Üretilen çıktılar
•	Kullanılan kanallar
•	Ölçüm yöntemi
•	Önceki dönem
•	Sonraki dönem
•	Gerçek sonuçlar
•	Sonuçların sınırları
•	Müşteri onayı
•	İlgili ekip
•	Görseller
•	Video
•	İlgili hizmetler
•	Teklif CTA’sı
Müşteri gizliliği nedeniyle isim verilemiyorsa bunu açıkla.
Sonuç uydurma.
Yüzde değişimini gerçek ham verilerden hesapla.
Nedensellik kanıtlanamıyorsa sonucu doğrudan ajansa bağlama.
Karşılaştırma ve alternatif sayfaları
Gerçek ve tarafsız içerikle kullanıcıların karşılaştırma niyetini karşıla.
Değerlendirilebilecek içerikler:
•	Sosyal medya ajansı mı freelancer mı?
•	SEO ajansı mı şirket içi ekip mi?
•	New media ajansı mı geleneksel reklam ajansı mı?
•	Organik sosyal medya mı ücretli reklam mı?
•	SEO mu Google Ads mi?
•	AI içerik mi insan içerik mi?
•	Proje bazlı mı aylık ajans hizmeti mi?
•	Büyük ajans mı butik ajans mı?
•	Hypers benzeri ajans seçerken nelere bakılmalı?
•	New media ajansı seçme rehberi
Rakip marka adını kullanırken:
•	Karalama yapma
•	Yanlış bilgi verme
•	Rakibin markasını sahiplenme
•	Rakibin logosunu izinsiz kullanma
•	Kendini objektif olmayan biçimde birinci ilan etme
•	Hukuki risk doğuran karşılaştırma yapma
“Hyers alternatifi” veya benzeri rakip markalı sayfaları yalnızca yeterli, dürüst ve karşılaştırmalı kullanıcı değeri varsa değerlendir.
Rakip adlarını sırf trafik almak için yüzlerce zayıf sayfada kullanma.
Dijital PR ve üçüncü taraf otoritesi
AI sistemlerinin yalnızca Kade New Media’nın kendi sitesindeki iddialarına değil, güvenilir üçüncü taraf kaynaklarına da erişebilmesi için etik dijital PR planı hazırla.
Aşağıdaki kanalları değerlendir:
•	Sektör yayınları
•	Pazarlama yayınları
•	Teknoloji yayınları
•	Girişimcilik yayınları
•	Yerel işletme yayınları
•	Podcast’ler
•	YouTube programları
•	Webinarlar
•	Konferanslar
•	Üniversite etkinlikleri
•	Meslek birlikleri
•	İş dünyası toplulukları
•	Ajans dizinleri
•	B2B hizmet platformları
•	Kurucu röportajları
•	Konuk yazılar
•	Özgün araştırma duyuruları
•	Ortak proje açıklamaları
•	Müşteri vaka çalışmaları
•	Uzman yorum talepleri
Güncel ve güvenilir ajans dizinlerini araştır.
Her platform için:
•	Uygunluk
•	Domain otoritesi
•	Türkiye görünürlüğü
•	Hedef kitle
•	Profil doğrulama yöntemi
•	Ücretli veya ücretsiz olması
•	Yorum sistemi
•	Spam riski
•	Lead potansiyeli
•	Marka entity katkısı
değerlendirmesi yap.
Sahte haber yayınlama.
Ücretli içeriği editoryal haber gibi göstermeye çalışma.
Sahte müşteri yorumu satın alma.
Kalitesiz dizinlere toplu kayıt yapma.
Link satın alma veya manipülatif backlink ağı kurma.
Aşağıdaki dosyayı oluştur:
DIGITAL_PR_AND_MENTIONS_PLAN_TR.md
Sosyal platformlarda arama görünürlüğü
Kade New Media’nın yalnızca web aramasında değil, platform içi aramalarda da bulunmasını sağla.
Değerlendir:
•	Instagram
•	TikTok
•	YouTube
•	LinkedIn
•	X
•	Pinterest
•	Behance
•	Uygun diğer profesyonel platformlar
Profil alanlarını tutarlı yap:
•	Marka adı
•	Kullanıcı adı
•	Kategori
•	Açıklama
•	Web sitesi
•	Konum
•	İletişim
•	Logo
•	Kapak görseli
•	Hizmet ifadeleri
İçeriklerde kullanıcıların gerçekten aradığı doğal ifadeleri kullan.
Aşırı hashtag veya anahtar kelime doldurma yapma.
YouTube içerikleri için:
•	Açıklayıcı başlık
•	Doğal açıklama
•	Bölümler
•	Altyazı
•	Transcript
•	Thumbnail
•	İlgili site sayfasına bağlantı
•	VideoObject schema
•	Video sitemap
değerlendir.
Kısa videolar için sosyal medya ajansı, SEO, AI marketing ve new media konularında uzman görüşü serileri oluştur.
Site mimarisi ve iç bağlantılar
Konu otoritesini anlaşılır bir hiyerarşiyle kur.
Örnek üst düzey yapı:
•	/hizmetler/
•	/hizmetler/sosyal-medya/
•	/hizmetler/seo/
•	/hizmetler/icerik-uretim/
•	/hizmetler/reklam-yonetimi/
•	/hizmetler/ai-marketing/
•	/hizmetler/new-media/
•	/sektorler/
•	/paketler/
•	/projeler/
•	/vaka-calismalari/
•	/bilgi-merkezi/
•	/rehberler/
•	/arastirmalar/
•	/hakkimizda/
•	/ekip/
•	/iletisim/
Mevcut URL’leri sebepsiz yere değiştirme.
URL değişikliği gerekiyorsa eksiksiz 301 yönlendirme haritası hazırla.
Her içerik kümesinde:
•	Hub sayfası
•	Alt içerikler
•	İlgili hizmet sayfası
•	Vaka çalışması
•	CTA
•	Breadcrumb
bağlantısı kur.
Yetim sayfa bırakma.
Footer’ı yüzlerce anahtar kelime bağlantısıyla doldurma.
Vite ve Next.js SEO bütünlüğü
Tek Vercel projesi altında çalışan iki servis nedeniyle SEO davranışını servis bazında doğrula.
Legacy Vite sitesi
Public pazarlama sayfalarının arama motorlarına anlamlı HTML sunup sunmadığını kontrol et.
Kritik içerik sadece client-side JavaScript sonrasında görünüyorsa mevcut mimariye uygun SSR, SSG veya prerender çözümü değerlendir.
Şunları test et:
•	View-source içeriği
•	JavaScript kapalı görünüm
•	Google render görünümü
•	Meta etiketleri
•	Canonical
•	Structured data
•	Status code
•	Sitemap
•	Internal links
apps/kadexai
Şu sayfaları varsayılan olarak indeksleme dışı tutmayı değerlendir:
•	Login
•	Register
•	Şifre sıfırlama
•	Dashboard
•	Admin
•	Ödeme ekranları
•	Kullanıcıya özel fiyat yönetimi
•	API endpointleri
•	Callback sayfaları
•	Başarılı veya başarısız ödeme dönüş sayfaları
•	Test ve preview sayfaları
Public ve gerçekten değerli ürün veya paket sayfaları varsa bunları kontrollü biçimde indekslenebilir yap.
/kadexai ile ana site arasında canonical çakışması oluşturma.
API endpointlerinin indekslenmesini engelle.
Preview Vercel domainlerini noindex yap.
Production custom domainini yanlışlıkla noindex bırakma.
Teknik SEO
Aşağıdaki kontrolleri uygula:
•	HTTP durum kodları
•	Canonical
•	Sitemap index
•	XML sitemap’ler
•	Image sitemap
•	Video sitemap
•	Robots.txt
•	Hreflang gerekiyorsa
•	Pagination
•	Redirect zincirleri
•	Redirect loop
•	Soft 404
•	Gerçek 404
•	5xx hataları
•	Duplicate content
•	Duplicate title
•	Duplicate description
•	Parametreli URL’ler
•	Trailing slash tutarlılığı
•	Büyük ve küçük harf URL’leri
•	Türkçe karakter URL davranışı
•	HTTP ve HTTPS
•	www ve non-www
•	Custom domain
•	Preview domainleri
•	Asset erişimi
•	JavaScript render
•	Hydration hataları
•	Internal link status
•	Orphan pages
•	Broken images
•	Structured data hataları
•	Open Graph
•	Social card
•	Favicon
•	Web app manifest
•	RSS veya Atom feed
•	Last modified tarihleri
•	ETag ve cache davranışı
Sitemap içine yalnızca canonical, indekslenebilir ve başarılı cevap veren URL’leri koy.
lastmod değerini her deployment sırasında sahte şekilde güncelleme. İçerik gerçekten değiştiğinde güncelle.
Core Web Vitals ve performans
Mobil öncelikli çalış.
Şunları ölç ve iyileştir:
•	LCP
•	INP
•	CLS
•	TTFB
•	FCP
•	Render blocking kaynaklar
•	JavaScript bundle boyutu
•	Üçüncü taraf scriptler
•	Font yükleme
•	Hero görseli
•	Video yükleme
•	Lazy loading
•	Responsive image
•	Image dimensions
•	Cache headers
•	CDN kullanımı
•	API gecikmesi
•	Server rendering süresi
•	Veritabanı sorguları
•	Hydration yükü
Performans uğruna kritik içeriği arama motorlarından gizleme.
İçerik kalitesi ve doğal Türkçe
SEO amacıyla anahtar kelime doldurma yapma.
Metinler:
•	Doğal Türkiye Türkçesiyle yazılmalı
•	Gerçek ajans deneyimi yansıtmalı
•	Somut olmalı
•	Jenerik AI cümlelerinden kaçınmalı
•	Okuyucunun sorusuna doğrudan cevap vermeli
•	Kanıtlanabilir olmalı
•	Gereksiz uzun olmamalı
•	Her sayfada farklı niyeti karşılamalı
•	Aynı paragrafı farklı sayfalarda tekrar etmemeli
•	Sahte otorite sinyali üretmemeli
Aşağıdaki ifadeleri gereksiz tekrar etme:
•	Dijital dünyada fark yaratın
•	Markanızı bir sonraki seviyeye taşıyın
•	Yenilikçi çözümler
•	Güçlü dijital varlık
•	Rakiplerinizin önüne geçin
•	Başarıya birlikte yürüyelim
•	Uçtan uca çözüm
•	Benzersiz deneyim
•	Geleceği bugünden yakalayın
Bunların yerine süreç, çıktı, zaman, ekip ve sonuçları anlat.
Gerçek referans ve yorum sistemi
Müşteri yorumları yalnızca gerçek ve doğrulanabilir olduğunda yayınlanmalıdır.
Her yorum için mümkünse:
•	Müşteri adı
•	Şirket
•	Görev
•	Verilen hizmet
•	Tarih
•	Yayın izni
•	Doğrulama durumu
sakla.
Sahte yorum yazma veya schema’ya sahte puan ekleme.
Gerçek müşteri yorumlarını Google Business Profile, güvenilir B2B platformları ve site arasında etik şekilde yönet.
Negatif yorumları gizlemek yerine yanıt ve iyileştirme süreci oluştur.
AI sistemleri için cevap verilebilirlik
Önemli sayfalarda kullanıcı sorularına açık ve alıntılanabilir cevaplar sun.
Örnek sorular:
•	Kade New Media hangi hizmetleri veriyor?
•	Kade New Media nerede hizmet veriyor?
•	Kade New Media’nın sosyal medya paketleri neler?
•	Sosyal medya yönetimi fiyatı ne kadar?
•	Kade New Media AI kullanıyor mu?
•	Kade New Media ile nasıl iletişime geçilir?
•	Kade New Media hangi sektörlerle çalışıyor?
•	Kade New Media ile Hypers arasındaki fark nedir?
•	Kade New Media küçük işletmelerle çalışıyor mu?
•	Kade New Media video çekimi yapıyor mu?
•	Kade New Media SEO hizmeti veriyor mu?
•	Kade New Media’nın çalışma süreci nasıl?
•	Kade New Media güvenilir mi?
•	Kade New Media’nın gerçek projeleri neler?
Bu sorulara sadece FAQ schema eklemekle yetinme. Cevapları sayfanın görünür içeriğinde sun.
Marka hakkında tek ve tutarlı “factsheet” oluştur:
•	Kısa marka açıklaması
•	Uzun marka açıklaması
•	Hizmet listesi
•	Hizmet bölgesi
•	İletişim
•	Kurucu bilgisi
•	Resmî sosyal hesaplar
•	Önemli projeler
•	Sık sorulan sorular
•	Son güncelleme tarihi
Bu factsheet’i kullanıcılar için gerçek bir sayfa olarak yayınla. Yalnızca botlar için gizli içerik oluşturma.
AI tarafından yanlış bilginin düzeltilmesi
AI görünürlük testlerinde Kade New Media hakkında yanlış bilgiler bulunursa:
1.	Yanlış bilginin kaynağını tespit et.
2.	Site üzerindeki çelişkili bilgileri düzelt.
3.	Sosyal profilleri tutarlı hâle getir.
4.	Eski üçüncü taraf profillerini güncelle.
5.	Canonical ve entity ilişkilerini düzelt.
6.	Güncel factsheet yayınla.
7.	Uygun arama motorlarında yeniden tarama iste.
8.	Sonucu daha sonra tekrar test et.
AI sistemini yanıltmak amacıyla yapay içerik, gizli metin veya manipülatif kaynak ağı oluşturma.
Arama ve AI referral ölçümü
Analytics sisteminde aşağıdaki kaynakları ayrı izlemeyi değerlendir:
•	ChatGPT
•	Claude
•	Gemini
•	Perplexity
•	Grok
•	Google AI özellikleri
•	Bing Copilot
•	Diğer cevap motorları
Referral bilgisinin her sistemde eksiksiz iletilmeyebileceğini kabul et.
GA4 veya kullanılan analytics sistemi içinde özel kanal grupları oluştur.
Şunları ölç:
•	Landing page
•	Kaynak
•	Kampanya
•	Oturum
•	Etkileşim
•	Teklif formu
•	Telefon tıklaması
•	E-posta tıklaması
•	WhatsApp tıklaması
•	Paket görüntüleme
•	Vaka çalışması görüntüleme
•	Lead kalitesi
•	Satışa dönüşüm
Crawler loglarını hassas veri toplamadan analiz et.
Önemli botların hangi URL’leri ne sıklıkla taradığını raporla.
Search Console ve webmaster entegrasyonları
Aşağıdaki sistemleri kur veya kurulum kontrol listesi hazırla:
•	Google Search Console
•	Bing Webmaster Tools
•	Google Business Profile
•	GA4
•	Tag Manager gerekiyorsa
•	Microsoft Clarity veya tercih edilen gizlilik uyumlu davranış analizi
•	Schema doğrulama araçları
•	PageSpeed Insights
•	Lighthouse
•	CrUX verileri
•	Log analizi
•	Rank tracking
•	AI visibility tracking
Doğrulama için kullanıcı erişimi gerekiyorsa gerekli adımları açıkça yaz.
İçerik yayın takvimi
İlk 90 gün için uygulanabilir içerik ve otorite planı oluştur.
Planı üç aşamaya ayır:
İlk 30 gün
•	Teknik SEO problemlerini düzelt
•	Marka entity bilgilerini standartlaştır
•	Ana hizmet sayfalarını tamamla
•	Paket sayfalarını tamamla
•	Hakkımızda ve ekip sayfalarını güçlendir
•	Schema sistemini kur
•	Sitemap ve robots kurallarını düzelt
•	Google Business Profile’ı optimize et
•	Başlangıç AI görünürlük ölçümünü yap
•	En önemli beş vaka çalışmasını hazırla
•	Ana sosyal profilleri tutarlı hâle getir
31–60 gün
•	Konu kümelerini yayınlamaya başla
•	Özgün rehberler oluştur
•	Karşılaştırma içerikleri yayınla
•	Video serileri başlat
•	Dijital PR outreach başlat
•	Güvenilir ajans platformlarında profilleri tamamla
•	İç bağlantıları geliştir
•	AI visibility testlerini tekrarla
•	Düşük performanslı sayfaları güncelle
61–90 gün
•	Özgün araştırma veya sektör raporu yayınla
•	Yeni vaka çalışmaları yayınla
•	Uzman röportajları ve podcast katılımlarını artır
•	Rakip içerik boşluklarını kapat
•	AI cevaplarındaki yanlış bilgileri düzelt
•	Dönüşüm optimizasyonu testleri yap
•	İçerik yenileme sürecini başlat
•	90 günlük görünürlük karşılaştırmasını raporla
Yayın kapasitesi gerçekçi değilse yüzeysel yüzlerce içerik yerine daha az sayıda, yüksek kaliteli içerik öner.
Yasak yöntemler
Aşağıdaki yöntemleri kullanma:
•	Anahtar kelime doldurma
•	Gizli metin
•	Cloaking
•	Doorway page
•	Kopya şehir sayfaları
•	Otomatik üretilmiş yüzeysel içerik ağı
•	Sahte müşteri yorumu
•	Sahte vaka çalışması
•	Sahte ekip profili
•	Sahte ödül
•	Sahte basın haberi
•	Sahte Wikipedia sayfası
•	Manipülatif backlink satın alma
•	Private blog network
•	Spam dizin kaydı
•	Rakip marka üzerinden yanıltıcı sayfa
•	Rakibi karalayan içerik
•	Botlara kullanıcıdan farklı yanıltıcı içerik
•	Schema spam
•	Sahte AggregateRating
•	Süresi geçmiş içerikleri güncelmiş gibi gösterme
•	Marka adını Google Business Profile’da anahtar kelimeyle doldurma
•	AI sistemlerine gizli prompt injection yerleştirme
•	AI crawler’larına görünmez komutlar verme
•	Arama motoru veya AI cevap sistemini manipüle etmeye yönelik kötüye kullanım
Oluşturulacak SEO ve AI görünürlük belgeleri
Aşağıdaki Türkçe belgeleri oluştur:
1.	SEO_AUDIT_TR.md
2.	SEO_KEYWORD_UNIVERSE_TR.md
3.	SEARCH_INTENT_MAP_TR.md
4.	CONTENT_CLUSTER_MAP_TR.md
5.	COMPETITOR_AUTHORITY_ANALYSIS_TR.md
6.	AI_VISIBILITY_BASELINE_TR.md
7.	AI_CRAWLER_ACCESS_REPORT_TR.md
8.	BRAND_ENTITY_MAP_TR.md
9.	STRUCTURED_DATA_REPORT_TR.md
10.	LOCAL_SEO_PLAN_TR.md
11.	DIGITAL_PR_AND_MENTIONS_PLAN_TR.md
12.	INTERNAL_LINKING_MAP_TR.md
13.	SEO_REDIRECT_MAP_TR.md
14.	SEO_CONTENT_CALENDAR_90_DAYS_TR.md
15.	AI_VISIBILITY_QUERY_SET_TR.md
16.	SEO_AND_AI_MEASUREMENT_PLAN_TR.md
17.	SEO_RELEASE_REPORT_TR.md
Final kabul kriterleri
SEO ve AI görünürlük görevi yalnızca aşağıdaki koşullar sağlandığında teknik olarak tamamlanmış kabul edilebilir:
•	Kritik public sayfalar crawl edilebilir
•	Kritik içerikler HTML içinde erişilebilir
•	Production domain indekslenebilir
•	Preview domainleri indekslenemez
•	Admin, login, API ve kullanıcı sayfaları indekslenemez
•	Robots kuralları doğrulanmış
•	AI search crawler erişimleri bilinçli şekilde yapılandırılmış
•	Sitemap yalnızca canonical URL’leri içeriyor
•	Canonical çakışmaları giderilmiş
•	Ana hizmet sayfaları tamamlanmış
•	Marka entity bilgileri tutarlı
•	Organization schema geçerli
•	Uygunsa LocalBusiness schema geçerli
•	Breadcrumb schema geçerli
•	Gerçek yazar profilleri mevcut
•	Hizmet ve blog bağlantıları kurulmuş
•	En az başlangıç AI görünürlük benchmarkı yapılmış
•	Rakip share-of-voice ölçülmüş
•	Hypers ve diğer gerçek rakiplerle fark analizi yapılmış
•	Google Search Console doğrulaması tamamlanmış veya kullanıcı adımları belgelenmiş
•	Bing Webmaster doğrulaması tamamlanmış veya kullanıcı adımları belgelenmiş
•	Google Business Profile kontrolü yapılmış
•	AI referral ölçüm planı kurulmuş
•	Gerçek vaka çalışmaları yayınlanmış veya veri eksikliği blocker olarak belirtilmiş
•	Sahte yorum ve sahte otorite sinyali bulunmuyor
•	Core Web Vitals için kritik teknik sorun kalmamış
•	Kırık linkler düzeltilmiş
•	Structured data hataları giderilmiş
•	90 günlük içerik ve dijital PR planı hazırlanmış
•	Başlangıç değerleri ile hedef KPI’lar belgelenmiş
Bu koşulların tamamlanması, belirli bir Google sırası veya herhangi bir AI sistemi tarafından önerilme garantisi anlamına gelmez.
Final raporunda sonucu şu ifadelerden biriyle sınıflandır:
•	Teknik SEO ve AI görünürlük altyapısı hazır
•	Temel altyapı hazır, otorite ve içerik çalışmaları devam etmeli
•	Kritik indeksleme veya güven sorunları nedeniyle hazır değil
“Bütün yapay zekâlar artık Kade New Media’yı önerecek” veya “her sorguda birinci sıraya çıkacak” gibi kanıtlanamayacak ifadeler kullanma.
Bunun yerine hangi sistemlerde, hangi sorgularda, hangi tarihte ölçüm yapıldığını ve sonuçların nasıl değiştiğini somut olarak raporla.

---

# EK B — Başlangıçta çıkarılacak kısa karar listesi

İlk baseline incelemesinden sonra kullanıcıya soru sormadan önce, mevcut koddan çıkarabildiğin bilgileri doldur:

- Ana uygulama(lar):
- Public domain:
- Admin rotası:
- Kullanıcı paneli rotası:
- Mevcut ödeme sağlayıcısı:
- Auth sağlayıcısı:
- Veritabanı/ORM:
- Storage:
- Deployment:
- Eski 26 Haziran sürümünün konumu:
- `/@link` mevcut izleri:
- Odoo mevcut mu:
- Mevcut paket/fiyat veri kaynağı:
- Kritik blockerlar:

Bu listeyi doldurduktan sonra uygulanabilir işlere doğrudan başla. Erişim veya sır gerektiren maddelerde adapter/test modu kullan ve blocker kaydı aç.
