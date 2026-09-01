# Devam notu — tek dağıtım birleştirmesi

Bu dosya, işi devralan kişi (veya asistan) için yazıldı. Repo'da `birlestirme/tek-deployment`
dalındaki iş **tamamlandı ve yerelde doğrulandı**, ama **henüz canlıya çıkmadı**.

---

## 1. Sistem nasıl çalışıyor (bunu bilmeden dokunma)

Site **iki ayrı kod tabanından** besleniyor:

| Katman | Nerede | Ne servis ediyor |
|---|---|---|
| Statik klon | `haoqi-clone/` | Anasayfa + tüm pazarlama sayfaları |
| React uygulaması | `src/` | Giriş ekranları, müşteri paneli, admin, hata sayfaları |
| KadexAI | `apps/kadexai/` | `/kadexai/*` |

`npm run legacy:build` sırayla: vite build → `generate-static-routes` → `verify-build-integrity`
→ `haoqi-clone/scripts/build-static.mjs` → `scripts/merge-clone.mjs`. Son adım klon çıktısını
React çıktısının **üzerine yazar**; hangi rotanın hangi katmandan geldiği
`scripts/merge-clone.mjs` içindeki `PAGES` dizisiyle belirlenir.

**Canlı site:** Vercel `kadeertwo` takımı → `kadenewmedia` projesi. (`demirk314-3297` hesabındaki
`kademedia` projesi ile karıştırma — o domainsiz bir kopya.)
**GitHub:** `origin` = `ertwokade/KADENEWMEDIA`, dal `main`.

---

## 2. Tamamlanan iş

### 2a. Tasarım birleştirmesi (dal: `tasarim/kade-arayuz-birlesimi`, **canlıda**)

Tüm arayüzler tek zincire bağlandı:

```
styles/kade-tokens.css   → styles/kade-gate.css   → styles/kade-surface.css → sayfa CSS'leri
(marka tokenları)          (rol eşlemesi --gate-*)   (ürün yüzeyi kiti)
```

Kapsam: `/giris`, `/giris/danismanlik`, `/musteri-panel`, `/proje-takip`, `/organizasyon-kiti`
(+5 bölüm +plan), `/kade-kit-business`, `/@handle`, `/admin`, `/401 /403 /429 /bakim /404`,
KadexAI giriş ekranı, anasayfa sosyal ikonları.

Yol üstünde düzeltilen hatalar:
- `lazyWithRetry` (`src/utils/lazyWithRetry.js`) — lazy chunk gelmediğinde Suspense fallback'i
  sonsuza kadar dönüyordu; **her deploy'da** sekmesi açık ziyaretçiyi vuruyordu. 37 rotada.
- `/links`, `/kadelinks`, `/kadirdemir` doğrudan açıldığında 404 veriyordu → rewrite eklendi.
- Klon, `organizasyon-kiti` için var olmayan 11 alt sayfa tanıtıyordu (React'te bambaşka 6 bölüm
  var, hiç kesişmiyorlardı) → kabuklar `PAGES`'ten çıkarıldı.
- Ürün yüzeylerinden klon rotalarına giden 14 bağlantı `<Link>` idi ve aynı URL'yi React'in kendi
  kopyasıyla çiziyordu → `<a href>` yapıldı, doğru katman geliyor.
- Eski parlak sarı `#FFD400` global kurallarda duruyordu → marka altını `#e0a81f`.

### 2b. Tek dağıtım mimarisi (dal: `birlestirme/tek-deployment`, **canlıda DEĞİL**)

`/kadexai` artık ayrı projeye proxy'lenmiyor; Next.js uygulaması sitenin tamamını barındırıyor:

```
/kadexai/*  → apps/kadexai/app/kadexai/    (Next rotaları, 73 API route dahil)
/api/*     → apps/kadexai/pages/api/      (ana sitenin 30 route'u, DEĞİŞTİRİLMEDEN)
diğer      → apps/kadexai/public/         (statik site, build'de kopyalanır)
```

Kritik kararlar ve **neden**:

