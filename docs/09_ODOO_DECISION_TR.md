# 09 — Odoo Değerlendirmesi ve Kararı (şartname §20)

## Karar: Odoo bu aşamada KURULMAYACAK

Şartnamenin kendi kuralı açık: *"Odoo'yu sırf kullanıcı adı geçti diye
sisteme ekleyip yeni karmaşa üretme"* ve §1'de genel kural olarak
*"Gereksiz mikroservis, mesaj kuyruğu, Odoo veya ağır altyapı ekleme"*
zaten yasaklanmış. Bu belge o değerlendirmeyi yapıyor ve sonucu
gerekçelendiriyor.

## Değerlendirme — alan alan, mevcut sistemle karşılaştırma

| Odoo'nun sağlayacağı alan | Kade New Media'da mevcut karşılığı | Odoo gerçek bir fayda sağlar mı? |
|---|---|---|
| CRM ve lead pipeline | `server/api/crm.js`, `KanbanSection`, `QuoteLeadsSection` — çalışan, entegre bir pipeline zaten var | Hayır — mevcut sistem zaten aynı işi görüyor, veri taşıma riski + iki sistemi senkron tutma yükü olurdu |
| Teklif/satış siparişi | `ProposalBuilderSection`, `kade_shopier_orders`, `kade_quotes` (Faz 3'te teklif-talebi durum makinesi eklendi) | Hayır — aynı gerekçe |
| Faturalama entegrasyonu | `kade_invoices` + `InvoicesSection` (basit fatura kaydı, muhasebe entegrasyonu yok) | **Kısmen tartışmalı** — gerçek çift-taraflı muhasebe/e-fatura entegrasyonu gerekiyorsa mevcut sistem yetersiz kalır (bkz. aşağıdaki "yeniden değerlendirme" bölümü) |
| Abonelik | `kade_subscriptions` + `SubscriptionsSection` | Hayır — mevcut sistem yeterli |
| Proje yönetimi | Yok (görev/task sistemi var: `TasksSection`, ama tam proje/gantt yönetimi yok) | Hayır bu aşamada — Kade New Media'nın ekip büyüklüğü ve iş akışı göz önüne alındığında mevcut basit görev sistemi yeterli görünüyor, kanıtlanmış bir ihtiyaç yok |
| Helpdesk | Kısmen (Mesajlar/CRM genel amaçlı) | Hayır — özel bir ticket sistemi ihtiyacı belirtilmemiş |
| E-posta otomasyonu | `EmailTemplatesSection`, SMTP entegrasyonu (`nodemailer`) | Hayır — mevcut yeterli |
| Creator/vendor yönetimi | Yok (Faz 7 kapsamı, henüz başlanmadı) | Belirsiz — bu alan henüz kendi içinde tanımlanmadığı için Odoo'nun bunu çözüp çözemeyeceği bile değerlendirilemez |
| Muhasebe süreçleri | Yok (gerçek çift-taraflı muhasebe yok, yalnızca fatura kaydı) | **En güçlü potansiyel gerekçe** ama bu turda kanıtlanmış bir talep/ihtiyaç yok |
| Türkiye yerelleştirmesi (e-fatura, e-arşiv, KDV) | Yok | Gerçek bir gereksinimse Odoo'nun Türkiye lokalizasyon modülü avantajlı olurdu — ama bu şu an yalnızca varsayımsal |

## Karar kuralları karşısında durum

Şartname Odoo'yu yalnızca şu koşulların HEPSİ sağlandığında kurmayı
söylüyor:

- [ ] Gerçek operasyonel fayda sağlıyor — **kanıtlanmadı**, mevcut CRM/teklif/fatura sistemleri zaten çalışıyor
- [ ] Mevcut panelle rol çakışması net çözülmüş — **değerlendirilmedi** (ön koşul sağlanmadığı için gerek kalmadı)
- [ ] Source of truth yazılmış — **yok**
- [ ] Senkronizasyon yönü/hata yönetimi belirlenmiş — **yok**
- [ ] Kimlik doğrulama/yetki güvenli — **yok**
- [ ] Deployment/backup planı var — **yok**

İlk koşul sağlanmadığı için diğerleri değerlendirilmedi — bu bilinçli
bir kısayol, eksiklik değil: gerekçesiz bir "evet" kararı üretip sonra
6 alt-koşulu doldurmaya çalışmak, şartnamenin "önce gerçek fayda var mı"
sorusunu atlayıp tam tersi bir sırayla ilerlemek olurdu.

## Ne zaman yeniden değerlendirilmeli

Bu karar kalıcı değil. Aşağıdakilerden biri gerçekleşirse yeniden
açılmalı:

1. Kade New Media gerçek çift-taraflı muhasebe / Türkiye e-fatura-e-arşiv
   zorunluluğuna girerse (bu, mevcut `kade_invoices` basit kayıt
   sisteminin gerçekten yetersiz kaldığı somut an olur).
2. Creator/influencer ağı (Faz 7) kapsamı netleşip vendor-yönetimi
   ölçeği mevcut CRM'in kapasitesini aşarsa.
3. Ekip büyüyüp gerçek bir proje-yönetimi (gantt/kaynak planlama)
   ihtiyacı doğarsa.

Bu üç durumdan biri gerçekleşmeden Odoo kurulumuna başlanmamalı.

## Sonuç

**Odoo entegrasyonu bu turda yapılmadı ve önerilmedi.** Mevcut
kod-tabanlı CRM/teklif/fatura/abonelik sistemleri operasyonel ihtiyacı
zaten karşılıyor; ek bir ERP katmanı şu an yalnızca karmaşa ve
senkronizasyon riski ekler, kanıtlanmış bir fayda getirmez.
