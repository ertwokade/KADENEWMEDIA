// Tasarım regresyon koruması — eski Kade Media tasarımının geri dönmediğini
// semantik olarak doğrular. Çalıştırma: dev/preview ayaktayken
//   node scripts/design-regression-check.mjs [baseURL]
// Varsayılan baseURL: http://localhost:5173
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5173'
const STATIC_ROUTES = ['/hakkimizda', '/hizmetler', '/iletisim', '/paketler', '/sss', '/neden-biz', '/ekip', '/kariyer', '/basin', '/tesekkur']
const REACT_ROUTES = ['/portfolio', '/blog', '/partnerler', '/teklif-al', '/giris', '/referanslar', '/kade-kit']
const VIEWPORTS = [{ w: 375, h: 812 }, { w: 768, h: 1024 }, { w: 1440, h: 900 }]

const failures = []

const browser = await chromium.launch()
for (const { w, h } of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  for (const path of [...STATIC_ROUTES, ...REACT_ROUTES]) {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message.slice(0, 60)))
    try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 20000 }) } catch { /* devam */ }
    await page.waitForTimeout(1200)
    const s = await page.evaluate(() => ({
      // ortak editoryal header (React .knav VEYA statik header)
      editorialHeader: !!document.querySelector('.knav') || !!document.querySelector('header a[href="/"]'),
      // eski klasik navbar OLMAMALI
      oldNavbar: !!document.querySelector('.navbar:not(.knav)'),
      // eski hakkımızda "lightning" glass-card öğesi OLMAMALI
      legacyLightning: !!document.querySelector('.lightning-svg, .lightning-container'),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 4,
    }))
    const problems = []
    if (!s.editorialHeader) problems.push('ortak editoryal header yok')
    if (s.oldNavbar) problems.push('eski .navbar render ediliyor')
    if (s.legacyLightning) problems.push('legacy lightning card render ediliyor')
    if (s.horizontalOverflow) problems.push('yatay overflow')
    if (errs.length) problems.push('console error: ' + errs[0])
    if (problems.length) failures.push(`${path} @${w}px → ${problems.join('; ')}`)
    page.removeAllListeners('pageerror')
  }
  await page.close()
}
await browser.close()

if (failures.length) {
  console.error('❌ TASARIM REGRESYONU:\n' + failures.join('\n'))
  process.exit(1)
}
console.log(`✓ Tasarım regresyon kontrolü geçti (${(STATIC_ROUTES.length + REACT_ROUTES.length)} route × ${VIEWPORTS.length} viewport)`)
