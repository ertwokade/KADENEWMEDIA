# Entegrasyon incelemesi ve bildirim onarımı

Güncelleme: 11 Eylül 2026. Bu notlar kaynak incelemesini, yerel kod değişikliklerini ve canlı yapılandırma onarımını ayrı tutar.

## AutoSocial

- Kaynak: https://github.com/Katzca/AutoSocial
- İncelenen commit: `6deb560ee58ea1e6a040e1ee8e6ca269bd1576b5`.
- MIT lisanslı, yerel TikTok/Instagram/YouTube video kuyruğu ve zamanlama aracı. Tarayıcı oturumları kullanıyor; resmi sosyal ağ OAuth bağlantımızın yerine geçmiyor.
- SECURITY.md: kimlik doğrulama ve kiracı izolasyonu yok; yerel bilgisayar için tasarlanmış. İnternete açılmadı, sunucuya kurulmadı, bağımlılıkları/kurulum betikleri çalıştırılmadı.
- KadexAI İçerik Stüdyosu'na özgün ve bağımlılıksız bir **açıklama dosyası aktarımı** eklendi. Kullanıcı platformu ve hazırladığı videoyu seçiyor; aynı basename ile UTF-8 `.description` dosyası indiriliyor. Video içeriği okunmuyor veya yüklenmiyor. Geçersiz dosya adları, boş açıklama ve desteklenmeyen uzantılar reddediliyor.
- Bu tam otomatik yayın entegrasyonu değildir. Kullanıcı, AutoSocial kapalıyken video ve açıklamayı `queue/<hesap>/<platform>/pending` içine birlikte yerleştirmeli; hedef hesabı ve metni kontrol edip yerel kuyruğu kendisi başlatmalı. Çalışan kuyruğa dosya eklemek yayın tetikleyebilir.
- AutoSocial kodu kopyalanmadı. Uyumluluk `src/queue.js` dosyasındaki yan dosya sözleşmesine dayanıyor. Gerçek sosyal hesaba paylaşım testi yapılmadı.

## X paylaşımı

- Paylaşım: https://x.com/Nozelcode/status/2095904418973511930
- İşaret ettiği proje: https://github.com/Alishahryar1/free-claude-code
- Bağımsız bir model yönlendirme/proxy projesi. Claude modelini ücretsiz sağlamıyor; farklı sağlayıcıların modellerini ve yerel modelleri kullanıyor. Ücretsiz kota iddiaları sağlayıcı şartlarına bağlı, garanti değil.
- KadexAI'nin mevcut çoklu sağlayıcı yönlendirmesi korunuyor. Proxy kurulmadı, Claude/Codex ayarları değiştirilmedi, kullanıcı verisi yeni sağlayıcılara gönderilmedi. Aynı işlev için ikinci bir proxy ve gizli fallback zinciri eklenmedi.

## Eklenen video

- Dosya: `WhatsApp Video 2026-09-01 at 08.15.12.mp4`; yaklaşık 39,4 saniye.
- Görüntü karelerinde tanımlanan kaynak: https://github.com/public-apis/public-apis
- Çeşitli kategorilerde API rehberi; tek bir kurulabilir servis veya tüm hizmetler için ortak anahtar değil. Listede yer almak ticari kullanım hakkı, kesintisiz hizmet veya sınırsız ücretsiz kota garantisi sayılmaz.
- İlgisiz API'ler topluca eklenmedi. Gerektiğinde her sağlayıcının kendi belgeleri, veri kullanım şartları ve maliyeti ayrıca doğrulanmalı. Videonun sesinden otomatik döküm yapılmadı; proje görüntülerinden teşhis edildi.

## CallMeBot — canlı onarım

6 Eylül'de salt okunur sunucu incelemesi:

- Web konteynerinde `WA_PHONE` ve `WA_APIKEY` eksikti; `CRON_SECRET` mevcuttu.
- İşlem defteri erişilebilirdi: inceleme anında 95 olay ve 60 eski kuyruğa alma kaydı vardı. Son 24 saatte olay yoktu; bu tek başına hata sayılmadı.
- Sabah/gün sonu ve Radar cron işleri silinmemişti.
- Yerel mevcut `.env` dosyasındaki iki bildirim değeri doğrulanıp **yalnız sunucunun gizli ortam dosyasına** geri eklendi. Değerler terminale veya Git'e yazılmadı.
- Önceki dosya sunucuda 0600 izinli `/srv/kade/secrets/kadexai.env.before-whatsapp-20260906T203450Z` olarak yedeklendi.
- Çalışan imaj değişmediği doğrulandı, sadece web konteyneri yeniden oluşturuldu. Medya ve veritabanı yeniden başlatılmadı. Kod dağıtımı yapılmadı.
- Mevcut numaraya **tek** test mesajı gönderildi: sağlayıcı HTTP 200 + `Message queued` verdi. Bu telefona teslim/okunma kanıtı değildir.
- Halka açık sağlık ucu onarım sonrası `status: ok` döndü. Ayarlar release klasörü dışında kaldığından sonraki normal GitHub dağıtımı bunları aynı env_file üzerinden okuyacak.

