import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const BASE = process.env.AUDIT_URL || 'http://127.0.0.1:4173'
const outputDir = new URL('../docs/design-references/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const routes = [
  '/', '/hakkimizda', '/hizmetler', '/new-media-ajansi', '/paketler', '/iletisim', '/sss', '/ekip', '/kariyer',
  '/teklif-al', '/kvkk', '/gizlilik', '/cerez-politikasi', '/portfolio', '/partnerler', '/blog',
  '/referanslar', '/basari-hikayeleri', '/giris', '/musteri-panel', '/proje-takip',
  '/tesekkur', '/admin', '/organizasyon-kiti', '/organizasyon-kiti/plan/fractional-new-media-director',
  '/organizasyon-kiti/medya-yol-haritasi', '/organizasyon-kiti/yonetim-toplantilari',
  '/organizasyon-kiti/ekip-surecler', '/organizasyon-kiti/stratejik-kararlar', '/organizasyon-kiti/notlar',
  '/kade-kit-business',
  '/hizmetler/sosyal-medya-yonetimi', '/hizmetler/icerik-uretimi', '/hizmetler/reklam-yonetimi',
  '/hizmetler/video-produksiyon', '/hizmetler/strateji-danismanlik', '/hizmetler/web-sitesi-tasarimi',
]
const noindexRoutes = new Set([
  '/portfolio', '/partnerler', '/blog', '/referanslar', '/basari-hikayeleri', '/giris',
  '/musteri-panel', '/proje-takip',
  '/tesekkur', '/admin', '/organizasyon-kiti', '/organizasyon-kiti/plan/fractional-new-media-director',
  '/organizasyon-kiti/medya-yol-haritasi', '/organizasyon-kiti/yonetim-toplantilari',
  '/organizasyon-kiti/ekip-surecler', '/organizasyon-kiti/stratejik-kararlar', '/organizasyon-kiti/notlar',
  '/kade-kit-business',
])
const viewports = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

const errors = []
const results = []
const addError = (message) => { errors.push(message) }