- **Next `basePath` kaldırıldı**, rotalar fiziksel olarak `app/kadexai/` altına taşındı.
  URL'ler birebir aynı kaldı → Google/Supabase'e kayıtlı OAuth redirect adresleri bozulmadı.
  basePath kalsaydı `/api/*` de `/kadexai` altına sıkışır, ana sitenin backend'i erişilemez olurdu.
- **Ana sitenin route modülleri `(req,res)` imzalı** → Next'in **Pages Router** API formatıyla
  birebir uyumlu. Adapter yazılmadı, modüller değiştirilmedi.
- **`/_next/` → `/_kade/`**: Klonlanan anasayfa da bir Next snapshot'ı ve chunk'larını `/_next/`
  altından çağırıyordu; o yol Next'in kendi çıktısına ait ve Vercel `public/_next`'i sunmuyor.
  Yol `kade-html-transform.mjs` + `build-static.mjs` + `public/site.html` + `public/_kade/`'de
  yeniden yazıldı.
  **Bunun tetiklediği sessiz hata:** klonun scriptleri "klonlanan Next uygulaması mı?" sorusunu
  `script[src*="/_next/"]` ile yanıtlıyordu. Yol değişince tespit `false` döndü, marka yaması
  bloğu atlandı, **anasayfa bomboş geldi**. `kade-brand.js`, `kade-access.js`, `kade-routes.js`
  içindeki 5 tespit iki yolu da tanıyacak şekilde güncellendi.
- **Fallback rewrite**: Next `public/` dosyalarını yalnız birebir adla sunar, `/giris` için
  `public/giris/index.html`'i bulmaz. `next.config.ts`'te `fallback` aşamasında rewrite eklendi.
- KadexAI'ın public varlıkları `public/kadexai/` altına alındı (`withBasePath()` zaten
  `/kadexai/...` üretiyordu).
- İki `vercel.json` birleşti → **`apps/kadexai/vercel.json`** (Root Directory orası olduğu için;
  repo kökündeki kopya silindi).

**Yerel doğrulama:** tek sunucudan `/`, `/giris`, `/giris/danismanlik`, `/hizmetler`,
`/musteri-panel`, `/kadexai/login` → 200. `/api/*` ana sitenin kendi yanıtını döndürüyor.
Anasayfa 3B "hello" dahil tam çiziliyor, 0 kırık kaynak. Lint + typecheck temiz, 46/46 test.

### 2c. Vercel ayarları (canlı projede **yapıldı**)

`kadeertwo/kadenewmedia` → Settings → Build and Deployment:
- Framework Preset: Next.js
- Build Command override: **kapatıldı** (vercel.json devralsın)
- Output Directory override: **kapatıldı**
- Root Directory: **`apps/kadexai`**
- "Include files outside the root directory": **Enabled**
- "Skip deployments…": **Disabled** ← Root Directory girilince Vercel bunu otomatik açtı;
  açık kalsaydı `src/` veya `haoqi-clone/` değişiklikleri deploy'u atlardı.

---

## 3. Yapılması gerekenler

### 3a. ÖNCE: KadexAI env değişkenleri (bloklayıcı)

Canlı proje ana sitenin değişkenlerine sahip (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`JWT_SECRET`, SMTP, SHOPIER, GA4, Upstash, `GEMINI_API_KEY`…) ama **KadexAI'ınkilere sahip değil**.

`apps/kadexai/scripts/validate-env.mjs` şunları **zorunlu** tutuyor — eksikse build patlar:

```
NEXT_PUBLIC_SUPABASE_URL     NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY            OPENAI_API_KEY
GROQ_API_KEY                 MISTRAL_API_KEY
CEREBRAS_API_KEY             OPENROUTER_API_KEY
GEMINI_API_KEY  ← zaten var
```

