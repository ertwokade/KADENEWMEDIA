# Saha raporları — düzeltme takibi

Güncelleme: 2026-09-15. Toplam 113 numaralı bulgu: admin 26, genel site 14, KadexAI 73. Tekrarlar ve olumlu gözlemler de özgün numarasıyla korunur; 113 ayrı hata olduğu anlamına gelmez. Güncel tek kapanış özeti `MASTER_KAPANIS_KONTROLU_TR.md` dosyasıdır.

Bu dosya tamamlanan düzeltme gruplarının durumudur. Rapor düzeltmeleri, son güvenlik/dağıtım ve çıktı-sözleşmesi sertleştirmeleriyle birlikte `origin/main` dalına gönderildi. GitHub kalite kontrolleri, GitHub Actions Keyubu dağıtımı ve Vercel üretim dağıtımı başarıyla tamamlandı; ana site Vercel'de, KadexAI Keyubu'da çalışıyor. CallMeBot ayarları geri yüklendi; Telegram teslim katmanı, sağlayıcı kullanılabilirlik koruması ve yedekten gerçek geri yükleme testi eklendi. Ayrıntılar `ENTEGRASYON_INCELEMESI.md` içindedir. Rapor içindeki 100 yeni özellik fikri bu hata listesine dahil değil.

## Güvenlik ve kapsam

Gerçek müşteri kayıtları, admin hesapları, seed verileri ve domain değiştirilmedi. 12 Eylül'de üç hazırlanmış şema migration'ı taze şifreli yedek ve transaction dry-run sonrasında üretim veritabanına uygulandı; mevcut veri satırları silinmedi veya tahminle değiştirilmedi. Mevcut CallMeBot ayarları dışında anahtar değişikliği yapılmadı. Tarayıcı testleri yerel API mock kullanır; gerçek backend bağlantısının çalıştığını tek başına kanıtlamaz.

## Son doğrulama

15 Eylül ek kapanışı: iletişim/teklif formlarında gerçek başarıya bağlı teşekkür
yönlendirmesi, çift gönderim kilidi, kısa mesaj açıklaması ve teknik hata
gizleme tamamlandı. Ana sayfa admin içeriğinin final klon derlemesinden düşmesi
engellendi; görünür kahraman başlığı ve SEO h1 birlikte güncelleniyor. Paket
fiyat editörü canlı statik `/paketler` sayfasına bağlandı; boş fiyat hâlâ
uydurulmuyor. Mobil meta yazıları 12 px tabana çıkarıldı, analitik açık çerez
onayına bağlandı ve eski `REUNIMOS` 3B dokusu Kade logosuyla değiştirildi.
Sunucu HTML'i ve bundle içindeki görünür eski şablon metinleri de temizlendi;
JavaScript kapalı production audit bunu kalıcı olarak denetliyor.

- Legacy birim testleri: 101 geçti; gerçek içerik API kodunda anonim/özel alan ayrımı, GA4 hata/sıfır ayrımı ve korumalı rotaların klon katmanıyla ezilmemesi dahil.
- KadexAI birim testleri: 273 geçti; gerçek history/materyal/akış/uyarı/yorum analizi/takvim/şablon/toplu üretim/ses dökümü kodu sahte bağımlılıklarla çalıştırıldı. Hesap izolasyonu, yönlendirme güvenliği, yönlendirilmiş ve düz metin çıktı sözleşmeleri, kaldırılmış materyal kaynağı, uyarı tekilleştirme, platform sayımı, dublaj bütünlüğü, Telegram teslim/webhook/komut güvenliği ve ses çıkarma temizliği dahil.
- Masaüstü/mobil tam Playwright koşusu: 252 geçti, 0 başarısız, ortam koşuluna bağlı 2 bilinçli atlandı. Production audit ayrıca 37 rota, 35 dahili bağlantı ve 7 görünümü sıfır hatayla denetledi; API çağrıları yerel güvenli test yanıtlarıyla sınandı.
- KadexAI TypeScript, değişen kodların ESLint kontrolü, legacy ve KadexAI üretim build başarılı.
- Vercel Git otomatik dağıtımı doğrulandı. Canlı ana sayfa, blog, paketler ve ana-site sitemap'i HTTP 200 döndü. Keyubu KadexAI sağlık ucu HTTP 200; oturumsuz yapılandırma ve bildirim uçları HTTP 401; korumalı panel rotaları girişe HTTP 307 döndü. Beş kritik KadexAI rotasına yapılan 20'şer ardışık istekte 503 görülmedi.
- Üretim kimlik uçlarında Gemini doğrulandı; diğer altı AI sağlayıcısı yetki hatası verdi ve güvenli bayrakla kullanım dışı bırakıldı. Gerçek medya üretimi henüz uçtan uca denenmedi.

9 Eylül ek grubu: Yorum Analizi'nde eksik taslak açıkça gösteriliyor; kullanıcı isteğiyle taslak üretilebiliyor, düzenlenip güncel metin kopyalanabiliyor. Taslak yorum özetine dayanıyor ve otomatik yayınlanmıyor. Aynı yetkili/plan kontrollü üretim rotası kullanıldı; girdi sınırları, hız sınırı, geçersiz çıktı ve güvenli hata yanıtları test edildi. Eksik oran/puanlar artık sıfır değil `null`/Belirtilmedi; gerçek sıfır korunuyor. Geç dönen taslak yeni analiz kartını değiştirmiyor. Genel öneriler görünür, mobil özet iki sütun. Altı API birim ve altı masaüstü/mobil testi geçti; ekran görüntüleri incelendi. KadexAI tip/lint/üretim derlemesi başarılı; 11 Eylül Keyubu dağıtımına dahil edildi.

8 Eylül ek grubu: zorunlu açık tema göçü kaldırıldı; snapshot, React ve statik sayfalar ortak tercihle sistem temasını izliyor. Referanslar CMS yorumlarını gösteriyor; Neden Biz yalnız dar kapsamlı, özel alanları dışlamış istatistik izdüşümünü okuyor. Materyal önizlemesi/klavye odağı, sayfalama, hata-boş ayrımı ve toplamada kısmi başarı düzeltildi. Akış adımlarında çıktı doğrulaması ve etiketli bağlam, Radar’da 20 farklı kurgu şablonu, Türkçe açıklamalar ve yinelenen uyarı düzeltmeleri eklendi. Mobil kurulum önerisi asistan düğmesiyle çakışıyordu; sabit bindirme yerine Genel Bakış sayfasının akışına alındı.

