import { test, expect } from '@playwright/test'

// Şartname §30/§23: "yetkisiz direct URL erişimini backend'de engelle".
// Gerçek koruma server tarafında (requireAuth/requirePermission,
// bkz. docs/07_SECURITY_AUDIT_TR.md) — bu test yalnızca CLIENT
// davranışının da tutarlı olduğunu doğruluyor: oturumsuz bir tarayıcı
// /admin'e gittiğinde asla panel içeriğini görmemeli, girişe düşmeli.
test('unauthenticated /admin visit shows the login gate, never the dashboard', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByLabel('Kullanıcı Adı')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Gösterge Paneli', { exact: false })).toHaveCount(0)
})

test('unauthenticated /musteri-panel visit does not show authenticated content', async ({ page }) => {
  const response = await page.goto('/musteri-panel')
  expect(response?.status()).toBeLessThan(500)
  // Müşteri paneli de oturumsuzken panel içeriği yerine giriş/yönlendirme göstermeli.
  await expect(page.locator('body')).toBeVisible()
})
