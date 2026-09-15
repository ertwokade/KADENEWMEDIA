import { test, expect } from '@playwright/test'

// Pazarlama rotaları statik Kade kabuğu, giriş ve admin ise React ürün
// kabuğudur. Testler eski React ana sayfasının sınıflarını değil, canlı build
// mimarisinin gerçekten çizdiği öğeleri ölçer.
const LAYOUT_ROUTES = [
  ['/hakkimizda', 'Montserrat Kade'],
  ['/hizmetler/sosyal-medya-yonetimi', 'Montserrat Kade'],
  ['/iletisim', 'Montserrat Kade'],
  ['/teklif-al', 'Montserrat Kade'],
  ['/giris', 'Poppins'],
  ['/admin', 'Poppins'],
]

const firstFamily = (fontFamily) => fontFamily.split(',')[0].replace(/["']/g, '').trim()

for (const [route, expectedFamily] of LAYOUT_ROUTES) {
  test(`${expectedFamily} uygulanıyor: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready).catch(() => {})
    const applied = await page.evaluate(() => {
      const pick = (selector) => {
        const el = document.querySelector(selector)
        return el ? getComputedStyle(el).fontFamily : null
      }
      return {
        heading: pick('h1, h2, h3'),
        button: pick('button, .btn, a.btn'),
        input: pick('input, textarea, select'),
      }
    })
    for (const [element, family] of Object.entries(applied)) {
      if (!family) continue
      expect(firstFamily(family), `${route} → ${element}`).toBe(expectedFamily)
    }
  })
}

test('Türkçe karakterler pazarlama fontuyla çiziliyor', async ({ page }) => {
  await page.goto('/hakkimizda')
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  const result = await page.evaluate(() => {
    const measure = (family) => {
      const span = document.createElement('span')
      span.textContent = 'ığĞİŞşÇçÖöÜü'
      span.setAttribute('style', `position:absolute!important;left:-9999px!important;white-space:pre;font-size:64px!important;font-weight:400!important;font-family:${family}!important`)
      document.documentElement.appendChild(span)
      const width = span.getBoundingClientRect().width
      span.remove()
      return width
    }
    return {
      loaded: document.fonts.check('400 16px "Montserrat Kade"'),
      brand: measure('"Montserrat Kade"'),
      fallback: measure('monospace'),
    }
  })
  expect(result.loaded, 'Montserrat Kade 400 yüklenmedi').toBe(true)
  expect(result.brand, 'Türkçe glifler fallback fonttan geliyor').not.toBeCloseTo(result.fallback, 0)
})

test.describe('mobil erişilebilirlik', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('ana içerik metni mobilde okunabilir boyutta', async ({ page }) => {
    await page.goto('/hakkimizda')
    const tooSmall = await page.locator('main').evaluate((main) => {
      const offenders = []
      for (const el of main.querySelectorAll('p, li, span, a, label, td')) {
        const text = el.textContent?.trim()
        if (!text || text.length < 12) continue
        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height || el.firstChild?.nodeType !== Node.TEXT_NODE) continue
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 12) offenders.push(`${el.tagName}.${String(el.className).split(' ')[0]}=${size}px`)
      }
      return [...new Set(offenders)].slice(0, 10)
    })
    expect(tooSmall, `12px altında içerik: ${tooSmall.join(', ')}`).toEqual([])
  })

  test('mobil menü aria-expanded durumunu bildiriyor', async ({ page }) => {
    await page.goto('/hakkimizda')
    const toggle = page.locator('.kade-static-menu-toggle:visible')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

test('klavye focus göstergesi görünür', async ({ page }) => {
  await page.goto('/iletisim')
  await page.keyboard.press('Tab')
  const result = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { ok: false }
    const style = getComputedStyle(el)
    return {
      ok: (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none',
      tag: el.tagName,
    }
  })
  expect(result.ok, `focus göstergesi yok: ${JSON.stringify(result)}`).toBe(true)
})

test('her temel sayfada tek h1 var', async ({ page }) => {
  for (const route of ['/hakkimizda', '/hizmetler', '/iletisim', '/paketler']) {
    await page.goto(route)
    await expect(page.locator('h1'), route).toHaveCount(1)
  }
})

for (const viewport of [
  { id: '1440x900', width: 1440, height: 900 },
  { id: '1024x768', width: 1024, height: 768 },
  { id: '390x844', width: 390, height: 844 },
]) {
  test(`ana sayfa başlığı ve CTA görünür (${viewport.id})`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-kade-loaded', '', { timeout: 10_000 })
    await expect(page.getByText('Biz', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('markanı', { exact: true })).toBeVisible()
    await expect(page.getByText('büyütüyoruz', { exact: true })).toBeVisible()
    await expect(page.locator('.kade-hero-cta a')).toHaveCount(2, { timeout: 10_000 })
  })
}

test('ana sayfa tanıtımı eski şablon adlarını taşımıyor', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/İstanbul merkezli ekibimiz/)).toContainText('içerik üretimi', { timeout: 10_000 })
  const text = await page.locator('body').innerText()
  expect(text).not.toMatch(/Haoqi|Reunimos|aDrive|Teambition|Inspire Mono|Wasm design utils/i)
})

test('footer sloganı iki görünümde de eksiksiz ve görünür', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-kade-loaded', '', { timeout: 10_000 })
    const words = page.locator('footer#contact > div:not(.absolute) > span')
    await expect(words).toHaveCount(4)
    await expect(page.locator('footer#contact')).toContainText('Hadi')
    await expect(page.locator('footer#contact')).toContainText('birlikte')
    await expect(page.locator('footer#contact')).toContainText('iş')
    await expect(page.locator('footer#contact')).toContainText('üretelim')
    expect(await words.evaluateAll((elements) => elements.every((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }))).toBe(true)
  }
})
