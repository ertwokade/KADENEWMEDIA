# Ürün Güveni ve İşlev Denetimi

## Amaç

Dashboard'u pazarlama vitrini gibi gösteren tekrarları azaltmak, görünen her kontrolün gerçek bir davranışı olmasını sağlamak ve model seçimini varsayılan olarak göreve göre otomatik yönlendirmek.

## Bulgular

- Model seçici TopBar'da ve araç formlarında tekrar ediyor.
- Tüm modeller, ilgili API anahtarı olmasa da seçilebilir görünüyor.
- Hız, ücretsiz ve premium rozetlerinin yoğunluğu ürün yerine satış kataloğu hissi veriyor.
- Otomatik seçim yalnızca route açılışında sabit bir model atıyor; girdi uzunluğu ve görev biçimi değerlendirilmiyor.
- Çoklu üretimlerde `Promise.allSettled` hataları sessizce yutabiliyor.
- Araçların büyük bölümünde sabit `w-80` form paneli mobil görünümü sıkıştırıyor.
- Dashboard seviyesinde kullanıcıya dönülebilir bir hata sınırı yok.
- Görsel üretici mevcut `/api/image` yerine üçüncü taraf URL'yi doğrudan tarayıcıdan çağırıyor.

## Değişiklikler

- `auto` model modu ve sunucu taraflı görev sınıflandırıcısı.
- Yalnızca yapılandırılmış sağlayıcı modellerinin manuel listede gösterilmesi.
- Tek model kontrolü: TopBar; araç içi tekrarların kaldırılması.
- Sade model metinleri; pazarlama rozetlerinin azaltılması.
- Ortak responsive form/sonuç yerleşimi.
- Çoklu isteklerde kısmi başarı ve açık hata özeti.
- Görsel üretiminde önce kendi güvenli API route'u, anahtar yoksa açıkça etiketlenmiş yedek servis.
- Dashboard error boundary ve tekrar deneme.

## Doğrulama

- Masaüstü: 1440x1000.
- Mobil: 390x844 ve 320x780.
- Otomatik modelin gerçek yanıt modeline çözülmesi.
- Manuel model seçiminin korunması.
- Tüm görünen dashboard route'larının HTTP 200 vermesi.
- Temel üretim endpoint'lerinin örnek isteklerle yanıt vermesi.
- Console/pageerror/network hatası olmaması.
- Lint, TypeScript ve production build.
