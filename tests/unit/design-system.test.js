import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildSocialLinks } from '../../src/config/brand.js'
import { mergeDefined } from '../../src/utils/mergeDefined.js'

const ROOT = new URL('../../', import.meta.url)
const readRepo = (rel) => readFile(new URL(rel, ROOT), 'utf8')

/** Bir dizindeki tüm dosyaları (alt dizinler dahil) verir. */
async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }
  return out
}

// ── Poppins: tek font ailesi ───────────────────────────────────────────────

test('kade-tokens.css tek font kaynağıdır ve Poppins tanımlar', async () => {
  const css = await readRepo('src/styles/kade-tokens.css')
  assert.match(css, /--font-sans:\s*'Poppins'/, '--font-sans Poppins olmalı')
  assert.match(css, /font-display:\s*swap/, 'font-display: swap zorunlu')

  // Kullanılan 4 ağırlığın her biri latin ve latin-ext olarak tanımlı olmalı;
  // latin-ext olmadan ı/İ/ğ/ş glifleri fallback fonttan gelir.
  for (const weight of [400, 500, 600, 700]) {
    for (const subset of ['latin', 'latin-ext']) {
      assert.ok(
        css.includes(`/fonts/poppins/poppins-${weight}-${subset}.woff2`),
        `Poppins ${weight}/${subset} tanımı eksik`,
      )
    }
  }

  // Fallback zinciri sistem fontlarıyla bitmeli.
  assert.match(css, /--font-sans:[^;]*sans-serif;/, 'fallback zinciri sans-serif ile bitmeli')
})

test('Poppins woff2 dosyaları gerçekten mevcut ve makul boyutta', async () => {
  let total = 0
  for (const weight of [400, 500, 600, 700]) {
    for (const subset of ['latin', 'latin-ext']) {
      const path = new URL(`public/fonts/poppins/poppins-${weight}-${subset}.woff2`, ROOT)
      const info = await stat(path)
      assert.ok(info.size > 1000, `poppins-${weight}-${subset}.woff2 boş görünüyor`)
      total += info.size
    }
  }
  // Regresyon koruması: yanlışlıkla tam (subset'lenmemiş) dosya eklenirse yakalar.
  assert.ok(total < 200 * 1024, `Poppins toplamı çok büyük: ${(total / 1024).toFixed(0)} KB`)
})

test('form elemanları ve dialog fontu miras alır', async () => {
  const css = await readRepo('src/styles/kade-tokens.css')
  // Tarayıcı bu elemanlara kendi UA fontunu verir; açıkça inherit edilmezse
  // Poppins uygulanmaz.
  for (const selector of ['button', 'input', 'select', 'textarea', 'dialog', '::placeholder']) {
    assert.ok(css.includes(selector), `${selector} miras listesinde yok`)
  }
  assert.match(css, /font-family:\s*inherit;/, 'inherit kuralı bulunamadı')
})

test('kaynak CSS dosyalarında eski font aileleri kalmadı', async () => {
  const files = (await walk(new URL('src/', ROOT).pathname))
    .filter((f) => f.endsWith('.css'))
    .filter((f) => !f.includes('/embedded/')) // gömülü 3. taraf araç, ayrı kabuk

  const banned = ['TikTokSans', 'GeistMono', 'DepartureMono', 'Plus Jakarta Sans', 'Newsreader', 'Outfit']
  for (const file of files) {
    const css = await readFile(file, 'utf8')
    for (const family of banned) {
      // Yorum satırları hariç gerçek bildirimleri ara.
      const declarations = css
        .split('\n')
        .filter((line) => /font-family/.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('/*'))
        .join('\n')
      assert.ok(
        !declarations.includes(family),
        `${file.replace(new URL('.', ROOT).pathname, '')} içinde eski font: ${family}`,
      )
    }
  }
})

