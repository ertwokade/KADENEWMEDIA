# Kade New Media — public site

Bu klasör kadenewmedia.com'un public yüzünü üretir: ana sayfa snapshot'ı ve
statik pazarlama rotaları. Uygulama tarafı (api/*, admin, müşteri paneli,
giriş) kök dizindeki React projesinde kalır.

## Çalıştırma

```bash
node server.mjs            # varsayılan 4180, PORT ile değiştirilir
```

`server.mjs` her HTML/JS isteğinde `kade-html-transform.mjs` içindeki tek
dönüşümü uygular: marka metinleri, bağlantı eşlemeleri ve stil/script
enjeksiyonları. Aynı dönüşüm `scripts/build-static.mjs` tarafından da
kullanıldığı için yerelde görülen çıktı yayınlanan çıktıyla birebir aynıdır.

## Üretim

```bash
node scripts/build-static.mjs   # dist/ üretir (sunucu gerektirmeyen statik)
```

Kök projedeki `npm run legacy:build` bu adımı çağırır ve `scripts/merge-clone.mjs`
ile çıktıyı uygulama derlemesinin üzerine bindirir.

## Katmanlar

| Dosya | İş |
|---|---|
| `kade-html-transform.mjs` | Tek doğruluk kaynağı: metin/bağlantı değişimleri + enjeksiyonlar |
| `kade-brand.css/js` | Marka dili, hizmetler paneli, dil ve tema kontrolleri |
| `kade-routes.css/js` | Statik rotaların ortak tasarımı, breadcrumb ve site indeksi |
| `kade-access.js` | KadeAI / danışmanlık giriş-kayıt menüsü |
| `kade-footer.js` | Ana sayfa site haritası footer'ı |
| `kade-entry-watchdog.js` | Giriş yükleyicisi takılırsa sayfayı açar |
