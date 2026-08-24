#!/usr/bin/env node
/**
 * Build bütünlüğü doğrulayıcı — üretim çıktısı (dist/) üzerinde çalışır.
 *
 * İki regresyonu kalıcı olarak kilitler:
 *
 *  1) Anasayfa snapshot'ı eksiksiz çıksın. Anasayfa (yalnız "/") derlenmiş bir
 *     statik snapshot ile servis ediliyor: public/site.html + public/_kade/**.
 *     (Yol adı _next DEĞİL: tek dağıtım mimarisinde /_next/ Next.js'in kendi
 *     build çıktısına ayrılmıştır — bkz. haoqi-clone/kade-html-transform.mjs.)
 *     Build sonunda snapshot hem dist/site.html hem de fiziksel
 *     dist/index.html olarak bulunur; Vercel rewrite önceliğine güvenilmez. Bir
 *     dönem kaldırılmış, yerine React anasayfası konmuştu; site sahibinin
 *     talebiyle geri alındı. Bu kontrol artık TERSİ yönde koruyor: snapshot
 *     ya da referans verdiği chunk'lardan biri dist'e girmezse anasayfa
 *     sessizce boş/bozuk yayına çıkar — build burada durur.
 *
 *     Snapshot yabancı kaynaklıdır ve kaynak kodu bu repoda yoktur; içeriği
 *     elle düzenlenebilir değildir. Diğer 38 rota kaynak koddaki React
 *     uygulamasından gelmeye devam eder (bkz. aşağıdaki bundle kontrolü).
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

// ── 1. Anasayfa snapshot'ı ─────────────────────────────────────────────────

console.log('\nAnasayfa snapshot kontrolü')

const SNAPSHOT = join(DIST, 'site.html')
const INDEX = join(DIST, 'index.html')
const snapshotHtml = (await exists(SNAPSHOT)) ? await readFile(SNAPSHOT, 'utf8') : null
const indexHtml = (await exists(INDEX)) ? await readFile(INDEX, 'utf8') : null

if (!snapshotHtml) {
  fail('dist/site.html yok — anasayfa snapshot\'ı build çıktısına girmemiş')
} else {
  ok('dist/site.html üretilmiş')

  // site.html'in referans verdiği HER chunk dist'te bulunmalı. Eksik tek bir
  // dosya bile anasayfayı boş ekrana düşürür ve bu ancak canlıda fark edilir.
  const referenced = [...new Set(
    [...snapshotHtml.matchAll(/(?:src|href)="(\/_kade\/static\/chunks\/[^"]+)"/g)].map((m) => m[1]),
  )]
  const missing = []
  for (const path of referenced) {
    if (!await exists(join(DIST, path.slice(1)))) missing.push(path)
  }
  if (!referenced.length) fail('dist/site.html hiçbir /_kade/ chunk\'ına referans vermiyor — snapshot bozuk')
  else if (missing.length) fail(`snapshot chunk'ları eksik (${missing.length}): ${missing.join(', ')}`)
  else ok(`snapshot'ın ${referenced.length} chunk referansının tamamı dist'te`)

  // Snapshot yabancı kaynaklı; orijinal imza SVG'sini Kade sürümüne çeviren
  // yama site.html içinde satır içi duruyor. Yama düşerse anasayfada başka
  // bir markanın imzası görünür.
  if (!/svg-sign/.test(snapshotHtml)) fail('dist/site.html: Kade imza yaması kaybolmuş')
  else ok('Kade imza yaması yerinde')

  if (!/src="\/homepage-admin\.js"/.test(snapshotHtml)) fail('dist/site.html: admin ana sayfa runtime bağlantısı yok')
  else if (!await exists(join(DIST, 'homepage-admin.js'))) fail('dist/homepage-admin.js yok — admin içerikleri ana sayfaya uygulanamaz')
  else ok('admin ana sayfa runtime bağlantısı yerinde')

  if (indexHtml !== snapshotHtml) fail('dist/index.html Haoqi snapshot\'ıyla aynı değil — Vercel kökte React fallback servis edebilir')
  else ok('dist/index.html doğrudan Haoqi snapshot\'ını içeriyor')
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

// React iç sayfaları ve app.html aynı uygulama bundle'ını yüklemeli. Anasayfa
// özellikle Haoqi snapshot'ıdır ve bu karşılaştırmaya dahil edilmez.
const bundleOf = (html) => (html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/) || [])[1] || null
const appBundle = bundleOf(await readFile(join(DIST, 'app.html'), 'utf8'))
const innerPath = join(DIST, 'hakkimizda', 'index.html')
if (!appBundle) {
  fail('dist/app.html bir /assets/index-*.js bundle\'ı yüklemiyor')
} else if (await exists(innerPath)) {
  const innerBundle = bundleOf(await readFile(innerPath, 'utf8'))
  if (appBundle !== innerBundle) fail(`app.html (${appBundle}) ve /hakkimizda (${innerBundle}) farklı bundle yüklüyor`)
  else ok(`React iç sayfaları aynı bundle'ı yüklüyor (${appBundle})`)
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
