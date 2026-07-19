# Dashboard arayüz toparlama

## Sorunlar

- Ana ekran kullanıcı odaklı bir başlangıç paneli yerine teknik proje envanteri gibi görünüyor.
- Üst bölümdeki küçük istatistik kutuları ve iki dar merkez kartı geniş ekranda dengesiz boşluk bırakıyor.
- Hızlı erişim kartları küçük ve görsel hiyerarşileri zayıf.
- Sidebar aynı anda çok fazla açık kategori gösterdiği için uzun ve yorucu.
- Açık renk sidebar ile açık renk içerik alanı birbirinden yeterince ayrışmıyor.

## Düzenleme

- Teknik kaynak proje haritası kaldırılacak.
- Koyu, marka sarısı vurgulu bir karşılama alanı eklenecek.
- Başlık Üretici ve Metin Oluşturucu ana CTA olarak öne alınacak.
- Altı hızlı başlangıç aracı eşit kartlarla gösterilecek.
- Aktif araçlar kategori kartlarında okunaklı bir kütüphane olarak listelenecek.
- Sidebar koyu yüzeye, daha rahat satır yüksekliğine ve otomatik aktif kategori açılımına kavuşacak.
- Sahip modunda Satış kategorisi görünmeye devam edecek.

## Responsive beklenti

- 1440 px: hero iki kolon, hızlı araçlar altı kolon, kategoriler üç kolon.
- Tablet: hero tek kolon, hızlı araçlar üç kolon, kategoriler iki kolon.
- Mobil: hero ve kartlar tek kolon; sidebar menü butonuyla açılır.

## Doğrulama

- Masaüstü ve mobil ekran görüntüsü kontrolü.
- Kullanıcı sürümünde Satış görünmez.
- Sahip sürümünde Satış görünür.
- TypeScript, lint ve production build başarılı olur.
