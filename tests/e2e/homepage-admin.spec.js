import { expect, test } from '@playwright/test'

test('admin homepage content updates the Haoqi snapshot', async ({ page }) => {
  await page.route('**/api/content?section=homepage', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        section: 'homepage',
        data: {
          brandName: 'Test Marka',
          location: 'BURSA',
          coordinates: '40.19° N',
          themeLabel: 'RENK',
          showSignature: false,
          showLogin: true,
          loginLabel: 'PANEL →',
          loginUrl: '/admin',
          navItems: [{ label: 'TEST MENÜ', url: '/test' }],
          hero: {
            kickerLines: ['YENİ', 'MEDYA'],
            statement: 'Test kısa metin',
            description: 'Test açıklama metni',
            titleLines: ['YENİ', 'ANA', 'BAŞLIK'],
          },
          intro: { primary: 'Birinci test paragrafı', secondary: 'İkinci test paragrafı' },
          workItems: [
            { title: 'Test Kartı', label: 'Proje', url: '/portfolio/test', image: '' },
            { title: 'Eklenen Kart', label: 'Hizmet', url: '/hizmetler', image: '' },
          ],
          statementLines: ['YENİ', 'ARA', 'SLOGAN'],
          contactLines: ['BİZE', 'ULAŞ', 'PROJENİ', 'ANLAT'],
          email: 'test@example.com',
          socialLinks: [{ label: 'Instagram', url: 'https://instagram.com/example' }],
          accentColor: '#123456',
        },
      }),
    })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('YENİANABAŞLIK')
  await expect(page.locator('header')).toContainText('Test Marka')
  await expect(page.locator('#selected-work article')).toHaveCount(2)
  await expect(page.locator('#selected-work')).toContainText('Eklenen Kart')
  await expect(page.locator('footer#contact')).toContainText('PROJENİ')
  await expect(page.locator('footer#contact a[href="mailto:test@example.com"]')).toBeVisible()
  await expect(page.locator('svg.svg-sign')).toBeHidden()
  await expect(page.locator('#kade-login-btn')).toHaveAttribute('href', '/admin')
})
