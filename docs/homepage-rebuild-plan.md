# Ana sayfa yeniden kurulumu — Aşama A: envanter ve plan

Tarih: 29 Temmuz 2026
Durum: **Envanter tamamlandı, hiçbir dosya silinmedi.**

## 1. Neden yeniden kuruluyor

`/` adresi `public/site.html` + `public/_next/**` üzerinden servis ediliyor.
Bu paket, haoqi.design'ın klonlanmış derlenmiş çıktısıdır. Beş bağımsız kanıt:

1. **Kart yükseklikleri birebir aynı** — 3 viewport × 5 kart = 15 eşleşme
   (1440px: `917,585,585…` her ikisinde; 1024px: `640,488,488…`;
   390px: `386,386,386…`). Kade'de 5 kart 0px'e düşüyor çünkü referansın
   projeleri silinmiş, kart iskeleti kalmış.
2. **Figma plugin ID'leri kopyalanmış.** `figma.com/community/plugin/
   1255914175202017737/vectorsymbols` → `tiktok.com/@kadenewmedia/community/
   plugin/1255914175202017737/reklam-yonetimi`. Domain ve slug değişmiş,
   **ID aynı**. Aynısı `986289377230504703` için de geçerli.
   Etkinlik yolları da aynı: `…/events/details/…see-hear-touch/`.
3. **Snapshot'ın kendi kodundaki yorum** (`public/site.html`, 61429. karakter):
   “Kade imza SVG'si: hidrasyon 'svg-sign' içeriğini *orijinal Haoqi
   imzasına* sıfırlıyor; her run() geçişinde Kade versiyonuna geri
   patchliyoruz.”
4. `THREE.Clock deprecated` uyarısı **her iki sitede** aynı — aynı Three.js
   sürümü, aynı sahne kodu.
5. Aynı bundle yapısı, aynı `#selected-work` mimarisi, aynı `<article>` sayısı.

Kaynak proje bu repoda yok; yalnız minified `_next/static/chunks/*` var.
Bu yüzden hero zamanlaması, kart yükseklikleri, starburst sahnesi, footer
metni ve hydration #418 **bakımı yapılabilir biçimde düzeltilemiyor**.

## 2. Snapshot'a bağlı olan her şey (silmeden önce çözülmesi gerekenler)

| Bağımlılık | Dosya | Ne yapılacak |
|---|---|---|
| `/` rewrite | `vercel.json:48` | Kaldır; `/` ön-render edilen React sayfası olur |
| Dev middleware | `vite.config.js:12-13` | Kaldır |
| Ön-render şablonu | `scripts/generate-static-routes.mjs` | `/` rotasını listeye ekle |
| Font yaması | `scripts/apply-poppins-to-site.mjs` | Gereksizleşir |
| Ağ temizleyici | `scripts/sanitize-site-snapshot.mjs` | Gereksizleşir |
| Build adımı | `package.json` → `legacy:prepare-snapshot` | Kaldır |
| Tarama engeli | `public/robots.txt:21` | `Disallow: /site.html` kaldır |
| Birim test | `tests/unit/design-system.test.js:98` | Snapshot yerine “geri gelmedi” regresyonu |
| E2E muafiyeti | `tests/e2e/routes.spec.js:31-42` | `#418` muafiyeti kaldırılır |
| Dokümanlar | `docs/` altında 8 dosya | Güncellenecek |

**Hiçbir React rotası snapshot'a bağlı değil.** `/` dışındaki 38 rota
`dist/app.html` üzerinden çalışıyor; snapshot kaldırılınca etkilenmezler.

## 3. Varlık envanteri ve köken durumu

### 3.1 Kade'ye ait olduğu doğrulanan

| Varlık | Kanıt |
|---|---|
| `public/kadir.jpg` (438 KB) | XMP metadata: `Author: Kadir Demir`, Canva ile üretilmiş |
| `public/fonts/poppins/*` | Google Fonts, açık lisans, bu turda indirildi |
| `src/data/*`, `src/i18n/translations.js` | Türkçe kurumsal içerik, repoda yazılmış |
| `src/config/brand.js` | Kade iletişim bilgileri |

### 3.2 Kökeni belirsiz — yeni ana sayfada KULLANILMAYACAK

| Varlık | Boyut | Nerede kullanılıyor | Not |
|---|---|---|---|
| `public/model/hello.gltf` + `.bin` + `.orig` | ~2 MB | Snapshot **ve** `KadeScene.jsx` | Referans sitenin hero'sundaki 3B “hello” objesi |
| `public/model/cnt.gltf` + `.bin` | ~1 MB | Yalnız snapshot | — |
| `public/model/cursor.glb` | ~200 KB | Yalnız snapshot | Referansta özel imleç vardı |
| `public/stickers/` | 3,1 MB, 12 dosya | **Hiçbir yerde** | `s_01…s_12` jenerik adlandırma |
| `public/sticker_img/` | 3,9 MB, 24 dosya | Yalnız snapshot | Aynı seri, png+webp |
| `public/img/m3.png` + `.webp` | 1,1 MB | Yalnız snapshot | — |
| `public/img/kade-hello-art.jpg` | 89 KB | `kade-yeni.css:873` | “hello” işine ait görsel |

