import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  // Gerçek operasyon arayüzü ve yerel varlıklar; hiçbir canlı API çağrısı yok.
  await page.route('**/api/**', route => route.fulfill({ json: {} }))
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }))
  const assets = { 'index.html': 'text/html', 'styles.css': 'text/css', 'kademedia-theme.css': 'text/css', 'app.js': 'application/javascript', 'lucide.min.js': 'application/javascript' }
  await page.route('**/kadexai/operations-kit/**', async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1)
    if (!Object.hasOwn(assets, name)) return route.fulfill({ status: 404, body: '' })
    const body = await readFile(new URL(`../../apps/kadexai/public/kadexai/operations-kit/${name}`, import.meta.url))
    await route.fulfill({ body, contentType: assets[name] })
  })
  await page.goto('/kadexai/operations-kit/index.html?view=comments')
  await expect(page.locator('body')).toHaveAttribute('data-operations-ready', 'true')
})

test('SentScan boş ve nötr yorumları yanlış puanlamaz; geçmişte null korunur', async ({ page }) => {
  await expect(page.locator('#videoScore')).toContainText('en az bir yorum ekle')
  await page.locator('#commentsInput').fill('Bu bölüm ne zaman yayınlandı?')
  await page.locator('#commentForm button[type=submit]').click()
  await expect(page.locator('#videoScore')).toContainText('olumsuz yorum demek değildir')
  await expect(page.locator('#topComments tbody')).toContainText('—')
  await page.locator('#saveAnalysis').click()
  await expect(page.locator('#analysisHistory')).toContainText('Puan hesaplanmadı')
  await page.reload()
  await expect(page.locator('#analysisHistory')).toContainText('Puan hesaplanmadı')
  await expect(page.locator('#analysisHistory')).not.toContainText('0/10')
})

test('CSV bilinmeyen puanı veya beğeniyi sayı olarak dışa aktarmaz', async ({ page }) => {
  await page.locator('#commentsInput').fill('Bu bölüm ne zaman yayınlandı?')
  const downloading = page.waitForEvent('download')
  await page.locator('#exportCsv').click()
  const download = await downloading
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('Puan hesaplanmadı')
  expect(csv).toContain('"Yorum","Bu bölüm ne zaman yayınlandı?",""')
  expect(csv).not.toContain('null/10')
})

test('hata bildirimi animasyon çalışmasa da klavyeyle kapanır', async ({ page }) => {
  await page.addStyleTag({ content: '.toast, .toast-out { animation: none !important; }' })
  await page.locator('#saveAnalysis').click()
  const toast = page.locator('#toastContainer [role=alert]')
  await expect(toast).toContainText('Önce yorum gir')
  const close = toast.getByRole('button', { name: 'Bildirimi kapat' })
  await close.focus()
  await page.keyboard.press('Enter')
  await expect(toast).toHaveCount(0)
})

test('dosya seçiciler tema ve klavyeyle çalışır, transkript içe aktarılır', async ({ page }, info) => {
  for (const id of ['sourceVideoFile', 'transcriptFile']) {
    const input = page.locator(`#${id}`)
    await input.focus()
    await expect(input).toBeFocused()
    const style = await input.evaluate(el => {
      const s = getComputedStyle(el, '::file-selector-button')
      return { minHeight: parseFloat(s.minHeight), radius: s.borderRadius, right: el.getBoundingClientRect().right }
    })
    expect(style.minHeight).toBeGreaterThanOrEqual(44)
    expect(style.radius).not.toBe('0px')
    expect(style.right).toBeLessThanOrEqual(page.viewportSize().width)
  }
  await page.locator('#transcriptFile').setInputFiles({ name: 'marka-konusmasi.txt', mimeType: 'text/plain', buffer: Buffer.from('Kade Media için yeni bölüm metni.') })
  await expect(page.locator('#transcriptInput')).toHaveValue('Kade Media için yeni bölüm metni.')
  await page.locator('#transcriptFile').scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('sentscan-upload.png') })
})
