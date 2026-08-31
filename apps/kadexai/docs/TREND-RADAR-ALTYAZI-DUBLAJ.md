# Trend Radar · Altyazı Stüdyosu · Dublaj Stüdyosu — kurulum ve işleyiş

Bu üç araç 18 Ağustos 2026'da eklendi. Ortak noktaları: ağır iş (ses çıkarma,
zaman çizgisi kurgusu) tarayıcıda, gizli anahtar gerektiren iş sunucuda yapılır.

---

## 1. Trend Radar (`/dashboard/trend-radar`)

Masaüstündeki **KADE SEARCH** motorunun kadexai'ye taşınmış hâli. Yapay zekâ
tahmini değil, ölçülmüş veri: her kaynak düzenli aralıklarla taranır, her tarama
bir *snapshot* yazar, skor bu zaman serisinden hesaplanır.

### Kurulum

1. `supabase/migrations/202608180001_kade_trend_radar.sql` dosyasını Supabase'e uygula.
   Yedi tablo + `kade_trend_current` görünümü oluşturur.
2. `.env` içine (hepsi opsiyonel, bkz. `.env.example`):
   - `YOUTUBE_API_KEY` — yoksa YouTube arama sayfası ayrıştırılır (daha kırılgan).
   - `TIKTOK_COOKIE` — yoksa TikTok kayıtları **çıkarım modunda** üretilir.
   - `INSTAGRAM_SESSION_ID` — yoksa Instagram kayıtları çıkarım modunda üretilir.
   - `SUPABASE_SERVICE_ROLE_KEY` — toplama bu anahtarla yazar, **zorunlu**.

### Veri modeli

| Tablo | İçerik |
|---|---|
| `kade_trends` | Trend varlığı (hashtag, ses, video, konu, kreatör) |
| `kade_trend_snapshots` | Her taramadaki ölçüm — hız hesabının kaynağı |
| `kade_trend_scores` | Hesaplanan skor + yaşam döngüsü aşaması |
| `kade_trend_links` | Aynı akımın farklı platformlardaki karşılığı |
| `kade_trend_alerts` | Patlama / çapraz platform / izleme listesi uyarıları |
| `kade_trend_runs` | Toplama turları |
| `kade_trend_watchlist` | Kişiye özel izleme listesi (RLS ile korunur) |

Trend havuzu **ortaktır**: oturum açan herkes okur, yazma yalnızca service-role'dedir.
İzleme listesi kişiye özeldir.

### Toplama neden parça parça çalışır

SQLite sürümü tüm kaynakları tek işlemde tarıyordu (YouTube tek başına ~2,5 dk).
Sunucusuz ortamda istek süresi sınırlı olduğundan `/api/kade-search/collect` **tek
kaynak** işler; pano kaynakları sırayla çağırır ve en sonda `{"finalize": true}`
ile çapraz bağlantı + skorlamayı tetikler.

Toplama yalnızca hesap sahibine açıktır (`isSettingsOwnerUser`). Zamanlanmış
çalıştırma için `x-cron-secret: $CRON_SECRET` başlığı yeterlidir:

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" -H 'content-type: application/json' \
  -d '{"source":"googleTrends","countries":["TR"]}' \
  https://kadenewmedia.com/kadexai/api/kade-search/collect
# ...diğer kaynaklar... sonra:
curl -X POST -H "x-cron-secret: $CRON_SECRET" -H 'content-type: application/json' \
  -d '{"finalize":true}' https://kadenewmedia.com/kadexai/api/kade-search/collect