glTF dosyalarının tamamı `THREE.GLTFExporter` ile üretilmiş, telif alanı boş —
metadata köken kanıtı vermiyor. Referans sitenin hero objesiyle görsel olarak
örtüştükleri için **yeni ana sayfada kullanılmayacaklar**.

### 3.3 Kaldırılacak geçersiz bağlantılar

Tamamı `public/_next/static/chunks/d59f7a97fb1c563f.js` içinde gömülü —
React kodunda karşılığı yok, snapshot kalkınca kendiliğinden gider:

- `tiktok.com/@kadenewmedia/community/plugin/1255914175202017737/reklam-yonetimi`
- `tiktok.com/@kadenewmedia/community/plugin/986289377230504703/video-produksiyon`
- `tiktok.com/@kadenewmedia/events/details/kade-media-presents-see-hear-touch/`
- `tiktok.com/@kadenewmedia/events/details/kade-media-presents-design-system/`
- `kademedia.com.tr/*` (chunk `7758f29a8aeb1c60.js`) — yanlış alan adı

## 4. Yeni ana sayfa mimarisi

### 4.1 Teknik yaklaşım

Mevcut yığın genişletilir, ikinci bir animasyon katmanı kurulmaz:

- **React 19 + React Router 7** (mevcut)
- **Framer Motion** (mevcut) — giriş/çıkış ve reveal
- **Lenis** (mevcut) — tek scroll yöneticisi
- **CSS** — hareketin çoğu `transform`/`opacity`/`clip-path` ile
- **Three.js/R3F yalnız gerekirse** ve kendi geometrimizle; hazır model
  kullanılmaz

Hero'nun görsel ağırlığı 3B modelden değil, **tipografi + katmanlı CSS
gradient + ince grain** ile kurulur. Bu, referansın çözümünü tekrarlamaz ve
2,4 MB'lık bundle bağımlılığını ortadan kaldırır.

### 4.2 Bölüm sırası — referanstan kasıtlı olarak farklı

Referans: hero → bio/portre → uzun proje galerisi → starburst → footer.

Kade için önerilen (hizmet ajansı, portfolyo stüdyosu değil):

1. **Hero** — kısa konum ifadesi + iki CTA. HTML metin ilk boyada görünür.
2. **Ne yapıyoruz** — 6 gerçek hizmet, editoryal satır düzeni. Referansta
   bu bölüm yok; Kade'nin asıl ticari içeriği bu.
3. **Çalışma biçimi** — 4 adım. Şeffaflık vurgusu Kade'nin ayırt edici yanı.
4. **Seçili işler** — admin verisinden; veri yoksa dürüst boş durum.
   Kart yüksekliği tokenlı `aspect-ratio` ile sabit, asla 0'a düşmez.
5. **Kapanış** — tek satır ifade + iletişim CTA.

Referansın uzun galeri odaklı ritmi, kart ölçüleri ve metin kompozisyonu
tekrarlanmaz.

### 4.3 Proje kartı içerik kuralı

Gerçek müşteri medyası ve izni yoksa müşteri işi gösterilmez. Kartlar üç
durumdan birinde olur:

- **Yayınlanmış proje** — admin'den, gerçek medya ve müşteri onayı ile
- **Kade Studio Deneyi** — kendi çalışmamız, açıkça bu etiketle
- **Hizmet Kabiliyeti** — medyasız, ne yapabildiğimizi anlatan kart

Boş liste durumunda “yakında” metni gösterilir; sahte kart üretilmez.

## 5. Kabul kriterleri (dokümandan)

| Kriter | Hedef |
|---|---|
| HTML başlık/CTA görünür | ≤ 500 ms |
| Hero görseli hazır | masaüstü ≤ 2,0 s · mobil (Fast 4G + 4× CPU) ≤ 2,5 s |
| `/portfolio` içerik görünür | ≤ 1 s |
| Hydration hatası | yok |
| Yatay taşma (390/1024/1440) | yok |
| 0px yüksekliğe düşen kart | yok |
| Geçersiz plugin/event linki | yok |
| Metin kırpılması | hiçbir viewport'ta yok |
| Route geçişi | ≤ 850 ms, reduced-motion'da anında |
| CLS | < 0,1 |
| Sekme/route sonrası canvas·RAF·listener sayısı | artmıyor |
| reduced-motion | tüm içerik görünür, opacity 0'da kalan yok |

## 6. Uygulama sırası ve geri dönüş

Her aşama ayrı commit; istenirse tek tek geri alınabilir.

- **B)** Özgün hero + navigasyon
- **C)** Hizmet ve proje sunumu
- **D)** Scroll sahneleri + footer
- **E)** Snapshot bağımlılığını kaldırma (dosyalar hâlâ yerinde)
- **F)** Playwright, performans, responsive doğrulama
- **G)** Tüm testler geçtikten **sonra** snapshot dosyalarının silinmesi —
  ayrı commit, ayrı onay

## 7. Kullanıcıdan gereken içerik

- Gerçek proje görselleri ve müşteri yayın izni (yoksa kartlar “Kade Studio
  Deneyi” / “Hizmet Kabiliyeti” olarak kalır)
- Logo dosyaları — mevcut `logo.svg` kullanılamaz durumda: viewBox 514×180
  olduğu hâlde çizim içeriği 65×100'lük bir köşede
- Sosyal medya adresleri (admin > İçerik > Footer'a girilecek)
