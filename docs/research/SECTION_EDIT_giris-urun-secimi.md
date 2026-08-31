# /giris ürün seçimi

## Mevcut durum

- `/giris`, Kade Media müşteri giriş/kayıt formunu doğrudan açıyor.
- Content AI giriş ekranı `/kadexai/login` altında ayrı bir uygulama olarak çalışıyor.

## İstenen değişiklik

- `/giris` iki çalışma alanını gösteren bir seçim ekranı olacak.
- “Danışmanlıklarım” seçimi `/giris/danismanlik` adresindeki mevcut müşteri giriş formuna gidecek.
- “Content AI” seçimi `/kadexai/login` adresindeki KadexAI giriş formuna gidecek.
- Masaüstü ve mobilde iki seçim de açık, klavye ile erişilebilir ve gerçek rotalara bağlı olacak.
- Giriş alanı, sabit site navigasyonu ve “GİRİŞ” düğmesi kartların üzerine binmeyecek şekilde bağımsız gösterilecek.

## Etkilenen dosyalar

- `src/App.jsx`
- `src/pages/LoginHub.jsx`
- `src/pages/LoginHub.css`
- `src/pages/Login.jsx`
- `scripts/generate-static-routes.mjs`

## Doğrulama

- `/giris` iki ürün kartını gösterir.
- Danışmanlık kartı `/giris/danismanlik` rotasını açar.
- Content AI kartı `/kadexai/login` rotasını açar.
- Lint ve production build başarılıdır.
- Masaüstü ve mobil tarayıcı kontrollerinde taşma veya kritik konsol hatası yoktur.
