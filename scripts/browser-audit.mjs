#!/usr/bin/env node
/**
 * Canlı görsel karşılaştırma denetimi — kadenewmedia.com ↔ haoqi.design
 *
 * Yalnız HTML/başlık okumak canlı inceleme sayılmaz. Bu script gerçek
 * tarayıcıda üç viewport'ta gezinir, bölüm bölüm ekran görüntüsü alır,
 * hover/scroll/menü etkileşimlerini dener, konsolu dinler ve zamanlama
 * ölçer.
 *
 * Kullanım:
 *   node scripts/browser-audit.mjs                 # her iki canlı site
 *   AUDIT_TARGET=local node scripts/browser-audit.mjs   # yerel site
 *   AUDIT_LABEL=sonra node scripts/browser-audit.mjs    # sonra ölçümü
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../docs/browser-audit/', import.meta.url))
await mkdir(OUT, { recursive: true })

const LABEL = process.env.AUDIT_LABEL || 'once'
const TARGET = process.env.AUDIT_TARGET || 'live'

// Yerel hedef varsayılan olarak Vite dev sunucusudur; AUDIT_URL ile üretim
// derlemesi (scripts/serve-dist.mjs, 4173) da ölçülebilir. Kabul kriterleri
// üretim derlemesinde doğrulanmalıdır — dev sunucusu farklı zamanlama üretir.
const SITES = TARGET === 'local'
  ? [{ id: 'kade-local', url: process.env.AUDIT_URL || 'http://127.0.0.1:5173', name: 'Kade (yerel)' }]
  : [
      { id: 'kade', url: 'https://kadenewmedia.com', name: 'Kade New Media (canlı)' },
      { id: 'haoqi', url: 'https://haoqi.design', name: 'Haoqi (referans)' },
    ]

const VIEWPORTS = [
  { id: '1440x900', width: 1440, height: 900 },
  { id: '1024x768', width: 1024, height: 768 },
  { id: '390x844', width: 390, height: 844, mobile: true },
]

const results = []

const browser = await chromium.launch()

for (const site of SITES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: Boolean(vp.mobile),
      hasTouch: Boolean(vp.mobile),
      userAgent: vp.mobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
    })
    const page = await ctx.newPage()

    const consoleErrors = []
    const consoleWarnings = []
    const failedRequests = []
    page.on('console', (m) => {
      const text = m.text().slice(0, 200)
      if (m.type() === 'error') consoleErrors.push(text)
      else if (m.type() === 'warning') consoleWarnings.push(text)
    })
    page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${String(e.message).slice(0, 200)}`))
    page.on('requestfailed', (r) => {
      const err = r.failure()?.errorText || ''
      if (!err.includes('ERR_ABORTED')) failedRequests.push(`${r.url().slice(0, 120)} :: ${err}`)
    })
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url().slice(0, 120)}`)
    })

    const record = { site: site.id, siteName: site.name, viewport: vp.id, url: site.url }
    const t0 = Date.now()

    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      record.domContentLoadedMs = Date.now() - t0

      // ── İlk boya zamanlaması: metin ne zaman görünür oldu? ────────────
      record.firstTextMs = await page.evaluate(() => new Promise((resolve) => {
        const started = performance.now()
        const check = () => {
          const text = (document.body?.innerText || '').trim()
          if (text.length > 40) return resolve(Math.round(performance.now()))
          if (performance.now() - started > 8000) return resolve(-1)
          requestAnimationFrame(check)
        }
        check()
      })).catch(() => null)

      // ── Ana görsel/canvas ne zaman hazır? ─────────────────────────────
      record.heroVisualMs = await page.evaluate(() => new Promise((resolve) => {
        const started = performance.now()
        const ready = () => {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            const r = canvas.getBoundingClientRect()
            if (r.width > 100 && r.height > 100 && getComputedStyle(canvas).opacity !== '0') return true
          }
          const img = [...document.images].find((i) => {
            const r = i.getBoundingClientRect()
            return i.complete && i.naturalWidth > 0 && r.width > 200 && r.height > 150
          })
          return Boolean(img)
        }
        const check = () => {
          if (ready()) return resolve(Math.round(performance.now()))
          if (performance.now() - started > 10000) return resolve(-1)
          requestAnimationFrame(check)
        }
        check()
      })).catch(() => null)

      await page.waitForTimeout(1500)

      // ── Sayfa yapısı ölçümleri ────────────────────────────────────────
      record.structure = await page.evaluate(() => {
        const de = document.documentElement
        const rect = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } }

        // Proje kartları: <article> ve benzeri
        const articles = [...document.querySelectorAll('article')]
        const cardHeights = articles.map((a) => Math.round(a.getBoundingClientRect().height))

        // Seçili işler bölümü
        const workSection = document.querySelector('#selected-work, [id*="work"], [class*="work"], #isler')

        // Yatay taşan elemanlar
        const overflow = []
        const limit = de.clientWidth + 2
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right <= limit && r.left >= -2) continue
          const st = getComputedStyle(el)
          if (['auto', 'scroll', 'hidden'].includes(st.overflowX)) continue
          overflow.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || '?'} right=${Math.round(r.right)}`)
          if (overflow.length >= 6) break
        }

        // Kırpılan metin (scrollWidth > clientWidth)
        const clipped = []
        for (const el of document.querySelectorAll('h1, h2, h3, p, span, a')) {
          if (!el.firstChild || el.firstChild.nodeType !== Node.TEXT_NODE) continue
          const text = el.textContent.trim()
          if (text.length < 4) continue
          if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0) {
            clipped.push(`${el.tagName.toLowerCase()}: "${text.slice(0, 34)}" ${el.scrollWidth}>${el.clientWidth}`)
            if (clipped.length >= 6) break
          }
        }

        return {
          scrollHeight: de.scrollHeight,
          scrollWidth: de.scrollWidth,
          clientWidth: de.clientWidth,
          horizontalOverflow: de.scrollWidth > de.clientWidth + 1,
          overflowingElements: overflow,
          clippedText: clipped,
          canvasCount: document.querySelectorAll('canvas').length,
          canvasSizes: [...document.querySelectorAll('canvas')].map(rect),
          articleCount: articles.length,
          cardHeights,
          zeroHeightCards: cardHeights.filter((h) => h === 0).length,
          workSectionHeight: workSection ? Math.round(workSection.getBoundingClientRect().height) : null,
          headerCount: document.querySelectorAll('header').length,
          h1Count: document.querySelectorAll('h1').length,
          imageCount: document.images.length,
          brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
        }
      })

      // ── Dış bağlantı denetimi ─────────────────────────────────────────
      record.links = await page.evaluate(() => {
        const all = [...document.querySelectorAll('a[href]')]
        const external = all.map((a) => a.getAttribute('href')).filter((h) => /^https?:/.test(h))
        return {
          total: all.length,
          placeholderHash: all.filter((a) => a.getAttribute('href') === '#').length,
          suspicious: [...new Set(external.filter((h) => /community\/plugin|figma\.com\/file\/\?|localhost|example\.com/.test(h)))].slice(0, 8),
          externalSample: [...new Set(external)].slice(0, 12),
        }
      })

      // ── Bölüm bölüm ekran görüntüsü ───────────────────────────────────
      const shot = async (name) => {
        const path = `${OUT}${LABEL}-${site.id}-${vp.id}-${name}.png`
        await page.screenshot({ path })
        return path.replace(fileURLToPath(new URL('../', import.meta.url)), '')
      }

      record.screenshots = {}
      record.screenshots.hero = await shot('01-hero')

      const total = record.structure.scrollHeight
      const stops = [
        ['02-bio', Math.round(total * 0.12)],
        ['03-selected-work', Math.round(total * 0.32)],
        ['04-mid-scene', Math.round(total * 0.55)],
        ['05-pre-footer', Math.round(total * 0.8)],
        ['06-footer', total],
      ]
      for (const [name, y] of stops) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
        await page.waitForTimeout(900)
        record.screenshots[name.slice(3)] = await shot(name)
      }

      // ── Etkileşim: hover (yalnız masaüstü) ────────────────────────────
      if (!vp.mobile) {
        await page.evaluate(() => window.scrollTo({ top: Math.round(document.documentElement.scrollHeight * 0.32), behavior: 'instant' }))
        await page.waitForTimeout(600)
        const card = page.locator('article, [class*="card"]').first()
        if (await card.count()) {
          const before = await card.boundingBox().catch(() => null)
          await card.hover({ timeout: 3000 }).catch(() => {})
          await page.waitForTimeout(700)
          const after = await card.boundingBox().catch(() => null)
          record.hover = {
            worked: Boolean(before && after),
            changed: before && after ? Math.abs(before.width - after.width) > 1 || Math.abs(before.height - after.height) > 1 : null,
          }
          record.screenshots.hover = await shot('07-hover')
        }
      }

      // ── Etkileşim: menü ───────────────────────────────────────────────
      const menuBtn = page.locator('button[aria-expanded], [aria-label*="enu" i], .knav-burger, .mobile-menu-btn').first()
      if (await menuBtn.count()) {
        await menuBtn.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(700)
        record.menu = await page.evaluate(() => ({
          expanded: document.querySelector('[aria-expanded]')?.getAttribute('aria-expanded') ?? null,
          bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
          focusInside: Boolean(document.activeElement && document.activeElement !== document.body),
        }))
        record.screenshots.menu = await shot('08-menu')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        record.menu.closesOnEscape = await page.evaluate(() =>
          document.querySelector('[aria-expanded]')?.getAttribute('aria-expanded') !== 'true')
      }

      record.consoleErrors = [...new Set(consoleErrors)].slice(0, 10)
      record.consoleWarnings = [...new Set(consoleWarnings)].slice(0, 10)
      record.failedRequests = [...new Set(failedRequests)].slice(0, 10)
    } catch (err) {
      record.error = String(err.message).slice(0, 200)
    }

    results.push(record)
    const s = record.structure || {}
    console.log(
      `${site.id.padEnd(11)} ${vp.id.padEnd(9)} ` +
      `metin=${record.firstTextMs ?? '?'}ms görsel=${record.heroVisualMs ?? '?'}ms ` +
      `kart=${s.articleCount ?? '?'}(0px:${s.zeroHeightCards ?? '?'}) ` +
      `taşma=${s.horizontalOverflow ? 'VAR' : 'yok'} ` +
      `hata=${(record.consoleErrors || []).length}`,
    )

    await page.close()
    await ctx.close()
  }
}

await browser.close()
await writeFile(`${OUT}${LABEL}-audit.json`, JSON.stringify(results, null, 2))
console.log(`\nRapor: docs/browser-audit/${LABEL}-audit.json`)
console.log(`Ekran görüntüleri: docs/browser-audit/${LABEL}-*.png`)
