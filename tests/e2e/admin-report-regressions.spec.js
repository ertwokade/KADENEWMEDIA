import { test, expect } from '@playwright/test'
import { mockAdminApi, openAdmin, gotoSection } from './helpers/adminMock.js'

async function openMenuItem(page, name) {
  const menu = page.locator('.mobile-menu-btn')
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name, exact: true }).click()
}

test('bülten gerçek veritabanı tarihini gösterir ve doğru kimlikle siler', async ({ page }) => {
  await mockAdminApi(page)
  const subscriber = { id: '550e8400-e29b-41d4-a716-446655440103', email: 'audit@example.test', created_at: '2026-09-01T10:00:00Z' }
  let deletedId = null
  await page.route('**/api/contact?*', route => {
    const request = route.request()
    if (request.method() === 'DELETE') {
      deletedId = new URL(request.url()).searchParams.get('id')
      return route.fulfill({ json: { success: true } })
    }
    return route.fulfill({ json: deletedId ? [] : [subscriber] })
  })
  await openAdmin(page)
  await openMenuItem(page, 'İÇERİK')
  await page.getByRole('button', { name: 'Newsletter', exact: true }).click()
  await expect(page.getByText('1 Eylül 2026', { exact: true })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Sil', exact: true }).click()
  await expect(page.getByText('Henüz abone yok', { exact: true })).toBeVisible()
  expect(deletedId).toBe(subscriber.id)
})

test('CRM test filtresi hizmet adlarını korur ve veri silmez', async ({ page }, info) => {
  await mockAdminApi(page)
  const writes = []
  await page.route('**/api/messages', route => {
    if (route.request().method() !== 'GET') writes.push(route.request().method())
    return route.fulfill({ json: [
      { _id: 'a', name: 'Ayşe Yılmaz', email: 'ayse@firma.com', service: 'social', status: 'yeni' },
      { _id: 'b', name: 'Demo Müşteri', email: 'demo@example.test', service: 'ads', status: 'yeni' },
    ] })
  })
  await openAdmin(page)
  await openMenuItem(page, 'Kanban CRM')
  await page.getByLabel('Kayıt ayrımı').selectOption('unmarked')
  await expect(page.getByText('Ayşe Yılmaz', { exact: true })).toBeVisible()
  await expect(page.getByText('Sosyal Medya Yönetimi', { exact: true })).toBeVisible()
  await expect(page.getByText('Demo Müşteri', { exact: true })).toHaveCount(0)
  await page.getByLabel('Kayıt ayrımı').selectOption('test')
  await expect(page.getByText('Demo Müşteri', { exact: true })).toBeVisible()
  await expect(page.getByText('Ayşe Yılmaz', { exact: true })).toHaveCount(0)
  expect(writes).toEqual([])
  await page.screenshot({ path: info.outputPath('crm-filter.png'), fullPage: true })
})

test('paket bağlantısı statik teklif formunda paket ve hizmetleri seçer', async ({ page }) => {
  await page.goto('/teklif-al?paket=buyume')
  await expect(page.locator('[name="package"]')).toHaveValue('buyume')
  for (const service of ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi']) {
    await expect(page.locator(`input[name="services"][value="${service}"]`)).toBeChecked()
  }
  await expect(page.locator('input[name="services"][value="Web Sitesi"]')).not.toBeChecked()
  await page.goto('/teklif-al?paket=__proto__')
  await expect(page.locator('[name="package"]')).toHaveValue('')
  await expect(page.locator('input[name="services"]:checked')).toHaveCount(0)
})

// Tamamı yerel API mock'larıdır; canlı veriye veya müşterilere yazılmaz.
async function analytics(page) {
  const menu = page.locator('.mobile-menu-btn')
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name: 'Analitik', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Analitik Paneli' })).toBeVisible()
}

test('sayaçlar yüklenirken sıfır göstermez; gerçek sıfır korunur', async ({ page }) => {
  await mockAdminApi(page, { blogs: [] })
  let release
  const pending = new Promise(resolve => { release = resolve })
  await page.route('**/api/contact?action=subscribers', async route => {
    await pending
    await route.fulfill({ json: [] })
  })
  await openAdmin(page)
  const counts = page.locator('.admin-stats-grid .stat-number')
  try {
    await expect(counts).toHaveText(['…', '…', '…', '…', '…'])
  } finally { release() }
  await expect(counts).toHaveText(['0', '0', '0', '0', '0'])
})

test('sayaç isteği başarısızsa sıfır yerine hata ve yeniden deneme gösterir', async ({ page }) => {
  await mockAdminApi(page)
  let failed = true
  await page.route('**/api/contact?action=subscribers', route => route.fulfill(
    failed ? { status: 500, json: { error: 'Test sunucu hatası' } } : { json: [] }
  ))
  await openAdmin(page)
  await expect(page.getByRole('alert')).toContainText('verileri alınamadı')
  await expect(page.locator('.admin-stats-grid .stat-number')).toHaveText(['—', '—', '—', '—', '—'])
  failed = false
  await page.getByRole('button', { name: 'Yeniden dene', exact: true }).click()
  await expect(page.locator('.admin-stats-grid .stat-number')).toHaveText(['2', '0', '0', '0', '0'])
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('GA4 yapılandırılmamış durumu, dahili sıfır ve genel öneriler ayrılır', async ({ page }) => {
  await mockAdminApi(page)
  await page.route('**/api/content?action=ga4&*', route => route.fulfill({ json: { configured: false } }))
  await page.route('**/api/content?action=analytics&*', route => route.fulfill({ json: { totalVisits: 0, dailyData: [], pages: [], sources: [] } }))
  await openAdmin(page)
  await analytics(page)
  await expect(page.getByText('Google Analytics 4 bağlantısı yapılandırılmamış.', { exact: false })).toBeVisible()
  await expect(page.getByText('En Yoğun Gün', { exact: true })).toBeVisible()
  await expect(page.getByText('Genel öneriler; ziyaret verilerinden kişiselleştirilmemiştir.', { exact: true })).toBeVisible()
  await expect(page.locator('.admin-stats-grid .stat-number').first()).toHaveText('0')
})

test('analitik servisi başarısızsa boş istatistik uydurulmaz', async ({ page }) => {
  await mockAdminApi(page)
  await page.route(/\/api\/content\?action=(ga4|analytics)&/, route => route.fulfill({ status: 500, json: { error: 'Test sunucu hatası' } }))
  await openAdmin(page)
  await analytics(page)
  await expect(page.getByRole('status')).toContainText('sayaçlar gösterilemiyor')
  await expect(page.locator('.admin-stats-grid')).toHaveCount(0)
})

test('seed onayı iptal edilince kurulum isteği gönderilmez', async ({ page }) => {
  await mockAdminApi(page)
  const seedCalls = []
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/seed') seedCalls.push(request)
  })
  await openAdmin(page)
  await gotoSection(page, 'SİSTEM', 'Ayarlar')
  await page.getByPlaceholder('Seed secret...').fill('local-test-only')
  const dialog = page.waitForEvent('dialog')
  const click = page.getByRole('button', { name: 'Veritabanını Başlat', exact: true }).click()
  const prompt = await dialog
  expect(prompt.message()).toContain('yedeğini')
  await prompt.dismiss()
  await click
  expect(seedCalls).toHaveLength(0)
})

test('Türkçe etiketler mevcut CRM aşama kimliklerini değiştirmez', async ({ page }) => {
  await mockAdminApi(page)
  await page.route('**/api/messages', route => route.fulfill({ json: [{ _id: 'local-lead', name: 'Yerel CRM testi', status: 'teklif-gonderildi' }] }))
  await openAdmin(page)
  const menu = page.locator('.mobile-menu-btn')
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name: 'Kanban CRM', exact: true }).click()
  const heading = page.getByText('Teklif Gönderildi', { exact: true })
  const column = heading.locator('../..')
  await expect(column.getByText('Yerel CRM testi', { exact: true })).toBeVisible()
  await expect(page.getByText('Görüşme Bekliyor', { exact: true })).toBeVisible()
})

test('referans takibi mevcut public sayfayı yayında değil diye etiketlemez', async ({ page }) => {
  await mockAdminApi(page)
  await openAdmin(page)
  await gotoSection(page, 'MÜŞTERİ YÖNETİMİ', 'Referral Takibi')
  await expect(page.getByRole('link', { name: 'Canlı Sayfayı Görüntüle' })).toHaveAttribute('href', '/referans-programi')
  await expect(page.getByText('Sayfa henüz yayında değil', { exact: true })).toHaveCount(0)
})