Ek güvenlik düzeltmeleri: ağ yanıtı kaybolduğunda mükerrer gönderimi önlemek için otomatik tekrar kaldırıldı; yönlendirme takibi kapatıldı; sağlayıcı gövdesi/anahtarlı URL hata yanıtına taşınmıyor; boş saatlik limit yanlışlıkla bildirimleri kapatmıyor; log yazma ve gönderim başarısızlıkları anahtarsız sabit hata koduyla kaydediliyor. Gün sonu mesajı artık tüm gönderilmeyen olayları yanlışlıkla “saatlik tavan” diye açıklamıyor.

## Telegram değerlendirmesi

Resmî kaynak: https://core.telegram.org/bots/api#sendmessage

Yönetim bildirimleri için Telegram'a doğrudan Bot API ile bağlanan ikinci kanal uygun bir seçenek: yapılandırılmış yanıtlar, mesaj kimliği ve hız sınırında `retry_after` bilgisi var. Bu, hataları izlemeyi kolaylaştırır; kesintisizlik garantisi değildir. CallMeBot'un ücretsiz API belgesi kişisel kullanım kapsamını belirtiyor: https://www.callmebot.com/blog/free-api-whatsapp-messages/

Mevcut WhatsApp çalışır durumda bırakıldı. Telegram teslim katmanı sıfırdan eklendi: yalnız sunucu tarafında token kullanıyor, izinli hedef listesini doğruluyor/tekilleştiriyor, hedefleri maskeleyerek raporluyor, belirsiz ağ sonucunda otomatik tekrar yapmıyor, 429 `retry_after` bilgisini güvenli biçimde döndürüyor ve birden fazla hedefte kısmi başarıyı ayırıyor. Operasyon bildirimleri yapılandırılmış WhatsApp ve Telegram kanallarına ortak dağıtılıyor; sahip hesabına kanala göre güvenli test ucu eklendi. Canlıda bot token/chat ID henüz yok, dolayısıyla Telegram teslimi yapılandırılana kadar WhatsApp tek başına çalışmayı sürdürüyor.

## AI, YouTube ve yedek doğrulaması

- 11 Eylül'de üretim konteynerindeki sağlayıcılar salt-okunur kimlik uçlarıyla kontrol edildi. Gemini HTTP 200 verdi. Groq, Cerebras, OpenRouter, Mistral, Anthropic ve OpenAI anahtarları 401/403 yetki hatası verdi; YouTube API anahtarı 403 döndürdü. Değerler yazdırılmadı veya silinmedi.
- Yetki testi başarısız platform sağlayıcıları ortam allow/deny katmanıyla kullanım dışı bırakıldı. Çalışmayan modeller seçicide görünmüyor ve otomatik yönlendirmede denenmiyor; anahtar yenilendiğinde bayrak kaldırılarak geri açılabilir. YouTube veri bağlantısı da anahtar düzelene kadar kapalı gösteriliyor. Google OAuth istemcisi mevcut, fakat gerçek kanal bağlantısı hesap sahibinin Google onayını gerektiriyor.
- Şifreli Supabase yedeği günlük çalışıyor. 11 Eylül arşivi ayrı/geçici PostgreSQL veritabanına gerçekten geri yüklendi; üretimle 123 tablo eşleşti ve geçici veritabanı temizlendi. Bu geri-dönüş doğrulaması her pazar cron ile otomatik çalışacak.

## Doğrulama

- KadexAI: 258 birim testi geçti; TypeScript ve ESLint başarılı (önceden var olan tek test uyarısı dışında).
- Yeni tarayıcı regresyonları: 4 geçti (AutoSocial ve Radar, 1440px masaüstü/390px mobil). Bütün veri API'leri mock; video yüklenmediği ve gerçek paylaşım yapılmadığı doğrulandı.
- Görseller incelendi; mevcut site tema sistemi korundu. `edit-section` yaklaşımı değişiklikleri mevcut İçerik Stüdyosu/Radar bölümlerinde sınırlandırdı.
- Genel raporların tüm maddeleri henüz bitmedi; güncel liste `SAHA_RAPORLARI_TAKIP.md` içindedir.

7 Eylül takip doğrulaması: KadexAI 193, legacy 90 birim testi; KadexAI 14 ve legacy 24 masaüstü/mobil regresyon testi geçti. Her iki üretim derlemesi başarılı. Yeni kapsam: geçmiş sahipliği/silme, Radar CSV ve filtreler, CRM test filtresi, bülten tarih/kimlik eşlemesi, statik paket ön seçimi. Bu kontrol yeni bir WhatsApp mesajı göndermedi veya canlıya kod dağıtmadı.
