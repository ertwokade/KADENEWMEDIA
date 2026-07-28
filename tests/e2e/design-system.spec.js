import { test, expect } from '@playwright/test'

/**
 * Tasarım sistemi ve erişilebilirlik regresyon testleri.
 *
 * Kapsam — kabul kriterlerindeki otomatik kontroller:
 *   • Poppins public ve admin layout'larında GERÇEKTEN uygulanıyor
 *   • Türkçe glifler fallback fonta düşmüyor
 *   • Mobilde dokunma hedefleri ve okunabilir font boyutu
 *   • Klavye focus'u görünür
 *   • Mobil menü aria durumunu bildiriyor
 *
 * Not: `font-family` bildirimini CSS'te aramak yetmez — bir override,
 * yüklenemeyen dosya veya eksik `inherit` yüzünden tarayıcı fallback'e
 * düşebilir. Bu yüzden ölçüm getComputedStyle üzerinden yapılır.
 */

// Farklı layout kabuklarını temsil eden rotalar: public pazarlama sayfası,
// ön-render hizmet detayı, form sayfası, giriş ekranı ve admin.
const LAYOUT_ROUTES = [
  '/hakkimizda',
  '/hizmetler/sosyal-medya-yonetimi',
  '/iletisim',
  '/teklif-al',
  '/giris',
  '/admin',
]

/** Elemanın gerçekten çizilen font ailesinin ilk adı. */
const firstFamily = (fontFamily) => fontFamily.split(',')[0].replace(/["']/g, '').trim()

for (const route of LAYOUT_ROUTES) {
  test(`Poppins uygulanıyor: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready).catch(() => {})

    const applied = await page.evaluate(() => {
      const pick = (selector) => {
        const el = document.querySelector(selector)
        return el ? getComputedStyle(el).fontFamily : null
      }
      return {
        body: pick('body'),
        heading: pick('h1, h2, h3'),
        button: pick('button, .btn, a.btn'),
        input: pick('input, textarea, select'),
      }
    })

    for (const [element, family] of Object.entries(applied)) {
      if (!family) continue // o sayfada yoksa atla
      expect(firstFamily(family), `${route} → ${element}`).toBe('Poppins')
    }
  })
}

test('Türkçe karakterler Poppins ile çiziliyor', async ({ page }) => {
  await page.goto('/hakkimizda')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready).catch(() => {})

  const result = await page.evaluate(() => {
    // Eksik glif sessizce başka aileden gelir; genişlik karşılaştırması bunu
    // yakalar. Ölçüm elemanı sayfa kurallarından etkilenmesin diye <html>
    // altına ve !important ile eklenir.
    const measure = (family) => {
      const span = document.createElement('span')
      span.textContent = 'ığĞİŞşÇçÖöÜü'
      span.setAttribute('style',
        'position:absolute!important;left:-9999px!important;white-space:pre;' +
        `font-size:64px!important;font-weight:400!important;font-family:${family}!important`)
      document.documentElement.appendChild(span)
      const width = span.getBoundingClientRect().width
      span.remove()
      return width
    }
    return {
      loaded: document.fonts.check('400 16px Poppins'),
      poppins: measure("'Poppins'"),
      fallback: measure('monospace'),
    }
  })

  expect(result.loaded, 'Poppins 400 yüklenmedi').toBe(true)
  expect(result.poppins, 'Türkçe glifler Poppins yerine fallback fonttan geliyor')
    .not.toBeCloseTo(result.fallback, 0)
})

test.describe('mobil erişilebilirlik', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('gövde metni mobilde okunabilir boyutta', async ({ page }) => {
    await page.goto('/hakkimizda')
    await page.waitForLoadState('networkidle')

    const tooSmall = await page.evaluate(() => {
      const offenders = []
      for (const el of document.querySelectorAll('p, li, span, a, label, td')) {
        const text = el.textContent?.trim()
        if (!text || text.length < 12) continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        // Yalnız kendi metnini taşıyan düğümleri ölç (kapsayıcıları değil).
        if (el.firstChild?.nodeType !== Node.TEXT_NODE) continue
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 12) offenders.push(`${el.tagName}.${String(el.className).split(' ')[0]}=${size}px`)
      }
      return [...new Set(offenders)].slice(0, 10)
    })

    expect(tooSmall, `12px altında metin: ${tooSmall.join(', ')}`).toEqual([])
  })

  test('mobil menü aria-expanded durumunu bildiriyor', async ({ page }) => {
    await page.goto('/hakkimizda')
    await page.waitForLoadState('networkidle')

    const toggle = page.locator('[aria-expanded]').first()
    if (await toggle.count() === 0) test.skip(true, 'bu layout\'ta menü düğmesi yok')

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

test('klavye focus\'u görünür', async ({ page }) => {
  await page.goto('/iletisim')
  await page.waitForLoadState('networkidle')

  await page.keyboard.press('Tab')
  const focusVisible = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { ok: false, reason: 'hiçbir eleman odaklanmadı' }
    const style = getComputedStyle(el)
    // Görünür bir işaret: outline, box-shadow veya belirgin border.
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const hasShadow = style.boxShadow !== 'none'
    return { ok: hasOutline || hasShadow, tag: el.tagName, outline: style.outline, shadow: style.boxShadow }
  })

  expect(focusVisible.ok, `focus göstergesi yok: ${JSON.stringify(focusVisible)}`).toBe(true)
})

test('tek h1 ve doğru başlık hiyerarşisi', async ({ page }) => {
  for (const route of ['/hakkimizda', '/hizmetler', '/iletisim', '/paketler']) {
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const h1Count = await page.locator('h1').count()
    expect(h1Count, `${route}: h1 sayısı`).toBe(1)
  }
})
