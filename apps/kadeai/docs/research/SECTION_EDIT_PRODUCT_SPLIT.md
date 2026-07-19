# Ürün sürümü ayrımı

## Hedef

- `KADE-ALL-IN-ONE-OWNER`: satış araçları yalnızca bu sahip sürümünde görünür ve erişilebilir.
- `KADE-ALL-IN-ONE`: normal kullanıcı sürümünde satış araçları görünmez ve doğrudan URL ile açılamaz.
- İki sürümde de kaldırılan araçlar menüden, kontrol paneli envanterinden ve doğrudan route erişiminden çıkarılır.

## Ortak kaldırılacak alanlar

- Video Editör ve tüm alt modülleri
- Script Yazarı, Podcast Script, Blog Yazısı, Newsletter, Sponsor Scripti, Çekiliş Metni
- Thumbnail Konsepti (AI Thumbnail korunur)
- Altyazı Üretici, Storyboard, B-Roll, Story Dizisi
- Büyüme ve Büyüme Analitik kategorileri
- Strateji kategorisi

## Korunacak alanlar

- AI Thumbnail
- Dublaj & Çeviri; menüde `Yakında` olarak gösterilir
- Sahip sürümünde Satış kategorisi

## Erişim ve görünürlük

- Merkezi route politikası Sidebar ve kontrol paneli kartlarını filtreler.
- Proxy, gizli route'lara doğrudan erişimi `/dashboard` sayfasına yönlendirir.
- `NEXT_PUBLIC_KADE_OWNER_MODE=1` yalnızca sahip kopyasında Satış alanını açar.

## Doğrulama

- TypeScript/ESLint ve production build başarılı olmalı.
- Kullanıcı sürümünde Satış ve ortak kaldırılan alanlar görünmemeli.
- Sahip sürümünde Satış görünmeli; ortak kaldırılan alanlar görünmemeli.
- AI Thumbnail ve Dublaj & Çeviri görünmeli.
