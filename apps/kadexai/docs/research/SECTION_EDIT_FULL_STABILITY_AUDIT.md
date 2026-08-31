# KADE All-in-One tam kararlılık düzeltmesi

## Kapsam

- Kullanıcı uygulaması: `KADE-ALL-IN-ONE` (3000)
- Sahip uygulaması: `KADE-ALL-IN-ONE-OWNER` (3001)
- Operasyon kabuğu: `/dashboard/operations`
- Gömülü operasyon uygulaması: `/public/operations-kit`

## Yapılacak değişiklikler

1. Operasyon içi görünüm değişiklikleri tarayıcı geçmişine yeni kayıt ekleyecek; geri/ileri hareketleri URL, üst başlık, dış menü ve iframe ile eşzamanlı kalacak.
2. Iframe için yükleme zaman aşımı, hata görünümü ve yeniden deneme eylemi eklenecek.
3. Üst çubukta seçilen AI modeli iframe ve `/api/assistant` isteğine taşınacak.
4. Asistan filtre değişimlerinde otomatik çağrılmayacak; tüm zamanlar, bu ay ve geçen ay verileri açık biçimde bağlama eklenecek.
5. Dashboard kartları 320 px dahil taşmadan çalışacak; geciken görevler doğru etiketlenecek.
6. İç içe etkileşimli öğeler kaldırılacak; ikon düğmelerine erişilebilir ad verilecek.
7. Mobilde kapalı dış menü klavye ve ekran okuyucu odağından çıkarılacak.
8. Operasyon arayüzündeki görünür Türkçe karakter ve yazım sorunları temizlenecek.
9. Dublaj & Çeviri route'u gerçek bir “Yakında” ekranına dönüşecek.
10. Satış route'ları üretimde kullanıcı kimliği/e-posta izin listesiyle korunacak; operasyon statik kabuğu da kimlik doğrulamasına dahil edilecek.
11. Kaldırılmış araçların kullanıcı ve sahip kopyalarındaki sayfa/API kaynakları fiziksel olarak silinecek; route engelleri savunma katmanı olarak kalacak.
12. Harici ikon betiğine bütünlük kontrolü eklenecek; Google Fonts bağımlılığı kaldırılacak; iframe yetkileri sınırlandırılacak.

## Responsive beklentiler

- 1440x1000: dört KPI, dengeli iki kolonlu paneller.
- 390x844: iki KPI kolonu, yatay taşma yok.
- 320x720: KPI değerleri ve ikonlar kırpılmadan okunabilir.
- Mobil menü kapalıyken ilk klavye odağı görünür “Menüyü aç” düğmesine gitmeli.

## Doğrulama listesi

- Kullanıcı ve sahip build/typecheck/lint.
- 5 sert yenilemede iframe yükleyicisinin kapanması.
- Dashboard → CRM → Geri → Dashboard → İleri → CRM.
- Filtreler ve asistan dönem cevabı.
- Seçilen model ile API'nin döndürdüğü modelin eşleşmesi.
- Görev ve medya satırlarının doğru hedefi açması.
- Mobil taşma ve klavye odağı.
- Kullanıcı satış 307, sahip satış 200; kaldırılan route'lar iki sürümde de kapalı.
- Konsol ve başarısız ağ isteği kontrolü.