11 Eylül canlı kontrolü: ana site ve KadexAI temel rotaları sağlıklı. Keyubu web/medya/Supabase konteynerleri çalışıyor. Üretim ortamında AI anahtar adları mevcut olsa da salt-okunur sağlayıcı kontrolünde yalnız Gemini HTTP 200 verdi; Groq, Cerebras, OpenRouter, Mistral, Anthropic ve OpenAI 401/403, YouTube API 403 döndürdü. Bozuk anahtarlar silinmedi, ilgili sağlayıcılar yenilenene kadar seçici ve otomatik yönlendirmeden çıkarıldı. OAuth istemcisi mevcut fakat kanal onayı ve GA4 sunucu raporlama kimlikleri gerçek hesap erişimi bekliyor. Günlük şifreli Supabase yedeğinin 11 Eylül arşivi geçici veritabanına geri yüklendi; üretimle 123 tablo eşleşti ve geçici veritabanı silindi.

15 Eylül Telegram canlı kurulumu: `KadeX` / `@KadeXAiBot` oluşturuldu; token
ve özel hedef yalnız Keyubu secret dosyasına kaydedildi. WhatsApp ve Telegram
ortak kanal seçimi etkinleştirildi, KadexAI konteynerleri sağlıklı yeniden
başladı ve sunucudan gönderilen korumalı test bildirimi Telegram Web'de görüldü.
Geçici token/kurulum dosyaları silindi; gizli değerler git'e yazılmadı.
Etkileşimli bot devamında webhook secret-token denetimiyle Keyubu rotasına
bağlandı. Yalnız izinli bire bir sohbet kabul ediliyor; Türkçe komut menüsü ve
`durum`, `bugun`, `trendler`, `teklifler`, `hatalar`, `rapor`, `yardim`
komutları salt-okunur çalışıyor. Canlı bekleyen komut yanıtlandı, düğmeler
Telegram Web'de görüldü; Telegram webhook kuyruğu sıfır ve son hata boştu.

12 Eylül operasyon kontrolü: GitHub'ın kendi sunucularından ana site ve KadexAI sağlık ucunu 15 dakikada bir denetleyen bağımsız uptime workflow'u eklendi. Kontrol SSL/HTTP başarısını ve KadexAI `auth`/`ai` hazır durumunu doğruluyor; başarısızlık GitHub Actions kaydına düşüyor. Ayrıntılı Sentry/PostHog takibi gerçek hesap yapılandırması bekliyor.

12 Eylül bağımlılık güvenliği: ana site, KadexAI ve Studio kilit dosyalarında bulunan güncel açıklar yamalandı; iki kritik Next.js bulgusu dahil üç denetim de sıfır bilinen açığa indi. Ana site 99, KadexAI 265 ve Studio çekirdeği 13 birim testi geçti; üç üretim derlemesi başarılı. CI bundan sonra üç kilit dosyayı her push'ta `moderate` eşiğinden itibaren denetliyor.

12 Eylül yedekleme arayüzü: admin ekranındaki manuel indirme gerçek kapsamına göre “JSON Dışa Aktarım” olarak ayrıştırıldı. Yalnız 11 yönetim koleksiyonunu, koleksiyon başına en yeni 1000 kayıtla dışa aktardığı; kimlik doğrulama verilerini ve tam veritabanını içermediği arayüzde ve dosya metadata'sında açık. Sınırı aşan koleksiyonlar ayrıca gösteriliyor; afet kurtarma kaynağı günlük şifreli PostgreSQL yedeği olarak kalıyor.

9 Eylül takvim/şablon grubu: hesap sahibi doğrulanamayan eski `kade-content-calendar` ve `contentai-templates` kayıtları artık bulut listelerine karıştırılmıyor. Eski tarayıcı verileri silinmedi veya üzerine yazılmadı; otomatik taşıma yok. Bulut hataları boş liste/yerel başarı olarak gizlenmiyor. Ekleme/düzenleme/silme yalnız sunucu onayından sonra ekrana yansıyor; hata halinde form ve eski kayıt korunuyor. API'ler boş kimlik, bozuk gövde, geçersiz tarih/durum ve aşırı uzun girdileri reddediyor; silme/güncelleme kullanıcıya göre sınırlandırılıyor, bulunamayan kayıt 404. Takvimde 50 üzeri toplu istek sessizce kesilmiyor. Başlangıç şablonları korunuyor; düzenlemek hesaba yeni kopya ekliyor. Plan aktarımı kayıt onayı bekliyor, platformu üretim anından alıyor, tarihleri İstanbul gününe sabitliyor ve 29–30. günler beşinci hafta sekmesinde görünüyor. Başarı sonrası aynı planın düğmesi tekrar aktarımı engelliyor; belirsiz ağ sonucunda otomatik tekrar yok, takvimi kontrol etmek gerekiyor. Operasyon takvimiyle veri modeli birleştirilmedi. On yeni API birim testi ve on iki masaüstü/mobil testi geçti; tip/lint/üretim derlemesi başarılı. Mevcut görünüm korundu; mobil başlık ayrı satıra alındı ve ekran görüntüleri incelendi.

9 Eylül toplu üretim grubu: 50 sınırı ve beşli parçalama kodda zaten vardı. Bir parça hatasında bütün başarılı çıktının kaybolması giderildi; boş/bozuk çıktı başarı değil 502. Kısmi yanıtlar gerçek başlık/hook/platform açıklaması sayılarıyla gösteriliyor; tekrarlar ve eksik alanlar tamamlanmış sayılmıyor. Geçersiz adet/platform sessizce başka değerlere çevrilmiyor; oturum/paket/hız denetimleri korunuyor. X kimliği birleştirildi, eski twitter yanıtları uyumlu; hashtag setleri ortak normalleştiriciden geçiyor. Başarısız yeniden üretim eski başarılı sonucu yeniden göstermiyor. Araç tek konu için varyasyon üretir; ayrı ürün listesi/CSV içe aktarma eklenmedi ve arayüz bunu açıklar. Altı yeni gerçek route birim testi ve dört masaüstü/mobil test geçti; gerçek sağlayıcıya üretim çağrısı yapılmadı.

10 Eylül ses/operasyon/erişim grubu: ses dökümü yanıtları, kelime zamanları ve sağlayıcı hataları sözleşmeyle doğrulanıyor; boş ses ile bozuk sağlayıcı yanıtı ayrılıyor. Marka/profil/isteğe bağlı özel adlar sağlayıcıya sınırlı sözlük olarak gidiyor. Dublaj eksik çeviriyi hazır saymıyor; kullanıcı düzenlemesi tekrar çevrilmeden yeniden seslendirilebiliyor. Tarayıcı ses çıkarma 16 kat hızlandırılmıyor, zaman aşımında yarım kayıt üretmiyor ve medya kaynaklarını kapatıyor. SentScan dosya seçicileri iki dağıtım kopyasında temalı/klavye erişilebilir; başlangıç verileri gerçek kayıt gibi gösterilmiyor ve sağlayıcı yokken sahte görsel/video üretilmiyor. Dört korumalı rota aynı giriş/yetki kapısını kullanıyor; klon derleme katmanının iki güvenli rotayı ezmesi engellendi. On altı yeni ses birim testi, iki operasyon UI testi ve on dört erişim testi dahil doğrulamalar geçti.

