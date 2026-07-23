import { test, expect } from '@playwright/test'

// Şartname §6.1: "Mobilde yatay taşma, küçük tıklama alanı, sabit
// eleman çakışması ... sorunlarını bitir." Bu test yalnızca en yaygın
// ve en kolay otomatik tespit edilebilen sorunu (yatay taşma) kontrol
// eder — tıklama alanı boyutu/manuel görsel inceleme kapsamı dışında,
// gerçek cihaz testi hâlâ gerekli (bkz. docs/11_LAUNCH_READINESS_TR.md
// madde 14, "doğrulanmadı" olarak işaretli).
test.describe('mobile-chromium', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const KEY_ROUTES = ['/', '/hizmetler', '/paketler', '/iletisim', '/blog', '/sss']

  for (const route of KEY_ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      // Birkaç pikseli (kaydırma çubuğu/subpixel rendering) tolere et.
      expect(scrollWidth - clientWidth, `${route}: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`).toBeLessThanOrEqual(5)
    })
  }
})
