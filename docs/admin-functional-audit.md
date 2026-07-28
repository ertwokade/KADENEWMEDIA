# Admin fonksiyonel ve API denetimi

Tarih: 28 Temmuz 2026
İncelenen ana bileşen: `src/pages/Admin.jsx` (yaklaşık 8.9 bin satır)

## Sonuç

Admin oturum sınırı, izin eşlemesi, temel CRUD istemcileri, içerik editörleri,
yükleme doğrulaması ve hata bildirimi incelendi. Bu turda production
veritabanına yazılmadı. Footer içerik CRUD'ının başarı ve 422 hata yolları
mock'lu Playwright ile masaüstü ve mobil projede doğrulandı.

## Düzeltilen fonksiyonel bulgular

| Alan | Önceki risk | Düzeltme |
|---|---|---|
| Kayıt silme/güncelleme | Dispatcher yalnız 24 karakter Mongo ObjectId kabul ediyor, Supabase UUID istekleri handler'a ulaşmadan 400 oluyordu | Query validator ObjectId + RFC uyumlu UUID kabul ediyor; birim testi eklendi |
| Pageview | Analytics insert hatası her sayfada 500/console hatası üretebiliyordu | Boş detail normalize edildi; analytics başarısızlığı sayfayı 500'e düşürmüyor |
| Content GET | Anonim sectionsız istek iç/admin içerik tablosunun tamamını açabiliyordu | Public section allow-list; diğer GET/all ve bütün PUT işlemleri permission ister |
| Section doğrulama | Yazım hatalı veya bilinmeyen section saklanabiliyordu | Bilinen section listesi ve plain-object data kontrolü |
| Site↔admin | Hizmet, SSS, hakkımızda/ekip, kariyer ve iletişim alanları admin verisini okumuyordu | Public hook + statik fallback ile canlı bağlandı |
| Hizmet rotaları | Admin keyfi kart ekleyerek karşılığı olmayan slug üretebiliyordu | Altı sabit hizmet slug'ı korunuyor; metin/özellik düzenleniyor |
| Partner logo | Emoji `<img src>` yapılıp 404 üretiyordu | URL/path/data ayrımı ve harf/emoji rozet fallback'i |
| Admin hook'ları | Link profili ve kısa link fetch effect'lerinde kararsız dependency uyarısı | `useCallback` ve doğru effect dependency'leri |
| Rapor export | Alanlar escape edilmeden HTML'e yazılıyor ve Arial kullanıyordu | HTML escape, güvenli dosya adı ve Poppins |
| Form/a11y | Footer label'ları input'a bağlı değildi; toast semantiği yoktu | `htmlFor/id`, `status/alert` live region |
| Hata yönetimi | CRUD testinde hata yolunun başarı gibi görünmesi otomatik korunmuyordu | Başarı payload'ı ve 422 mesajı için E2E regresyon testleri |
| Hata mesajı sızıntısı | Sunucudan gelen ham hata (ORM/sürücü/yığın izi) doğrudan ziyaretçiye basılıyordu | `src/utils/userMessage.js`: teknik desenler jenerik mesaja çevrilir, anlamlı doğrulama mesajları korunur |
| Admin mobil düzen | `.admin-main` 390 px ekranda 510 px'e çıkıyor, tüm panel yatay kayıyordu | Flex item'a `min-width: 0`; inline `gridTemplateColumns` mobilde tek sütuna indirildi |
| Modal erişilebilirliği | Dokuz modalda Escape, odak tuzağı, odak geri verme ve dialog semantiği yoktu | `src/hooks/useDialog.js` admin kökünde bir kez kurulur; `role="dialog"`, `aria-modal`, `aria-label="Kapat"` |
| Mobil menü | İkon-only düğmenin erişilebilir adı ve `aria-expanded` durumu yoktu | `aria-label`, `aria-expanded`, `aria-controls`; Escape ile kapanma; aktif bölümde `aria-current` |
| Renk kontrastı | Footer ikincil metni krem zeminde 2,97:1 — 11 sayfada WCAG AA ihlali | `--kade-ink-3` 0,55 → 0,62 alfa (5,2:1); token yorumunda her tonun ölçülen oranı belgelendi |

