# Analytics Event Şeması (şartname §32.16)

## Altyapı

- **Sağlayıcı:** Google Analytics 4 (`gtag.js`), Web Vitals (`src/utils/webVitals.js`)
- **Onay kapısı:** `src/utils/analytics.js`'teki `trackEvent()` her çağrıda `localStorage.getItem('cookie_consent') === 'accepted'` kontrolü yapıyor — onay yoksa **hiçbir event GA'ya gitmiyor**, `CookieBanner.jsx`'in kendisi de GA script'ini onaydan önce hiç yüklemiyor (çift güvenlik katmanı, bkz. `docs/08_LEGAL_COMPLIANCE_CHECKLIST_TR.md` §3).
- **Merkezi tanım dosyası:** `src/utils/analytics.js` — tüm event'ler `analytics.<isim>()` yardımcı fonksiyonları olarak tanımlı.

## Event kataloğu

| Event adı | Yardımcı fonksiyon | Kategori | Parametreler | Durum (bu turdan önce) |
|---|---|---|---|---|
| `form_submit` | `analytics.formSubmit(service)` | Lead | `event_label` | Bağlıydı — `Contact.jsx` |
| `cta_click` | `analytics.ctaClick(label, destination)` | CTA | `event_label`, `destination` | **Tanımlı ama hiçbir yerde çağrılmıyordu** |
| `whatsapp_click` | `analytics.whatsappClick(source)` | Contact | `event_label` | Tanımlı ama çağrılmıyordu — ayrıca public bir WhatsApp CTA'sı sitede yok (yalnızca admin panelde kullanılıyor), bu yüzden bağlanacak gerçek bir yer bulunamadı |
| `package_click` | `analytics.packageClick(packageName)` | Pricing | `event_label` | Tanımlı ama çağrılmıyordu — **bu turda `Packages.jsx`'teki "Teklif al" CTA'sına bağlandı** |
| `blog_read` | `analytics.blogRead(slug, title)` | Blog | `event_label`, `slug` | Tanımlıydı ama bağlanacağı `/blog/:slug` sayfası bir NotFound stub'ıydı — **bu turda hem sayfa gerçek hale getirildi hem event bağlandı** |
| `audit_start` / `audit_complete` | `analytics.auditStart()` / `auditComplete(score, company)` | Lead | — | Tanımlı ama bu turda karşılığı bir "ücretsiz denetim" akışı bulunamadı — muhtemelen eski/planlanan bir özellik, kod ölü |
| `map_directions` | `analytics.mapDirections()` | Engagement | — | Tanımlı ama çağrılmıyordu |
| `case_study_view` | `analytics.caseStudyView(partnerName)` | Engagement | `event_label` | Tanımlıydı ama bağlanacağı `/partnerler/:id` sayfası bir NotFound stub'ıydı — **bu turda hem sayfa gerçek hale getirildi hem event bağlandı** |
| `conversion` | (doğrudan `window.gtag`) | — | — | `Tesekkur.jsx`'te (teşekkür/dönüşüm sayfası) bağlı |
| Web Vitals (`CLS`/`FCP`/`LCP`/`TTFB`/`INP`) | `webVitals.js` | — | — | Bağlı, otomatik |

## Bu turda bulunan ve düzeltilen gerçek bir fonksiyonellik boşluğu

`src/pages/BlogDetail.jsx` ve `src/pages/PartnerDetail.jsx` her ikisi de
**tamamen `<NotFound />` döndüren stub dosyalardı** — yani `/blog/:slug`
ve `/partnerler/:id` altındaki HER URL 404 gösteriyordu, admin panelde
blog yazısı/partner oluşturmanın hiçbir public karşılığı yoktu. Daha da
önemlisi: bu oturumun önceki bir turunda (`server/api/sitemap.js`
düzeltmesi) sitemap'e tam olarak bu kırık URL'ler dinamik olarak
eklenmişti — yani sitemap fix'i kendi başına bir SEO riski yaratmıştı
(Google'ın 404 sayfalarını taraması). Her iki sayfa da gerçek CMS
API'lerine (`getBlogsApi`/`getPartnersApi`, ikisi de zaten iyi
tasarlanmış ve sanitize edilmiş) bağlanacak şekilde yeniden yazıldı;
zaten var olan ama kullanılmayan CSS (`Blog.css`/`Partners.css`'teki
`.blog-detail-*`/`.partner-detail-*` sınıfları) yeniden kullanıldı.

`Partners.jsx` (liste sayfası) bilinçli olarak **değiştirilmedi** —
şu an statik/küratörlü platform kartları gösteriyor, gerçek
`kade_partners` CMS kayıtlarını listelemiyor. Bu iki farklı kavram
olabilir (genel "çalıştığımız platformlar" vs. CMS'teki "vaka
çalışması" partnerleri) ve yanlış varsayımla listeyi değiştirmek
riskli olurdu — bu netleşene kadar yalnızca detay sayfası (zaten
sitemap'te referans verilen, doğrudan URL ile erişilebilir olması
gereken) düzeltildi.

## Açık kalan (bu turda ele alınmayan)

- `cta_click`/`mapDirections`/`whatsappClick`/`auditStart`/`auditComplete` hâlâ tanımlı ama çağrılmıyor — düşük öncelikli, gerçek bir kullanıcı yolculuğu haritası (funnel) çizilip hangi CTA'ların gerçekten ölçülmesi gerektiği netleşmeden mekanik olarak her yere event eklemek gürültü yaratır.
- `Partners.jsx` liste sayfasının gerçek CMS verisiyle mi yoksa statik içerikle mi kalacağı netleşmedi.
- Server-side event şeması (backend'de üretilen olaylar — örn. Shopier ödeme tamamlandı, teklif talebi oluşturuldu) bu belgenin kapsamı dışında; onlar zaten `kade_activity_log`'da tutuluyor (bkz. `docs/00` REQ-CODE-009).
