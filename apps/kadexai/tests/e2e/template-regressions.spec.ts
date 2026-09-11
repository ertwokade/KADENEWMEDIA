import { test, expect, type Page } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_UI !== '1', 'Isolated loopback API mocks only')
const legacy = JSON.stringify([{ id: 'local-other', kategori: 'Hook', baslik: 'Başka hesaba ait gizli şablon', icerik: 'Gizli içerik', tarih: '2026-09-09' }])
const row = { id: 'own-template', category: 'Hook', title: 'Kendi şablonum', content: 'Kendi içeriğim', created_at: '2026-09-09T10:00:00Z' }

async function setup(page: Page) {
  await page.route('**/kadexai/api/**', route => route.fulfill({ json: { availableModels: [], settingsAccess: false } }))
  await page.addInitScript(value => localStorage.setItem('contentai-templates', value), legacy)
}

test('templates isolate legacy data and save edited starters as new cloud records only after success', async ({ page }) => {
  await setup(page)
  let readFailure = true
  let writeFailure = true
  await page.route('**/kadexai/api/templates', route => {
    const method = route.request().method()
    if (method === 'GET') return route.fulfill(readFailure ? { status: 401, json: {} } : { json: { templates: [] } })
    expect(method).toBe('POST')
    const body = route.request().postDataJSON()
    expect(body.id).toBeUndefined()
    return route.fulfill(writeFailure ? { status: 503, json: { error: 'Şablon kaydedilemedi.' } } : { status: 201, json: { template: { ...row, ...body } } })
  })
  await page.goto('/kadexai/dashboard/templates')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('yeniden giriş')
  await expect(page.getByText('Başka hesaba ait gizli şablon')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Merak boşluğu' })).toBeVisible()
  readFailure = false
  await page.getByRole('button', { name: 'Yeniden dene' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Merak boşluğu düzenle' }).click()
  await page.getByLabel('Başlık', { exact: true }).fill('Benim başlangıç şablonum')
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Şablon kaydedilemedi.')
  await expect(page.getByLabel('Başlık', { exact: true })).toHaveValue('Benim başlangıç şablonum')
  await expect(page.getByRole('heading', { name: 'Benim başlangıç şablonum', exact: true })).toHaveCount(0)
  writeFailure = false
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Benim başlangıç şablonum', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Merak boşluğu', exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('contentai-templates'))).toBe(legacy)
})

test('template edit, delete and clipboard failures remain visible without losing data', async ({ page }, info) => {
  await setup(page)
  let failure = true
  await page.route('**/kadexai/api/templates', route => {
    const method = route.request().method()
    if (method === 'GET') return route.fulfill({ json: { templates: [row] } })
    if (failure) return route.fulfill({ status: 500, json: { error: 'İşlem kaydedilemedi.' } })
    return route.fulfill(method === 'PUT' ? { json: { template: { ...row, ...route.request().postDataJSON() } } } : { json: { success: true } })
  })
  page.on('dialog', dialog => dialog.accept())
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/kadexai/dashboard/templates')
  await page.getByRole('button', { name: 'Kendi şablonum düzenle' }).click()
  await page.getByLabel('Başlık', { exact: true }).fill('Yeni başlık')
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('İşlem kaydedilemedi.')
  await expect(page.getByRole('heading', { name: 'Kendi şablonum', exact: true })).toBeVisible()
  await expect(page.getByLabel('Başlık', { exact: true })).toHaveValue('Yeni başlık')
  failure = false
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Yeni başlık', exact: true })).toBeVisible()
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } }))
  await page.getByRole('button', { name: 'Yeni başlık kopyala' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Panoya kopyalanamadı')
  failure = true
  await page.getByRole('button', { name: 'Yeni başlık sil' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('İşlem kaydedilemedi.')
  await expect(page.getByRole('heading', { name: 'Yeni başlık', exact: true })).toBeVisible()
  await page.getByRole('heading', { name: 'Yeni başlık', exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('template-preserved.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  failure = false
  await page.getByRole('button', { name: 'Yeni başlık sil' }).click()
  await expect(page.getByRole('heading', { name: 'Yeni başlık', exact: true })).toHaveCount(0)
  expect(errors).toEqual([])
})
