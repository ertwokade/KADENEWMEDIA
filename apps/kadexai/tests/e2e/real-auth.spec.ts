import { expect, test } from '@playwright/test'

test('real Supabase login, logout and browser back stay protected', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The disposable staging account is exercised once on desktop Chromium.')
  const email = process.env.E2E_REAL_EMAIL
  const password = process.env.E2E_REAL_PASSWORD
  test.skip(!email || !password, 'E2E_REAL_EMAIL and E2E_REAL_PASSWORD are required.')

  await page.goto('/kadexai/login')
  await page.locator('#auth-email').fill(email!)
  await page.locator('#auth-password').fill(password!)
  await page.locator('form').getByRole('button', { name: 'Giriş Yap', exact: true }).click()
  await page.waitForURL('**/kadexai/dashboard')
  await expect(page).toHaveURL(/\/kadexai\/dashboard$/)

  await page.goto('/kadexai/login')
  await page.waitForURL('**/kadexai/dashboard')

  await page.goto('/kadexai/logout')
  await page.waitForURL('**/kadexai/login')
  const profileAfterLogout = await page.request.get('/kadexai/api/profile')
  expect(profileAfterLogout.status()).toBe(401)

  await page.goBack()
  await page.waitForURL('**/kadexai/login')
  await page.reload()
  await expect(page).toHaveURL(/\/kadexai\/login$/)

  const dashboardAfterLogout = await page.request.get('/kadexai/dashboard', { maxRedirects: 0 })
  expect([302, 303, 307, 308]).toContain(dashboardAfterLogout.status())
  expect(dashboardAfterLogout.headers().location).toContain('/kadexai/login')
})