```

### Skorlama

`lib/kade-search/score.ts` — ağırlıklar: hacim %30, hız %28, etkileşim %16,
sıralama %14, çapraz platform %7, tazelik %5. Hız katkısı hacim güvenine göre
kısılır (200 → 2000 arama "%1000 büyüme" sayılmaz). Çıkarım kayıtlarının hızı
sınırlanır ve skoru %28 düşürülür; "zirvede" olarak etiketlenemezler.

Aşamalar: `emerging` (yükselen filiz) → `rising` → `peak` → `plateau` →
`declining` → `dead`. **Erken Radar** sekmesi ilk ikisini hız sırasına göre gösterir.

### İçerik fikri üreteci

`lib/kade-search/ideas.ts` — yapay zekâ çağrısı yoktur. Yüksek skorlu trendi
alır, türüne uygun format havuzundan kanca seçer (bir şarkıya "test ettim"
formatı önerilmez), kurgu iskeleti + gerçek hashtag seti + aynı kategorideki en
yüksek skorlu sesi önerir. Panoda **İçerik Fikirleri** sekmesi, uçta
`/api/kade-search/ideas`.

---

## 2. Altyazı Stüdyosu (`/dashboard/subtitles`)

Video → ses (tarayıcıda) → Whisper (Groq) → kelime zaman damgaları → altyazı
kutuları → düzenle/çevir → SRT/VTT indir veya YouTube'a yükle.

- Ses çıkarma `lib/media/extractAudio.ts` ile tarayıcıda yapılır; sunucuya
  yalnızca küçültülmüş ses gider (transkripsiyon ucu 25 MB sınırlı).
- Kutu bölme `lib/subtitles/cues.ts`: cümle sonu > uzun sessizlik > virgül >
  karakter/süre sınırı önceliğiyle. `inspectCues` okuma hızı, çok kısa/uzun kutu
  ve zaman çakışmasını işaretler.
- Çeviri `/api/subtitles/translate` — kutu sayısı ve zamanlama korunur, model
  bir kutuyu atlarsa kaynak metin kalır ve kaç kutunun atlandığı bildirilir.

### YouTube'a yükleme (OAuth)

Altyazı yüklemek API anahtarıyla yapılamaz; kanal sahibinin izni gerekir.

1. Google Cloud Console > Credentials > **OAuth client ID (Web application)**.
2. Yetkili yönlendirme URI'si: `<NEXT_PUBLIC_APP_URL>/api/youtube/callback`
   (üretimde `https://kadenewmedia.com/kadexai/api/youtube/callback`).
3. `.env`: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` ve
   `KADE_TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`).

Yenileme belirteci `integrations.encrypted_secret` alanında **AES-256-GCM** ile
şifreli tutulur; erişim belirteci hiç saklanmaz, her istekte yenilenir. Şifreleme
anahtarı yoksa bağlantı kapalı kalır — belirteci düz metin saklamak yerine
özelliğin kapalı olması tercih edildi.

Google yenileme belirtecini yalnızca ilk onayda döndürür. Kullanıcı uygulamayı
daha önce yetkilendirdiyse ve belirteç kaybolduysa, Google hesap izinlerinden
erişimi kaldırıp yeniden bağlaması gerekir; arayüz bu durumu açıkça söyler.

---

## 3. Dublaj Stüdyosu (`/dashboard/dubbing`)

Video → konuşma çözümü → hedef dile çeviri (süreye sığacak şekilde) →
bölüm bölüm seslendirme → zaman çizgisine yerleştirme → WAV.

- Çeviri `mode: 'dubbing'` ile yapılır: model, çevirinin kaynakla yaklaşık aynı
  sürede okunacak uzunlukta olmasını hedefler.
- Seslendirme `/api/dubbing/tts` — **her altyazı kutusu için ayrı mp3**. Tek uzun
  ses üretilse zamanlama tutmazdı; parçalar `lib/media/dubMixer.ts` ile kendi
  kutularının başlangıcına yerleştirilir.
- Bir parça kendi aralığına sığmazsa en fazla 1,6x hızlandırılır; hâlâ taşıyorsa
  arayüz kaç bölümün taştığını söyler (o bölümlerin çevirisini kısaltmak çözer).
- Orijinal ses kısık seviyede altta tutulabilir (ortam sesi ve müzik korunur).
- Çıktı ayrı bir ses dosyasıdır; videoya bindirme kurgu tarafında yapılır.

`OPENAI_API_KEY` gerekir (TTS). Tanımlı değilse arayüz "ses sağlayıcısı
yapılandırılmamış" der.

### Diller

`lib/subtitles/languages.ts` — 25 dil. `tts: false` olanlar (İbranice, Farsça,
Azerice, Sırpça, Bulgarca) altyazı çevirisinde vardır ama seslendirme kalitesi
yetersiz olduğu için dublaj listesinde gösterilmez.