11 Eylül çıktı sözleşmesi kapanışı: başlık ve hook rotaları sohbet önsözünü sonuç kartına çevirmiyor; bozuk JSON 502. Eski çeviri rotası yalnız tam ana çeviri alanı olan sınırlı şemayı kabul ediyor. Thread ve carousel etiketleri ortak Unicode/tekilleştirme/sayı sınırından geçiyor. Açıklama, izlenme analizi, sosyal analiz ve serbest metin üretiminde boş veya aşırı uzun sağlayıcı yanıtı başarı sayılmıyor. Yeni sınır testleriyle birlikte tip, lint, 263 birim testi ve üretim derlemesi başarılı.

## Kod dışı / canlı doğrulama gerektiren kalanlar

1. YouTube kanal onayı, yenilenecek yedek AI sağlayıcı anahtarları ve GA4 erişimi kullanıcıya ait gerçek hesap/anahtar ister; değer uydurulmadı. Kod ve güvenli durum görünümü hazır.
2. Gerçek partner, proje, basın, admin e-postası ve CRM aşamaları işletme verisidir; mevcut kayıtlar tahmin edilerek değiştirilmedi veya silinmedi.
3. Gerçek AI/video/ses kalitesi ve zamanlanmış bildirim teslimi sağlayıcılarla canlı uçtan uca denenmelidir.
4. Kod GitHub'a gönderildi; KadexAI Keyubu'ya, ana site Vercel'e dağıtıldı ve iki hedefte temel canlı sağlık/rota testlerinden geçti. Sonraki `main` push'ları Vercel üretim dağıtımını otomatik başlatır; Keyubu dağıtımı ise ilgili yol filtreli GitHub Actions iş akışıyla çalışır.

7 Eylül ek grubu: CRM iki görünümde test işareti filtresi (silme/sınıflandırma yapmaz), Türkçe hizmet etiketleri ve kısmi toplu silme hatası; bülten `id/created_at` uyumluluğu; statik teklif formunda paket ön seçimi; hesaplar arası geçmiş önbellek görünürlüğü ve doğru silme sonucu; Radar CSV formül koruması ve ölçülmemiş hız; sessiz izleme listesi hataları ve filtre aktarımı düzeltildi. `edit-section` yaklaşımıyla mevcut bölümler ve tema korundu. Tarayıcı becerisi için gereken MCP olmadığından yerel Playwright CLI kullanıldı; CRM ve Radar ekran görüntüleri incelendi.

## adminpanelraporu

Kaynak: `/Users/kadirdemir/Desktop/adminpanelraporu.html`

| No | Rapordaki bulgu | Durum / kalan doğrulama |
| --- | --- | --- |
| 01 | Dokuz lead'in dokuzu da altı aydır "Yeni" kutusunda | İşletme kararı: gerçek lead aşamaları ve müşteri iletişimi kendiliğinden değiştirilmedi. |
| 02 | Altı bölümün ⚠ "sayfa sitede yok" uyarısı — genel site raporunda yanlış çıktı | Düzeltildi ve dağıtıldı: admin sekmeleri gerçek rota tablosuyla eşlendi; var olan klon sayfalar `static`, olmayan sayfalar ayrı durumla gösteriliyor. Kaynakla eşleşme birim testinde korunuyor. |
| 03 | Türkçe karakterler baştan sona silinmiş, ayrıca sabit karışık | Bu tur: Analitik metinleri düzeltildi; masaüstü/mobil etiket testi geçti. |
| 04 | "Gerçek zamanlı işlemler" diyor, son kayıt 44 gün önce | Düzeltildi: desteklenen admin yazma uçları ortak log yardımcısını kullanıyor; log yazımı yanıt öncesi bekleniyor ve 5 sn süre sınırı var. Yapısal hedef/önce/sonra alanları 12 Eylül'de canlı şemaya uygulandı. Liste görünürken 30 sn yenileniyor ve hata eski kaydı güncelmiş gibi göstermiyor. Gerçek işletme kayıtlarına test logu eklenmedi. |
| 05 | Şirketin ikinci, ayrı AI içerik üreticisi — ve aynı tarih hatasını taşıyor | Bu tur: İstanbul saat diliminde güncel tarih bağlamı eklendi; yıl geçişi testi geçti. Gerçek model çıktısı ayrıca kontrol edilecek. |
| 06 | Aynı kelimenin içinde hem doğru hem yanlış Türkçe harf | Bu tur: Hatırlatıcılar ekranı, formu ve hata/başarı metinlerinin Türkçe karakterleri düzeltildi. |
| 07 | İngilizce koleksiyon adlarına Türkçe büyütme kuralı uygulanmış | Bu tur: tablo adlarının otomatik büyük harfe dönüşmesi kaldırıldı; eski MongoDB açıklaması düzeltildi. |
| 08 | Sayaçlar ilk yüklemede sıfır gösterip sonra doluyor | Bu tur: yükleniyor, hata ve gerçek sıfır ayrıldı; yeniden deneme eklendi. Masaüstü/mobil testleri geçti. |
| 09 | Google Analytics tamamen sıfır, yapılandırma durumu belirsiz | Düzeltildi: UI ve gerçek GA4 route kodunda yapılandırılmamış, erişilemeyen ve gerçek sıfır ayrıldı. Token/rapor reddi başarılı sıfır dönmüyor. 12 Eylül canlı denetiminde Vercel'deki üç GA4 değerinin örnek/placeholder olduğu kanıtlandı; kod bunları artık yapılandırılmış saymıyor veya Google'a göndermiyor. Gerçek property ve servis hesabı kullanıcıdan bekleniyor. |
| 10 | Beş partnerin beşi de uydurma seed verisi | İşletme kararı: seed kayıtları silinmedi; gerçek partner bilgileri gerekli. |
| 11 | "Veritabanını Başlat" düğmesi tek adımlık, uyarısız | Bu tur: seed işlemi öncesinde yedek hatırlatmalı açık onay eklendi; gerçek seed çalıştırılmadı. |
| 12 | "0 proje" diyor ama canlı sayfa dolu — CMS ile site bağlantısız | Önceki CMS portföy bağlantısı kodda mevcut; statik referans vitrini ayrı kalıyor. İçerik sahipliği ve canlı doğrulama bekliyor. |
| 13 | Aynı pipeline aşaması iki ayrı görünümde iki farklı isim taşıyor | Bu tur: Görüşme Bekliyor etiketi eşitlendi; veritabanı aşama kimlikleri korunuyor. |
| 14 | Gerçek talepler test kayıtlarıyla aynı listede, ayrıştırılmamış | Yerel düzeltme: CRM ve ayrı Kanban'da tüm/test işareti olmayan/olası test filtresi var. Sayımlar ve dışa aktarma görünür filtreyi izliyor. İşaretler yalnız ipucu; gerçek kayıt silinmedi. Birim ve masaüstü/mobil test geçti. |
| 15 | Hizmet alanı iki farklı formatta karışık | Yerel düzeltme: kodlar ve virgüllü/dizi hizmetler ortak Türkçe etikete dönüştürülüyor; özel adlar korunuyor. Tablo, detay, Kanban ve Excel aynı gösterimi kullanıyor. Test geçti. |
| 16 | Veri sıfırken bile öneriler değişmiyor | Bu tur: sabit önerilerin kişiselleştirilmediği açıklandı; masaüstü/mobil testi geçti. |
| 17 | Dashboard sayacı "0" diyor, gerçek sayı 1 | Yerel düzeltme: sayaç yükleme/hata ayrımı, bülten API'sinde id/created_at uyumluluğu sağlandı. Tarih görünümü ve doğru kimlikle silme masaüstü/mobilde test edildi. Gerçek abone silinmedi. |
| 18 | Sayfa canlı değil, tek kayıt test verisi | Yerel: `/referans-programi` rotası mevcut ve üretim çıktısında üretiliyor; adminin yanlış “Sayfa henüz yayında değil” etiketi gerçek sayfaya açılan bağlantıyla değiştirildi ve masaüstü/mobil test edildi. Rapordaki test kayıt gerçek veriden ayrıştırılmadan silinmedi. |
| 19 | "İşletme Adı" alanında kurumsal değil kişisel kimlik | İşletme kararı: marka/işletme bilgileri tahmin edilerek değiştirilmedi. |
| 20 | Dört admin kullanıcısının ikisinde e-posta kaydı yok | İşletme kararı: kade dahil mevcut admin yetkileri korunuyor; e-posta eksikliği tek başına yetki kaldırma gerekçesi değil. |
| 21 | KadexAI raporundaki isim tutarsızlığı burada da var | Doğrulandı: yönetim menüsünde `Blog Yazıları` ve `Rapor Oluştur` etiketleri kullanılıyor; eski tutarsız adlar kaynakta yok. |
| 22 | Sekiz gündür yeni yazı eklenmemiş | İçerik operasyonu: yazı yayın sıklığı kod hatası değil; kullanıcı adına yeni yazı yayınlanmadı. |
| 23 | Çalışma süresi ters sırada yazılmış | Bu tur: çalışma süresi sa/dk/sn olarak açık gösteriliyor; geçersiz değer bilinmiyor olarak gösteriliyor. |
| 24 | Dört bölüm tamamen boş, dördü de birbirine bağlı değil | Ürün kapsamı: görev, abonelik, NPS ve onboarding ekranlarının boş olması kod arızası değildir. Gerçek müşteri/iş akışı verisi uydurulmadı; bunları tek süreçte birleştirmek ayrı ürün kararıdır. |
| 25 | Üçüncü boş takvim | Ürün kapsamı: admin takvimi ve KadexAI içerik takvimi farklı sahiplik/yetki sınırlarında. KadexAI plan aktarımı tamamlandı; ürünler arası ortak takvim için veri sahipliği kararı gerekir. |
| 26 | Sıfır dosya | Hata değil: boş medya kütüphanesine sahte dosya eklenmedi. Yükleme arayüzü/API mevcut; gerçek blog/portföy dış URL'leri kullanıcı verisidir. |