Ayrıca çalışma anında gerekenler: `KADEXAI_ADMIN_API_SECRET`, `KADE_TOKEN_ENCRYPTION_KEY`,
`KADE_OWNER_EMAIL(S)`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, Sentry (`SENTRY_DSN`,
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`), PostHog,
Google OAuth (`GOOGLE_OAUTH_*`), `RESEND_API_KEY`, `YOUTUBE_API_KEY`, `PAYMENT_*`.
Tam liste: `apps/kadexai/.env.example`.

**Bunlar `demirk314-3297/kadexai` projesinde ve "Sensitive" işaretli — okunamıyorlar.**
`vercel env pull` yerlerine `[SENSITIVE]` yazıyor. Kaynaklarından (Supabase paneli, ilgili AI
sağlayıcı panelleri) yeniden alınıp `kadeertwo/kadenewmedia` projesine elle girilmeleri gerekiyor.

`NEXT_PUBLIC_BASE_PATH` **girilmemeli** (varsayılan `/kadexai` doğru).

### 3b. SONRA: preview ile doğrula

```bash
npx vercel            # --prod YOK, preview üretir
```

Preview URL'de kontrol: `/` (anasayfa çizilmeli), `/giris`, `/giris/danismanlik`,
`/kadexai/login`, giriş yapıp `/musteri-panel` ve `/kadexai/dashboard`, `/api/auth?action=csrf`
(csrfToken dönmeli).

### 3c. EN SON: canlıya al

```bash
git checkout main
git merge birlestirme/tek-deployment
git push origin main
```

---

## 4. Bilinen açıklar / dokunulmayanlar

- **Anasayfadaki 3B "hello" objesi**: canvas kendi lacivert zeminini boyuyor, site temasını
  dinlemiyor (koyu temada siyahın üstünde lacivert kalıyor). Sahnenin "Light BG" `#ffead6` ve
  "Dark BG" `#2c4bd5` sabitleri bundle'da bulundu, ama renk tek sabitten gelmiyor — vignette,
  output, tint ve tail renkleri + CSS'teki `sepia(.55) saturate(1.5)` filtresi birlikte çalışıyor.
  `#000000` denendi, obje tamamen kayboldu (cam malzeme arkasındaki zemini kırıyor). Yama geri
  alındı, hero **dokunulmamış** halde. Kullanıcı "boş ver" dedi, ama sorun duruyor.
- **Gözle görülmeyen yüzeyler**: `/kade-kit-business`, `/@handle` ve KadexAI dashboard'unun içi
  gerçek veriyle görülmedi (yerelde giriş yapılamıyor). Kod doğru, build geçiyor, ama render
  edilmiş hâlleri doğrulanmadı.
- **KadexAI önizlemesi kaba çıkmıştı**: `kade-skin.css` önizlemesinde düzen bozuk göründü, çünkü
  gerçek bileşenlerdeki Tailwind sınıfları elle yeniden kurulamadı. Palet doğrulandı, yerleşim
  değil — ama yerleşime zaten dokunulmadı.
- **Klon rotalarının React kopyaları**: `Home.jsx`, `Services.jsx`, `Blog.jsx` vb. hâlâ derleniyor
  ve bundle'a giriyor. Canlıda sert gezinmede görünmüyorlar ama SPA içi gezinmede görünüyorlardı
  (bu yüzden 14 bağlantı `<a href>` yapıldı). Silinebilirler, ama önce hangi rotaların gerçekten
  React'ten servis edildiği doğrulanmalı.

---

## 5. Faydalı komutlar

```bash
npm run legacy:build                        # statik site + klon katmanı
node scripts/stage-static-into-next.mjs     # dist/ → apps/kadexai/public/
cd apps/kadexai && npm run build             # birleşik Next derlemesi
cd apps/kadexai && npx next start -p 3100    # birleşik sunucu (yerel test)
node haoqi-clone/server.mjs                 # yalnız klon, port 4180
```

Yerelde `.env` ve `apps/kadexai/.env.local` **placeholder** Supabase bilgileri taşıyor; bu yüzden
giriş yapılamıyor ve `/api/*` 503 döner. Bu beklenen davranış, hata değil.

---

## Adlandırma: KadeAI → KadexAI

`apps/kadeai/` → `apps/kadexai/`, `/kadeai/*` → `/kadexai/*`.

Eski yol kalıcı olarak yeni yola yönlendiriliyor (`vercel.json`), yani yer
imleri ve paylaşılmış bağlantılar kırılmıyor.

**Vercel'de elle yapılan ayar:** Root Directory `apps/kadeai` → `apps/kadexai`.
Bu ayar klasör adına bağlı olduğu için adlandırmadan sonra her dağıtım
"Error" veriyordu ve canlıya hiçbir şey çıkmıyordu. Aynı hata bir daha
olursa ilk bakılacak yer burasıdır.

**Hâlâ elle yapılması gereken:** Google OAuth ve Supabase'e kayıtlı dönüş
adresleri `/kadeai/...` olarak duruyor. OAuth sağlayıcıları kayıtlı adresi
birebir eşler ve yönlendirme İZLEMEZ; bu yüzden YouTube bağlantısı ve Google
ile giriş, adresler konsolda `/kadexai/...` olarak güncellenene kadar
çalışmaz.

## Arayüz toparlama (31 Ağustos 2026)

Yeniden adlandırma canlıya çıktı. Kök dizin `apps/kadexai` olarak
düzeltildikten sonra `b39559d`den beri düşen bütün dağıtımlar geçti;
`/kadexai/*` yayında, `/kadeai/*` kalıcı yönlendiriyor.

Toplanan tutarsızlıklar:

- **Genel Bakış** bir tanıtım açılış sayfasıydı (slogan, dev "AI" objesi,
  altında bütün araçları listeleyen kütüphane). O kütüphane sol menünün
  birebir kopyasıydı; aynı bağlantılar tek sayfada üç kez geçiyordu. Sayfa
  artık plan, dönem içi istek, kullanılan token ve son çalışmaları canlı
  veriden gösteriyor; gezinme sol menüde kaldı.
- **Sol menü** kategori başına ayrı renk kullanıyordu (mor, camgöbeği,
  turuncu, pembe, mavi, teal, kehribar). Tek marka vurgusuna indirildi.
- **Beş renk ailesi** (pembe, gül, mor, fuşya, lime) palet köprüsünün
  dışındaydı; dekoratif olanlar vurguya, anlamlı olanlar semantik renklere
  bağlandı. Platform rozetleri tersine, köprü yüzünden marka renklerini
  kaybetmişti; hex'e sabitlendi.
- **Operasyon Merkezi** KPI kartlarının üst şeridi kart başına ayrı renk
  kullanıyordu; tek vurguya indirildi.
- **Araç adları** hem kayıt defterinde hem geçmiş sayfasında ayrı ayrı
  tutuluyordu; tek kaynak kayıt defteri oldu.

Birleştirilen araçlar (toplam dört):

| Kaldırılan | Nereye | Neden |
|---|---|---|
| A/B Başlık Testi | Viral Skor | Aynı uca istek atıyordu |
| Trend Araştırması | Trend Radarı | Aynı iş |
| Performans Tahmini | Viral Skor | Aynı başlığı aynı 0-100 ölçeğinde puanlıyordu; çıktısında A/B alternatifleri bile üretiyordu |
| Analitik Dashboard | Sosyal Medya Analizi | İkisi de hesap metriklerinden büyüme önerisi çıkarıyordu |

Eski rotalar yönlendirme olarak duruyor, API uçları korundu.

## Kullanıcı ayrımı ve paket kısıtlaması (31 Ağustos 2026)

**Adresler.** Panel her kullanıcı için kendi adresinde açılıyor:
`/kadexai/<slug>/dashboard/...`. Slug bir yetki değil, yalnızca adres;
başkasının adresini yazan erişim kazanmaz, kendi alanına yönlendirilir.
Sahip adresi `kade`, hesaba `app_metadata` üzerinden atanmış durumda
(oraya yalnızca servis rolü yazabilir; kullanıcının yazabildiği
`user_metadata`'dan gelen `kade` reddediliyor).

Geçiş sırasında iki arıza çıktı, ikisi de canlıyı kırardı:

1. Yeniden adlandırmada tetikleyici eski isimli fonksiyona bağlı kalmış;
   herkese sabit `ana-calisma-alani` yazıyordu. Adres global benzersiz
   olunca **ikinci kayıttan itibaren hiç kimse kayıt olamazdı.** Sahte
   hesaplarla test edilip doğrulandı, hesaplar silindi.
2. TopBar modül rozeti hiç çalışmıyormuş: rotalar fiziksel olarak
   `/kadexai` altında olduğu için `/dashboard/operations` karşılaştırması
   hiçbir zaman tutmuyordu.

**Yetkiler.** `ertugyld@gmail.com` ve SSO admin hesabı (`kade`)
`app_metadata.kade_admin_role = 'admin'` taşıyor; ikisi de tam yetkili ve
Sınırsız pakete sahip. Sahip YETKİSİ ile sahip ADRESİ ayrı: admin rolü olan
hesaplar yetkilerini korur ama kendi adreslerinde açılır.

**Paket kısıtlaması.** Artık gerçek: görsel üretimi, toplu içerik, klip,
transkripsiyon ve altyazı çevirisi uçları paketi olmayana 402 döner.
Menüdeki kilit yalnızca işaret; sınır uçta.

Eşlemede kısıtlama açılsa ödeme yapan kullanıcıyı kesecek bir hata vardı:
araç başına tek özellik yazılmıştı, oysa Pro/Sınırsız'da `image-basic`,
Başlangıç'ta `video-factory` yok. Eşleme liste aldı, herhangi biri yeterli.
Üst paketin hiçbir aracı kaybetmediğini doğrulayan test eklendi.

Analiz ve metin araçları bilerek eşlenmedi: hangi pakete ait oldukları bir
fiyatlandırma kararı, uydurulmadı.

### thekademedia@gmail.com hesabına sahiplik (31 Ağustos 2026)

Hesap 31 Temmuz'da Google ile açılmış, hiçbir yetkisi yoktu. Diğer sahip
hesapları `kade_users` tablosundaki bir satıra bağlı (`app_metadata.
kade_admin_id`); o tabloda `password_hash` zorunlu olduğu için oraya satır
açmak bu hesaba admin paneli parolası üretmek demekti. Hesap zaten Google
ile giriyor, dolayısıyla doğru yol `KADE_OWNER_EMAILS`.

Değişken hiç tanımlı değilmiş — e-postayla sahiplik yolu bugüne kadar hiç
çalışmamış, tek yol admin rolüymüş. Vercel'e Config olarak eklendi.

Hesabın adresi `app_metadata.workspace_slug = 'thekademedia'` olarak
sabitlendi: sahip listesine girince `workspaceSlugForUser` ona da `kade`
vermek isteyecekti ve SSO hesabındaki `kade` ile çakışacaktı.

## "Karanlık altın" tasarım yönü (1 Eylül 2026)

Referans creato.digital/tr'nin dili: derin siyah zemin, yüzen yuvarlak
kabuk, iri + ince başlık, kart içi ürün vinyeti. Renk tamamen Kade
paletinde — mor/magenta gradyan yerine altın gradyan. Mor bilerek
alınmadı: hem palete yabancı hem de her AI sitesinde var.

Yön token katmanında yaşıyor; 49 araç sayfası ortak sınıfları kullandığı
için hiçbirine tek tek dokunulmadan geçtiler.

- Köşe ölçeği 0px → yumuşak ölçek. Arayüzün yassı görünmesinin ana sebebi.
- Koyu zemin #0f1111 → #0b0c0c. Kartların yüzdüğü hissi ancak zeminle
  yüzey arasında yeterli fark olunca oluşuyor.
- Çizgiler nötr gri → SICAK altın. İmza burada. Tailwind nötr rampı da
  ısıtıldı, yoksa kart kenarı soğuk kabuk kenarı sıcak kalıyordu.
- Zemindeki 1px ızgara → yumuşak altın hâle.
- Kenar çubuğu → yüzen yuvarlak rail. Üst çubuk → yüzen hap.
- Birincil düğmeler düz dolgu → gradyan + hâle + hap biçim.

Yol boyunca çıkanlar: uyarı şeridindeki düğme mürekkep rengine
sabitlenmişti (koyu zeminde beyaz kutu); devre dışı düğmelerde gradyanın
üstüne %50 opaklık çamur üretiyordu; koyu temada --kade-faint fazla soluk
kalıp 44 öğeyi 4.5 eşiğinin altına düşürmüştü. Üçü de düzeltildi.

Kontrast iki temada da temiz (kalan iki "düşük" ölçüm yanlış pozitif:
degradeyle boyanan başlıklar color:transparent olduğu için betik ölçemiyor).

Eksik kalan: kart içi vinyetler ve başlıklarda 300 ağırlık (yerel
Montserrat 400'den başlıyor, 300 istenirse font dosyası eklenmeli).
