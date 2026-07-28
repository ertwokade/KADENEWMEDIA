import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Otomatik WCAG 2.1 AA taraması (axe-core).
 *
 * Otomatik tarama ihlallerin yaklaşık üçte birini yakalar; klavye akışı,
 * odak sırası ve ekran okuyucu deneyimi tests/e2e/design-system.spec.js
 * içindeki davranış testleriyle ve elle kontrolle tamamlanır.
 *
 * Kural seti: wcag2a + wcag2aa + wcag21a + wcag21aa.
 */

const RULE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Layout kabuklarını temsil eden rotalar.
const ROUTES = [
  '/hakkimizda',
  '/hizmetler',
  '/hizmetler/sosyal-medya-yonetimi',
  '/paketler',
  '/sss',
  '/iletisim',
  '/teklif-al',
  '/kariyer',
  '/ekip',
  '/blog',
  '/partnerler',
  '/giris',
  '/admin',
]

/**
 * Ana sayfa (`/`) taranmaz: kaynağı bu repoda olmayan, başka bir Next.js
 * projesinden alınmış minified snapshot'tır. İhlalleri düzeltilemez;
 * yanlış bir "yeşil" izlenimi vermemek için kapsam dışıdır ve
 * docs/route-audit.md içinde açıkça belirtilir.
 */

/** İhlalleri okunabilir tek satırlara indirger. */
function summarize(violations) {
  return violations.map((v) => {
    const where = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')
    return `[${v.impact}] ${v.id}: ${v.help} → ${where}${v.nodes.length > 3 ? ` (+${v.nodes.length - 3})` : ''}`
  })
}

for (const route of ROUTES) {
  test(`WCAG 2.1 AA: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(RULE_TAGS)
      // Dekoratif canvas/3B sahneler metin taşımaz; axe'ın renk kontrastı
      // hesabı bunların üzerindeki metni yanlış ölçüyor.
      .exclude('canvas')
      .analyze()

    // "serious" ve "critical" ihlaller geçilemez; "minor"/"moderate"
    // kayıtları rapora yazılır ama build'i düşürmez.
    const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    const advisory = results.violations.filter((v) => !['serious', 'critical'].includes(v.impact))

    if (advisory.length) {
      console.log(`  ${route} — bilgilendirici:\n    ${summarize(advisory).join('\n    ')}`)
    }

    expect(blocking, `${route}\n  ${summarize(blocking).join('\n  ')}`).toEqual([])
  })
}

test.describe('mobil WCAG', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const route of ['/hakkimizda', '/iletisim', '/teklif-al', '/admin']) {
    test(`WCAG 2.1 AA mobil: ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(RULE_TAGS)
        .exclude('canvas')
        .analyze()

      const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
      expect(blocking, `${route}\n  ${summarize(blocking).join('\n  ')}`).toEqual([])
    })
  }
})