## Auth ve izin sınırı

- Oturum HTTP-only cookie/session endpoint'iyle doğrulanır; admin route client
  tarafında paneli göstermeden önce session sonucunu bekler.
- API dispatcher query whitelist, toplam query sınırı, request body boyutu,
  CSRF ve route allow-list uygular.
- Public POST istisnaları yalnız login/register, Shopier imzalı webhook,
  contact/newsletter ve public survey submit gibi açıkça listelenmiş akışlardır.
- Admin modülleri `requirePermission()` ile modül anahtarına göre korunur.
  Content, media, blog, partner, link profili ve kısa link yazmaları write
  yetkisi ister.
- Auth sınırı E2E testinde oturumsuz `/admin` ve `/musteri-panel` için
  doğrulanır.

## CRUD ve yükleme kapsamı

Blog, partner, link profili, kısa link, içerik, portfolio, mesaj, kullanıcı,
kupon, görev, teklif, fatura, medya ve diğer iç araçlar ortak `src/api.js`
istemcisini kullanır. Unsafe istekler CSRF token'ı ekler; 401 durumunda oturum
temizlenir; JSON olmayan/başarısız response kullanıcıya hata olarak döner.

Medya yükleme doğrulaması MIME beyanına güvenmez; dosya imzasını kontrol eder,
forged PNG ve script içeren SVG birim testte reddedilir. Boyut limiti dispatcher
katmanında da uygulanır.

## Test kanıtı

- Legacy lint: 0 hata, 0 uyarı.
- Birim test: 46/46 başarılı.
- Admin CRUD (`tests/e2e/admin-crud.spec.js`): 10/10 — liste, boş liste, silme
  onayı/iptali, silme sonrası liste tazeleme, silme hatası, modal açılış/kapanış,
  kısmi kayıtta veri kaybı olmaması, `no-page`/`static` uyarıları.
- Admin responsive (`tests/e2e/admin-responsive.spec.js`): 11/11 — 390/768/1440
  yatay taşma, tablo kaydırma, modal taşması ve Escape, sabit çubuk çakışması,
  dokunma hedefi boyutu.
- Form akışları (`tests/e2e/forms.spec.js`): 10/10 — KVKK zorunluluğu, e-posta ve
  uzunluk doğrulaması, Türkçe karakter bütünlüğü, `/tesekkur` yönlendirmesi,
  hata yolunda yanlış başarı olmaması, çift gönderim koruması, teknik hata sızıntısı.
- Erişilebilirlik (`tests/e2e/accessibility.spec.js`): axe-core WCAG 2.1 AA
  (wcag2a/2aa/21a/21aa) 13 rota + 4 mobil rota, 17/17 — serious/critical ihlal yok.
- Tam Playwright E2E: 186/186 başarılı, 2 atlandı (desktop + mobile Chromium).
- SEO ve Poppins doğrulayıcıları başarılı.
- Production build 38 rota giriş dosyasıyla başarılı.

## Kalan teknik borç ve sınırlar

1. `Admin.jsx` yaklaşık 8.9 bin satırlık tek dosyadır. Bölümler route-level
   lazy modüllere ayrılmadığı için admin chunk'ı yaklaşık 345 KB'dır.
   Fonksiyonel değişiklikten bağımsız bir refactor planı gerekir.
2. Mock'lu CRUD hata/başarı davranışını doğrular; gerçek Supabase, SMTP,
   Shopier, push ve dosya storage entegrasyonlarında bu turda production write
   testi yapılmadı. Admin kimlik bilgisi paylaşılmadığından 34 bölümün
   tamamı gerçek oturumla tek tek gezilmedi; yetki sınırı sunucu tarafında
   (tüm korumalı uçlar 401) ve E2E ile doğrulandı.
3. Public içerik hydration sonrasında admin verisini okur; SEO'nun ilk HTML
   yanıtına veritabanı içeriğini taşımak SSR/build-time fetch gerektirir.
4. Dinamik geçersiz slug'ların gerçek HTTP 404 vermesi statik SPA rewrite
   mimarisinin dışında sunucu tarafı çözüm gerektirir; ayrıntı
   `docs/route-audit.md` içindedir.
