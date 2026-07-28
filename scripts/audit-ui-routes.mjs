// Canlı site denetimi: her rotayı gerçek tarayıcıda 3 viewport'ta açar,
// console/network hatalarını, SEO meta'sını, yatay taşmayı ve font ailesini toplar.
import { chromium, request as playwrightRequest } from 'playwright'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = process.env.AUDIT_BASE || 'https://kadenewmedia.com'
const OUT = process.env.AUDIT_OUT || fileURLToPath(new URL('../docs/live-route-audit.json', import.meta.url))
const SETTLE_MS = Number(process.env.AUDIT_SETTLE_MS || 1200)

const ROUTES = [
  // indekslenen
  '/', '/hakkimizda', '/hizmetler', '/new-media-ajansi', '/paketler', '/sss', '/ekip',
  '/kariyer', '/iletisim', '/teklif-al', '/kvkk', '/gizlilik', '/cerez-politikasi', '/telif-haklari',
  '/hizmetler/sosyal-medya-yonetimi', '/hizmetler/icerik-uretimi', '/hizmetler/reklam-yonetimi',
  '/hizmetler/video-produksiyon', '/hizmetler/strateji-danismanlik', '/hizmetler/web-sitesi-tasarimi',
  // noindex ama herkese açık
  '/blog', '/portfolio', '/partnerler', '/referanslar', '/basari-hikayeleri',
  // özel
  '/admin', '/giris', '/giris/danismanlik', '/musteri-panel', '/proje-takip',
  '/kade-kit-business', '/tesekkur', '/organizasyon-kiti',
  '/organizasyon-kiti/medya-yol-haritasi', '/organizasyon-kiti/yonetim-toplantilari',
  '/organizasyon-kiti/ekip-surecler', '/organizasyon-kiti/stratejik-kararlar',
  '/organizasyon-kiti/notlar', '/organizasyon-kiti/plan/fractional-new-media-director',
  // hata/bakım
  '/401', '/403', '/429', '/bakim',
  // dinamik — geçerli
  '/partnerler/flavora', '/@kadirdemir',
  // dinamik — geçersiz
  '/blog/gecersiz-yazi', '/partnerler/gecersiz-kayit', '/@gecersizprofil', '/s/kade-audit-gecersiz',
  '/hizmetler/gecersiz-hizmet', '/bu-sayfa-kesinlikle-yok-12345',
]

const VIEWPORTS = [
  { name: 'mobil', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'masaustu', width: 1440, height: 900 },
]

