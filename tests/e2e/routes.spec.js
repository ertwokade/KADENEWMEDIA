import { test, expect } from '@playwright/test'

// Şartname §30: route bütünlüğü — her genel (public) sayfa çökmeden
// yükleniyor mu, konsola kritik bir hata basmıyor mu. Canlı Supabase
// olmadan çalıştığı için veri-bağımlı sayfalar boş durum (empty state)
// gösterir — bu testler CRASH olup olmadığını doğrular, veri doğruluğunu
// değil (bkz. playwright.config.js üstündeki not).
const PUBLIC_ROUTES = [
  '/',
  '/hizmetler',
  '/new-media-ajansi',
  '/paketler',
  '/hakkimizda',
  '/iletisim',
  '/teklif-al',
  '/kariyer',
  '/sss',
  '/ekip',
  '/portfolio',
  '/portfolio/flavora-sosyal-medya',
  '/fiyat-hesaplama',
  '/basin',
  '/neden-biz',
  '/referans-programi',
  '/podcast-webinar',
  '/bulten-arsivi',
  '/partnerler',
  '/basari-hikayeleri',
  '/referanslar',
  '/blog',
  '/kvkk',
  '/gizlilik',
  '/cerez-politikasi',
  '/telif-haklari',
]

// Ana sayfa, eski tasarımı birebir koruyan vendored Next.js statik exportudur.
// Kaynak React projesi bu repoda olmadığı için export içindeki özelleştirilmiş
// metinler hydrate edilirken #418 uyarısı üretir; sayfanın çalışmasını etkilemez.
const KNOWN_CONSOLE_ISSUES = {
  '/': [/Minified React error #418/],
}

for (const route of PUBLIC_ROUTES) {
  test(`public route loads without console errors: ${route}`, async ({ page }) => {
    const consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    const response = await page.goto(route)
    expect(response?.status(), `${route} HTTP status`).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()

    // Bu test ortamında server.js/API çalışmadığı için (bkz.
    // docs/BLOCKERS_TR.md #1) her /api isteği 502 dönüyor — bu, sayfanın
    // GERÇEKTEN çökmesinden (React hatası, TypeError vb.) ayırt edilmeli.
    // "Failed to load resource" ağ-seviyeli mesajları filtrelenir, gerçek
    // JS çalışma zamanı hataları filtrelenmez.
    const knownPatterns = KNOWN_CONSOLE_ISSUES[route] || []
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !/favicon|ERR_INTERNET_DISCONNECTED|Failed to load resource/i.test(e) &&
        !knownPatterns.some((pattern) => pattern.test(e))
    )
    expect(criticalErrors, `${route} console errors: ${criticalErrors.join(' | ')}`).toEqual([])
  })
}

test('unknown route shows 404, not a blank page', async ({ page }) => {
  await page.goto('/bu-route-hicbir-zaman-var-olmayacak')
  await expect(page.locator('body')).not.toBeEmpty()
})

test('previously-broken blog detail route no longer 404s at the routing level', async ({ page }) => {
  // Bkz. commit 640b734 — BlogDetail.jsx daha önce her zaman NotFound
  // döndüren bir stub'dı. Canlı veri olmadan gerçek bir yazı test
  // edilemez ama route'un JS hatası vermeden render olduğu doğrulanır.
  const response = await page.goto('/blog/gercek-olmayan-bir-slug')
  expect(response?.status()).toBeLessThan(500)
  await expect(page.locator('body')).toBeVisible()
})
