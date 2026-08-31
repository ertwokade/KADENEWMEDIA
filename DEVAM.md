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
