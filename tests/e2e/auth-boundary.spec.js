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

for (const path of ['/musteri-panel', '/proje-takip', '/organizasyon-kiti', '/kade-kit-business']) {
  test(`unauthenticated ${path} uses the same explicit customer login gate`, async ({ page }) => {
    await page.route('**/api/customer-auth?action=session', route => route.fulfill({
      status: 401,
      json: { authenticated: false },
    }))

    const response = await page.goto(path)
    expect(response?.status()).toBeLessThan(500)
    await expect(page.getByRole('heading', { name: 'Bu alan için müşteri girişi gerekli.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Giriş Yap' })).toHaveAttribute('href', '/giris/danismanlik')
    await expect(page.getByText('Hoş geldin,', { exact: false })).toHaveCount(0)
  })
}

for (const [path, heading] of [
  ['/organizasyon-kiti', 'Kade Organizasyon Kiti aktif danışmanlık planlarına özeldir.'],
  ['/kade-kit-business', 'Kade Kit Business erişimi aktif planlara özeldir.'],
]) {
  test(`authenticated customer without entitlement sees the package gate on ${path}`, async ({ page }) => {
    await page.route('**/api/customer-auth?action=session', route => route.fulfill({
      json: { authenticated: true, customer: { id: 'customer-e2e', name: 'Test Müşteri', email: 'test@example.test' } },
    }))
    await page.route('**/api/customer-portal', route => route.fulfill({
      json: { packages: [], entitlements: {} },
    }))

    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.getByRole('link', { name: /Planlarını İncele/ })).toHaveAttribute('href', '/paketler')
    await expect(page.getByRole('link', { name: 'Giriş Yap' })).toHaveCount(0)
  })
}
