# 08 — Hukuki Uyumluluk Kontrol Listesi (şartname §22)

**Bu belge hukuki danışmanlık değildir, bir yazılım denetimidir.** Aşağıdaki
her madde "uygulanıyor / uygulanmıyor / hukukçu doğrulaması gerekli" olarak
işaretlendi. Mevcut `/kvkk`, `/gizlilik`, `/cerez-politikasi`,
`/telif-haklari` sayfalarının metin içeriği **hukuken bağlayıcı nihai metin
değildir** — teknik altyapı olarak var, ama içerik yetkin bir Türk
hukukçusu (tercihen KVKK/e-ticaret deneyimli) tarafından incelenmeden
yayında kalmaya devam etmemeli (bkz. `docs/BLOCKERS_TR.md` #2).

## 1. Değerlendirilen mevzuat (kapsam, doğrulama değil)

| Mevzuat | Bu sistemle ilgisi | Durum |
|---|---|---|
| 6698 KVKK | Müşteri/kullanıcı verisi işleniyor (Supabase'te) | Aydınlatma metni sayfası var, içerik hukukçu onayı bekliyor |
| 6563 Elektronik Ticaret Kanunu | Online sipariş (Shopier) var | Mesafeli satış sözleşmesi/ön bilgilendirme formu **yok** |
| 6502 Tüketici Koruma Kanunu | Dijital hizmet satışı var | Cayma/iptal/iade politikası sayfası **yok** |
| Mesafeli Sözleşmeler Yönetmeliği | Aynı | Aynı, **yok** |
| Ticari İletişim/İYS | Newsletter gönderimi var (`contact.js`) | İYS entegrasyonu doğrulanmadı — bu turda kapsam dışı |
| ETBİS | Uygulanabilirliği belirsiz (hukukçu kararı gerekli) | Değerlendirilmedi |
| 5846 FSEK (telif) | `/telif-haklari` sayfası var | İçerik hukukçu onayı bekliyor |
| Vergi/e-belge | Fatura kaydı var (`kade_invoices`) ama gerçek e-fatura/e-arşiv entegrasyonu yok | Mali müşavir doğrulaması gerekli |
| Yurt dışı veri aktarımı | Supabase (AWS altyapılı, muhtemelen AB/ABD bölgesi), Gemini API (Google) | Hangi bölgede barındırıldığı ve KVKK md.9 aktarım şartlarına uygunluğu **doğrulanmadı** — hukukçu + Supabase proje bölge ayarı kontrolü gerekli |
| Çerezler/consent | `CookieBanner.jsx` mevcut | Aşağıya bkz., teknik olarak iyi tasarlanmış |

## 2. Public hukuki sayfalar — mevcut durum

| Sayfa | Durum | Not |
|---|---|---|
| Kullanım Koşulları | **Yok** | Hiç route/sayfa yok |
| Gizlilik Politikası | Var (içerik onay bekliyor) | `/gizlilik` |
| KVKK Aydınlatma Metni | Var (içerik onay bekliyor) | `/kvkk` |
| Çerez Politikası | Var (içerik onay bekliyor) | `/cerez-politikasi` |
| Çerez Tercih Merkezi | Kısmen | `CookieBanner.jsx` kabul/red sunuyor ama kategori bazlı (analytics/marketing/functional ayrı ayrı) tercih merkezi yok — yalnızca ikili (tümü/hiçbiri benzeri analytics_storage) |
| Mesafeli Satış/Hizmet Sözleşmesi | **Yok** | Gerçek bir e-ticaret akışı (Shopier) olduğu için bu, en somut boşluk |
| Ön Bilgilendirme Formu | **Yok** | Aynı gerekçe |
| Cayma/İptal/İade Politikası | **Yok** | Faz 3'te eklenen admin-taraflı manuel iade akışı var ama MÜŞTERİYE dönük bir politika sayfası yok |
| Abonelik/otomatik yenileme koşulları | **Yok** | `kade_subscriptions` var ama koşulları anlatan public bir sayfa yok |
| Dijital hizmet ifası bilgilendirmesi | **Yok** | — |
| Fikri Mülkiyet ve Telif Politikası | Var (`/telif-haklari`, içerik onay bekliyor) | — |
| Kullanıcı İçeriği ve Lisans Koşulları | **Yok** | Müşteri panelinde kullanıcı içeriği (medya/link profili) yükleniyor ama lisans koşulu yok |
| Kabul Edilebilir Kullanım Politikası | **Yok** | — |
| AI Kullanım ve Çıktı Politikası | **Yok** | `chat.js`/kadexai AI araçları var ama AI çıktısına dair sorumluluk reddi/kullanım politikası public olarak yok |
| API Kullanım Koşulları | **Yok** | Şu an public bir API sunulmuyor, uygulanabilirliği düşük |
| Takedown/İhlal Bildirim Prosedürü | **Yok** | Kullanıcı içeriği barındıran `/@link` sistemi için önemli bir boşluk |
| Veri Sahibi Başvuru Formu | **Yok** | KVKK md.11 kapsamında zorunlu — gerçek bir boşluk |
| Kurumsal bilgiler/iletişim | Var | `/iletisim`, `BRAND` config |
| SLA/destek koşulları | **Yok** | Paket bazlı SLA tanımı yok |

## 3. Onay sistemi — teknik değerlendirme

| Kural | Durum | Kanıt |
|---|---|---|
| Aydınlatma metni + açık rıza aynı checkbox'a sıkıştırılmamış | Uygun görünüyor | `QuoteRequest.jsx`'te tek checkbox yalnızca KVKK/teklif süreci için — ayrı bir pazarlama izni bu formda yok, bu yüzden karışma riski yok |
| Zorunlu sözleşme kabulü ile opsiyonel ticari ileti izni ayrı | Doğrulanmadı | Newsletter aboneliği (`contact.js` `action=newsletter`) ayrı bir akış — teklif formundaki zorunlu KVKK onayıyla karışmıyor, ama newsletter formunun kendi onay metni bu turda incelenmedi |
| Belge versiyonu/timestamp/user/IP kaydı | **Yok** | `kade_quotes.consent_at` yalnızca zaman damgası tutuyor; hangi belge VERSİYONUNUN onaylandığı, IP/user-agent kaydı yok — `LegalDocumentVersion`/`LegalAcceptance` şeması hiç kurulmadı (bkz. `docs/05`) |
| Kullanıcı kabul ettiği belgeye panelden ulaşabiliyor | **Yok** | Müşteri panelinde "hangi belgeyi ne zaman onayladım" görünümü yok |
| Belge değişince yeniden onay yönetimi | **Yok** | Versiyonlama olmadığı için bu da yok |
| Önceden işaretli checkbox yok | Uygun | `consent: false` varsayılan, `CookieBanner` de varsayılan gizli/onaysız |
| Gerekli olmayan çerezler onaydan önce çalışmıyor | Uygun | `loadAnalytics()` yalnızca `cookie_consent==='accepted'` sonrası çağrılıyor, GA4 script'i onaydan önce hiç yüklenmiyor |
| Red seçeneği gizli/zor değil | Uygun | Kabul/Red butonları eşit görünürlükte, red gerçek cookie temizliği yapıyor |

## 4. Admin hukuki modülü (şartname §22, madde 33-34)

Şartnamenin istediği "Hukuki belgeler ve versiyonları" admin modülü
(belge oluşturma/taslak/yayın, versiyonlama, yürürlük tarihi, dil,
yeniden onay zorunluluğu, onay kayıtları, veri talepleri, ihlal
bildirimleri, takedown talepleri, saklama süresi, dışa aktarma, audit
log) **hiç kurulmadı**. Bu, `docs/06_ADMIN_PANEL_SCOPE_TR.md`'deki
madde 33/34 ile aynı boşluk. Gerekçe: (a) gerçek hukuki metin olmadan
bir versiyonlama sistemi kurmak anlamsız — önce içerik, sonra
versiyonlama altyapısı; (b) veri sahibi başvuru/silme akışı KVKK md.11
gereği gerçek bir süreç (kim onaylıyor, ne kadar sürede yanıtlanıyor)
gerektiriyor, bu bir ürün kararı, tahmin edilip kod yazılamaz.

## 5. Sonuç ve öncelik sırası

Bu, şartnamenin en büyük tek açık kalemi çünkü **teknik olarak
inşa edilebilecek kısım küçük, hukuki olarak onaylanması gereken kısım
büyük**:

1. **En kritik, en ucuz kazanım:** Mesafeli Satış Sözleşmesi + Ön
   Bilgilendirme Formu + Cayma/İptal/İade Politikası — gerçek bir
   e-ticaret akışı (Shopier) zaten canlı, bu üç belge olmadan mevcut
   satış süreci hukuki risk taşıyor.
2. **KVKK md.11 gereği zorunlu:** Veri Sahibi Başvuru Formu + admin
   panelinde veri talebi işleme akışı.
3. **Teknik olarak ucuz, henüz yapılmamış:** `LegalDocumentVersion`/
   `LegalAcceptance` şeması (`docs/05`'te taslak var) — versiyon+IP+
   user-agent+timestamp kaydı, hukuki metin onaylandıktan hemen sonra
   kurulabilir.
4. **Hukukçu onayı olmadan yapılamaz:** Mevcut 4 sayfanın içeriğinin
   nihai onayı, ETBİS/İYS uygulanabilirlik kararı, yurt dışı veri
   aktarımı KVKK md.9 uygunluğu.

Hiçbir hukuki metin bu oturumda uydurulmadı veya "tamamlandı" diye
işaretlenmedi — şartnamenin kendi kuralı gereği.
