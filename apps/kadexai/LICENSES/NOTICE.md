# KadexAI — Üçüncü Taraf Yazılım Bildirimleri (NOTICE)

KadexAI, aşağıdaki açık kaynak bileşenleri içerir veya kullanır. Her bileşenin
orijinal lisans metni `LICENSES/` klasöründe ilgili dosyada saklanır. MIT ve
benzeri izin verici lisansların tek zorunluluğu bu atıf ve lisans metninin
korunmasıdır; bu dosya o zorunluluğu karşılar.

> ⚠️ Bu tablo, `apps/kadexai/vendor/` altına kopyalanan (vendored) her bileşen
> eklendikçe güncellenir. Yeni bir bileşen eklerken lisansını buraya ve
> lisans metnini `LICENSES/<bilesen>.LICENSE` olarak eklemek ZORUNLUDUR.

| Bileşen | Kaynak | Lisans | KadexAI'da kullanım | Ticari kullanım |
|---|---|---|---|---|
| MoneyPrinterTurbo | github.com/harry0703/MoneyPrinterTurbo | MIT | Video Fabrikası (senaryo→video) | ✅ Serbest |
| ShortGPT | github.com/RayVentura/ShortGPT | MIT | Video otomasyon çerçevesi | ✅ Serbest |
| open-generative-ai | github.com/anil-matcha/open-generative-ai | MIT | Görsel/video üretim arayüzü | ✅ Serbest |
| ComfyUI | github.com/comfyanonymous/ComfyUI | GPL-3.0 | **Ayrı servis** (API ile), koda gömülmez | 🟡 Ayrı servis sınırında serbest |

## Lisans sınırları (uyum kuralları)
1. **MIT bileşenler** (MoneyPrinterTurbo, ShortGPT, open-generative-ai): kaynak
   kod içine kopyalanabilir, değiştirilebilir, kapalı ürün olarak satılabilir.
   Tek şart: lisans + telif bildiriminin korunması (bu dosya + `LICENSES/`).
2. **GPL-3.0 bileşen** (ComfyUI): KadexAI koduna KOPYALANMAZ/gömülmez. Yalnızca
   ayrı çalışan bir servis olarak HTTP API üzerinden çağrılır. Bu sınır
   korunduğu sürece kapalı KadexAI kodu GPL'e tabi olmaz.
3. **Ticari-değil / araştırma lisanslı** bileşenler (Wav2Lip, SadTalker,
   Coqui XTTS, F5-TTS model ağırlıkları vb.) KadexAI'a EKLENMEZ. Bu tür
   yeteneklere ihtiyaç olursa ticari lisanslı bir bulut API'si kullanılır.

## Yeni bileşen ekleme kontrol listesi
- [ ] Lisansı MIT/Apache/BSD gibi izin verici mi? (Değilse ekleme.)
- [ ] `LICENSES/<bilesen>.LICENSE` dosyasına lisans metni kopyalandı mı?
- [ ] Bu NOTICE tablosuna satır eklendi mi?
- [ ] Marka/isim referansları KadexAI olarak değiştirildi mi?
