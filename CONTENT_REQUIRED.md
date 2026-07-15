# Kade Media — Production Content Checklist

Son bağımsız denetim: 15 Temmuz 2026

Canonical alan adı: **https://www.kademedia.com.tr**  
Doğrulanmış iletişim kanalı: **thekademedia@gmail.com**  
Doğrulanmış genel konum: **İstanbul**

Bu dosyadaki bir madde doğrulanmadan siteye gerçek veri gibi eklenmemelidir.

## Yayından kaldırılan / noindex yapılan içerikler

- Doğrulanmamış müşteri, partner, testimonial ve vaka çalışmaları kaldırıldı.
- Doğrulanmamış başarı yüzdeleri, müşteri sayıları ve deneyim istatistikleri kaldırıldı.
- Kaynağı ve editoryal onayı olmayan blog yazıları kaldırıldı; `/blog` noindex durumunda.
- Sabit fiyat, ücretsiz hizmet, kontenjan ve aciliyet iddiaları kaldırıldı.
- Doğrulanmamış telefon, WhatsApp, açık adres, çalışma saati ve sosyal hesaplar kaldırıldı.
- Eski `Kade New Media` / `kadenewmedia` kamuya açık marka kullanımları kaldırıldı.
- Geliştirme seed işlemi artık demo müşteri, partner, blog veya metrik üretmiyor.

## Yayına geri almak için gerekli kanıtlar

### Referanslar ve vaka çalışmaları

- Müşteri/marka adı ve logo kullanım izni
- Yayınlanabilir proje kapsamı
- Ölçüm dönemi, veri kaynağı ve hesaplama yöntemiyle doğrulanmış sonuçlar
- Müşteri tarafından onaylanmış alıntı ve kişi unvanı

### Ekip ve şirket bilgileri

- Yayın izni bulunan ekip adı, rolü, biyografisi ve görseli
- Resmî şirket unvanı, vergi/MERSİS bilgisi gerekiyorsa hukuk kontrolü
- Açık adres veya Teknopark ilişkisi için doğrulanabilir belge

### İletişim ve sosyal kanallar

- Domain tabanlı kurumsal e-posta
- Telefon ve WhatsApp numarası için sahiplik doğrulaması
- Her sosyal profil için açılıp çalıştığı doğrulanmış resmî URL
- Harita profili ve açık adres için işletme doğrulaması

### Blog ve SEO içeriği

- Yazar/editör onayı
- Güncel istatistiklerin birincil kaynakları ve erişim tarihleri
- Telif hakkı uygun görsel/asset kaynağı
- Search Console üzerinden sitemap ve canonical doğrulaması

### Fiyatlandırma ve ticari koşullar

- Para birimi, KDV durumu ve faturalama koşulları
- Reklam/medya bütçesinin dahil olup olmadığı
- Ek prodüksiyon, lisans, seyahat ve üçüncü taraf maliyetleri
- Taahhüt, iptal, revizyon ve teslim koşulları
- Shopier/ödeme ürünü ile web sitesindeki kapsamın birebir eşleşmesi

## Demo ve özel alanlar

- Organizasyon Kiti içindeki örnek operasyon kayıtları gerçek müşteri verisi değildir; ürün ekranında **demo** olarak açıkça işaretlenmelidir.
- Özel müşteri içeriği istemci bundle'ına gömülmemeli; sunucuda oturum ve entitlement kontrolünden sonra verilmelidir.
- Production ortamında ücretsiz test paketi talebi kapalı kalmalıdır.

## Operasyonel takip

- Vercel ortam değişkenleri: MongoDB, JWT (en az 32 karakter), SMTP, isteğe bağlı Upstash rate limit
- `SEED_ENDPOINT_ENABLED` production'da varsayılan olarak kapalı
- 404, sitemap, robots ve güvenlik header'ları her deploy sonrası smoke testten geçirilmeli
- Yasal metinler şirketin gerçek hukuki statüsü ve veri akışları kesinleştiğinde hukuk uzmanına onaylatılmalı