const browser = await chromium.launch()
const results = []

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 KadeAudit/1.0',
  })

  for (const route of ROUTES) {
    const page = await ctx.newPage()
    const consoleErrors = []
    const pageErrors = []
    const failedRequests = []
    let blockedMutations = 0

    // Denetim production verisini değiştirmemeli. İçerik/SEO GET'leri gerçek
    // kaynaktan okunur; pageview, heartbeat ve diğer bütün yazma istekleri
    // tarayıcıdan çıkmadan 204 ile sonlandırılır.
    await page.route('**/api/**', async (intercepted) => {
      if (intercepted.request().method() !== 'GET') {
        blockedMutations += 1
        await intercepted.fulfill({ status: 204, body: '' })
        return
      }
      await intercepted.continue()
    })

    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300))
    })
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 300)))
    page.on('requestfailed', (r) => {
      const f = r.failure()?.errorText || ''
      if (f.includes('ERR_ABORTED')) return
      failedRequests.push(`${r.url().slice(0, 160)} :: ${f}`)
    })
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('/api/')) {
        failedRequests.push(`${r.status()} ${r.url().slice(0, 160)}`)
      }
    })

    let status = null
    let error = null
    try {
      const resp = await page.goto(new URL(route, BASE).href, { waitUntil: 'domcontentloaded', timeout: 45000 })
      status = resp?.status() ?? null
      await page.waitForTimeout(SETTLE_MS) // hidrasyon + useSEO
    } catch (e) {
      error = String(e.message).slice(0, 200)
    }

    let info = {}
    if (!error) {
      info = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        const body = document.body
        const de = document.documentElement
        const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 60))
        // font: gövde ve ilk başlıkta gerçekten uygulanan aile
        const cs = getComputedStyle(body)
        const h1el = document.querySelector('h1')
        const btn = document.querySelector('button, .btn, a.btn')
        const inp = document.querySelector('input, textarea, select')
        // yatay taşma yapan elemanlar
        const overflowing = []
        const limit = de.clientWidth + 2
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > limit || r.left < -2) {
            const st = getComputedStyle(el)
            if (st.position === 'fixed' && st.visibility === 'hidden') continue
            if (st.overflow === 'hidden' || st.overflowX === 'hidden') continue
            overflowing.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || ''} w=${Math.round(r.width)} r=${Math.round(r.right)}`)
            if (overflowing.length > 6) break
          }
        }
        // görsel eksikliği
        const brokenImgs = [...document.images]
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.currentSrc || i.src).slice(0, 5)
        const noAltImgs = [...document.images].filter((i) => !i.alt && !i.getAttribute('aria-hidden')).length

        return {
          title: document.title,
          robots: q('meta[name="robots"]')?.content || null,
          canonical: q('link[rel="canonical"]')?.href || null,
          ogTitle: q('meta[property="og:title"]')?.content || null,
          ogImage: q('meta[property="og:image"]')?.content || null,
          ogUrl: q('meta[property="og:url"]')?.content || null,
          description: q('meta[name="description"]')?.content?.slice(0, 80) || null,
          bodyFont: cs.fontFamily,
          h1Font: h1el ? getComputedStyle(h1el).fontFamily : null,
          btnFont: btn ? getComputedStyle(btn).fontFamily : null,
          inputFont: inp ? getComputedStyle(inp).fontFamily : null,
          h1Count: h1s.length,
          h1s: h1s.slice(0, 3),
          scrollW: de.scrollWidth,
          clientW: de.clientWidth,
          hasHorizontalOverflow: de.scrollWidth > de.clientWidth + 1,
          overflowing,
          brokenImgs,
          noAltImgs,
          textLen: (body.innerText || '').trim().length,
        }
      }).catch((e) => ({ evalError: String(e.message).slice(0, 150) }))
    }

    results.push({ viewport: vp.name, route, status, error, blockedMutations, consoleErrors, pageErrors, failedRequests, ...info })
    process.stdout.write(`${vp.name} ${route} -> ${status}${info.hasHorizontalOverflow ? ' [TAŞMA]' : ''}${consoleErrors.length ? ` [${consoleErrors.length} console]` : ''}\n`)
    await page.close()
  }
  await ctx.close()
}

await browser.close()

const api = await playwrightRequest.newContext({
  baseURL: BASE,
  extraHTTPHeaders: { 'user-agent': 'KadeAudit/1.0' },
})
const endpointChecks = []
for (const route of ['/robots.txt', '/sitemap.xml', '/kadirdemir', '/links', '/kadelinks', '/kadelinks/eski', '/bu-sayfa-kesinlikle-yok-12345']) {
  try {
    const response = await api.get(route, { maxRedirects: 0 })
    endpointChecks.push({
      route,
      status: response.status(),
      location: response.headers().location || null,
      contentType: response.headers()['content-type'] || null,
    })
  } catch (error) {
    endpointChecks.push({ route, error: String(error.message).slice(0, 200) })
  }
}
await api.dispose()

const summary = {
  pages: results.length,
  routeCount: ROUTES.length,
  viewportCount: VIEWPORTS.length,
  consoleErrorPages: results.filter((row) => row.consoleErrors.length || row.pageErrors.length).length,
  networkErrorPages: results.filter((row) => row.failedRequests.length).length,
  overflowPages: results.filter((row) => row.hasHorizontalOverflow).length,
  brokenImagePages: results.filter((row) => row.brokenImgs?.length).length,
  nonPoppinsPages: results.filter((row) =>
    [row.bodyFont, row.h1Font, row.btnFont, row.inputFont]
      .filter(Boolean)
      .some((family) => !family.split(',')[0].replace(/["']/g, '').trim().includes('Poppins'))
  ).length,
  blockedMutationRequests: results.reduce((sum, row) => sum + row.blockedMutations, 0),
}

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  settleMs: SETTLE_MS,
  viewports: VIEWPORTS,
  summary,
  endpointChecks,
  routes: results,
}
await writeFile(OUT, JSON.stringify(report, null, 2))
console.log('\nÖzet:', summary)
console.log('Bitti ->', OUT)
