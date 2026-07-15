# CONTENT_REQUIRED — Gerçek Veri İhtiyaçları

Bu dosya, repository içinde **gerçekliği doğrulanamayan** ve uydurulmaması gereken
içerikleri listeler. Her madde için: mevcut durum · ihtiyaç · kullanıldığı yer ·
geçici güvenli çözüm.

> Canonical domain: **https://kademedia.com.tr** (secondary: kadenewmedia.com →
> Vercel proje ayarlarından canonical'a 301 yönlendirilmeli; kod tarafında robots
> ve BASE_URL zaten kademedia.com.tr).
> Gerçek iletişim: **thekademedia@gmail.com** (Gmail). Domain e-postası
> (örn. hello@kademedia.com.tr) **yok** — çalışıyormuş gibi yayınlanmadı.

---

## 1. Ekip / Kurucu
- **Durum:** `src/pages/Team.jsx` — placeholder isimler (Ayşe Yılmaz, Mehmet Kaya,
  Zeynep Demir) kaldırıldı. Yalnızca **Kadir Demir · Kurucu & CEO** (git author ile
  doğrulanabilir) bırakıldı.
- **İhtiyaç:** Gerçek ekip üyeleri, unvanları, foto ve kısa bio.
- **Yer:** `/ekip`, `/hakkimizda` ekip bölümü, `Team.jsx`, admin içerik.
- **Geçici çözüm:** "Çekirdek ekip + açık pozisyonlar (/kariyer)" nötr modeli.

## 2. Müşteri sayısı / istatistikler
- **Durum:** "20+", "%87 müşteri tutma", "4.8/5 memnuniyet", "3+ yıl". `/neden-biz`,
  `/referanslar`, `/hakkimizda`, `NedenBiz.jsx`, `Referanslar.jsx` demo değerler.
  "yüzlerce marka" → "onlarca marka" olarak çelişki giderildi.
- **İhtiyaç:** Doğrulanabilir gerçek müşteri sayısı ve metrikler (kaynak/tarih ile).
- **Geçici çözüm:** Değerler nötr tutuldu; doğrulanana kadar merkezi bir
  `data`/config dosyasından yönetilmeli (öneri: `src/config/stats.js`).

## 3. Portfolyo / case study
- **Durum:** `Portfolio.jsx` + `server/api/sitemap.js` — Flavora, TechVibe,
  GreenLife, UrbanStyle, PetPal, FitZone **örnek projeler**. Sonuç metrikleri
  (2M+ erişim, %400 satış vb.) doğrulanamıyor. Figma/template linkleri kaldırıldı.
- **İhtiyaç:** Gerçek proje verisi (müşteri izni, görsel/telif, doğrulanmış sonuç).
- **Yer:** `/portfolio`, `/portfolio` detay, anasayfa proje index'i, sitemap.
- **Geçici çözüm:** Gerçek proje gelene kadar örnek projeler "örnek çalışma"
  olarak işaretlenmeli veya kaldırılıp 2 gerçek projeyle değiştirilmeli.
  **Aksiyon:** doğrulanmamış proje slug'ları sitemap'ten çıkarılmalı (aşağıya bkz).

## 4. Referanslar / yorumlar
- **Durum:** `Referanslar.jsx` — Elif Karahan, Mert Doğan, Dr. Selin Aydın vb.
  isimli yorumlar **örnek**. Google/Instagram rozetleri doğrulanamıyor.
- **İhtiyaç:** Gerçek, izinli müşteri yorumları (isim/kurum/tarih/kaynak).
- **Geçici çözüm:** Doğrulanana kadar yayından kaldırılmalı veya "örnek" etiketli.

## 5. Partnerler
- **Durum:** `Partners.jsx` — Flavora/TechVibe vb. "iş ortağı" mı "müşteri" mi
  belirsiz; logo kullanım izni doğrulanamıyor.
- **İhtiyaç:** Gerçek partner listesi + logo kullanım izni + partnerlik türü.
- **Geçici çözüm:** İçerik azsa `/partnerler` route'u kaldırılıp anasayfa/hakkımızda
  içinde küçük "iş ortakları" bölümü değerlendirilmeli.

## 6. Paket fiyatları ve koşulları
- **Durum:** `/paketler` — Start-Up/Büyüme/Premium kapsam listeleri var; **fiyat
  yok** (API'ye bağlı). Ücretsiz panel demoları ayrı bölüme alındı.
- **İhtiyaç:** Gerçek fiyatlar, KDV, reklam bütçesi dahil/hariç, prodüksiyon/stüdyo/
  ulaşım ek maliyetleri, revizyon sınırı, minimum taahhüt, ödeme koşulları.
- **Geçici çözüm:** Fiyat yerine kapsam + "Teklif Al" CTA.

## 7. İletişim / kurumsal
- **İhtiyaç:** Domain tabanlı e-posta, telefon, WhatsApp, harita/adres doğrulaması,
  resmî şirket unvanı, Vergi/MERSİS. Biruni Teknopark ilişkisi yalnızca
  doğrulanabilir seviyede ("İstanbul, Biruni Teknopark" konum etiketi olarak).
- **Geçici çözüm:** Mevcut gerçek e-posta (thekademedia@gmail.com) korundu.
  Marka/iletişim bilgisi `src/config/brand.js`'te merkezi.

## 8. Yasal metinler
- **Durum:** `/kvkk`, `/gizlilik`, `/cerez-politikasi` mevcut ama genel metin.
- **İhtiyaç:** Resmî şirket unvanı, KVKK veri sorumlusu, gerçek çerez sağlayıcı
  listesi, hukukçu onaylı metin.
- **Geçici çözüm:** Nötr iskelet korundu; kesin hüküm içeren sahte metin yazılmadı.

## 9. Kade Kit Business
- **Durum:** `/kade-kit-business` auth-gated stüdyo/ürün; noindex.
- **İhtiyaç:** Ürünün net tanımı (hizmet mi / SaaS mi / panel mi), fiyat, erişim
  modeli, ana hizmetlerden farkı.

---

## Uygulanan teknik aksiyonlar (bu görev)
- Domain: canonical = kademedia.com.tr; robots'a `/giris`, `/kade-kit-business`
  eklendi; kadenewmedia.com → Vercel dashboard 301 (infra, kodda değil).
- Sitemap: doğrulanmamış demo portfolyo slug'ları için not (bkz. madde 3) —
  gerçek veri gelene kadar `server/api/sitemap.js`'ten çıkarılması önerilir.
- Placeholder/demo temizliği, merkezi brand config, nav dedup, a11y focus,
  noscript fallback, reduced-motion önceki commit'lerde uygulandı.

## Bilinmeyen gerçek bilgiler (uydurulmadı)
Ekip üyeleri · unvanlar · müşteri sayısı/metrikler · case study sonuçları ·
referans kişileri · partner izinleri · fiyatlar/KDV · domain e-postası · telefon ·
resmî unvan/Vergi/MERSİS · çerez sağlayıcıları · görsel telif/izin.
