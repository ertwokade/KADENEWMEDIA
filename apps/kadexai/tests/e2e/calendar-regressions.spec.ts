import { test, expect, type Page } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_UI !== '1', 'Isolated loopback API mocks only')
const row = { id: 'own-record', title: 'Hesabımın planı', platform: 'pinterest', status: 'taslak', publish_at: '2026-09-09T09:00:00.000Z' }
const legacy = JSON.stringify([{ id: 'foreign-record', title: 'Başka hesabın gizli planı', platform: 'youtube', status: 'taslak', date: '2026-09-09' }])

async function setup(page: Page) {
  await page.route('**/kadexai/api/**', route => route.fulfill({ json: { availableModels: [], settingsAccess: false } }))
  await page.addInitScript(value => localStorage.setItem('kade-content-calendar', value), legacy)
}

test('calendar never exposes unowned browser cache, even on server failure or an expired session', async ({ page }) => {
  await setup(page)
  let status = 503
  await page.route('**/kadexai/api/calendar', route => route.fulfill({ status, json: status === 200 ? { entries: [] } : { error: 'Takvim servisine ulaşılamıyor.' } }))
  await page.goto('/kadexai/dashboard/calendar')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Takvim servisine ulaşılamıyor.')
  await expect(page.getByText('0 içerik planlandı')).toHaveCount(0)
  await expect(page.getByText('Başka hesabın gizli planı')).toHaveCount(0)
  status = 401
  await page.getByRole('button', { name: 'Yeniden dene' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('yeniden giriş')
  status = 200
  await page.getByRole('button', { name: 'Yeniden dene' }).click()
  await expect(page.getByText('0 içerik planlandı')).toBeVisible()
  await expect(page.getByText('Başka hesabın gizli planı')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('kade-content-calendar'))).toBe(legacy)
})

test('failed calendar mutations preserve the record and status; successful acknowledgements update them', async ({ page }, info) => {
  await setup(page)
  let failure = true
  let current = { ...row }
  await page.route('**/kadexai/api/calendar', route => {
    const method = route.request().method()
    if (method === 'GET') return route.fulfill({ json: { entries: [current] } })
    if (failure) return route.fulfill({ status: 500, json: { error: 'İşlem kaydedilemedi.' } })
    if (method === 'PUT') { current = { ...current, status: route.request().postDataJSON().status }; return route.fulfill({ json: { entry: current } }) }
    return route.fulfill({ json: { success: true } })
  })
  page.on('dialog', dialog => dialog.accept())
  await page.goto('/kadexai/dashboard/calendar')
  const status = page.getByRole('button', { name: 'Hesabımın planı: taslak, durumu değiştir' })
  await status.click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('İşlem kaydedilemedi.')
  await expect(status).toHaveText('taslak')
  const remove = page.getByRole('button', { name: 'Hesabımın planı kaydını sil' })
  await remove.click()
  await expect(page.getByText('Hesabımın planı', { exact: true })).toBeVisible()
  await expect(remove).toBeEnabled()
  await page.screenshot({ path: info.outputPath('calendar-preserved.png') })
  failure = false
  await status.click()
  await expect(page.getByRole('button', { name: 'Hesabımın planı: hazır, durumu değiştir' })).toHaveText('hazır')
  await remove.click()
  await expect(page.getByText('0 içerik planlandı')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a failed calendar save preserves the form and never invents a local success', async ({ page }) => {
  await setup(page)
  let failure = true
  await page.route('**/kadexai/api/calendar', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { entries: [] } })
    const body = route.request().postDataJSON()
    expect(body.publish_at).toBe('2026-09-30T12:00:00+03:00')
    expect(body.platform).toBe('pinterest')
    return route.fulfill(failure ? { status: 401, json: { error: 'Oturum gerekli.' } } : { status: 201, json: { entry: { ...row, ...body, title: 'Yeni plan' } } })
  })
  await page.goto('/kadexai/dashboard/calendar?title=Yeni%20plan&platform=pinterest')
  await page.getByLabel('Yayın Tarihi').fill('2026-09-30')
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Oturum gerekli.')
  await expect(page.getByLabel('İçerik Başlığı')).toHaveValue('Yeni plan')
  await expect(page.getByText('0 içerik planlandı')).toBeVisible()
  failure = false
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByText('1 içerik planlandı')).toBeVisible()
  await expect(page.getByLabel('İçerik Başlığı')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('kade-content-calendar'))).toBe(legacy)
})

test('monthly plan shows days 29 and 30 and confirms cloud transfer before announcing success', async ({ page }, info) => {
  await setup(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/kadexai/api/generate/content-plan', route => route.fulfill({ json: { plan: {
    strateji: 'Test stratejisi', haftalik_temalar: [], kpi_hedefleri: {},
    gunler: [1, 29, 30].map(gun => ({ gun, baslik: `Gün ${gun} içeriği`, tarih_onerisi: '', icerik_turu: 'egitici', format: 'Video', aciklama: '', ipucu: '' })),
  } } }))
  let attempts = 0
  let saved: Record<string, unknown>[] = []
  await page.route('**/kadexai/api/calendar', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { entries: saved } })
    attempts++
    const entries = route.request().postDataJSON().entries as Record<string, unknown>[]
    expect(entries).toHaveLength(3)
    expect(entries.every(entry => entry.platform === 'pinterest')).toBe(true)
    expect(Date.parse(String(entries[2].publish_at)) - Date.parse(String(entries[0].publish_at))).toBe(29 * 86400000)
    if (attempts === 1) return route.fulfill({ status: 503, json: { error: 'Takvim yazımı başarısız.' } })
    saved = entries.map((entry, i) => ({ ...entry, id: `plan-${i}`, status: 'taslak' }))
    return route.fulfill({ status: 201, json: { entries: saved } })
  })
  await page.goto('/kadexai/dashboard/content-plan')
  await page.getByPlaceholder('Teknoloji, fitness, yemek...').fill('Teknoloji')
  await page.getByRole('button', { name: 'Pinterest', exact: true }).click()
  await page.getByRole('button', { name: '30 Günlük Plan Üret', exact: true }).click()
  await page.getByRole('button', { name: 'Hafta 5', exact: true }).click()
  await expect(page.getByText('Gün 29 içeriği', { exact: true })).toBeVisible()
  await expect(page.getByText('Gün 30 içeriği', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'YouTube', exact: true }).click()
  const transfer = page.getByRole('button', { name: 'Planı İçerik Takvimi’ne Aktar', exact: true })
  await transfer.click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Takvim yazımı başarısız.')
  await expect(page.getByText('3 içerik takvime eklendi.')).toHaveCount(0)
  await transfer.click()
  await expect(page.getByText('3 içerik takvime eklendi.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plan takvime aktarıldı' })).toBeDisabled()
  await page.getByRole('button', { name: 'Hafta 5' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('plan-week-five.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Takvimi aç →' }).click()
  await expect(page.getByText('3 içerik planlandı')).toBeVisible()
  await expect(page.getByText('Gün 30 içeriği', { exact: true })).toBeVisible()
  expect(attempts).toBe(2)
  expect(errors).toEqual([])
})
