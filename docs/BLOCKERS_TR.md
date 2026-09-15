# Güncel dış-girdi ve karar listesi

Son güncelleme: 15 Eylül 2026

Bu dosyada yalnız kod yazarak güvenle tamamlanamayacak maddeler bulunur. Güncel
teknik kapanışın tek kaynağı `docs/MASTER_KAPANIS_KONTROLU_TR.md`, 113 saha
bulgusunun ayrıntılı eşlemesi `docs/SAHA_RAPORLARI_TAKIP.md` dosyasıdır.

| # | Bekleyen konu | Teknik durum | Kullanıcıdan/hesaptan gereken |
|---|---|---|---|
| 1 | Telegram | Teslim kodu ve testleri hazır | Telegram Web girişi + BotFather token + chat ID |
| 2 | GA4 | Placeholder/erişim hatası/gerçek sıfır ayrımı hazır | Gerçek property ve servis hesabı |
| 3 | YouTube | OAuth ve şifreli token akışı hazır | Kanal sahibi onayı + çalışan API erişimi |
| 4 | AI sağlayıcıları | Gemini çalışıyor; hatalı altı sağlayıcı devre dışı | Açılacak sağlayıcılar için geçerli anahtar |
| 5 | İşletme verisi | Yönetim ve yayın altyapısı hazır | Gerçek partner, proje, basın, CRM, admin e-posta ve onaylı fiyat |
| 6 | Hukuki son metin | Teknik sayfalar/taslaklar mevcut | Türkiye mevzuatına göre hukukçu onayı |
| 7 | Canlı kalite kabulü | Hata/şema/erişim testleri hazır | Gerçek hesaplarla AI, video, ses, YouTube ve WhatsApp uçtan uca kabul testi |
| 8 | Opsiyonel servisler | Varsayılan kapalı/opt-in | Sentry, PostHog, e-posta veya ödeme açılacaksa hesap ve ürün kararı |

## Son kapatılan eski blockerlar

- Supabase taşınması, migration ve gerçek yedekten geri yükleme testi tamamlandı.
- Vercel ve Keyubu GitHub push dağıtımı tamamlandı.
- E2E/route/mobil test altyapısı kuruldu.
- Ana site bağımlılıkları, KadexAI ve Studio audit sonuçları sıfır bilinen açık
  seviyesine getirildi; CI audit kapısı eklendi.
- Uptime GitHub Actions denetimi eklendi.
- Paket editörü final statik `/paketler` sayfasına bağlandı.
- Final klon merge sonrasında ikinci build-bütünlük kapısı eklendi.

Telegram hariç bir maddenin tamamlanması için gerçek girdi sağlandığında bu
liste güncellenir; değer uydurularak “kapalı” işareti verilmez.