let child
if (!process.env.AUDIT_URL) {
  child = spawn(process.execPath, ['scripts/serve-dist.mjs'], { cwd: new URL('..', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(BASE)).ok) break
    } catch { /* server is starting */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()}: ${message.text()}`)
  })
  page.on('pageerror', error => consoleErrors.push(`${page.url()}: ${error.message}`))

  const internalLinks = new Set()
  for (const route of routes) {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('h1', { state: 'attached', timeout: route === '/' ? 1000 : 5000 }).catch(() => {})
    await page.waitForTimeout(100)
    const audit = await page.evaluate(() => {
      const canonical = [...document.querySelectorAll('link[rel="canonical"]')].map(node => node.href)
      const robots = document.querySelector('meta[name="robots"]')?.content || ''
      const unnamedButtons = [...document.querySelectorAll('button')].filter(button => !((button.getAttribute('aria-label') || button.textContent || '').trim())).length
      const unnamedInputs = [...document.querySelectorAll('input, textarea, select')].filter(control => {
        if (control.type === 'hidden') return false
        const id = control.id
        return !(control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || control.closest('label'))
      }).length
      const brokenImages = [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src)
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        canonical,
        robots,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
        unnamedButtons,
        unnamedInputs,
        brokenImages,
        lang: document.documentElement.lang,
        links: [...document.querySelectorAll('a[href]')].map(anchor => anchor.getAttribute('href')),
      }
    })
    results.push({ route, status: response?.status(), ...audit })
    if (response?.status() !== 200) addError(`${route}: expected 200, received ${response?.status()}`)
    if (!audit.title.trim()) addError(`${route}: empty title`)
    if (audit.h1 !== 1) addError(`${route}: expected one h1, found ${audit.h1}`)
    if (audit.canonical.length !== 1) addError(`${route}: expected one canonical, found ${audit.canonical.length}`)
    if (!audit.canonical[0]?.startsWith('https://kadenewmedia.com')) addError(`${route}: canonical host mismatch`)
    if (noindexRoutes.has(route) && !audit.robots.includes('noindex')) addError(`${route}: missing noindex`)
    if (!noindexRoutes.has(route) && audit.robots.includes('noindex')) addError(`${route}: unexpectedly noindex`)
    if (audit.overflow > 1) addError(`${route}: horizontal overflow ${audit.overflow}px`)
    if (audit.unnamedButtons) addError(`${route}: ${audit.unnamedButtons} unnamed buttons`)
    if (audit.unnamedInputs) addError(`${route}: ${audit.unnamedInputs} unnamed form controls`)
    if (audit.brokenImages.length) addError(`${route}: ${audit.brokenImages.length} broken images`)
    if (audit.lang !== 'tr') addError(`${route}: html lang is ${audit.lang || 'missing'}`)
    audit.links.filter(Boolean).forEach(href => {
      try {
        const url = new URL(href, BASE)
        if (url.origin === BASE && !url.hash && !url.pathname.startsWith('/api/')) internalLinks.add(url.pathname)
      } catch { /* ignore malformed external values here; browser reports them elsewhere */ }
    })
  }

  for (const link of internalLinks) {
    const response = await context.request.get(`${BASE}${link}`, { maxRedirects: 0 })
    if (response.status() >= 400) addError(`broken internal link ${link}: HTTP ${response.status()}`)
  }

  for (const invalid of ['/olmayan-route', '/hizmetler/gecersiz', '/partnerler/gecersiz', '/blog/gecersiz', '/organizasyon-kiti/gecersiz']) {
    const response = await context.request.get(`${BASE}${invalid}`, { maxRedirects: 0 })
    if (response.status() !== 404) addError(`${invalid}: expected true HTTP 404, received ${response.status()}`)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/hizmetler`, { waitUntil: 'domcontentloaded' })
  const menuButton = page.locator('button[aria-controls="mobile-navigation"]')
  if (await menuButton.count()) {
    await menuButton.click()
    if ((await menuButton.getAttribute('aria-expanded')) !== 'true') addError('mobile nav did not expose expanded state')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(50)
    if ((await menuButton.getAttribute('aria-expanded')) !== 'false') addError('mobile nav did not close with Escape')
    if (!(await menuButton.evaluate(element => element === document.activeElement))) addError('mobile nav focus was not restored after Escape')
  } else addError('mobile navigation control missing')

  await page.goto(`${BASE}/iletisim`, { waitUntil: 'domcontentloaded' })
  await page.fill('#name', 'Audit Kullanıcısı')
  await page.fill('#email', 'audit@example.com')
  await page.fill('#message', 'Bu yalnızca istemci doğrulama testidir ve gönderilmemelidir.')
  await page.locator('form.contact-form').evaluate(form => { form.noValidate = true })
  await page.locator('form.contact-form button[type="submit"]').click()
  const consentError = await page.locator('.form-error-msg').textContent({ timeout: 3000 }).catch(() => '')
  if (!consentError?.includes('KVKK')) addError('contact consent validation did not trigger')
  await page.locator('.kvkk-consent .checkbox-mark').click()
  await page.locator('form.contact-form button[type="submit"]').click()
  await page.waitForURL(`${BASE}/tesekkur`, { timeout: 3000 }).catch(() => {})
  const confirmedCopy = await page.getByText('İletişim talebiniz sunucu tarafından başarıyla kaydedildi.').textContent({ timeout: 2000 }).catch(() => '')
  if (!confirmedCopy) addError('successful contact response did not produce a confirmed state')

  await page.goto(`${BASE}/tesekkur?direct=1`, { waitUntil: 'domcontentloaded' })
  const directThankYouCopy = await page.getByText(/Talep durumu doğrulanamadı/i).textContent({ timeout: 2000 }).catch(() => '')
  if (!directThankYouCopy) addError('direct thank-you route presented an unverified success state')

  await page.goto(`${BASE}/proje-takip`, { waitUntil: 'domcontentloaded' })
  const protectedCopy = await page.getByText('Müşteri girişi gerekli').textContent({ timeout: 3000 }).catch(() => '')
  if (!protectedCopy) addError('project tracking route exposed without a customer session')

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(450)
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth)
    if (overflow > 1) addError(`/: horizontal overflow ${overflow}px at ${viewport.name}`)
    await page.screenshot({ path: new URL(`audit-home-${viewport.name}.png`, outputDir).pathname, fullPage: true })
  }

  for (const route of ['/hizmetler', '/iletisim']) {
    for (const viewport of [{ name: '390x844', width: 390, height: 844 }, { name: '1440x900', width: 1440, height: 900 }]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(200)
      await page.screenshot({
        path: new URL(`audit-${route.slice(1)}-${viewport.name}.png`, outputDir).pathname,
        fullPage: true,
      })
    }
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const noJsPage = await noJs.newPage()
  for (const route of ['/', '/hizmetler', '/iletisim']) {
    const response = await noJsPage.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
    const text = (await noJsPage.locator('body').innerText()).trim()
    if (response?.status() !== 200 || text.length < 80) addError(`${route}: insufficient no-JavaScript baseline`)
  }
  await noJs.close()

  consoleErrors.forEach(error => addError(`console: ${error}`))
  await writeFile(new URL('production-audit.json', outputDir), JSON.stringify({ generatedAt: new Date().toISOString(), results, errors }, null, 2))
  console.log(`Audited ${routes.length} routes, ${internalLinks.size} internal links, and ${viewports.length} viewports.`)
  console.log(`Report: ${new URL('production-audit.json', outputDir).pathname}`)
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exitCode = 1
  }
} finally {
  await browser.close()
  child?.kill('SIGTERM')
}