test('index.html Google Fonts yerine self-host Poppins preload eder', async () => {
  const html = await readRepo('index.html')
  assert.ok(!html.includes('fonts.googleapis.com'), 'Google Fonts stylesheet kaldırılmalı')
  assert.ok(html.includes('/fonts/poppins/poppins-400-latin.woff2'), 'Poppins 400 preload yok')
  assert.match(html, /rel="preload"[^>]*as="font"[^>]*crossorigin/, 'font preload crossorigin olmalı')
})

test('yabancı snapshot ve kökeni belirsiz varlıklar geri dönmemiştir', async () => {
  // `/` bir dönem başka bir projenin (haoqi.design) klonlanmış derlenmiş
  // çıktısıyla servis ediliyordu. Kanıt: 3 viewport'ta birebir örtüşen kart
  // yükseklikleri, kopyalanmış Figma plugin ID'leri ve snapshot kodundaki
  // "orijinal Haoqi imzası" yorumu. Paket ve ona bağlı varlıklar kaldırıldı;
  // bu test geri gelmediklerini korur.
  for (const path of [
    'public/site.html',
    'public/_next',
    'public/stickers',
    'public/sticker_img',
    'public/img/kade-hello-art.jpg',
    'public/model/cnt.gltf',
    'public/model/cnt.bin',
    'public/model/cursor.glb',
    'public/model/hello.gltf.orig',
    'scripts/apply-poppins-to-site.mjs',
    'scripts/patch-home-content.mjs',
    'scripts/sanitize-site-snapshot.mjs',
  ]) {
    await assert.rejects(stat(new URL(path, ROOT)), `${path} geri gelmiş`)
  }

  // `public/model/hello.*` ve `src/components/kade/` bilinçli olarak geri
  // getirildi: ana sayfanın cam "hello" objesi yayındaki tasarımın parçası ve
  // site sahibi bu görünümün korunmasını istedi. Yalnız BU iki varlık serbest;
  // yukarıdaki liste (imleç modeli, sticker setleri, ikinci sahne modeli)
  // hâlâ yasak. Klasörün tamamı serbest bırakılmasın diye içerik denetlenir.
  const modelDir = await readdir(new URL('public/model/', ROOT))
  assert.deepEqual(
    modelDir.filter((f) => !f.startsWith('.')).sort(),
    ['hello.bin', 'hello.gltf'],
    'public/model yalnız hello modelini içermeli',
  )
})

