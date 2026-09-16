# Güncel dış-girdi ve karar listesi

Son güncelleme: 15 Eylül 2026

Bu dosyada yalnız kod yazarak güvenle tamamlanamayacak maddeler bulunur. Güncel
teknik kapanışın tek kaynağı `docs/MASTER_KAPANIS_KONTROLU_TR.md`, 113 saha
bulgusunun ayrıntılı eşlemesi `docs/SAHA_RAPORLARI_TAKIP.md` dosyasıdır.

| # | Bekleyen konu | Teknik durum | Kullanıcıdan/hesaptan gereken |
|---|---|---|---|
| 1 | GA4 | Placeholder/erişim hatası/gerçek sıfır ayrımı hazır | Gerçek property ve servis hesabı |
| 2 | YouTube | OAuth ve şifreli token akışı hazır | Kanal sahibi onayı + çalışan API erişimi |
| 3 | AI sağlayıcıları | Gemini çalışıyor; hatalı altı sağlayıcı devre dışı | Açılacak sağlayıcılar için geçerli anahtar |
| 4 | İşletme verisi | Yönetim ve yayın altyapısı hazır | Gerçek partner, proje, basın, CRM, admin e-posta ve onaylı fiyat |
| 5 | Hukuki son metin | Teknik sayfalar/taslaklar mevcut | Türkiye mevzuatına göre hukukçu onayı |
| 6 | Canlı kalite kabulü | Hata/şema/erişim testleri hazır | Gerçek hesaplarla AI, video, ses ve YouTube uçtan uca kabul testi |
| 7 | Opsiyonel servisler | Varsayılan kapalı/opt-in | Sentry, PostHog, e-posta veya ödeme açılacaksa hesap ve ürün kararı |

## Son kapatılan eski blockerlar

- Supabase taşınması, migration ve gerçek yedekten geri yükleme testi tamamlandı.
- Vercel ve Keyubu GitHub push dağıtımı tamamlandı.
- E2E/route/mobil test altyapısı kuruldu.
- Ana site bağımlılıkları, KadexAI ve Studio audit sonuçları sıfır bilinen açık
  seviyesine getirildi; CI audit kapısı eklendi.
- Uptime GitHub Actions denetimi eklendi.
- Paket editörü final statik `/paketler` sayfasına bağlandı.
- Final klon merge sonrasında ikinci build-bütünlük kapısı eklendi.
- `KadeX` / `@KadeXAiBot` oluşturuldu; token ve özel hedef yalnız Keyubu'nun
  `0600` izinli secret dosyasına yazıldı. KadexAI çalışma zamanı ayarları gördü,
  sağlık ucu HTTP 200 verdi ve korumalı gerçek test bildirimi teslim edildi.
  Güçlü webhook sırrı, izinli özel hesap denetimi ve 22 komutluk Türkçe menü
  canlıya alındı. Özel sohbet yanında sahibin `/baslat` ile açıp `/durdur` ile
  kapatabildiği kalıcı grup modu eklendi; grup üyeleri yalnız salt-okunur yönetim
  raporlarını kullanabiliyor. Gerçek Telegram yanıtı Web istemcisinde doğrulandı.

Bir maddenin tamamlanması için gerçek girdi sağlandığında bu liste güncellenir;
değer uydurularak “kapalı” işareti verilmez.