## genelsiteraporu

Kaynak: `/Users/kadirdemir/Desktop/genelsiteraporu.html`

| No | Rapordaki bulgu | Durum / kalan doğrulama |
| --- | --- | --- |
| 01 | Üç yayında yazının üçü de blog listesinde görünmüyor | Düzeltildi ve dağıtıldı: liste/tarih düzeltmesi mevcut; API hatası boş yayın gibi sunulmuyor. Serbest Türkçe tarih ve güvenli metin çizimi masaüstü/mobilde geçti; canlı blog rotası HTTP 200. |
| 02 | İki bağımsız tasarım sistemi aynı domain altında, hiçbiri sistem temasını dinlemiyor | Yerel: ilk girişte zorunlu açık tema kaydı kaldırıldı; snapshot/React/statik sayfalarda sistem değişimi ve manuel tercihin rota değişiminde korunması masaüstü/mobilde geçti. Tasarım sistemleri birleştirilmedi. |
| 03 | Admin panelinin altı "sayfa sitede yok" uyarısının hepsi yanlış | Admin #02 ile aynı bulgu; kaynak/rota eşleşmesi düzeltildi, birim testinde korunuyor ve üretime dağıtıldı. |
| 04 | Admin'in "0 proje" dediği portföy, canlıda dolu — çünkü farklı bir kaynaktan geliyor | Admin #12 ile aynı konu; CMS bağlantısı kodda mevcut, statik vitrin ayrı. |
| 05 | Proje detay rotası tanımlı ama tamamen ölü | Kodda dinamik detay rotası ve sunucu doğrulaması mevcut; yayınlanmayan/geçersiz slug SPA kabuğu yerine 404 döner. Gerçek yayınlanmış proje verisi olmadan içerik uydurulmadı. |
| 06 | E-posta adresi büyük harfe çevrilerek gösteriliyor | Bu tur: React footer e-posta adresinde büyük harf dönüşümü kaldırıldı; statik footer zaten korumalı. |
| 07 | İki ayrı rota, birebir aynı içerik | Yerel: Referanslar, portföy kopyası yerine CMS müşteri yorumlarını gösteriyor; boş/hata ayrımı ve yayınlanmayan satırların gizlenmesi test edildi. Portföy verisi silinmedi. |
| 08 | "Giriş gerekli" durumu dört rotada dört farklı biçimde ele alınmış | Yerel: müşteri paneli, proje takip, organizasyon kiti ve Kade Kit Business aynı yüklenme/giriş/yetki bileşenini kullanıyor. Oturumsuz ve paketsiz durumlar masaüstü/mobilde 14 testle doğrulandı. Üretim derlemesinde klon sayfanın güvenli kök rotaları ezmesi de giderildi. |
| 09 | Paket ön-seçim parametresi sessizce yok sayılıyor | Düzeltildi ve dağıtıldı: statik teklif formu paket parametresini ve ilgili hizmetleri seçiyor; bilinmeyen parametre yok sayılıyor. Üretim çıktısında masaüstü/mobil test geçti. |
| 10 | Sayfa başlığı menüdeki adla eşleşmiyor | Yerel: statik/React/build başlıkları Paketler olarak eşitlendi; masaüstü/mobil test geçti. |
| 11 | Dinamik partner rotası test edilen kimlikte boş | Hata değil: var olmayan `/1` kaydı sunucuda 404 verir; dinamik partner rotası yayınlanmış slug'ı doğrular. Gerçek partner kaydı olmadan sahte detay oluşturulmadı. |
| 12 | İstatistik etiketleri var, rakamları metin çıktısında görünmüyor | Yerel: Neden Biz gerçek CMS sayı/etiketlerini çiziyor, boş sayılara değer uydurmuyor; gerçek 0 korunuyor. Özel CMS alanları açılmadı. API yetki testi ve hata/yeniden deneme/boş durum UI testi geçti. |
| 13 | Açık pozisyon yok, sayfa bunu doğru şekilde söylüyor | Hata değil: rapor da açık pozisyon olmadığının doğru belirtildiğini söylüyor. |
| 14 | Admin'deki beş uydurma partner canlıda görünmüyor — teyit edildi | Olumlu gözlem: raporda test partnerlerinin halka gösterilmediği doğrulanmış; kayıt silinmedi. |

