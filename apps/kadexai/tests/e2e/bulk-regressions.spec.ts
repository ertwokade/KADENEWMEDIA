import { test, expect, type Page } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_UI !== '1', 'Isolated loopback API mocks only')

async function setup(page: Page) {
  await page.route('**/kadexai/api/**', route => route.fulfill({ json: { availableModels: [], settingsAccess: false } }))
  await page.goto('/kadexai/dashboard/bulk')
  await page.getByLabel('Konu', { exact: true }).fill('Teknoloji')
}

const output = (count: number) => ({
  basliklar: Array.from({ length: count }, (_, i) => `İçerik başlığı ${i + 1}`),
  hooklar: Array.from({ length: count }, (_, i) => `Merak uyandıran kanca ${i + 1}`),
  captions: { instagram: Array.from({ length: count }, (_, i) => `Instagram metni ${i + 1}`), tiktok: Array.from({ length: count }, (_, i) => `TikTok metni ${i + 1}`) },
  hashtag_setleri: [['#teknoloji']],
})

test('bulk accepts 50 but clearly labels incomplete output and keeps usable content', async ({ page }, info) => {
  await setup(page)
  await page.route('**/kadexai/api/generate/bulk', route => {
    expect(route.request().postDataJSON().count).toBe(50)
    return route.fulfill({ json: { data: output(1), partial: true } })
  })
  const slider = page.getByRole('slider')
  await slider.focus()
  await slider.press('End')
  await expect(slider).toHaveValue('50')
  await page.getByRole('button', { name: 'Toplu Üret', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Kısmi sonuç')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('İstenen: 50 · Başlık: 1 · Hook: 1')
  await expect(page.getByText('İçerik başlığı 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Üretim tamamlandı.', { exact: true })).toHaveCount(0)
  await page.getByRole('main').getByRole('alert').scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('bulk-partial.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('failed or malformed bulk reruns do not redisplay a stale successful result', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await setup(page)
  let run = 0
  await page.route('**/kadexai/api/generate/bulk', route => {
    run++
    return route.fulfill(run === 1 ? { json: { data: output(3), partial: false } }
      : run === 2 ? { status: 502, json: { error: 'Üretim başarısız.' } }
        : { json: { data: { basliklar: { invalid: true }, hooklar: [], captions: {}, hashtag_setleri: [] } } })
  })
  await page.getByRole('slider').focus()
  await page.getByRole('slider').press('Home')
  const generate = page.getByRole('button', { name: 'Toplu Üret', exact: true })
  await generate.click()
  await expect(page.getByText('Üretim tamamlandı.', { exact: true })).toBeVisible()
  await generate.click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Üretim başarısız.')
  await expect(page.getByText('İçerik başlığı 1', { exact: true })).toHaveCount(0)
  await generate.click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('geçerli içerik listeleri')
  expect(errors).toEqual([])
})
