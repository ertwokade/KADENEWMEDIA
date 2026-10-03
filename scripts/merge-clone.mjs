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
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'haoqi-clone', 'dist')
const dist = join(root, 'dist')

/* Klondan alınacak sayfalar. Buraya yazılmayan her rota React uygulamasında kalır. */
/* organizasyon-kiti ve kade-kit-business BİLEREK YOK.

   Klon 11 alt sayfa için SEO kabuğu üretiyordu (genel-bakis, marka-kimligi,
   butce…). React uygulamasında ise bambaşka 6 bölüm var (medya-yol-haritasi,
   yonetim-toplantilari, ekip-surecler, stratejik-kararlar, notlar, plan/…) ve
   iki küme HİÇ KESİŞMİYORDU: klonun tanıttığı sayfaların hiçbiri gerçekte
   yoktu, gerçek bölümlerin hiçbirinin de kabuğu yoktu.

   Kabuklar listeden çıkarıldı; o adresler artık React'e düşüyor ve olmayan bir
   sayfa için dürüstçe 404 veriyor. Gerçek 6 bölüm zaten React'ten servis
   ediliyor (generate-static-routes.mjs kendi dosyalarını üretiyor). Kök
   /organizasyon-kiti ve /kade-kit-business de oturum/yetki kontrolü yapan
   uygulama rotalarıdır; tanıtım kabuğu bunların güvenlik ekranını ezmemelidir. */
const PAGES = [
  'hizmetler',
  'hizmetler/sosyal-medya-yonetimi', 'hizmetler/icerik-uretimi', 'hizmetler/reklam-yonetimi',
  'hizmetler/video-produksiyon', 'hizmetler/strateji-danismanlik', 'hizmetler/web-sitesi-tasarimi',
  'hakkimizda', 'neden-biz', 'ekip', 'kariyer', 'basin', 'new-media-ajansi',
  'portfolio', 'referanslar', 'basari-hikayeleri', 'partnerler', 'referans-programi',
  'blog', 'sss', 'podcast-webinar', 'bulten-arsivi',
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

// Public pazarlama rotaları geçici olarak tek bir "coming soon" kabuğu taşır.
// Uygulama, giriş, yönetim ve müşteri rotaları bu izin listesinde olmadığı için
// generate-static-routes.mjs tarafından üretilen React kabuklarını korur.
const comingSoonHtml = await readFile(join(root, 'public', 'site.html'), 'utf8')
const ROBOTS_META = /<meta name="robots" content="[^"]*"\s*\/?>/i
const CANONICAL_TAG = /<link rel="canonical" href="[^"]*"\s*\/?>/i
const OG_URL_TAG = /<meta property="og:url" content="[^"]*"\s*\/?>/i

function routeUrl(route) {
  return route ? `https://kadenewmedia.com/${route}` : 'https://kadenewmedia.com/'
}

async function comingSoonFor(route, generatedPath) {
  // Rota üreticisinin kararını koru: herkese açık sayfalar index, follow;
  // özel/noindex sayfalar ise coming soon kabuğu altında da kapalı kalsın.
  const generated = await readFile(generatedPath, 'utf8').catch(() => '')
  const robots = generated.match(/<meta name="robots" content="([^"]*)"/i)?.[1] || 'index, follow'
  const canonical = routeUrl(route)

  return comingSoonHtml
    .replace(ROBOTS_META, `<meta name="robots" content="${robots}" />`)
    .replace(CANONICAL_TAG, `<link rel="canonical" href="${canonical}" />`)
    .replace(OG_URL_TAG, `<meta property="og:url" content="${canonical}" />`)
}

async function copyPage(route) {
  const to = join(dist, route, 'index.html')
  const html = await comingSoonFor(route, to)
  await mkdir(dirname(to), { recursive: true })
  await writeFile(to, html)
  pages += 1
}

await copyAssets(source)

/* Ana sayfa: Vercel rewrite'ı /site.html'e bakıyor, fiziksel dosya da dursun. */
await writeFile(join(dist, 'site.html'), comingSoonHtml)
await writeFile(join(dist, 'index.html'), comingSoonHtml)
pages += 2

for (const route of PAGES) await copyPage(route)

console.log(`Coming soon katmanı bindirildi — ${pages} sayfa, ${assets} ortak dosya (api/, uygulama rotaları ve hata sayfaları korundu).`)