## kadexaisaharaporu

Kaynak: `/Users/kadirdemir/Desktop/kadexaisaharaporu.html`

| No | Rapordaki bulgu | Durum / kalan doğrulama |
| --- | --- | --- |
| 01 | Fikir üretimi yapay zekâ kullanmıyor, şablon dolduruyor | AI çağrısı zaten mevcut. Bu tur: Radar’da AI/şablon kaynağı açık etiketleniyor; eksik kanca/kurgu/CTA cevabı kişiselleştirme sayılmıyor. Birim ve mobil/masaüstü testleri geçti; gerçek model kalitesi ayrıca kontrol edilecek. |
| 02 | Radar yabancı içerikle dolu, Türk kullanıcı için kullanılamaz | Kısmi: ülke/dil filtreleri mevcut; tüm ülkeler seçiminin tekrar TR'ye düşmesi ve Radar/İçerik Fikirleri'nde sorguya aktarılmayan filtreler düzeltildi. Yanlış etiketli canlı kayıtların dil kalitesi ayrıca değerlendirilecek. |
| 03 | Her trendde “1 ölçüm” — hız motoru ölü | Yerel sahte hız korumaları test edildi. 7 Eylül canlı örnekleminde 1000 kaydın 240'ında çoklu/doğrulanmış ölçüm var; motor tamamen ölü değil. Tek ölçümlü ve türetilmiş kayıtlar hâlâ açıkça ayrılıyor. |
| 04 | Altı kaynağın üçü anahtarsız | Canlı yapılandırma: arayüz kaynakları “yapılandırılmış / anahtarsız / çıkarım” diye ayırıyor ve türetilmiş kayıtları gerçek ölçüm gibi sunmuyor. YouTube API, TikTok çerezi ve Instagram erişimi gerçek hesap/anahtar ister; değer uydurulmadı. |
| 05 | Bugünkü zamanlanmış toplama sıfır kayıt getirdi | 7 Eylül canlı son altı koşu kayıt buldu (42,40,247,100,195,10); bir koşu kısmi. Önceki günün sıfır sonucu bugünkü tüm toplayıcıların bozuk olduğunu göstermiyor. Eksik kaynak anahtarları ayrı izleniyor. |
| 06 | Kategori ataması güvenilmez | Yerel sınıflandırıcı boş sinyali rastgele kategoriye atamıyor; `diğer` + 0 güven döndürüyor. Yakın iki adayda kesin kategori iddia etmiyor, `diğer` altında adayları ve düşük güveni koruyor; resmi YouTube/TikTok kategori sinyalleri ayrı ağırlık alıyor. Birim testi geçti; canlı yabancı başlık kalitesi ayrıca ölçülmeli. |
| 07 | Hashtag üretimi bozuk | Radar AI çıktısı ortak etiket normalleştirmesine bağlandı; nesne/bozuk etiketler eleniyor, Türkçe etiketler tutarlı dönüştürülüp tekilleştiriliyor. Test geçti; konu uygunluğu gerçek model çıktısıyla değerlendirilecek. |
| 08 | Kullanıcıya görünen metinde Türkçe karakterler silinmiş | Yerel: 20 Radar formatı ve aşama açıklamalarının Türkçesi düzeltildi. Yalnız ç/ö/ü içeren yabancı metin otomatik Türkçe sayılmıyor; dil sınıflandırma testi geçti. |
| 09 | “20 içerik formatı” aslında iki kurgu iskeleti | Yerel: 20 formatın her biri farklı, konuya bağlı üç adımlı çekim şablonu kullanıyor; katalog kapsamı/benzersizlik test edildi. Şablon, AI kişiselleştirmesi olarak gösterilmiyor. |
| 10 | Aynı uyarı defalarca üretiliyor | Yerel: aynı çapraz-platform mesajı üretimde ve okumada tekilleştiriliyor; eski satırlar silinmedi. Trend ID'sinin uyarı ID'sini ezmesi ve aynı platformun fazladan sayılması düzeltildi. Gerçek store koduyla dört regresyon testi geçti. |
| 11 | Sonuçlarda dil ve ülke filtresi yok | Yerel düzeltme: ülke/dil ve diğer desteklenen filtreler Trendler/Radar/Fikirler sorgusuna aktarılıyor; genel Nabız/Uyarılar için uygulanmadığı açık ve kontroller pasif. Eski ağ yanıtı yeni filtre sonucunu ezemiyor; parametre sınırları güvenli. Birim ve masaüstü/mobil test geçti. |
| 12 | Ses önerisi içerikle ilgisiz | Kodda ses önerisi yalnız trendin kendisi sound ise kendi başlık/kaynak adresinden geliyor; rastgele başka şarkı seçilmiyor. Gerçek model/medya kalite kontrolü ayrıca bekliyor. |
| 13 | Canlı panelde örnek veri gerçek gibi duruyor | Yerel: yeni çalışma alanı temiz açılıyor; eski dokunulmamış başlangıç seti temiz duruma taşınıyor, değiştirilmiş veri korunuyor. Başlangıç verisi açıkça etiketli ve tek tıkla temizlenebilir; sağlayıcı yokken sahte görsel/video veya maliyet kaydı üretilmiyor. |
| 14 | Marka briefi yarım kalıyor, uyarı şeridi pasif | Mevcut uyarıda Bilgileri tamamla bağlantısı /kadexai/onboarding'e gidiyor; boş brief kullanıcı adına doldurulmadı. Yerel UI bağlantısı doğrulandı. |
| 15 | “Telefona ekle” bandı içeriğin üstünü kapatıyor | Yerel: kurulum kartı Genel Bakış sayfasının normal akışında; araç formlarını örtmüyor. Kapatma hedefi 44×44, klavye ve depolama erişilemezken kapatma çalışıyor. Dört masaüstü/mobil testi geçti; ekran görüntüsü incelendi. |
| 16 | Zorluk değerlendirmesi sabit | Kısmi: ölçüm yokken yedek zorluk “Belirsiz”; AI zorluk etiketleri doğrulanıyor ve öneri olduğu açıklanıyor. Hesap analitiğinden ölçülmüş rekabet modeli kurulmadı. |
| 17 | Paylaşım saati ve CTA iki sabit listeden dönüyor | AI kanca/kurgu/CTA sözleşmesi doğrulanıyor; hazır şablon açık etiketleniyor. Geçersiz saatler reddediliyor, İstanbul saat dilimi ve analitik olmayan öneri niteliği gösteriliyor. |
| 18 | Trend Radar hiçbir pakette özellik olarak geçmiyor | Mevcut varsayılan üç paket matrisinde trend-radar var; paket ekranı Trend Radar ve erken sinyaller etiketiyle gösteriyor. Canlı admin fiyat/özellik override'ları ayrıca doğrulanmalı; fiyatlar değiştirilmedi. |
| 19 | Dışa aktarma yok | CSV zaten vardı; ölçülmeyen hızı sıfır göstermesi düzeltildi, veri niteliği ve Türkçe etiketler eklendi. Formül enjeksiyonu koruması ve gerçek dosya indirme testi geçti. |
| 20 | Kaldırılmış araç adları geçmişte yaşıyor | Kısmi: adlar mevcut kayıt defterinden geliyor; kaldırılmış/bilinmeyen araçlar yanlış API'den yeniden çalıştırılmıyor, görsel üretimi doğru uca gidiyor. Eski kayıtlar silinmedi; bilinmeyen araç kimliği korunuyor. |
| 21 | Etiketlerde noktalı İ eksik | Mevcut Hook etiket tablosunda İstatistik doğru; canlı eski kayıt çıktıları ayrıca kontrol edilmeli. |
| 22 | Boş durum ile bozuk durum aynı görünüyordu — düzeltildi | Raporun kendisi de bu bulgunun giderildiğini doğruluyor; boş/hata ayrımı diğer veri ekranlarının regresyon testlerinde de korunuyor. |
| 23 | Viral Skor’un A/B karşılaştırması yanlış kazanan seçiyor | Yerel: sıfır puan geçerli sonuç olarak korunuyor ve doğruluk değerine göre kazanan seçiliyor; eksik skor sıfırlaştırılmıyor. Canlı model çıktısı ayrıca dağıtım sonrası denenmeli. |
| 24 | Paketle satılan araç canlıda kapalı | Taşınma sonrasında video servisi yapılandırılmıştı; güncel uçtan uca üretim tekrar doğrulanacak. |
| 25 | Beş adımlı zincirin çıktısı ham JSON dökümü | Bu tur: akışın kullandığı ortak çıktı göstericisinde iç içe Markdown, numaralı listeler ve kod blokları düzeltildi. SSR testleri geçti; gerçek beş adımlı üretim ayrıca doğrulanacak. |
| 26 | Akış, adımlar arasında bozulmuş metin taşıyor | Yerel: ham JSON kesmek yerine etiketli/sınırlı bağlam taşınıyor; bozuk/eksik adım çıktısında zincir duruyor. İlerleme ve bildirim toplam adımı doğru gösteriyor. Gerçek runner ile hata/başarı birim testleri geçti. |
| 27 | YouTube’a yükleme kapalı | Canlı OAuth istemci kimliği/gizlisi ve belirteç şifreleme anahtarı mevcut. YouTube API anahtarı 403 verdiği için veri bağlantısı geçici kapalı; yükleme için hesap sahibinin Google kanal onayı hâlâ gerekli. |
| 28 | 553 materyal var, hiçbirinin önizlemesi yok | Düzeltildi: güvenli küçük resim proxy'si, fotoğraf yedeği, hata göstergesi, erişilebilir önizleme penceresi, 60'lık sayfalama, geç yanıt koruması ve kısmi toplama durumu test edildi. Canlı iki örnek resim JPEG/200. 12 Eylül'de Arsivhub sitemap'leri 410 ile kaldırıldı; mevcut 553 kayıt korunuyor ve tüm dış kaynaklar kullanılamazken zamanlanmış iş artık bunu sunucu arızası diye raporlamıyor. Gerçek video oynatımı kullanıcı oturumuyla ayrıca doğrulanacak. |
| 29 | Üretim 40-70 saniye sürüyor, ilerleme göstergesi yok | Yerel: uzun süren medya üretimlerinde aşamalı yüklenme/uzun işlem göstergesi; zincirlerde adım/toplam ilerleme mevcut. Gerçek sağlayıcı süreleri dağıtım sonrası ölçülmeli. |
| 30 | Platformun kendi kazıyıcısı var ama hiçbir analiz aracı kullanmıyor | Ürün kapsamı: kazıyıcı materyal havuzu/Radar verisi üretir; analiz araçları kullanıcı girdisi ve hesap yetkisiyle çalışır. Bu iki veri alanını otomatik birleştirmek içerik sahipliği/onay akışı gerektirir; rastgele materyal kullanıcı analizine sokulmadı. |
| 31 | “Haftalık paket” kısa video üretmiyor | Önceki kısa video paketi düzeltmesi kodda mevcut; canlı üretim tekrar doğrulanacak. |
| 32 | Kayıtlar ham JSON olarak listeleniyor | Ortak JSON/Markdown göstericisi güçlendirildi. Ek olarak doğrulanmamış/başka hesap önbelleği gösterilmiyor; silme başarısızsa kayıt korunuyor; API hatası boş geçmiş sayılmıyor. Eski şema silmesi gerçek silinen satırı doğruluyor; yetki hatasında başka tabloya geri düşmüyor. Birim ve UI testleri geçti. Ayrıntılardaki teknik girdi JSON'u kasıtlı. |
| 33 | Tek bir sabit akış var, kendi zincirini kuramıyorsun | Mevcut Özel Akış arayüzünde adım seçme/sıralama/kaldırma var. Bu tur API geçersiz zincirleri çağrı öncesi reddediyor; gerçek özel akışın tüm UI ve canlı model testi ayrıca bekliyor. |
| 34 | İkisi de tamamen boş ve birbirine bağlı değil | Yerel: beş başlangıç şablonu zaten vardı; hesaplar arası önbellek ve yanıltıcı kayıt başarısı düzeltildi. Başlangıç örneği kişisel kopyaya dönüşüyor. 30 Günlük Plan → İçerik Takvimi bulut aktarımı onay bekliyor; 29–30. günler görünür. Otomatik yayın yapılmıyor. |
| 35 | Tarayıcının çıplak dosya seçici düğmesi | Yerel: iki SentScan dağıtım kopyasında dosya alanı ve seçici düğmesi ortak tema, odak ve en az 44 px hedefle stillendi; dosya içe aktarma masaüstü/mobilde test edildi. |
| 36 | Maliyet dolar, paketler lira | Hata değil: USD servis maliyeti ile TRY satış fiyatı farklı kavramlar ve kendi para birimleriyle açık etiketleniyor; kur/fiyat uydurulmadı. |
| 37 | Menüdeki ad ile sayfadaki ad farklı | Yerel araç kayıt defteri ve sayfa başlıkları aynı adları kullanıyor; eski başlıklar kaynakta kalmadı. |
| 38 | Sayfa ön yükleme istekleri aralıklı 503 dönüyor | Düzeltildi ve canlıda yeniden ölçüldü: kritik zincir bağlantılarında gereksiz ön yükleme kapalı. Yeni Keyubu sürümünde beş kritik rotaya 20'şer ardışık istekte 503 görülmedi. |
| 39 | Tüm platform tek yapay zekâ sağlayıcısıyla ayakta | 11 Eylül canlı yetki kontrolünde Gemini çalıştı; Groq/Cerebras/OpenRouter/Mistral/OpenAI/Anthropic anahtarları mevcut fakat 401/403 verdi. Bozuk sağlayıcılar anahtarları silinmeden kullanım dışı bırakıldı; seçicide görünmüyor ve otomatik yönlendirmeyi yavaşlatmıyor. Yeni geçerli anahtarlarla tekrar açılabilir. |
| 40 | Altyapı sekmesi tamamen boş | Yerel: yapılandırılmış/eksik servislerin durumunu veren çevre-durumu API'si ve altyapı görünümü mevcut; anahtar değerleri istemciye açılmıyor. Gerçek servis durumu canlı anahtarlara bağlı. |
| 41 | Bozuk olan üç anahtar hiçbir yerde raporlanmıyor | Altyapı durumu gerçek kullanılabilir model kümesini ayrıca gösteriyor. Canlı yetki testinde başarısız altı sağlayıcı güvenli devre dışı listesine alındı; yalnız ortamda değer bulunması artık “çalışıyor” sayılmıyor. |
| 42 | Sayfada sürekli tekrarlayan JavaScript hatası | Yerel: hatalı `deleteRadarNote` çağrısı KadexAI dağıtım kopyasında yok; kök gömülü kopyada çağrı ve tanım birlikte mevcut. Mevcut masaüstü/mobil operasyon testlerinde sayfa hatası oluşmadı. |
| 43 | Yaş aralıkları birbirini kapsıyor | Yerel: açıklama aracında `13–17`, `18–24`, `25–34`, `35–44`, `45+`, `Genel` ayrık aralıkları kullanılıyor; eski `18–34` seçeneği yok. |
| 44 | Aynı platform beş araçta beş farklı yazılmış | Yerel: platform kimlikleri `youtube/instagram/tiktok/x/linkedin/pinterest`, kullanıcı etiketleri `YouTube/Instagram/TikTok/X (Twitter)/LinkedIn/Pinterest` olarak ortaklaştırıldı. Rapordaki `TikTak`, `Twitter/X`, `X / Twitter`, `Youtube`, `Tiktok`, `Linkedin` kullanıcı etiketleri kaynakta kalmadı. |
| 45 | Menüdeki ad ile sayfadaki ad dört araçta farklı | Düzeltildi ve dağıtıldı: sayfa başlıkları Sosyal Medya Analizi, FAQ Üretici, Bağlantı Bio ve YouTube SEO olarak kayıt defteriyle uyumlu. |
| 46 | Birbirinden habersiz iki boş takvim | Bekleyen kapsam: operasyon takvimi ile içerik takvimi aynı veri modeline taşınmadı. Bu tur içerik takviminin hesap izolasyonu, güvenilir kayıt/silme/durum ve 30 Günlük Plan bağlantısı düzeltildi. |
| 47 | Bütçe göstergesinin bozuk olmasının sebebi burada | Yerel: sıfır/tanımsız bütçe yüzde hesabına sokulmuyor; “Tanımlı değil” gösteriliyor ve NaN/uydurma oran üretilmiyor. |
| 48 | Ürünün en tamamlanmış parçası hiçbir şeye bağlı değil | Ürün kapsamı: Notlar bağımsız belge alanıdır; müşteri/brief/üretim ilişkisi için kimlik, yetki ve veri saklama modeli gerekir. Mevcut gerçek notlar tahminle başka kayıtlara bağlanmadı. |
| 49 | Zincir tek yönlü ve iki halkada bitiyor | Yerel: fikir → başlık; hashtag → başlık; başlık/hook → Viral Skor/Thumbnail/Takvim; açıklama → Takvim ve 30 Günlük Plan → Takvim akışları eklendi. Parametreler hedef formlara aktarılıyor; otomatik yayın yok. |
| 50 | “Toplu” üretim en fazla on başlık | 50 sınırı/beş parça zaten mevcut. Yerel: başarısız parça diğer çıktıları kaybettirmiyor; boş/bozuk/kısmi üretim doğru ayrılıyor, gerçek adetler gösteriliyor. Altı API ve dört masaüstü/mobil test geçti. Ayrı ürün listesi/CSV girişi yok; tek konudan varyasyon kapsamı açıkça belirtiliyor. |
| 51 | Kodda duran sayfa canlıda 404 | Tasarım kararı doğrulandı: `/kadexai/onizleme` geliştirme güvenlik önizlemesidir, genel navigasyonda bağlantısı yoktur ve üretimde bilinçli olarak 404 döner. Müşteri özelliği gibi sunulmuyor. |
| 52 | Ekranda olmayan bir yeri işaret eden metin | Yerel boş durum yön metni ekran konumuna bağlı “sağdaki” ifadesini kullanmıyor; mobil yerleşimde yanlış yönlendirme yok. |
| 53 | Görsel ve video üretiminin üç yolu da çalışmıyor | Sağlayıcı/dağıtım: Thumbnail gerçek görsel üretim rotasını, video ayrı medya servisini kullanıyor; gömülü operasyon aracı sağlayıcı yokken hata veriyor ve sahte çıktı üretmiyor. Canlı anahtar/medya servisi olmadan üretim başarılı ilan edilmedi; gerçek uçtan uca test dağıtım sonrası gerekli. |
| 54 | Operasyon bölümünün tamamı gömülü ayrı bir uygulama | Mimari karar, hata değil: gömülü uygulama korumalı ana rotanın oturum/yetki kapısının arkasında tutuluyor; iki dağıtım kopyasında erişilebilirlik ve operasyon regresyonları test edildi. |
| 55 | Modelin sohbet girişi ve ham markdown ürüne sızıyor | Düzeltildi: iç içe JSON metinleri güvenli Markdown olarak çiziliyor; kod çitleri ve gerçek listeler korunuyor. Şema isteyen başlık/hook araçları düz sohbet yanıtını kart olarak kabul etmiyor. Düz metin araçları doğrudan istenen içerikle başlama talimatı ve boş/uzun yanıt sınırı kullanıyor. |
| 56 | Hashtag kuralı üç araçta üç farklı | Düzeltildi: sağlayıcı metni, Radar, toplu üretim, thread ve carousel aynı Unicode normalleştirme, `#` biçimi, tekilleştirme ve toplam adet sınırını kullanıyor. |
| 57 | WhatsApp raporu gönderilemiyor | Canlı kök neden: taşınmış web konteynerinde WA_PHONE/WA_APIKEY eksik. Mevcut değerler gizli env dosyasına geri yüklendi; aynı imajla web yeniden başlatıldı. Tek test HTTP 200 + queued; telefona teslim teyidi ve sonraki zamanlanmış rapor ayrıca doğrulanmalı. |
| 58 | Hata bildirimi kapanmıyor, içeriği örtüyor | Bu tur: operasyon bildirimlerine klavyeyle kullanılabilen kapatma düğmesi ve animasyona bağlı olmayan kaldırma süresi eklendi. Masaüstü/mobilde animasyon kapalıyken test geçti. |
| 59 | Çıktıda kendi kendini çürüten cümle | Model kalite örneği: tek bir üretim cümlesi kodla güvenilir biçimde otomatik “düzeltilemez”. Yapı/uzunluk sözleşmeleri denetleniyor; anlam doğruluğu için kullanıcı incelemesi ve gerçek model kalite değerlendirmesi gerekir. |
| 60 | Araç, sunucudan gelen başarılı cevabı çizerken çöküyor | Önceki FAQ çıktı normalleştirmesi kodda mevcut; canlı model çıktısıyla tekrar kontrol gerekli. |
| 61 | Model çıktısı bazı araçlarda denetleniyor, bazılarında hiç | Düzeltildi: yapılandırılmış üretim rotaları alan tipi, zorunlu içerik, uzunluk ve liste sınırı uygular; geçersiz/boş şema başarılı sonuç olmaz. Düz metin rotaları da yalnız gerçek, boş olmayan ve sınır içindeki metni kabul eder. Ses rotaları ayrı medya sözleşmeleriyle testlidir. |
| 62 | Yarısı seslendirilmemiş dublajı “hazır” diye sunuyor | Yerel: eksik/atlanan çeviri ve çözülemeyen ses parçasında dublaj duruyor; sessiz boşlukla hazır dosya üretmiyor. Hatalı parça düzenlenip yalnız o metin yeniden seslendirilebiliyor; açık kullanıcı onayı olmadan tekrar çevrilmiyor. Dosya dili gerçek çıktı dilini izliyor. Birim ve masaüstü/mobil testleri geçti; gerçek sağlayıcı kalitesi ayrıca bekliyor. |
| 63 | Sunucu hatasını kullanıcının suçu gibi gösteriyor | Yerel istemci/API katmanı doğrulama hatası, oturum hatası, hız sınırı ve sağlayıcı/sunucu hatasını ayrı Türkçe mesajlarla gösteriyor; teknik ayrıntı sızdırmıyor. Route ve UI hata yolları birim/tarayıcı testlerinde sınandı. |
| 64 | Marka adı her seferinde farklı ve yanlış çözülüyor | Yerel: Kade/KadexAI adları, profil görünen adı ve kullanıcının isteğe bağlı özel kelimeleri ortak sınırlı sözlükle Gemini/Groq döküm isteğine ekleniyor. Döküm/zamanlama doğrulanıyor; tahmini zaman açıkça etiketleniyor. Birim ve masaüstü/mobil testleri geçti. |
| 65 | İçerik takvimi bugünün tarihini bilmiyor | Önceki tarih bağlamı düzeltmesi kodda mevcut; admin AI tarih bağlamı bu tur ayrıca düzeltildi. |
| 66 | Çıktıda bozuk karakter | Yerel: Unicode metin korunuyor, hashtag/JSON satırları ortak normalleştiriliyor ve bozuk nesne/metin sağlayıcı çıktıları reddediliyor. Canlı eski kayıtlar silinmedi. |
| 67 | İlerleme göstergesi bir araçta doğru yapılmış, diğerlerinde hiç yok | Düzeltildi: standart AI sayfaları ortak geçen süre/aşama göstergesini, medya ve zincir araçları kendi gerçek parça/adım ilerlemesini kullanıyor. Salt CRUD ekranları yalnız yükleme/kaydetme durumunu gösterir. |
| 68 | Yanıtlanacak yorumu buluyor, yanıtı yazmıyor | Yerel: mevcut isteğe bağlı taslak alanı düzenleme/kopyalama ile tamamlandı. Taslak yoksa kullanıcı isteğiyle aynı yetkili rotadan oluşturuluyor; hata/boş yanıt yeniden denenebiliyor. Eski taslak yeni analizi bozmuyor. Otomatik yayın yok; gerçek yorumla karşılaştırma uyarısı var. Altı API birim ve altı masaüstü/mobil test geçti. Gerçek model kalitesi ayrıca doğrulanmalı. |
| 69 | Hiç veri yokken olumsuz not veriyor | Bu tur: her iki operasyon kopyasında boş/nötr veri puansız; beğeni bilgisi olmayan yorumlara sayı uydurulmuyor. Puan hesaplanmadı durumu geçmiş/CSV boyunca korunuyor. Birim ve masaüstü/mobil testleri geçti. Yöntem hâlâ anahtar kelime temelli, yapay zekâ duygu analizi değildir. |
| 70 | Düzyazı döndüren araçlar markdown’ı çizmiyor | Bu tur: #55 ile ortak gösterici düzeltmesi; ham HTML çalıştırılmadan güvenli React çıktısı korunuyor. |
| 71 | Hashtag kuralı dördüncü bir biçime daha ayrıldı | Düzeltildi: #56 ile ortak normalleştirme; hashtag ucu, Radar, toplu üretim, thread ve carousel gruplar arası tekrarları, Unicode biçimini ve toplam adet sınırını aynı kuralla uyguluyor. |
| 72 | Örnek metin dolu değer gibi görünüyor | Yerel: örnek asistan metni gerçek `value` olmaktan çıkarılıp placeholder/başlangıç bildirimi yapıldı; yeni operasyon çalışma alanı temiz açılıyor. |
| 73 | Türkçe karakter kaybı burada da var | Yerel: SentScan'ın iki dağıtım kopyasında geçmişe ekle açıklaması Türkçe; boş durum metni birim testine eklendi. |
