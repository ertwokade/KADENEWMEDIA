import { test, expect, type Page } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_UI !== '1', 'Isolated local API mocks only')

const analysis = {
  ozet: { pozitif_oran: 0, negatif_oran: null, genel_duygu: 'Belirtilmedi' },
  topluluk_sagligi: { puan: null }, duygu_analizi: {}, icerik_firsatlari: [],
  yanit_oncelikleri: [{ yorum_ozeti: 'Kaynak nerede?', neden_onemli: 'Bilgi talebi', yanit_tonu: 'samimi', yanit_taslagi: 'Açıklamaya bakabilirsin.' }],
  genel_oneriler: ['Kaynakları açıkça belirt.'],
}

async function setup(page: Page) {
  await page.route('**/kadexai/api/**', route => route.fulfill({ json: { availableModels: [], settingsAccess: false } }))
  await page.goto('/kadexai/dashboard/comment-analysis')
  await page.getByLabel('Yorumlar', { exact: true }).fill('Kaynak nerede?')
  await page.getByLabel('İçerik Başlığı').fill('Bilim videosu')
}

test('analysis keeps unknown metrics distinct and copies the edited draft without publishing', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await setup(page)
  await page.route('**/kadexai/api/generate/comment-analysis', route => route.fulfill({ json: { analysis } }))
  await page.getByRole('button', { name: 'Yorumları Analiz Et', exact: true }).click()
  await expect(page.getByText('0%', { exact: true })).toBeVisible()
  await expect(page.getByText('0/100', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Belirtilmedi', { exact: true })).toHaveCount(2)
  await expect(page.getByText('Kaynakları açıkça belirt.')).toBeVisible()
  const draft = page.getByLabel('Yanıt taslağı 1', { exact: true })
  await expect(draft).toHaveValue('Açıklamaya bakabilirsin.')
  await draft.fill('Teşekkürler! Kaynak bağlantısını ekledim.')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copied = text } } }))
  await page.getByRole('button', { name: 'Kopyala', exact: true }).click()
  await expect.poll(() => page.evaluate(() => document.body.dataset.copied)).toBe('Teşekkürler! Kaynak bağlantısını ekledim.')
  await expect(page.getByText('otomatik yayınlanmaz.', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await draft.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('comment-draft.png') })
  expect(errors).toEqual([])
})

test('missing drafts can retry failures and empty model responses with the original analysis context', async ({ page }) => {
  await setup(page)
  let replies = 0
  await page.route('**/kadexai/api/generate/comment-analysis', async route => {
    const body = route.request().postDataJSON()
    if (body.action !== 'reply') return route.fulfill({ json: { analysis: { ...analysis, yanit_oncelikleri: [{ ...analysis.yanit_oncelikleri[0], yanit_taslagi: '' }] } } })
    expect(body.contentTitle).toBe('Bilim videosu')
    expect(body.comments).toBe('Kaynak nerede?')
    replies++
    return route.fulfill(replies === 1 ? { status: 503, json: { error: 'Sağlayıcı kullanılamıyor.' } } : { json: { draft: replies === 2 ? '' : 'Kaynakları açıklamada paylaştık.' } })
  })
  await page.getByRole('button', { name: 'Yorumları Analiz Et', exact: true }).click()
  const button = page.getByRole('button', { name: 'Yanıt taslağı oluştur', exact: true })
  await expect(button).toBeVisible()
  await page.getByLabel('İçerik Başlığı').fill('Henüz analiz edilmeyen yeni başlık')
  await button.click()
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Sağlayıcı kullanılamıyor.')
  await button.click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('boş yanıt')
  await button.click()
  await expect(page.getByLabel('Yanıt taslağı 1', { exact: true })).toHaveValue('Kaynakları açıklamada paylaştık.')
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  expect(replies).toBe(3)
})

test('a late draft cannot replace a newer analysis', async ({ page }) => {
  await setup(page)
  let count = 0
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/kadexai/api/generate/comment-analysis', async route => {
    if (route.request().postDataJSON().action === 'reply') {
      await pending
      return route.fulfill({ json: { draft: 'Eski analizin geç yanıtı' } })
    }
    count++
    return route.fulfill({ json: { analysis: { ...analysis, yanit_oncelikleri: [{ ...analysis.yanit_oncelikleri[0], yanit_taslagi: count === 1 ? '' : 'Yeni analiz taslağı' }] } } })
  })
  await page.getByRole('button', { name: 'Yorumları Analiz Et', exact: true }).click()
  await page.getByRole('button', { name: 'Yanıt taslağı oluştur', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Taslak hazırlanıyor…' })).toBeDisabled()
  await page.getByRole('button', { name: 'Yorumları Analiz Et', exact: true }).click()
  await expect(page.getByLabel('Yanıt taslağı 1', { exact: true })).toHaveValue('Yeni analiz taslağı')
  const completed = page.waitForResponse(async response => response.url().includes('/generate/comment-analysis') && response.request().postDataJSON().action === 'reply')
  release()
  await completed
  await expect(page.getByLabel('Yanıt taslağı 1', { exact: true })).toHaveValue('Yeni analiz taslağı')
})
