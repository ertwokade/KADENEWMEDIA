# Genel dashboard tema denetimi

## Bulgular

- Araç sayfaları Tailwind zinc paletiyle koyu tema için yazılmış.
- Global `.kade-panel` kuralları arka plan, metin, input ve üst bar renklerini `!important` ile açık temaya çeviriyor.
- Operasyon Merkezi iframe içinde çalıştığı için bu ezmeden etkilenmiyor; üst bar açık, içerik koyu kalıyor.
- Form sayfalarında kart sınırları, input yüzeyleri ve sonuç alanları kayboluyor.
- Aynı tema ezme bloğu `globals.css` içinde iki kez bulunuyor.

## Çözüm

- Geniş kapsamlı `.kade-panel` renk ezmeleri iki kopyadan da kaldırılacak.
- Araç sayfaları kendi koyu Tailwind tasarımını kullanacak.
- Ana dashboard açık çalışma alanını kendi sayfa sınıfıyla açıkça tanımlayacak.
- Koyu sidebar için yalnızca `kade-sidebar` kapsamındaki kurallar korunacak.
- TopBar koyu araç yüzeyiyle tutarlı hale gelecek.

## Kontrol rotaları

- `/dashboard`
- `/dashboard/operations?view=dashboard`
- `/dashboard/title`
- `/dashboard/ai-thumbnail`
- `/dashboard/analytics`
- `/dashboard/settings`

## Responsive

- 1440x1000 masaüstü görünümü
- 390x844 mobil görünümü ve sidebar etkileşimi
