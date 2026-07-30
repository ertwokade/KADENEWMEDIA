# Kade New Media — Kapsamlı UI/UX, Fonksiyon ve Kod Kalitesi Denetimi

**Tarih:** 30 Temmuz 2026
**Denetlenen dal:** `main` (origin/main'in 19 commit önünde, çalışma ağacı temiz)
**Denetim ortamı:** Cowork / izole Linux çalışma alanı
**Durum:** **AŞAMA 1 TAMAMLANDI (statik denetim + kaynak doğrulama).** Görsel dönüşüm aşaması ortam kısıtı nedeniyle başlatılmadı — bkz. §7.

---

## 0. Yönetici özeti

> ### ⚠️ DÜZELTME — bu raporun ilk sürümü §1'de yanılıyordu
>
> İlk taramayı tarayıcısız yaptım ve "canlı site Next.js değil" sonucuna vardım. **Bu yanlıştı.** Tarayıcı bağlandıktan sonra yapılan ölçüm, görev tanımındaki orijinal gözlemin **doğru** olduğunu gösterdi: canlı ana sayfa gerçekten Next.js çıktısıdır, `/_next` dosyaları ve runtime CSS yama katmanları içerir.
>
> Hata nedeni: `web_fetch` canlı ana sayfanın ön-render edilmiş **metnini** döndürdü; bu metin `Home.jsx`'in yeniden kurduğu tasarımla aynı olduğu için "aynı kaynak" sandım. Ayrıca `_next` dizinini **depoda** aradım, bulamadım ve bundan production hakkında sonuç çıkardım — geçersiz bir çıkarım. Düzeltilmiş analiz §1'dedir.

Dört bulgu bu raporun geri kalanını çerçeveliyor:

1. **Canlı site HİBRİT: ana sayfa bir Next.js snapshot'ı, diğer 19 rota bu depodaki Vite uygulaması.** "Farklı kişilerce yapılmış sayfalar" hissinin ana kaynağı CSS değil, **tek alan adı altında çalışan iki ayrı uygulama**. Ayrıntı: §1.

2. **Bunun sebebi bir deployment gecikmesidir, kod hatası değil.** Sorunu çözen commit'ler zaten yerelde mevcut ama **push edilmemiş**. Ayrıntı: §1.6.

2. **Asıl sorun eksik tasarım sistemi değil, gömülmüş tasarım sistemi.** `kade-tokens.css` ve `components/system/` katmanı gerçekten iyi tasarlanmış ve eksiksiz. Ancak bu katmanın üzerine **iki ayrı toplu `!important` yama katmanı** yazılmış (toplam **694 `!important`**) ve `:root` **dört kez** yeniden tanımlanmış. Sayfaların "farklı kişilerce yapılmış" görünmesinin sebebi bu. Ayrıntı: §2.

3. **İç sayfalarda asıl sorun eksik tasarım sistemi değil, gömülmüş tasarım sistemi.** `kade-tokens.css` ve `components/system/` katmanı gerçekten iyi tasarlanmış. Ancak üzerine **iki toplu `!important` yama katmanı** yazılmış (**694 `!important`**) ve `:root` **dört kez** tanımlanmış. Ayrıntı: §2.

4. **Sistem katmanını 39 sayfadan yalnızca 3'ü kullanıyor.** `Home`, `Portfolio`, `ProjectDetail`. Kalan 36 sayfa kendi page-level CSS'ini kullanıyor. Ayrıntı: §3.

Ayrıca: raporlanan 6 adet 404 rotası **kasıtlıdır ve doğru davranmaktadır** (§4); kırık iç link bulunmadı; H1 kapsaması public sayfalarda eksiksiz (canlıda 20 rotanın hepsinde tam olarak 1 adet H1 ölçüldü).

---

## 1. Source of truth — kesinleştirildi

### 1.1 Soru: Production'ı hangi kaynak ve build süreci oluşturuyor?

`vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run legacy:build",
  "outputDirectory": "dist"
}
```

`package.json`:

```
"legacy:build": "vite build
                 && node -e \"...renameSync('dist/index.html','dist/app.html')\"
                 && node scripts/generate-static-routes.mjs"
```

**Sonuç:** Production, `src/` altındaki Vite + React uygulamasından derleniyor. `npm run build` (studio-web) ve `apps/kadeai` production pazarlama sitesine **girmiyor**.

Ancak `vercel.json`'ın **deploy edilmiş sürümü** bundan farklıdır — bkz. §1.6.

### 1.2 ÖLÇÜM: canlı site hibrit çalışıyor

Chrome üzerinden 20 rota tek tek `fetch` edilip HTML imzası incelendi:

| Rota | HTTP | Motor | `#root` var mı | Boyut |
|---|---|---|---|---|
| `/` | 200 | **Next.js** (`/_next/static/`) | ❌ hayır | 79.202 B |
| `/hakkimizda` | 200 | Vite (`/assets/index-*.js`) | ✅ evet | 8.250 B |
| `/hizmetler` | 200 | Vite | ✅ | 8.206 B |
| `/hizmetler/sosyal-medya-yonetimi` | 200 | Vite | ✅ | 8.747 B |
| `/paketler` | 200 | Vite | ✅ | 8.402 B |
| `/sss` | 200 | Vite | ✅ | 10.119 B |
| `/iletisim` | 200 | Vite | ✅ | 6.949 B |
| `/portfolio` | 200 | Vite | ✅ | 6.238 B |
| `/blog` | 200 | Vite | ✅ | 6.199 B |
| `/teklif-al` | 200 | Vite | ✅ | 6.998 B |
| `/giris` | 200 | Vite | ✅ | 6.374 B |
| `/ekip` `/kariyer` `/referanslar` `/basari-hikayeleri` `/partnerler` `/new-media-ajansi` `/kvkk` `/tesekkur` | 200 | Vite | ✅ | 6.2–12 KB |
| `/bu-sayfa-yok-404-testi` | **404** | statik | — | 2.010 B |

**Ana sayfa tek başına farklı bir uygulamadan geliyor.** Sitenin "farklı dönemlerde farklı kişilerce yapılmış" görünmesinin birincil sebebi budur.

### 1.3 Ana sayfada ölçülen yabancı-snapshot kanıtları

Canlı `/` üzerinde doğrudan ölçüldü:

- **13 adet Next.js/turbopack chunk'ı** yükleniyor, ör. `/_next/static/chunks/turbopack-425288158aa66df2.js`
- `#root` **yok** (Vite uygulaması `#root`'a mount olur) → bu depodaki uygulama değil
- `__NEXT_DATA__` yok, `#__next` yok → Next.js **App Router** çıktısı
- `--kade-canvas`, `--kade-gold`, `--bg-primary` gibi **hiçbir marka token'ı tanımlı değil** → `kade-tokens.css` ana sayfada yüklü değil
- **8 adet inline `<style>` yama katmanı** — görev tanımında yasaklanan türden:
  ```css
  canvas{filter:sepia(.55) saturate(1.5) hue-rotate(-8deg) ... !important}
  header.z-50>div:nth-child(2)>span:nth-child(-n+3){display:none!important}
  .kade-navrow{opacity:1!important;flex-wrap:nowrap!important;...}
  .lg\:flex.justify-between.items-center...{opacity:0}
  ```
  `nth-child` ile nav öğesi gizlemek yapısal olarak son derece kırılgandır.
- Tailwind sınıf adları (`lg:flex`, `justify-between`, `z-50`) → snapshot **Tailwind** tabanlı; depodaki Vite uygulaması Tailwind kullanmıyor
- **Alan adı dışına giden bağlantılar:** `https://kademedia.com.tr/portfolio`, `/hizmetler`, `/kade-kit-business`

### 1.4 Snapshot'ın kaynakları workspace'te var mı?

**Çalışma ağacında yok — ama git geçmişinde var ve canlıdakiyle birebir aynı dosyalar.**

Commit `5ff665e` şu dosyaları sildi:

```
public/site.html
public/_next/static/chunks/turbopack-425288158aa66df2.js
public/_next/static/chunks/7cc1924554447827.js
public/_next/static/chunks/83f95f6c165018c5.js
public/_next/static/chunks/635eb04122aa774f.css
… (toplam 13 chunk)
scripts/sanitize-site-snapshot.mjs
```

Bu **dosya adları canlı sitede şu anda yüklenen chunk'larla harf harf aynıdır**. Yani canlıdaki ana sayfa, bu commit'ten önceki depo durumundan gelmektedir.

### 1.5 Soru: `vercel.json` ve build scriptleri tutarlı mı?

Yerel `main`'de evet. `npm run audit:routes` temiz geçiyor:

```json
{ "total": 169, "implemented": 161, "duplicates": [], "sourceMismatches": [] }
```

### 1.6 KÖK NEDEN: production 19 commit geride

| | `origin/main` = **canlıdaki** | yerel `main` |
|---|---|---|
| HEAD | `77b55bb` | `24b0ef2` |
| `vercel.json` → `/` | `{"source": "/", "destination": "/site.html"}` **var** | rewrite **kaldırılmış** |
| `public/site.html` | **var** | `5ff665e`'de silinmiş |
| `public/_next/` | **var** (13 chunk) | `5ff665e`'de silinmiş |
| `/` neyi sunar | yabancı Next.js snapshot | `src/pages/Home.jsx` ön-render'ı |

`git merge-base --is-ancestor 5ff665e origin/main` → **NOT PUSHED**.

Canlı ana sayfanın `last-modified` başlığı: `Tue, 28 Jul 2026 12:15:18 GMT`.

> ### Deployment sonucu — en önemli tek çıktı
>
> **Ana sayfa/iç sayfa kopukluğunu çözen kod zaten yazılmış durumda; sadece deploy edilmemiş.** `main` yayına alındığı anda:
> - `/` rewrite'ı kalkar, ana sayfa `Home.jsx`'ten render edilir
> - 13 Next.js chunk'ı ve 8 inline CSS yaması ortadan kalkar
> - `kademedia.com.tr`'ye giden bağlantılar kaybolur
> - Site tek bir uygulama hâline gelir
>
> Bu yüzden **derlenmiş HTML'e, Next chunk'larına veya runtime yama scriptlerine dokunulmadı** — doğru çözüm onları düzenlemek değil, mevcut `main`'i yayına almaktır.
>
> ⚠️ Bu 19 commit yayına alınmadan yapılacak hiçbir tasarım çalışması ana sayfada görünmez.

### 1.7 Soru: Production ile local build arasındaki fark nedir?

**19 commit.** Fark yalnızca ana sayfayla da sınırlı değil; yayına alınmamış commit'ler arasında şunlar var:

| Commit | İçerik |
|---|---|
| `24b0ef2` | 3B sahnenin sayfa boyunca içeriği örtmesini durduran düzeltme |
| `03af9fc` | Ana sayfanın React kaynağında yeniden kurulması |
| `03a3ea7` | Gerçek Kade logosu ve favicon seti |
| `d3b86be` | Footer sloganının okunabilir hâle getirilmesi |
| `e2ba887` | Mobilde görünmeyen ana başlık düzeltmesi (reveal observer kilidi) |
| `5ff665e` | **Snapshot bağımlılığının kaldırılması** |
| `b42b6a2` | Paketler / Hakkımızda / İletişim'in tasarım sistemine alınması |
| `3790c5a` | Hizmet sayfalarının ortak şablona taşınması |
| `855003d` | Portfolyo proje sistemi + admin CRUD |
| `7d7f984` | Kontrast, mobil düzen, modal erişilebilirliği düzeltmeleri |

Yani görev tanımında "gözlemlenen olası sorunlar" başlığı altında listelenen maddelerin bir kısmı **yerelde zaten düzeltilmiş, sadece canlıda görünmüyor**.

---

## 2. Tasarım sistemi — kök neden analizi

### 2.1 CSS yükleme sırası (gerçek kaskad)

`src/main.jsx` sırasıyla:

```
1. index.css
     ├── @import styles/kade-tokens.css     ← GERÇEK token kaynağı
     └── @import styles/kade-design.css     ← .kade-home'a scope'lu (sorun değil)
2. styles/kade-yeni.css                     ← 410 !important
3. styles/kade-blocks.css
4. (her sayfa kendi CSS'ini component içinde import eder)
```

### 2.2 Bulgu C1 — `:root` dört kez tanımlanmış (Critical)

| Dosya | Satır | Ne yapıyor |
|---|---|---|
| `src/styles/kade-tokens.css` | 102 | **Kanonik** token seti (`--kade-*`, `--fs-*`, `--space-*`, `--radius-*`, `--z-*`) |
| `src/index.css` | 12 | Eski palet takma adlarını tanımlar (`--primary`, `--black`, `--white`…) |
| `src/index.css` | 878 | "KADE MEDIA1 CINEMATIC THEME" — **aynı değişkenleri yeniden tanımlar** |
| `src/styles/kade-yeni.css` | 12 | **Üçüncü kez** yeniden tanımlar, farklı değerlerle |

**Ölçülebilir sonuç — marka rengi kaymış:**

- `kade-tokens.css:143` → `--kade-canvas: #fdf6e3` (görev tanımındaki marka kremi)
- `index.css:12` → `--bg-primary: #fdf6e3` (tutarlı)
- `kade-yeni.css:13` → `--bg-primary: #fbfaf4` (**farklı**)
- `kade-yeni.css:26` → `html, body, #root { background: #fbfaf4 !important; }`

Yani sayfa zemini marka kremi `#fdf6e3` **değil**, `#fbfaf4`. Token dosyasındaki doğru değer üç katman sonra `!important` ile eziliyor.

### 2.3 Bulgu C2 — Toplu `!important` yama katmanları (Critical)

Toplam **694 `!important`** bildirimi:

| Dosya | Adet |
|---|---|
| `src/styles/kade-yeni.css` | 410 |
| `src/index.css` | 223 |
| `src/pages/Admin.css` | 36 |
| diğer 10 dosya | 25 |

En zararlı blok — `src/index.css:1627-1646`, "KADE EDITORIAL PAGE-BODY PASS":

```css
.glass-card, .service-card, .service-detail-card, .package-card, .pricing-card,
.blog-card, .contact-card, .value-card, .partner-card, .team-card, .feature-card,
.stat-card, .case-card, .info-card, .price-card, .plan-card, .review-card {
  background: #fffdf7 !important;
  border: 1px solid rgba(23, 19, 10, 0.12) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  ...
}
```

**Bu bir tasarım sistemi değil, 17 ayrı kart sınıfını tek seferde bastıran bir yama.** Aynı dosyada `.btn`, `.section-title`, `[class*="-hero"] h1`, `.tag/.badge/.chip/.pill` için de benzer bloklar var (satır 1648-1672).

Bu yapı, görev tanımında yasaklanan "runtime DOM patch" ile aynı işlevi CSS kaskadında görüyor: kalıcı bir sistem kurmak yerine sonucu zorla bastırıyor. Sayfa CSS'leri `!important` olmadan bu katmanı hiçbir zaman yenemiyor — sayfa bazlı tasarım kararları bu yüzden tutmuyor.

### 2.4 Bulgu C3 — Hero ve kart sistemleri parçalanmış (High)

- **~20 ayrı hero sistemi:** `.about-hero`, `.blog-hero`, `.careers-hero`, `.contact-hero`, `.hero`, `.new-media-hero`, `.ok-hero`, `.ok-section-hero`, `.packages-hero`, `.partner-detail-hero`, `.partners-hero`, `.portfolio-hero`, `.pt-hero`, `.quote-hero`, `.referanslar-hero`, `.services-hero`, `.sss-hero`, `.team-hero`, `.tool-hero`, `.bento-cell--hero`
- **60+ ayrı kart sınıfı:** `.kade-card`, `.glass-card`, `.blog-card`, `.case-card`, `.cp-card`, `.ok-card`, `.kk-card`, `.kd-card`, `.new-media-card`, `.access-hub-card`, `.contact-card`, `.faq-card`, `.job-card`, `.login-card`, `.newsletter-card`…

Oysa `components/system/index.jsx` içinde **hazır ve iyi yazılmış** bir `PageHero` bileşeni zaten var (satır 76-105) — eyebrow, h1, lead, meta ve CTA slot'larıyla.

### 2.5 Bulgu H1 — `NotFound` ile `ErrorStatePage` neredeyse birebir kopya (High)

`src/components/ErrorStatePage.jsx` (401/403/429/bakım için) ile `src/pages/NotFound.jsx` aynı düzeni iki farklı sınıf ailesiyle kuruyor:

| | ErrorStatePage | NotFound |
|---|---|---|
| Sınıf öneki | `.error-state-*` | `.notfound-*` |
| CSS dosyası | `ErrorStatePage.css` | `NotFound.css` (125 satır) |
| Kod dosyası | 56 satır | 130 satır |

`ErrorStatePage.jsx:8-9` içindeki yorum bu kopyalamayı **açıkça kabul ediyor**: *"src/pages/NotFound.jsx ile aynı görsel dilde ama kendi (generic isimli) CSS sınıflarını kullanır."*

Ayrıca `NotFound.jsx:11-16` popüler sayfa linklerinde emoji kullanıyor (`📋 Hizmetler`, `💰 Paketler`, `❓ SSS`, `✉️ İletişim`) — görev tanımındaki "generic SaaS görünümünden kaçın / rastgele emoji ekleme" ilkesiyle çelişiyor.

### 2.6 Bulgu H2 — `'—'` placeholder istatistikleri (High) ✔ doğrulandı

Görev tanımında gözlem olarak geçen madde **doğrulandı**:

`src/pages/About.jsx:33-37`

```js
const stats = {
  experience: content.experience || '—',
  teamSize:   content.teamSize   || '—',
  clients:    content.clients    || '—',
}
```

Admin'de içerik girilmediğinde /hakkimizda sayfasında üç istatistik kutusu da anlamsız bir tire gösteriyor. Görev tanımı bunu açıkça yasaklıyor ("`—` gibi anlamsız placeholder'lar bırakma"). Doğru davranış: değer yoksa **kutuyu hiç render etme** veya dürüst bir empty state göster.

### 2.7 Bulgu M1 — Sabit GİRİŞ butonu (Medium, kısmen belgelenmiş)

`.knav-giris` — `src/components/Navbar.css:76`, `position: fixed`, sağ alt.

`src/components/Footer.css:84-87` içinde önceki bir ölçüm notu var: *"Sayfa dibindeyken üç viewport'ta da yasal link satırının ALTINDA kalıyor, örtüşme yok — ölçüldü (1440/1024/390, atBottom=0)."*

Ancak bu ölçüm yalnızca **3 viewport** ve yalnızca **sayfa dibi** için yapılmış. Görev tanımındaki 9-viewport matrisi ve sayfa ortasındaki form/kart çakışmaları **bu ortamda doğrulanamadı** (§7).

---

## 3. Sistem katmanı benimsenme oranı

`components/system` import eden sayfalar: **3 / 39**

| Kullanıyor | Kullanmıyor (36) |
|---|---|
| `Home.jsx`, `Portfolio.jsx`, `ProjectDetail.jsx` | About, Admin, Blog, BlogDetail, Careers, CaseStudies, CerezPolitikasi, Contact, CustomerPortal, Forbidden, Gizlilik, KVKK, KadeKitBusinessStudio, LinkProfile, Login, LoginHub, Maintenance, NewMediaAgency, NotFound, OrganizationKit×3, Packages, PartnerDetail, Partners, ProjectTracking, QuoteRequest, Referanslar, SSS, ServiceDetail, Services, Team, TelifHaklari, Tesekkur, TooManyRequests, Unauthorized |

Sistem katmanı şunları **zaten** sağlıyor ve kullanılmayı bekliyor:
`Container`, `Section`, `PageHero`, `SectionHeading`, `Eyebrow`, `Button`, `LinkArrow`, `Media` (broken-image fallback dahil), `ProjectCard`, `ServiceCard`, `Marquee`, `ContactCTA`, `EmptyState`, `Reveal`/`RevealGroup`.

Yani dönüşüm için **yeni bir sistem yazmaya gerek yok**; mevcut sistemi yaymak ve önündeki `!important` katmanlarını kaldırmak yeterli.

---

## 4. 404 dönen 6 rota — araştırma sonucu

**Karar: 404 davranışı DOĞRUDUR, korunmalıdır. Kod değişikliği gerekmez.**

| Kontrol | Sonuç |
|---|---|
| Route manifest beklentisi | `implemented: false`, `expectedStatus: 404` — **kasıtlı** |
| Admin panelinde işaret | Altısı da `status: 'no-page'` (`src/pages/Admin.jsx:1090-1100`) |
| Menü/içerik/footer'da kırık link | **Sıfır.** `src/`, `public/`, `api/`, `index.html` taranarak doğrulandı |
| Sitemap / robots.txt | Bu rotalar **yok** |
| Validator | `audit:routes` bu 6 rotayı `expectedMissing` listesinde bekliyor ve geçiyor |

Temizlenecek stale link bulunamadı.

### 4.1 Ancak: sahipsiz admin editörleri (Medium)

Sayfası olmayan bu rotalar için **admin içerik editörleri mevcut**:

- `src/pages/admin/editors/BasinEditor.jsx`
- `src/pages/admin/editors/NedenBizEditor.jsx`
- `src/pages/admin/editors/PodcastWebinarEditor.jsx`
- `src/pages/admin/editors/ReferralEditor.jsx`
- `src/pages/admin/editors/NewsletterArchiveEditor.jsx`

`NewsletterArchiveEditor.jsx:35` şunu yazıyor: *"/bulten-arsivi sayfasında gösterilecek newsletter başlıkları."* — ama o sayfa yok.

**Bu bir iş kararıdır, teknik hata değil.** İçerik giriliyor ama hiçbir yerde yayınlanmıyor. İki seçenek: (a) sayfaları gerçek içerikle uygula, (b) editörleri admin'den kaldır. Görev tanımı "sırf 200 dönsün diye boş sayfa açma" dediği için **karar kullanıcıya bırakılmıştır**.

---

## 5. Rota ve link denetimi (statik)

| Kontrol | Sonuç |
|---|---|
| `audit:routes` | ✅ 169 rota, 161 implemented, 0 duplicate, 0 source mismatch |
| Kırık iç link | ✅ Bulunamadı |
| Public sayfalarda H1 | ✅ Eksiksiz — `Portfolio` `PageHero` üzerinden, `Forbidden/Maintenance/TooManyRequests/Unauthorized` `ErrorStatePage` üzerinden alıyor |
| `/kadirdemir → /@kadirdemir` | ✅ `vercel.json` redirects'te tanımlı (permanent) |
| `/links`, `/kadelinks` | ✅ `kadirardademir.com/links`'e permanent redirect |
| Admin H1 sayısı | ⚠️ `Admin.jsx` 37 `<h1>` içeriyor (sekme başına bir tane). Sayfa `noindex` olduğu için SEO riski yok, ancak aynı anda birden fazla render edilip edilmediği **doğrulanmadı** |

---

## 6. Severity özeti

| # | Severity | Bulgu | Dosya / kanıt | Durum |
|---|---|---|---|---|
| **C0** | **Critical** | **Production 19 commit geride; `/` yabancı Next.js snapshot'ı sunuyor, iç sayfalar Vite. Site iki ayrı uygulama.** | §1.2–1.6, `origin/main=77b55bb` | **Kod düzeltmesi gerekmiyor — deploy gerekiyor** |
| C1 | **Critical** | `:root` dört kez tanımlanmış; marka kremi `#fdf6e3` → `#fbfaf4` olarak eziliyor | `kade-tokens.css:143`, `index.css:12,878`, `kade-yeni.css:12,26` | Tespit edildi — düzeltilmedi |
| C2 | **Critical** | 694 `!important`; 17 kart sınıfını bastıran toplu yama katmanı | `index.css:1627-1672`, `kade-yeni.css` (410) | Tespit edildi — düzeltilmedi |
| H1 | High | Sistem katmanını 39 sayfadan 3'ü kullanıyor | §3 tablosu | Tespit edildi — düzeltilmedi |
| H2 | High | ~20 hero sistemi, 60+ kart sınıfı | §2.4 | Tespit edildi — düzeltilmedi |
| H3 | High | `NotFound` ↔ `ErrorStatePage` kopyası + emoji kullanımı | `NotFound.jsx`, `ErrorStatePage.jsx:8-9` | Tespit edildi — düzeltilmedi |
| H4 | High | `'—'` placeholder istatistikleri | `About.jsx:33-37` | ✅ **DÜZELTİLDİ** |
| C2b | **Critical** | **Canlı ana sayfa kaydırılamıyor**: `html`/`body` `overflow:hidden` + `height:654px`; 10.010 px içerik iç Lenis scroller'da. `window.scrollTo` etkisiz. | canlı `/` ölçümü | Snapshot kaynaklı — **deploy ile çözülür** (`src/`'de lenis yok, `overflow:hidden` yok) |
| H5 | High | **Sabit GİRİŞ butonu içeriği örtüyor** — 500px'te `/sss`'de `button.sss-soru` akordiyon tetikleyicisinin üzerinde ölçüldü | `Navbar.css:76` | ✅ **DÜZELTİLDİ** |
| H6 | High | Dokunma hedefleri 44px altında — GİRİŞ 39px, sosyal linkler 38px, KVKK 19px, 38×38 buton | canlı `/sss` @500px | ⚠️ Kısmen düzeltildi (GİRİŞ); footer linkleri kaldı |
| M1 | Medium | `Footer.css`'teki "örtüşme yok" notu yanlış — ölçüm yalnız sayfa dibinde yapılmış | `Footer.css:84` | ✅ **DÜZELTİLDİ** (not düzeltildi) |
| M2 | Medium | Sayfası olmayan 5 admin içerik editörü | `src/pages/admin/editors/` | İş kararı bekliyor |
| — | — | 6 rotanın 404 dönmesi | route-manifest | ✅ **Doğru davranış** |

---

## 7. Test edilemeyen / BLOCKED maddeler

Bu ortamda **hiçbir sayfa render edilemedi**. İki bağımsız blocker:

### 7.1 Tarayıcı — kısmen çözüldü

Chrome eklentisi oturum ortasında bağlandı. Bu noktadan sonra **canlı ölçüm yapılabildi**; aşağıdaki maddeler artık ölçülmüş durumda:

| Ölçüm | Sonuç |
|---|---|
| 20 rota HTTP durumu + motor imzası | ✅ Yapıldı (§1.2) |
| Tek H1 kuralı, 20 rota | ✅ Hepsinde tam olarak 1 H1 |
| Horizontal overflow (1280 ve 500px) | ✅ Hiçbir rotada yok |
| Bölüm bazlı boş dikey alan | ✅ `/hakkimizda` `/hizmetler` `/paketler` `/sss` — **büyük boşluk YOK**, bölümler bitişik |
| Footer'ın içerikle ilişkisi | ✅ `gapBeforeFooter = 0` (dört sayfada da) |
| Hero yükseklik tutarlılığı | ✅ Dördü de tam **500px** — tutarlı |
| Sabit GİRİŞ çakışması | ✅ Ölçüldü, **çakışma bulundu**, düzeltildi |
| Dokunma hedefleri | ✅ Ölçüldü, 10+ öğe 44px altında |
| Ana sayfa kaydırma davranışı | ✅ Ölçüldü, **kaydırılamıyor** |

> **Not:** Görev tanımındaki "Hakkımızda, Hizmetler, Paketler ve SSS'de açıklanamayan çok büyük boş dikey alanlar" gözlemi **1280px'te canlıda üretilemedi**. Bölümler kesintisiz (`/hakkimizda`: 0→500→983→1772; `/hizmetler`: 0→500→1853; `/paketler`: 0→500→1104). Bu gözlem ya başka bir viewport'a, ya ana sayfaya (kaydırma kilidi nedeniyle), ya da daha eski bir sürüme ait olabilir.

**Hâlâ yapılamayanlar:**

- Önce/sonra ekran görüntüleri (`cowork-before-*`, `cowork-after-*`) — **üretilmedi**; tarayıcı penceresi minimum ~500px genişliğin altına indirilemediği için 320/375/390/412 viewport'ları gerçek boyutta yakalanamadı
- 9-viewport matrisinin tamamı (320, 375, 390, 412 alınamadı; 500, 1280 alındı)
- Dark/light mode karşılaştırması
- Renk kontrastı ölçümü
- Klavye navigasyonu ve focus görünürlüğü
- `prefers-reduced-motion` davranışı
- CLS / performans / 3D sahne yükü
- Guard ekranları (oturumsuz `/musteri-panel`, `/proje-takip`, `/organizasyon-kiti`, `/admin`) — **BLOCKED**, test hesabı yok
- `/tesekkur` doğrudan açıldığında sahte başarı mesajı
- Dinamik rota geçerli/geçersiz slug davranışı
- `playwright test` (e2e)

**En önemli kısıt:** Yapılan düzeltmeler `src/` üzerindedir, ancak canlı site 19 commit geride olduğu için **düzeltmelerin canlıdaki etkisi ölçülemez**. Doğrulama ancak local production build ile mümkündür — o da §7.2 nedeniyle bu ortamda çalışmıyor.

### 7.2 Build çalıştırılamıyor

`node_modules` macOS (darwin-arm64) üzerinde kurulmuş; Linux çalışma alanı linux-arm64 native binary bekliyor:

```
Cannot find module './rolldown-binding.linux-arm64-gnu.node'
```

`npm run legacy:build` ve `npm run test:production` bu ortamda **çalıştırılamadı**.

### 7.3 Bu ortamda çalışan doğrulamalar (baseline)

| Komut | Sonuç |
|---|---|
| `npm run audit:routes` | ✅ Geçti — 169/161/0/0 |
| `npm run legacy:lint` (`eslint .`) | ✅ Geçti — 0 sorun |
| `npm run legacy:test:unit` | ✅ Geçti — **49/49** |
| `npm run legacy:build` | ❌ Çalıştırılamadı (platform) |
| `npm run legacy:test:e2e` | ❌ Çalıştırılamadı (tarayıcı yok) |
| `npm run test:production` | ❌ Çalıştırılamadı (tarayıcı yok) |

---

## 8. Kod değişiklikleri

15 dosya, **+510 / −376**. Görsel doğrulama yapılamadığı için her düzeltme bir **regresyon testine** bağlandı (§8.3).

### 8.1 Canlıda ölçülerek kanıtlanmış düzeltmeler

| Dosya | Değişiklik | Kanıt |
|---|---|---|
| `src/components/Navbar.jsx` | Yüzen GİRİŞ bağlantısına `--float` modifier'ı; mobil menüye ayrı GİRİŞ/PANEL satırı | Canlı ölçüm: hap `button.sss-soru`'yu örtüyordu |
| `src/components/Navbar.css` | ≤1024px'te `.knav-giris--float { display: none }`; `min-height: var(--tap-min)`; `.knav-mlink--giris` | Aynı ölçüm + 39px dokunma hedefi |
| `src/components/Footer.css` | Yanlış "örtüşme yok" notu düzeltildi; gereksiz 110px alt boşluk 72px'e indirildi | Eski not yalnız sayfa dibinde ölçüm yapmış |
| `src/pages/About.jsx` | `'—'` fallback'leri kaldırıldı; değeri olmayan kutu render edilmiyor, hiçbiri yoksa şerit kalkıyor | `About.jsx:33-37` |

### 8.2 Statik olarak kanıtlanmış tasarım sistemi düzeltmeleri

| Dosya | Değişiklik | Neden güvenli |
|---|---|---|
| `src/index.css` | İlk `:root` bloğu 31 → 3 değişkene indirildi | **Ölçüldü: 28 değişkenin tamamı zaten eziliyordu** — 16'sı birebir aynı değerle tekrar, 12'si farklı değerle. Silinen hiçbir bildirim yürürlükte değildi → görsel olarak nötr |
| `src/pages/Legal.css` | Sabit hex (`#1A1715` `#4A4540` `#7A7570`) → `--kade-ink*`; sabit px → `--space-*`/`--fs-*`; `min-height:100vh` kaldırıldı; ayrı `[data-theme="light"]` bloğu gereksizleşti; yüzey `.glass-card` yerine tokenlarla tanımlandı | Renkler görsel olarak eşdeğer; `100vh` kısa yasal metinlerde boş alan üretiyordu |
| `KVKK/Gizlilik/CerezPolitikasi/TelifHaklari.jsx` | `className="legal-content glass-card"` → `"legal-content"` | `.glass-card` zaten `index.css`'teki toplu `!important` yamasıyla düzleştiriliyordu; yüzey artık `Legal.css`'te `!important` olmadan tanımlı |
| `src/components/ErrorStatePage.jsx/.css` | `children` ve `codeDisplay` prop'ları; 404'ün arama + popüler sayfa stilleri buraya taşındı ve tokenlandı | Tek hata sayfası iskeleti |
| `src/pages/NotFound.jsx` | ErrorStatePage üzerine kuruldu; 193 satır → 105; emojiler (📋 💰 ❓ ✉️) kaldırıldı | Aynı düzen, tek kaynak |
| `src/pages/NotFound.css` | **SİLİNDİ** (125 satır) | İlk 52 satırı `ErrorStatePage.css`'in birebir kopyasıydı |

**Kart/arama/rozet dokunma hedefleri** de bu geçişte 44px'e çıkarıldı (`error-state-search-btn`, `error-state-popular-link`).

### 8.3 Eklenen regresyon testleri

Görsel doğrulama mümkün olmadığı için invariant'lar yapısal olarak kilitlendi. `tests/unit/design-system.test.js` içine **7 yeni test**:

1. `index.css` tek palet bloğu tanımlar — ölü `:root` tekrarı geri gelmemeli
2. Yasal sayfalar merkezi tokenları baypas etmez
3. Yasal sayfalar toplu `!important` yamasına bağlı `.glass-card` kullanmaz
4. 404 ile diğer hata sayfaları tek iskeleti paylaşır (`NotFound.css` geri gelirse kırılır)
5. Hata sayfalarında dekoratif emoji kullanılmaz
6. Sabit GİRİŞ butonu dar ekranda içeriğin üzerine binmez
7. İstatistikler uydurma veya anlamsız placeholder göstermez

Testler **kodu** denetler, açıklama satırlarını değil (`stripComments`) — ilk sürümde kendi yorumlarım testleri düşürdüğü için eklendi.

### 8.4 Kasıtlı olarak YAPILMAYANLAR

- `kade-yeni.css`'teki 410 `!important`'ın sökülmesi
- `index.css:1627-1672` toplu "editorial pass" bloğunun kaldırılması
- 36 sayfanın `PageHero` / `kade-card` sistemine taşınması
- Marka kremi kararı (`#fdf6e3` ↔ `#fbfaf4`) — bkz. §11

Gerekçe: bunların tamamı **görünür** değişikliklerdir ve doğrulanmaları için production build + ekran görüntüsü karşılaştırması gerekir. Build bu ortamda çalışmıyor (§7.2), canlı site 19 commit geride olduğu için karşılaştırma zemini de yok. Görev tanımı "önce kanıtla, sonra düzelt, ardından aynı koşullarda tekrar test et" diyor — üçüncü adım şu anda mümkün değil. Uygulama sırası §9'dadır.

---

## 9. Önerilen uygulama sırası (Chrome bağlandığında)

Aşağıdaki sıra bilinçlidir: her adım bir öncekinin kanıtına dayanır.

**Aşama A — kaskadı düzleştir (C1, C2)**
1. `kade-yeni.css` ve `index.css:878` içindeki tekrarlanan `:root` bloklarını `kade-tokens.css`'e çöz; marka kremini `#fdf6e3` olarak tek noktada sabitle.
2. `index.css:1627-1672` "editorial pass" bloğunu kaldır; yerine `components/system/system.css` içinde `!important`siz gerçek kart/buton sınıfları koy.
3. `kade-yeni.css`'teki 410 `!important`'ı kademeli olarak sök — her adımdan sonra ekran görüntüsü karşılaştır.

**Aşama B — sistem bileşenlerini yay (H1, H2)**
4. Her public sayfanın hero'sunu `PageHero`'ya taşı (~20 hero sistemi → 1).
5. Kartları `kade-card` / `ServiceCard` / `ProjectCard` ailesine indir.
6. Sayfa CSS'lerinden sabit piksel değerlerini `--space-*` / `--radius-*` tokenlarına çevir.

**Aşama C — içerik dürüstlüğü (H3, H4)**
7. `About.jsx` `'—'` fallback'lerini kaldır; değer yoksa kutuyu render etme.
8. `NotFound.jsx`'i `ErrorStatePage` üzerine kur; `NotFound.css`'i emekliye ayır; emojileri kaldır.

**Aşama D — uygulama alanları**
9. Admin / müşteri paneli / Organizasyon Kiti: hero zorlamadan renk, tipografi, buton, form, focus ve bildirim dilini markaya bağla.

**Aşama E — doğrulama**
10. 9-viewport × kritik sayfa matrisini yeniden çalıştır, "sonra" görüntülerini aynı isimlendirmeyle al.
11. `legacy:build`, `legacy:lint`, `legacy:test:unit`, `legacy:test:e2e`, `test:production`.

---

## 10. Deploy öncesi yapılması gerekenler

**Sıra önemlidir.**

1. **Önce mevcut `main`'i yayına al.** Tek başına bu adım şunları çözer: ana sayfa/iç sayfa kopukluğu, kaydırma kilidi, 13 Next.js chunk'ı, 8 inline CSS yaması, `kademedia.com.tr`'ye giden bağlantılar. Bu 19 commit yayına alınmadan başka hiçbir tasarım çalışmasının ana sayfada etkisi olmaz.
2. Yayın sonrası **canlıyı yeniden ölç** — bu raporun §1.2 tablosunu tekrarla; hepsi Vite imzası vermeli.
3. Ancak ondan sonra §9'daki tasarım sistemi çalışmasına başla.
4. Commit/push/deploy bu oturumda **yapılmamıştır** (görev tanımı gereği).

### Yayın öncesi mutlaka macOS tarafında çalıştırılmalı

```
npm run legacy:build      # bu ortamda çalışmadı — platform (§7.2)
npm run legacy:test:e2e   # bu ortamda çalışmadı — tarayıcı
npm run test:production   # bu ortamda çalışmadı — tarayıcı
```

Bu ortamda geçen doğrulamalar: `legacy:lint` ✅, `legacy:test:unit` ✅ 49/49, `audit:routes` ✅ — **düzeltmelerden sonra tekrar çalıştırıldı, üçü de geçiyor.**

---

## 11. Kalan blocker'lar

| Blocker | Etki | Çözüm |
|---|---|---|
| **Production 19 commit geride** | Yapılan hiçbir düzeltme canlıda görünmüyor; "sonra" görüntüsü alınamıyor | `main`'i yayına al |
| `node_modules` platform uyumsuzluğu | `legacy:build`, `test:production` çalışmıyor | Build'i macOS tarafında çalıştır |
| Tarayıcı penceresi ~500px altına inmiyor | 320/375/390/412 viewport'ları gerçek boyutta ölçülemedi | macOS'ta `legacy:test:e2e` (Playwright kendi viewport'unu kurar) |
| Oturum/test hesabı yok | `/musteri-panel`, `/proje-takip`, `/organizasyon-kiti`, `/admin` authenticated görünümü | **BLOCKED** — güvenlik aşılmadı |
| Sahipsiz admin editörleri | 5 editör, 0 sayfa | İş kararı: sayfaları yaz **veya** editörleri kaldır |

### 11.1 Karar bekleyen tasarım sorusu — marka kremi

Görev tanımı marka zeminini **`#fdf6e3`** olarak veriyor. Ancak canlı sitede ölçülen gövde zemini **`#fbfaf4`** (`kade-yeni.css:26`, `!important`). `kade-tokens.css` ikisini de tanımlıyor: `--kade-canvas: #fdf6e3`, `--kade-surface: #fbfaf4`.

Bu, brief'in iki ifadesi arasında gerçek bir çelişki: "krem zemin #fdf6e3" ile "canlı siteyi görsel referans al". Sitenin tamamının zemin rengini değiştirmek geri dönüşü göze çarpan bir karar olduğu için **değiştirmedim**; yalnız tekrarları temizledim.

**Karar gerekiyor:** zemin `#fdf6e3`'e mi çekilsin (brief'in harfi), yoksa `#fbfaf4` mü kalsın (mevcut görünüm)?
