#!/usr/bin/env node
/**
 * SEO değişmezleri doğrulayıcı — üretim build'i (dist/) üzerinde çalışır.
 *
 * Bu kurallar sitenin doğrulanmış davranışıdır; bir arayüz değişikliği
 * bunları sessizce bozarsa indekslenme kaybedilir. Script her kuralı
 * üretilmiş çıktıdan okur, kaynak koddan varsayım yapmaz.
 *
 * Kullanım:  npm run legacy:build && node scripts/verify-seo-invariants.mjs
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const BASE = 'https://kadenewmedia.com'

const INDEXABLE = [
  // Ana sayfa artık React uygulamasından ön-render edilir (dist/index.html).
  '/',
  '/hakkimizda', '/hizmetler', '/new-media-ajansi', '/paketler', '/sss', '/ekip',
  '/kariyer', '/iletisim', '/teklif-al', '/kvkk', '/gizlilik', '/cerez-politikasi',
  '/telif-haklari',
  '/hizmetler/sosyal-medya-yonetimi', '/hizmetler/icerik-uretimi',
  '/hizmetler/reklam-yonetimi', '/hizmetler/video-produksiyon',
  '/hizmetler/strateji-danismanlik', '/hizmetler/web-sitesi-tasarimi',
]

// Herkese açık ama indekslenmemesi gereken sayfalar.
const PUBLIC_NOINDEX = ['/blog', '/portfolio', '/partnerler', '/referanslar', '/basari-hikayeleri']

// Oturum gerektiren alanlar — noindex olmalı ve robots.txt'de engellenmeli.
const PROTECTED = [
  '/admin', '/musteri-panel', '/proje-takip', '/kade-kit-business',
  '/organizasyon-kiti', '/giris', '/giris/danismanlik', '/tesekkur',
]

const failures = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => { failures.push(msg); console.error(`  ✗ ${msg}`) }

const read = (route) => readFile(route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html'), 'utf8')
const tag = (html, re) => (html.match(re) || [])[1] || null

const robotsOf = (html) => tag(html, /<meta name="robots" content="([^"]*)"/)
const canonicalOf = (html) => tag(html, /<link rel="canonical" href="([^"]*)"/)

console.log('\n── İndekslenen sayfalar (ön-render + canonical + robots) ──')
for (const route of INDEXABLE) {
  let html
  try { html = await read(route) } catch { fail(`${route}: ön-render dosyası üretilmedi`); continue }

  const robots = robotsOf(html)
  const canonical = canonicalOf(html)

  if (robots !== 'index, follow') fail(`${route}: robots "${robots}" (beklenen "index, follow")`)
  else if (canonical !== `${BASE}${route}`) fail(`${route}: canonical "${canonical}"`)
  else if ((html.match(/<link rel="canonical"/g) || []).length !== 1) fail(`${route}: birden fazla canonical`)
  else if (!/<h1[^>]*>/.test(html)) fail(`${route}: ön-render çıktısında h1 yok`)
  else ok(route)
}

console.log('\n── Herkese açık noindex sayfalar ──')
for (const route of PUBLIC_NOINDEX) {
  let html
  try { html = await read(route) } catch { fail(`${route}: ön-render dosyası üretilmedi`); continue }
  const robots = robotsOf(html)
  // `follow` korunmalı: bu sayfalar indekslenmesin ama üzerlerindeki
  // bağlantılar (ör. /partnerler → /partnerler/:id) taranabilir kalsın.
  if (robots !== 'noindex, follow') fail(`${route}: robots "${robots}" (beklenen "noindex, follow")`)
  else ok(`${route} → noindex, follow`)
}

console.log('\n── Korumalı alanlar ──')
const robotsTxt = await readFile(join(DIST, 'robots.txt'), 'utf8')
for (const route of PROTECTED) {
  let html
  try { html = await read(route) } catch { fail(`${route}: ön-render dosyası üretilmedi`); continue }
  const robots = robotsOf(html)
  // robots.txt yolları ön ek olarak eşleşir: `Disallow: /giris`
  // `/giris/danismanlik`'i de kapsar. Bu yüzden tam eşleşme değil,
  // rotayı kapsayan HERHANGİ bir ön ek aranır.
  const covered = robotsTxt
    .split('\n')
    .filter((line) => line.trim().startsWith('Disallow:'))
    .map((line) => line.split(':')[1].trim())
    .some((prefix) => prefix && route.startsWith(prefix))

  if (!robots?.startsWith('noindex')) fail(`${route}: robots "${robots}" — noindex olmalı`)
  else if (!covered) fail(`${route}: robots.txt hiçbir Disallow ön ekiyle kapsanmıyor`)
  else ok(`${route} → noindex + robots.txt Disallow`)
}

console.log('\n── SPA kabukları taranmamalı ──')
// site.html snapshot'ı kaldırıldı; yalnız app.html kabuğu kaldı.
if (robotsTxt.includes('Disallow: /app.html')) ok('robots.txt Disallow /app.html')
else fail('robots.txt /app.html engellemiyor — alt sayfaların kopyası olarak indekslenir')

console.log('\n── app.html: dinamik rotalara servis edilen kabuk ──')
const appShell = await readFile(join(DIST, 'app.html'), 'utf8')
if (/<link rel="canonical"/.test(appShell)) {
  fail('app.html sabit canonical içeriyor — TÜM dinamik rotalar kendini o sayfanın kopyası ilan eder')
} else {
  ok('app.html sabit canonical içermiyor (canonical runtime\'da useSEO ile kurulur)')
}

console.log('\n── Sitemap ──')
const { STATIC_PAGES } = await import('../server/api/sitemap.js')
const locs = STATIC_PAGES.map((p) => p.loc)

for (const route of INDEXABLE) {
  if (!locs.includes(route)) fail(`sitemap eksik: ${route}`)
}
if (INDEXABLE.every((r) => locs.includes(r))) ok(`${INDEXABLE.length} indekslenebilir sayfanın tamamı sitemap'te`)

for (const route of [...PUBLIC_NOINDEX, ...PROTECTED]) {
  if (locs.includes(route)) fail(`sitemap'te olmamalı: ${route}`)
}
ok('noindex ve korumalı sayfalar sitemap dışında')

// Sitemap toplamı: 20 statik indekslenebilir sayfa (ana sayfa + 19).
if (locs.length !== INDEXABLE.length) {
  fail(`sitemap statik sayfa sayısı ${locs.length}, beklenen ${INDEXABLE.length}`)
} else {
  ok(`sitemap ${locs.length} statik sayfa içeriyor`)
}

console.log('\n── Redirect ve rewrite yapılandırması ──')
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))

const expectedRedirects = {
  '/kadirdemir': '/@kadirdemir',
  '/links': 'https://kadirardademir.com/links',
  '/kadelinks': 'https://kadirardademir.com/links',
  '/kadelinks/:path*': 'https://kadirardademir.com/links',
}
for (const [source, destination] of Object.entries(expectedRedirects)) {
  const rule = vercel.redirects?.find((r) => r.source === source)
  if (!rule) fail(`redirect eksik: ${source}`)
  else if (rule.destination !== destination) fail(`${source} hedefi değişmiş: ${rule.destination}`)
  else if (rule.permanent !== true) fail(`${source} kalıcı redirect olmalı`)
  else ok(`${source} → ${destination} (kalıcı)`)
}

// Blanket SPA rewrite koruması: `/(.*)` veya `/:path*` gibi bir kural,
// bilinmeyen TÜM URL'lerin 404 yerine indekslenebilir HTTP 200 dönmesine
// yol açar. Bu, daha önce yaşanmış ve düzeltilmiş bir regresyondur.
const blanket = (vercel.rewrites || []).filter((r) =>
  /^\/(\(\.\*\)|:path\*|\(\.\*\))$/.test(r.source) || r.source === '/(.*)')
if (blanket.length) {
  fail(`blanket SPA rewrite bulundu: ${blanket.map((r) => r.source).join(', ')}`)
} else {
  ok('blanket SPA rewrite yok — bilinmeyen URL\'ler 404 döner')
}

// Dinamik rota rewrite'ları serve-dist.mjs ile aynı olmalı; yoksa yerel
// doğrulama production'dan farklı davranır.
const dynamicSources = (vercel.rewrites || [])
  .filter((r) => r.destination === '/app.html')
  .map((r) => r.source)
  .sort()
const expectedDynamic = ['/401', '/403', '/429', '/@:handle', '/bakim', '/blog/:slug', '/partnerler/:id', '/s/:slug'].sort()
if (JSON.stringify(dynamicSources) !== JSON.stringify(expectedDynamic)) {
  fail(`app.html rewrite listesi değişmiş:\n      var: ${dynamicSources.join(', ')}\n      bekl: ${expectedDynamic.join(', ')}`)
} else {
  ok(`${dynamicSources.length} dinamik rota app.html'e yönlendiriliyor`)
}

console.log('\n' + '─'.repeat(64))
if (failures.length) {
  console.error(`SEO doğrulaması BAŞARISIZ — ${failures.length} sorun`)
  process.exit(1)
}
console.log('SEO doğrulaması BAŞARILI — tüm değişmezler korunuyor.')
