# KadexAI Medya Kontrol Listesi

## Kaynaklar

- `Ekran Kaydı 2026-07-16 20.22.36.mov`: bulundu ve incelendi.
- Süre: 22,116 saniye; çözünürlük: 2880×1800; codec: H.264; 60 FPS.
- Yaklaşık her 2 saniyede bir 11 kare `_audit/media_frames` klasörüne çıkarıldı.
- `image(275).png` ve `image(276).png`: Desktop, Downloads, Documents, Pictures ve Videos altında dosya olarak bulunamadı. Görev mesajında gösterilen iki görsel yalnızca servis referansı olarak incelendi.

## Videoda doğrulanan ekran ve akışlar

- [x] Rota: `localhost:3000/kadexai/dashboard`.
- [x] Koyu arayüz, sarı vurgu rengi ve sabit sol navigasyon.
- [x] KadexAI marka alanı ve “İçerik çalışma alanı” alt başlığı.
- [x] “Bugün ne üretmek istersin?” ana başlığı.
- [x] “Başlık üret” ve “Metin oluştur” birincil aksiyonları.
- [x] Sayaçlar: 38 aktif araç, 5 kategori, otomatik model.
- [x] Sık kullanılan araç kartları: Başlık Üretici, Metin Oluşturucu, Hook Jeneratörü, AI Thumbnail, İzlenme Analizi, Operasyon Merkezi.
- [x] Sol menü arama alanı.
- [x] Platform / Genel Bakış grubu.
- [x] Operasyon grubu ve Operasyon Merkezi, SentScan, Prodüksiyon CRM, Banana Studio, Vibe Coding, AI Radar, Notlar, Operasyon Ayarları girdileri.
- [x] Üretim grubu; Başlık Üretici, Metin Oluşturucu, Video Açıklama ve devam eden araçlar.
- [x] Analiz grubu; Viral Skor, A/B Başlık Testi, Clickbait Dedektörü, YouTube SEO, İzlenme Analizi, Sosyal Medya Analizi, Trend Bulucu, Rakip Analizi, Yorum Analizi, Performans Tahmini, Analitik, FAQ Üretici, Alıntı Çıkarıcı.
- [x] Planlama grubu; İçerik Fikirleri, 30 Günlük Plan, Bağlantı Bio, İçerik Takvimi, Şablon Kütüphanesi, Geçmiş.
- [x] Ayarlar grubu ve sistem durumu bağlantısı.
- [x] Menü gruplarının açılıp kapanması ve sayfanın dikey kaydırılması.
- [ ] Videoda login, kayıt, parola kurtarma, logout veya gerçek AI üretim sonucu gösterilmiyor.
- [ ] Videoda mobil görünüm gösterilmiyor.

## Kod ile medya arasındaki önemli farklar

- Kodda 38 araçlık kayıt yapısı korunuyor; bazı videodaki operasyon araçları owner erişimi veya “yakında” durumu nedeniyle koşullu.
- Kullanıcının sağladığı yeni yatay KADE logosu, videodaki kare ikon + metin yerine giriş ve sidebar’da kullanılıyor.
- Güvenlik çalışması tasarım dilini değiştirmeden auth, API, RLS ve deployment katmanlarına odaklanıyor.
- Görev mesajındaki servis listesi mimari gereksinim değil; yalnızca kaynak kodda gerçekten kullanılan Supabase ve AI sağlayıcıları denetlendi.
