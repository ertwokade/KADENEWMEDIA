# Site ↔ admin içerik matrisi

Tarih: 28 Temmuz 2026

Bu tablo, admin'de “kaydedildi” görünen alanın public sitede gerçekten okunup
okunmadığını gösterir. Admin sekmeleri aynı durumu `live`, `static` ve
`no-page` rozetleriyle kullanıcıya bildirir.

## İçerik yönetimi sekmeleri

| Section | Admin alanı | Public tüketici | Durum | Not |
|---|---|---|---|---|
| `hero` | TR/EN başlık ve alt metin | `/` | Statik | Ana sayfa harici Next snapshot; veritabanını okumaz |
| `stats` | Sayaçlar | `/` | Statik | Snapshot içinde sabit |
| `services` | 6 hizmet başlık/açıklama/özellik | `/hizmetler`, `/hizmetler/:slug` | Canlı | Slug sabit tutulur; admin yeni, bozuk rota üretemez |
| `faq` | TR/EN soru-cevap listeleri | `/sss` | Canlı | Statik fallback korunur |
| `testimonials` | Referans kartları | `/referanslar` | Statik | Public sayfa henüz bu section'ı okumaz |
| `packages` | Paket fiyat alanları | `/paketler` | Canlı | Paket kimliği/kapsamı kodda; fiyat admin'den |
| `priceCalculator` | Katsayılar | `/fiyat-hesaplama` | Sayfa yok | URL 404 |
| `about` | Hikâye, misyon, istatistik, ekip | `/hakkimizda`, `/ekip` | Canlı | Ekip avatarı URL/path veya harf rozeti olabilir |
| `footer` | E-posta, telefon, adres, şehir, sosyal linkler | Global Footer, `/iletisim`, `/kariyer` | Canlı | Güvensiz sosyal URL şemaları elenir |
| `careers` | TR/EN ilanlar ve hero metni | `/kariyer` | Canlı | İlan yoksa doğrulanmamış örnek ilan gösterilmez |
| `basin` | Basın içeriği | `/basin` | Sayfa yok | URL 404 |
| `nedenBiz` | Neden Biz içeriği | `/neden-biz` | Sayfa yok | URL 404 |
| `tesekkur` | Teşekkür içeriği | `/tesekkur` | Statik | Public metin kodda |
| `referralProgram` | Program içeriği | `/referans-programi` | Sayfa yok | URL 404 |
| `podcastWebinar` | Podcast/webinar içeriği | `/podcast-webinar` | Sayfa yok | URL 404 |
| `caseStudies` | Vaka içeriği | `/basari-hikayeleri` | Statik | Public metin kodda |
| `newsletterArchive` | Arşiv içeriği | `/bulten-arsivi` | Sayfa yok | URL 404 |

## Ayrı içerik modelleri

| Model/API | Admin bölümü | Public/işlevsel tüketici | CRUD |
|---|---|---|---|
| Blog | Blog Yazıları | `/blog`, `/blog/:slug` | Oluştur/güncelle/sil; draft ve ileri tarih public filtreden çıkar |
| Partner | Partnerler | `/partnerler`, `/partnerler/:id` | Oluştur/güncelle/sil; emoji ve URL logo ayrımı var |
| Portfolio | Portföy | `/portfolio` | Medya tabanlı liste yönetimi |
| Link profili | Link Sayfaları | `/@:handle` | Oluştur/güncelle/sil, aktif/pasif |
| Kısa link | Kısa Linkler | `/s/:slug` | Oluştur/güncelle/sil, click kaydı |
| Medya | Medya Kütüphanesi | Admin editörleri | Yükleme/toplu silme; imza ve boyut doğrulaması |
| Müşteri/CRM | Mesajlar, teklif, görev, fatura vb. | Korumalı admin/müşteri akışları | Yetki bazlı |

## Veri birleştirme kuralı

Public sayfalar `useSiteContent(section)` ile yalnız public section'ları okur.
`mergeDefined()` dolu admin alanını statik fallback üzerine yazar; boş string,
`null`, `undefined` veya boş dizi doğrulanmış fallback metnini yanlışlıkla
silmez.

Anonim `/api/content` isteği artık bütün `kade_site_content` tablosunu döndürmez.
Anonim erişim yalnız açık allow-list section'larıyla mümkündür; `calendar` ve
diğer iç/admin section'ları `content` yetkisi ister. Bilinmeyen section hem GET
hem PUT için 400 döner.

## İçerik değişikliğinin SEO etkisi

React hydration sonrasında admin içeriği kullanıcıya görünür; fakat ön-render
HTML metni build zamanındaki fallback'tir. Arama motoruna ilk yanıtta admin
metninin de gitmesi gerekiyorsa section verisinin build sırasında çekilmesi
veya SSR gerekir. Admin bu nedenle statik/no-page sekmelerde açık uyarı gösterir.
