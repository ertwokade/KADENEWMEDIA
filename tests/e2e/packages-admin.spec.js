import { expect, test } from '@playwright/test'

test('admin paket fiyatları statik canlı /paketler sayfasına yansır', async ({ page }) => {
  await page.route('**/api/content?section=packages', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      section: 'packages',
      data: { items: [{ id: 'baslangic', priceTRY: '12.500', priceUSD: '390', priceNote: 'başlangıç fiyatı' }] },
    }),
  }))

  await page.goto('/paketler')
  const scope = page.locator('[data-package-id="baslangic"]')
  await expect(scope.locator('[data-package-price]')).toBeVisible()
  await expect(scope).toContainText('12.500 ₺')
  await expect(scope).toContainText('$390')
  await expect(scope).toContainText('başlangıç fiyatı')
})

test('paket API erişilemezse fiyat uydurulmaz', async ({ page }) => {
  await page.route('**/api/content?section=packages', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }))
  await page.goto('/paketler')
  await expect(page.locator('[data-package-price]:visible')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Teklif al/i }).first()).toBeVisible()
})
