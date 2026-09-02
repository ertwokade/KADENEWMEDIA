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
/* organizasyon-kiti ALT SAYFALARI BİLEREK YOK.

   Klon 11 alt sayfa için SEO kabuğu üretiyordu (genel-bakis, marka-kimligi,
   butce…). React uygulamasında ise bambaşka 6 bölüm var (medya-yol-haritasi,
   yonetim-toplantilari, ekip-surecler, stratejik-kararlar, notlar, plan/…) ve
   iki küme HİÇ KESİŞMİYORDU: klonun tanıttığı sayfaların hiçbiri gerçekte
   yoktu, gerçek bölümlerin hiçbirinin de kabuğu yoktu.

   Kabuklar listeden çıkarıldı; o adresler artık React'e düşüyor ve olmayan bir
   sayfa için dürüstçe 404 veriyor. Gerçek 6 bölüm zaten React'ten servis
   ediliyor (generate-static-routes.mjs kendi dosyalarını üretiyor).
   Kök /organizasyon-kiti kabuğu kalıyor: giriş öncesi tanıtım sayfası. */
const PAGES = [
  'hizmetler',
  'hizmetler/sosyal-medya-yonetimi', 'hizmetler/icerik-uretimi', 'hizmetler/reklam-yonetimi',
  'hizmetler/video-produksiyon', 'hizmetler/strateji-danismanlik', 'hizmetler/web-sitesi-tasarimi',
  'hakkimizda', 'neden-biz', 'ekip', 'kariyer', 'basin', 'new-media-ajansi',
  'portfolio', 'referanslar', 'basari-hikayeleri', 'partnerler', 'referans-programi',
  'blog', 'sss', 'podcast-webinar', 'bulten-arsivi', 'kade-kit-business',
  'organizasyon-kiti',
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

/* Klon kabuğu, generate-static-routes.mjs'in ürettiği kabuğun ÜZERİNE yazılıyor.
   İki kaynak robots etiketinde ayrışabiliyor ve üretilen dosyadaki `noindex`
   niyeti sessizce kayboluyordu: /fiyat-hesaplama ve /referans-programi
   canlıda "index, follow" ile duruyordu, oysa ikisi de noindex işaretliydi.
   Kopyalamadan ÖNCE hedefteki robots değeri okunup kopyanın üstüne
   yazılıyor — içerik klondan, indeksleme kararı tek kaynaktan. */
const ROBOTS = /<meta name="robots" content="([^"]*)"\s*\/?>/i

async function copyPage(route) {
  const from = join(source, route, 'index.html')
  if (!await stat(from).catch(() => null)) {
    console.warn(`  ! klonda yok, atlandı: /${route}`)
    return
  }
  const to = join(dist, route, 'index.html')

  const uretilen = await readFile(to, 'utf8').catch(() => null)
  const karar = uretilen?.match(ROBOTS)?.[1] ?? null

  await mkdir(dirname(to), { recursive: true })

  if (karar) {
    const klon = await readFile(from, 'utf8')
    const duzeltilmis = klon.replace(ROBOTS, `<meta name="robots" content="${karar}" />`)
    if (duzeltilmis !== klon) console.log(`  robots korundu: /${route} → ${karar}`)
    await writeFile(to, duzeltilmis)
  } else {
    await cp(from, to)
  }

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