test('ana sayfa React uygulamasından servis edilir', async () => {
  // `/` daha önce başka bir Next.js projesinin minified statik snapshot'ına
  // rewrite ediliyordu. Snapshot ana sayfa ile iç sayfaları iki ayrı tasarım
  // sistemine bölüyor, ortak bileşen paylaşımını imkânsız kılıyor ve
  // hydration #418 hatası veriyordu.
  //
  // Bu test SERVİS yolunu doğrular. Snapshot DOSYALARININ silindiğini
  // doğrulayan ayrı bir test aşağıdadır; ikisi bilerek ayrı tutulur çünkü
  // "artık kullanılmıyor" ile "dosya kaldırıldı" farklı adımlardır.
  const vercel = JSON.parse(await readRepo('vercel.json'))
  const rootRewrite = (vercel.rewrites || []).find((rule) => rule.source === '/')
  assert.equal(rootRewrite, undefined, '`/` için rewrite tanımlı — ana sayfa React ön-render\'ı olmalı')

  const vite = await readRepo('vite.config.js')
  assert.doesNotMatch(vite, /site\.html/, 'dev sunucusu hâlâ site.html\'e yönlendiriyor')

  // Ana sayfa ön-render listesinde ve indekslenebilir olmalı.
  const generator = await readRepo('scripts/generate-static-routes.mjs')
  assert.match(generator, /\n\s*\['\/',/, 'ana sayfa ön-render rota listesinde yok')

  // React ana sayfası ortak bileşen sistemini kullanmalı ve yönlendirme yapmamalı.
  const home = await readRepo('src/pages/Home.jsx')
  assert.match(home, /from '\.\.\/components\/system'/, 'ana sayfa ortak bileşenleri kullanmalı')
  assert.doesNotMatch(home, /window\.location\.replace/, 'ana sayfa statik sayfaya yönlendirmemeli')

  // 3B sahne ana sayfada kullanılıyor (yayındaki tasarımın parçası), ama
  // BLOKLAYICI OLMAMALI: lazy yüklenmeli ki Three.js bundle'ı diğer 38 rotayı
  // ve ilk boyayı yavaşlatmasın, metin sahneyi beklemeden okunabilsin.
  assert.match(home, /lazy\(\s*\(\)\s*=>\s*import\(.*KadeScene/s, 'KadeScene lazy yüklenmeli')
  assert.match(home, /Suspense/, 'sahne Suspense ile sarılmalı')
})
test('hata, offline ve gömülü organizasyon kabukları da Poppins kullanır', async () => {
  for (const path of ['public/404.html', 'public/offline.html', 'src/embedded/kadir-organizasyon-kiti/styles.css']) {
    const source = await readRepo(path)
    assert.match(source, /Poppins/, `${path} Poppins kullanmalı`)
    assert.doesNotMatch(source, /fonts\.googleapis\.com|font-family:\s*Inter\b/, `${path} uzaktaki/eski fontu kullanmamalı`)
  }
})

test('takip edilen eski kök font dosyaları kaldırılmıştır', async () => {
  for (const path of ['fonts/DepartureMono-Regular.otf', 'fonts/GeistMono[wght].ttf', 'fonts/TikTokSans.ttf']) {
    await assert.rejects(stat(new URL(path, ROOT)), `${path} artık bulunmamalı`)
  }
})

test('üçüncü taraf hava durumu isteği ve gömülü anahtarı kaldırılmıştır', async () => {
  // Anahtar, kaldırılan snapshot bundle'ının içindeydi. Repoda hiçbir yerde
  // yeniden belirmediğini doğruluyoruz.
  const files = (await walk(new URL('src/', ROOT).pathname))
    .filter((file) => /\.(js|jsx|css|html)$/.test(file))
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    assert.doesNotMatch(source, /devapi\.qweather\.com|c6e1eaf8/, `${file} üçüncü taraf hava durumu anahtarı içeriyor`)
  }
})

test('tek reveal sistemi: otomatik katman ile bileşen aynı sınıfı paylaşmaz', async () => {
  // İkisi de `.kade-reveal` kullandığında specificity eşit kalıyor, en son
  // yüklenen CSS kazanıyor ve içerik kalıcı olarak opacity:0'da takılıyordu.
  const motion = await readRepo('src/styles/kade-motion.js')
  assert.match(motion, /kade-automotion/, 'otomatik katman kendi sınıfını kullanmalı')
  assert.doesNotMatch(motion, /classList\.add\('kade-reveal'\)/, 'otomatik katman bileşen sınıfını eklememeli')

  const legacyCss = await readRepo('src/styles/kade-yeni.css')
  assert.doesNotMatch(legacyCss, /\.kade-motion \.kade-reveal\b/, 'eski CSS bileşen sınıfını ezmemeli')

  // Bileşen tarafı: hareket kapalıyken içerik gizlenmemeli.
  const systemCss = await readRepo('src/components/system/system.css')
  assert.match(systemCss, /prefers-reduced-motion: reduce/, 'reveal reduced-motion desteklemeli')
  assert.match(systemCss, /opacity: 1 !important/, 'reduced-motion içeriği görünür yapmalı')
})

test('reveal observer eşiği sıfır: clip varyantı kendini kilitleyemez', async () => {
  // `clip` varyantı öğeyi `clip-path: inset(0 0 100%)` ile gizler. Bu,
  // IntersectionObserver'ın kesişim dikdörtgenini 0 px yüksekliğe indirir ve
  // intersectionRatio her zaman 0 olur. Sıfırdan büyük bir threshold o oranı
  // asla yakalayamaz: öğe ekranın tam ortasında dursa bile isIntersecting
  // false döner ve içerik kalıcı olarak görünmez kalır.
  //
  // Bu tam olarak yaşandı: ana sayfadaki <h1> mobilde hiç açılmadı, yalnız
  // 2,5 sn'lik güvenlik zamanlayıcısı sayesinde geç geldi. Kaydırma sonrası
  // ölçüm yaptığımız için "takılı öğe yok" raporu üretmişti.
  const reveal = await readRepo('src/components/system/Reveal.jsx')
  const threshold = reveal.match(/threshold:\s*([\d.]+)/)
  assert.ok(threshold, 'Reveal bir threshold tanımlamalı')
  assert.strictEqual(threshold[1], '0', 'threshold 0 olmalı — clip varyantı hiçbir pozitif eşiği geçemez')

  const systemCss = await readRepo('src/components/system/system.css')
  assert.match(systemCss, /\.kade-reveal--clip\s*\{[^}]*clip-path/, 'clip varyantı hâlâ clip-path kullanıyor olmalı')
})

// ── Tasarım tokenları ──────────────────────────────────────────────────────

test('tasarım tokenları eksiksiz tanımlı', async () => {
  const css = await readRepo('src/styles/kade-tokens.css')
  const required = [
    '--kade-gold', '--kade-ink', '--kade-canvas', '--kade-line',
    '--kade-success', '--kade-danger', '--kade-warning', '--kade-info',
    '--fs-base', '--fs-2xl', '--fw-semibold', '--lh-body',
    '--space-4', '--space-12', '--container-max', '--section-y',
    '--radius-md', '--radius-pill', '--shadow-md', '--shadow-focus',
    '--tap-min',
  ]
  for (const token of required) {
    assert.match(css, new RegExp(`${token}\\s*:`), `token eksik: ${token}`)
  }
})

test('mobil gövde fontu 15px altına düşmez', async () => {
  const css = await readRepo('src/styles/kade-tokens.css')
  const match = css.match(/--fs-base:\s*([\d.]+)rem/)
  assert.ok(match, '--fs-base tanımlı olmalı')
  assert.ok(Number(match[1]) * 16 >= 15, `--fs-base çok küçük: ${Number(match[1]) * 16}px`)
})

test('hareket azaltma tercihi destekleniyor', async () => {
  const css = await readRepo('src/styles/kade-tokens.css')
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})

// ── Admin ↔ public içerik bağlantısı ───────────────────────────────────────

test('mergeDefined boş admin alanlarının statik değeri silmesini engeller', () => {
  const base = { email: 'a@b.com', city: 'İstanbul', phone: '+90 500' }

  // Dolu alan üzerine yazar.
  assert.equal(mergeDefined(base, { email: 'yeni@b.com' }).email, 'yeni@b.com')

  // Boş/null/undefined ve boş dizi statik değeri KORUMALI — aksi hâlde
  // admin'de boş bırakılan bir alan siteden bilgiyi siler.
  assert.equal(mergeDefined(base, { email: '' }).email, 'a@b.com')
  assert.equal(mergeDefined(base, { email: '   ' }).email, 'a@b.com')
  assert.equal(mergeDefined(base, { email: null }).email, 'a@b.com')
  assert.equal(mergeDefined(base, { email: undefined }).email, 'a@b.com')
  assert.equal(mergeDefined(base, { city: [] }).city, 'İstanbul')

  // Dokunulmayan alanlar aynen kalır.
  assert.equal(mergeDefined(base, { email: 'x@y.z' }).phone, '+90 500')
})

test('footer sosyal medya linkleri yalnız güvenli http(s) adreslerini kabul eder', () => {
  const links = buildSocialLinks({
    instagram: 'https://instagram.com/kade',
    youtube: 'http://youtube.com/@kade',
    tiktok: 'javascript:alert(1)',        // XSS denemesi — elenmeli
    linkedin: 'not-a-url',                 // geçersiz — elenmeli
    whatsapp: '   ',                       // boş — elenmeli
  }, [])

  assert.deepEqual(links.map((l) => l.label), ['INSTAGRAM', 'YOUTUBE'])
  assert.ok(links.every((l) => /^https?:\/\//.test(l.href)))
})

test('footer statik ve admin linklerini birleştirir, tekrar etmez', () => {
  const links = buildSocialLinks(
    { instagram: 'https://instagram.com/adminden' },
    [{ label: 'INSTAGRAM', href: 'https://instagram.com/statikten' }],
  )
  // Statik liste öncelikli; aynı etiket iki kez eklenmez.
  assert.equal(links.length, 1)
  assert.equal(links[0].href, 'https://instagram.com/statikten')
})

test('Footer bileşeni admin içeriğini gerçekten okur', async () => {
  const source = await readRepo('src/components/Footer.jsx')
  // Regresyon koruması: bu bağlantı koparsa admin'de girilen iletişim ve
  // sosyal medya bilgisi sitede yine görünmez olur.
  assert.match(source, /useSiteContent\(\s*['"]footer['"]/, 'Footer admin içeriğini çekmeli')
  assert.match(source, /buildSocialLinks/, 'sosyal medya linkleri üretilmeli')
})

test('admin içerik sekmeleri public karşılığını bildirir', async () => {
  const source = await readRepo('src/pages/Admin.jsx')
  // Hedef sayfası olmayan editörler 'no-page' ile işaretlenmeli ki yönetici
  // hiçbir yere yansımayan bir ekranda "kaydedildi" bildirimiyle yanılmasın.
  for (const tabId of ['basin', 'nedenBiz', 'referralProgram', 'podcastWebinar', 'newsletterArchive', 'priceCalculator']) {
    const row = source.match(new RegExp(`\\{\\s*id:\\s*'${tabId}'[^}]*\\}`))
    assert.ok(row, `sekme bulunamadı: ${tabId}`)
    assert.match(row[0], /status:\s*'no-page'/, `${tabId} 'no-page' olarak işaretlenmeli`)
  }
  // Gerçekten canlı olan bölümler doğru işaretli olmalı.
  for (const tabId of ['services', 'faq', 'packages', 'about', 'footer', 'careers']) {
    const row = source.match(new RegExp(`\\{\\s*id:\\s*'${tabId}'[^}]*\\}`))
    assert.match(row[0], /status:\s*'live'/, `${tabId} 'live' olmalı`)
  }
})

// ── Görsel alanı ayrımı ────────────────────────────────────────────────────

test('emoji logolar <img src> olarak render edilmez', async () => {
  const { isImageSource, toBadgeText } = await import('../../src/utils/mediaValue.js')

  // Veritabanındaki gerçek partner değerleri emoji tutuyor.
  for (const emoji of ['🍕', '🌿', '👗', '🐾', '💪']) {
    assert.equal(isImageSource(emoji), false, `${emoji} görsel sayılmamalı`)
    assert.equal(toBadgeText(emoji, 'Flavora'), emoji)
  }

  // Gerçek görseller tanınmalı.
  assert.equal(isImageSource('https://cdn.example.com/logo.png'), true)
  assert.equal(isImageSource('/img/logo.svg'), true)
  assert.equal(isImageSource('data:image/png;base64,iVBORw0KGgo='), true)

  // Güvensiz şema reddedilmeli.
  assert.equal(isImageSource('javascript:alert(1)'), false)

  // Değer yoksa baş harfe düşülür.
  assert.equal(toBadgeText('', 'greenlife'), 'G')
  // Türkçe büyütme: 'ırmak' → 'I' (İngilizce kuralda da 'I', ama 'istanbul' → 'İ')
  assert.equal(toBadgeText(null, 'ırmak'), 'I')
  assert.equal(toBadgeText(null, 'istanbul'), 'İ')
})

test('PartnerDetail emoji/URL ayrımını kullanır', async () => {
  const source = await readRepo('src/pages/PartnerDetail.jsx')
  assert.match(source, /isImageSource\(partner\.logo\)/, 'logo alanı tür kontrolünden geçmeli')
})

// ── Merkezî tasarım sistemi: kaskad bütünlüğü ──────────────────────────────

/**
 * Yorumları siler. Aşağıdaki testler "şu şey KULLANILMAMALI" diye iddia
 * ediyor; açıklama satırlarında o şeyin adının geçmesi normaldir (neden
 * kaldırıldığını anlatır). Denetim koda uygulanmalı, düzyazıya değil.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')   // /* blok */ — hem CSS hem JS
    .replace(/^\s*\/\/.*$/gm, '')        // // satır
}
// Bu blok 30.07.2026 denetiminde bulunan ve düzeltilen sorunları kilitler.
// Görsel doğrulama (ekran görüntüsü/e2e) bu ortamda yapılamadığı için
// invariant'lar YAPISAL olarak korunur.

test('index.css tek palet bloğu tanımlar — ölü :root tekrarı geri gelmemeli', async () => {
  // Dosyada iki `:root` bloğu vardı. İlkinin 31 değişkeninden 28'i, aynı
  // dosyanın ilerisindeki `:root, [data-theme="light"]` bloğu tarafından
  // eziliyordu (16'sı birebir aynı değerle). Yani ölü koddu ve hangi değerin
  // yürürlükte olduğunu okumayı imkânsızlaştırıyordu.
  const css = await readRepo('src/index.css')

  const firstRoot = css.match(/^:root \{([\s\S]*?)^\}/m)
  assert.ok(firstRoot, 'index.css bir :root bloğu içermeli')

  const declared = [...firstRoot[1].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]).sort()
  assert.deepEqual(
    declared,
    ['--transition-fast', '--transition-normal', '--transition-slow'],
    'ilk :root yalnız benzersiz transition değişkenlerini tutmalı — palet tekrarı geri gelmiş',
  )
})

test('yasal sayfalar merkezi tokenları baypas etmez', async () => {
  const raw = await readRepo('src/pages/Legal.css')
  const css = stripComments(raw)

  // Eskiden [data-theme="light"] altında sabit hex kullanılıyordu; tema veya
  // marka tonu değiştiğinde bu dört sayfa eski renkte kalıyordu.
  assert.doesNotMatch(css, /#1A1715|#4A4540|#7A7570/i, 'Legal.css sabit hex renk içermemeli')
  assert.doesNotMatch(css, /\[data-theme="light"\]/, 'ayrı light-mode bloğu gerekmiyor — tokenlar tema ile değişir')

  // Kısa yasal metinlerde açıklanamayan boş dikey alan üretiyordu.
  assert.doesNotMatch(css, /min-height:\s*100vh/, 'min-height:100vh boş alan üretiyor, kaldırılmalı')

  // Renk ve ölçüler merkezi tokenlardan gelmeli.
  for (const token of ['--kade-ink', '--kade-line', '--space-', '--fs-', '--container-narrow']) {
    assert.ok(css.includes(token), `Legal.css ${token} kullanmalı`)
  }
})

test('yasal sayfalar toplu !important yamasına bağlı .glass-card kullanmaz', async () => {
  for (const page of ['KVKK', 'Gizlilik', 'CerezPolitikasi', 'TelifHaklari']) {
    const source = await readRepo(`src/pages/${page}.jsx`)
    assert.doesNotMatch(
      source,
      /className="legal-content glass-card"/,
      `${page}.jsx yüzeyini .glass-card'tan almamalı — Legal.css tokenlarla tanımlıyor`,
    )
  }
})

test('404 ile diğer hata sayfaları tek iskeleti paylaşır', async () => {
  // NotFound.jsx, ErrorStatePage'in neredeyse birebir kopyasıydı: ayrı
  // bileşen + `notfound-*` adıyla 125 satırlık ikinci bir CSS ailesi. İkisi
  // birlikte güncellenmediği için hata sayfaları zamanla ayrışıyordu.
  await assert.rejects(
    stat(new URL('src/pages/NotFound.css', ROOT)),
    'NotFound.css geri gelmiş — hata sayfası CSS ailesi tekrar ikiye bölünmüş',
  )

  const notFound = await readRepo('src/pages/NotFound.jsx')
  assert.match(notFound, /from '\.\.\/components\/ErrorStatePage'/, '404 ortak iskeleti kullanmalı')
  assert.doesNotMatch(stripComments(notFound), /notfound-/, 'eski CSS ailesi kalmamalı')

  // Ortak iskelet 404'ün ek içeriğini alabilmeli.
  const skeleton = await readRepo('src/components/ErrorStatePage.jsx')
  assert.match(skeleton, /children/, 'ErrorStatePage children almalı')
  assert.match(skeleton, /codeDisplay/, 'ErrorStatePage özel kod gösterimini desteklemeli')
})

test('hata sayfalarında dekoratif emoji kullanılmaz', async () => {
  // Marka dili editoryal; popüler sayfa etiketlerindeki 📋 💰 ❓ ✉️ generic
  // SaaS görünümü veriyordu.
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  for (const path of ['src/pages/NotFound.jsx', 'src/components/ErrorStatePage.jsx']) {
    const source = stripComments(await readRepo(path))
    assert.doesNotMatch(source, emoji, `${path} dekoratif emoji içermemeli`)
  }
})

test('sabit GİRİŞ butonu dar ekranda içeriğin üzerine binmez', async () => {
  // ÖLÇÜLDÜ (canlı, 500px, /sss): hap [394,599,90,39] `button.sss-soru`
  // akordiyon tetikleyicisini örtüyordu. Dar ekranda içerik tam genişlik
  // olduğu için yüzen hap kaçınılmaz olarak bir kontrolü kapatıyor.
  const css = await readRepo('src/components/Navbar.css')
  const mobileBlock = css.match(/@media \(max-width: 1024px\) \{([\s\S]*?)\n\}/)
  assert.ok(mobileBlock, 'Navbar.css ≤1024px bloğu içermeli')
  assert.match(
    mobileBlock[1],
    /\.knav-giris--float\s*\{\s*display:\s*none/,
    '≤1024px\'te yüzen GİRİŞ gizlenmeli',
  )

  // Erişim kaybolmamalı: mobil menüde karşılığı olmalı.
  const jsx = await readRepo('src/components/Navbar.jsx')
  assert.match(jsx, /knav-mlink--giris/, 'GİRİŞ mobil menüde erişilebilir kalmalı')
  assert.match(jsx, /knav-giris--float/, 'yüzen sürüm kendi modifier\'ını taşımalı')

  // Dokunma hedefi alt sınırı.
  assert.match(css, /\.knav-giris \{[\s\S]*?min-height:\s*var\(--tap-min/, 'GİRİŞ 44px dokunma hedefini karşılamalı')
})

test('istatistikler uydurma veya anlamsız placeholder göstermez', async () => {
  // /hakkimizda'da admin içeriği boşken üç istatistik kutusu da '—' basıyordu.
  const source = await readRepo('src/pages/About.jsx')
  assert.doesNotMatch(source, /\|\|\s*'—'/, "boş istatistik '—' ile doldurulmamalı")
  assert.match(source, /stats\.length > 0/, 'hiç veri yoksa istatistik şeridi hiç render edilmemeli')
})
