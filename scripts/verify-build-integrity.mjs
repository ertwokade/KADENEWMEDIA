#!/usr/bin/env node
/**
 * Build bütünlüğü doğrulayıcı — üretim çıktısı (dist/) üzerinde çalışır.
 *
 * İki regresyonu kalıcı olarak kilitler:
 *
 *  1) Geçici "coming soon" kabuğu eksiksiz çıksın. Ana sayfa ve public
 *     pazarlama rotaları aynı statik kabuktan; giriş/admin/portal gibi uygulama
 *     rotaları React bundle'ından gelir. Arama motoru engeli, logo varlığı ve
 *     iki fiziksel ana sayfa çıktısının eşitliği burada doğrulanır.
 *
 *  2) Tasarım token katmanı bundle'a girsin. src/styles/kade-tokens.css tek
 *     doğruluk kaynağı; bir import zinciri kopar da token'lar üretilen CSS'e
 *     ulaşmazsa site sessizce tarayıcı varsayılanlarına düşer.
 *
 * Kullanım:  npm run legacy:build   (build sonunda otomatik koşar)
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const failures = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => { failures.push(msg); console.error(`  ✗ ${msg}`) }

/** dist altındaki tüm dosyaları (alt dizinler dahil) verir. */
async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }
  return out
}

const exists = (path) => stat(path).then(() => true, () => false)

const files = await walk(DIST)
const rel = (path) => path.slice(DIST.length)
const htmlFiles = files.filter((f) => f.endsWith('.html'))
const cssFiles = files.filter((f) => f.endsWith('.css'))

// ── 1. Coming soon kabuğu ──────────────────────────────────────────────────

console.log('\nComing soon kabuğu kontrolü')

const SNAPSHOT = join(DIST, 'site.html')
const INDEX = join(DIST, 'index.html')
const snapshotHtml = (await exists(SNAPSHOT)) ? await readFile(SNAPSHOT, 'utf8') : null
const indexHtml = (await exists(INDEX)) ? await readFile(INDEX, 'utf8') : null

if (!snapshotHtml) {
  fail('dist/site.html yok — coming soon kabuğu build çıktısına girmemiş')
} else {
  ok('dist/site.html üretilmiş')

  if (!/data-coming-soon/.test(snapshotHtml)) fail('dist/site.html: coming soon işareti yok')
  else ok('coming soon işareti yerinde')

  if (!/src="\/kade-coming-soon-icon\.png"/.test(snapshotHtml)) fail('dist/site.html: Kade metal ikon bağlantısı yok')
  else if (!await exists(join(DIST, 'kade-coming-soon-icon.png'))) fail('dist/kade-coming-soon-icon.png yok')
  else ok('Kade metal ikon dosyası build çıktısında')

  if (!/<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex"/.test(snapshotHtml)) {
    fail('dist/site.html: güçlü noindex direktifi yok')
  } else {
    ok('noindex + nofollow + noarchive direktifi yerinde')
  }

  if (indexHtml !== snapshotHtml) fail('dist/index.html coming soon kabuğuyla aynı değil')
  else ok('dist/index.html doğrudan coming soon kabuğunu içeriyor')
}

// Snapshot DIŞINDAKİ hiçbir HTML yabancı bundle'a referans vermemeli; verirse
// snapshot iç sayfalara da sızmış demektir. Minified JS içindeki rastgele
// değişken adları yanlış pozitif ürettiği için yalnızca HTML'e ve gerçek
// script/link referanslarına bakılır.
for (const file of htmlFiles) {
  if (file === SNAPSHOT || file === INDEX) continue
  const html = await readFile(file, 'utf8')
  const nextRefs = html.match(/(?:src|href)="\/?_(?:next|kade)\//g) || []
  if (nextRefs.length) fail(`${rel(file)}: ${nextRefs.length} adet snapshot varlık referansı var — snapshot iç sayfaya sızmış`)
}
if (!failures.some((f) => f.includes('sızmış'))) ok(`${htmlFiles.length - 2} iç sayfa HTML'inde snapshot varlık referansı yok`)

// Uygulama rotaları app.html ile aynı React bundle'ını; public pazarlama
// rotaları ise statik coming soon kabuğunu yüklemeli.
const bundleOf = (html) => (html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/) || [])[1] || null
const appBundle = bundleOf(await readFile(join(DIST, 'app.html'), 'utf8'))
const adminPath = join(DIST, 'admin', 'index.html')
const marketingPath = join(DIST, 'hakkimizda', 'index.html')
if (!appBundle) {
  fail('dist/app.html bir /assets/index-*.js bundle\'ı yüklemiyor')
} else if (await exists(adminPath)) {
  const adminBundle = bundleOf(await readFile(adminPath, 'utf8'))
  if (appBundle !== adminBundle) fail(`app.html (${appBundle}) ve /admin (${adminBundle}) farklı React bundle yüklüyor`)
  else ok(`React uygulama rotaları aynı bundle'ı yüklüyor (${appBundle})`)
}
if (process.env.FINAL_MERGE === '1' && await exists(marketingPath)) {
  const marketingHtml = await readFile(marketingPath, 'utf8')
  if (bundleOf(marketingHtml)) fail('/hakkimizda coming soon kabuğu yerine React bundle yüklüyor')
  else if (!/data-coming-soon/.test(marketingHtml)) fail('/hakkimizda coming soon kabuğunu yüklemiyor')
  else if (!/<meta name="robots" content="noindex, nofollow/.test(marketingHtml)) fail('/hakkimizda noindex değil')
  else ok('public pazarlama rotaları noindex coming soon kabuğunu yüklüyor')
}

// ── 2. Tasarım token katmanı ───────────────────────────────────────────────

console.log('\nTasarım token katmanı kontrolü')

// Her token için: değeriyle birlikte tanımlanmış olmalı (yalnız kullanılmış değil).
const REQUIRED_TOKENS = [
  '--kade-gold', '--kade-ink', '--kade-surface', '--kade-line',
  '--radius-md', '--radius-lg', '--shadow-md', '--shadow-lg',
  '--dur-fast', '--dur-normal', '--ease-out',
  '--font-sans', '--fs-base', '--container-max',
]

const allCss = (await Promise.all(cssFiles.map((f) => readFile(f, 'utf8')))).join('\n')
for (const token of REQUIRED_TOKENS) {
  // "--token:" biçiminde bir *tanım* ara (minifier boşlukları siler).
  if (new RegExp(`${token}\\s*:\\s*[^;}]`).test(allCss)) continue
  fail(`${token} üretilen CSS'te tanımlı değil — token katmanı bundle'a girmemiş`)
}
if (!failures.some((f) => f.includes('token'))) ok(`${REQUIRED_TOKENS.length} zorunlu token üretilen CSS'te tanımlı`)

// Altın rengin gerçek değeri; token dosyası boşaltılırsa yakalar.
if (!/--kade-gold\s*:\s*#e0a81f/i.test(allCss)) fail("--kade-gold beklenen değeri (#e0a81f) taşımıyor")
else ok('--kade-gold: #e0a81f')

// ── Sonuç ──────────────────────────────────────────────────────────────────

if (failures.length) {
  console.error(`\n${failures.length} bütünlük ihlali — build reddedildi.\n`)
  process.exit(1)
}
console.log('\nBuild bütünlüğü doğrulandı.\n')
