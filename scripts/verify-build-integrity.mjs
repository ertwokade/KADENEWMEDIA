#!/usr/bin/env node
/**
 * Build bütünlüğü doğrulayıcı — üretim çıktısı (dist/) üzerinde çalışır.
 *
 * İki regresyonu kalıcı olarak kilitler:
 *
 *  1) Klonlanmış Next.js snapshot'ı geri gelmesin. Anasayfa bir dönem başka
 *     bir projenin derlenmiş Next.js çıktısıyla (public/site.html + _next/**)
 *     servis ediliyordu; kaynak koddaki React anasayfası ise hiç yayına
 *     çıkmıyordu. Snapshot kaldırıldı — bu kontrol geri sızmasını engeller.
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

// ── 1. Klonlanmış snapshot kalıntısı ───────────────────────────────────────

console.log('\nSnapshot kalıntısı kontrolü')

for (const artifact of ['site.html', '_next']) {
  if (await exists(join(DIST, artifact))) fail(`dist/${artifact} üretilmiş — snapshot geri gelmiş`)
  else ok(`dist/${artifact} yok`)
}

// HTML çıktısında yabancı bundle referansı olmamalı. Minified JS içindeki
// rastgele değişken adları yanlış pozitif ürettiği için yalnızca HTML'e ve
// gerçek script/link referanslarına bakılır.
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const nextRefs = html.match(/(?:src|href)="\/?_next\//g) || []
  if (nextRefs.length) fail(`${rel(file)}: ${nextRefs.length} adet /_next/ referansı var`)
  if (/haoqi/i.test(html)) fail(`${rel(file)}: 'haoqi' dizesi geçiyor`)
}
if (!failures.length) ok(`${htmlFiles.length} HTML dosyasında _next/haoqi referansı yok`)

// Anasayfa ile bir iç sayfa aynı uygulama bundle'ını yüklemeli; farklıysa
// tekrar iki ayrı uygulama servis ediliyor demektir.
const bundleOf = (html) => (html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/) || [])[1] || null
const homeBundle = bundleOf(await readFile(join(DIST, 'index.html'), 'utf8'))
const innerPath = join(DIST, 'hakkimizda', 'index.html')
if (!homeBundle) {
  fail('dist/index.html bir /assets/index-*.js bundle\'ı yüklemiyor')
} else if (await exists(innerPath)) {
  const innerBundle = bundleOf(await readFile(innerPath, 'utf8'))
  if (homeBundle !== innerBundle) fail(`anasayfa (${homeBundle}) ve /hakkimizda (${innerBundle}) farklı bundle yüklüyor`)
  else ok(`anasayfa ve iç sayfalar aynı bundle'ı yüklüyor (${homeBundle})`)
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
