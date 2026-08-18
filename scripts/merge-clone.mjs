#!/usr/bin/env node
/**
 * Klon katmanını üretim çıktısına bindirir.
 *
 * haoqi-clone/ artık sitenin public yüzü: ana sayfa snapshot'ı ve pazarlama
 * rotaları oradan gelir. Backend (api/*), uygulama rotaları (/@handle, /s/:slug,
 * admin, müşteri paneli, giriş) ve hata sayfaları React uygulamasında kalır —
 * bu yüzden bindirme bir izin listesiyle çalışır, kör kopyalama yapmaz.
 *
 * legacy:build sonunda çalışır; generate-static-routes.mjs'den SONRA gelmesi
 * şart, aksi halde React'in ürettiği sayfalar klonun üzerine yazar.
 */
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'haoqi-clone', 'dist')
const dist = join(root, 'dist')

/* Klondan alınacak sayfalar. Buraya yazılmayan her rota React uygulamasında kalır. */
const PAGES = [
  'hizmetler',
  'hizmetler/sosyal-medya-yonetimi', 'hizmetler/icerik-uretimi', 'hizmetler/reklam-yonetimi',
  'hizmetler/video-produksiyon', 'hizmetler/strateji-danismanlik', 'hizmetler/web-sitesi-tasarimi',
  'hakkimizda', 'neden-biz', 'ekip', 'kariyer', 'basin', 'new-media-ajansi',
  'portfolio', 'referanslar', 'basari-hikayeleri', 'partnerler', 'referans-programi',
  'blog', 'sss', 'podcast-webinar', 'bulten-arsivi', 'kade-kit-business',
  'organizasyon-kiti', 'organizasyon-kiti/genel-bakis', 'organizasyon-kiti/marka-kimligi',
  'organizasyon-kiti/hedef-kitle', 'organizasyon-kiti/kanal-stratejisi', 'organizasyon-kiti/icerik-plani',
  'organizasyon-kiti/reklam-plani', 'organizasyon-kiti/takvim', 'organizasyon-kiti/butce',
  'organizasyon-kiti/ekip', 'organizasyon-kiti/rakip-analizi', 'organizasyon-kiti/raporlama',
  'teklif-al', 'fiyat-hesaplama', 'paketler', 'iletisim', 'tesekkur',
  'kvkk', 'gizlilik', 'cerez-politikasi', 'telif-haklari'
]

/* Repo kendi sürümünü servis etmeye devam etsin. */
const KEEP_REPO = new Set(['robots.txt', 'sitemap.xml', 'vercel.json', '404.html'])

let assets = 0
let pages = 0

async function copyAssets(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const from = join(dir, entry.name)
    const rel = relative(source, from)
    if (entry.isDirectory()) {
      await copyAssets(from)
      continue
    }
    if (entry.name.endsWith('.html') || KEEP_REPO.has(rel)) continue
    const to = join(dist, rel)
    await mkdir(dirname(to), { recursive: true })
    await cp(from, to)
    assets += 1
  }
}

async function copyPage(route) {
  const from = join(source, route, 'index.html')
  if (!await stat(from).catch(() => null)) {
    console.warn(`  ! klonda yok, atlandı: /${route}`)
    return
  }
  const to = join(dist, route, 'index.html')
  await mkdir(dirname(to), { recursive: true })
  await cp(from, to)
  pages += 1
}

await copyAssets(source)

/* Ana sayfa: Vercel rewrite'ı /site.html'e bakıyor, fiziksel dosya da dursun. */
const home = await readFile(join(source, 'index.html'), 'utf8')
await writeFile(join(dist, 'site.html'), home)
await writeFile(join(dist, 'index.html'), home)
pages += 2

for (const route of PAGES) await copyPage(route)

console.log(`Klon katmanı bindirildi — ${pages} sayfa, ${assets} dosya (api/, uygulama rotaları ve hata sayfaları korundu).`)
