import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ json: {} }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('static blog lists published articles with free-form dates and distinguishes API errors', async ({ page }) => {
  let fail = false
  await page.route('**/api/blog', route => route.fulfill(fail ? { status: 503, json: {} } : { json: [{ slug: 'ornek-yazi', titleTr: 'Örnek yazı', date: '26 Ağu 2026', excerptTr: '<script>metin</script>' }] }))
  await page.goto('/blog')
  await expect(page.getByRole('link', { name: 'Yazıyı oku →' })).toHaveAttribute('href', '/blog/ornek-yazi')
  await expect(page.locator('[data-kade-blog-list]')).toContainText('26 Ağu 2026')
  await expect(page.locator('[data-kade-blog-list] script')).toHaveCount(0)
  fail = true
  await page.reload()
  await expect(page.locator('[data-kade-blog-list]')).toContainText('yüklenemedi')
  await expect(page.locator('[data-kade-blog-list]')).not.toContainText('yayında doğrulanmış bir yazı yok')
})

test('references render CMS comments rather than duplicate portfolio cards', async ({ page }, info) => {
  await page.route('**/api/content?section=testimonials', route => route.fulfill({ json: { data: { items: [
    { nameTr: 'Test Müşteri', textTr: 'İzinli yorum örneği', roleTr: 'Test rolü' },
    { nameTr: 'Gizli yorum', textTr: 'Yayınlanmayacak', published: false },
  ] } } }))
  await page.goto('/referanslar')
  await expect(page.getByText('İzinli yorum örneği', { exact: true })).toBeVisible()
  await expect(page.getByText('Yayınlanmayacak', { exact: true })).toHaveCount(0)
  await expect(page.locator('.client-showcase')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'portfolyoyu inceleyin' })).toHaveAttribute('href', '/portfolio')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.locator('[data-kade-public-content]').screenshot({ path: info.outputPath('references-cms.png') })
})

test('public stats show real zero, not invented counters; retry is distinct from empty', async ({ page }) => {
  let fail = true
  let rows = [{ sayi: 0, etiket: 'Kampanya' }]
  await page.route('**/api/content?section=nedenBiz&view=public-stats', route => route.fulfill(fail ? { status: 503, json: {} } : { json: { data: { rakamlar: rows } } }))
  await page.goto('/neden-biz')
  const stats = page.getByRole('region', { name: 'Yayınlanan istatistikler' })
  await expect(stats.getByRole('alert')).toContainText('yüklenemedi')
  fail = false
  await stats.getByRole('button', { name: 'Yeniden dene' }).click()
  await expect(stats.locator('strong')).toHaveText('0')
  await expect(stats).toContainText('Kampanya')
  rows = []
  await page.reload()
  await expect(stats).toContainText('Sayısal sonuçlar henüz yayınlanmadı')
})

test('package heading matches navigation and static pages follow system theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/paketler')
  await expect(page).toHaveTitle('Paketler | Kade New Media')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paketler')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull()
  const mobileMenu = page.getByRole('button', { name: 'Menüyü aç', exact: true })
  if (await mobileMenu.isVisible()) await mobileMenu.click()
  await page.getByRole('button', { name: 'Karanlık temaya geç' }).first().click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await page.goto('/referanslar')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('React article entry respects system theme without overwriting a saved choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.route('**/api/blog*', route => route.fulfill({ json: [] }))
  await page.goto('/blog/olmayan-yazi')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('system')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
})

test('homepage snapshot keeps its native theme and shared CSS theme synchronized', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-kade-enhanced', '', { timeout: 15000 })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: /^Theme:/ }).filter({ visible: true }).first().click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.goto('/paketler')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
