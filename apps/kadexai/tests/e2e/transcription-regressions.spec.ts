import { test, expect, type Page } from '@playwright/test'

test.skip(process.env.E2E_LOCAL_UI !== '1', 'Isolated API mocks only')

function wav() {
  const data = Buffer.alloc(44 + 16000)
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8)
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22)
  data.writeUInt32LE(8000, 24); data.writeUInt32LE(16000, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34)
  data.write('data', 36); data.writeUInt32LE(16000, 40)
  return { name: 'local-test.wav', mimeType: 'audio/wav', buffer: data }
}
const transcript = { text: 'Kade Media', words: [{ word: 'Kade', start: 0, end: 0.5 }, { word: 'Media', start: 0.5, end: 1 }], language: 'tr', timing: 'estimated' }
async function setup(page: Page, tool: string) {
  await page.route('**/kadexai/api/**', route => route.fulfill({ json: { availableModels: [], settingsAccess: false } }))
  await page.goto(`/kadexai/dashboard/${tool}`)
  await page.locator('input[type=file]').first().setInputFiles(wav())
  await page.getByLabel('Özel isimler (isteğe bağlı)', { exact: false }).fill('Kadir Demir, Özel Ürün')
}

test('subtitles pass vocabulary, label estimated timing and reject malformed successful responses', async ({ page }, info) => {
  await setup(page, 'subtitles')
  let call = 0
  await page.route('**/kadexai/api/transcribe', route => {
    expect(route.request().postDataBuffer()!.toString('utf8')).toContain('Kadir Demir, Özel Ürün')
    return route.fulfill({ json: ++call === 1 ? transcript : { ...transcript, words: [{ word: {}, start: 0, end: 1 }] } })
  })
  await page.getByRole('button', { name: 'Altyazı üret', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('tahmin edildi')
  await expect(page.locator('textarea').last()).toHaveValue('Kade Media')
  await page.getByRole('status').scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('subtitles-vocabulary.png') })
  await page.getByRole('button', { name: 'Altyazı üret', exact: true }).click()
  await expect(page.getByText('Ses dökümünün kelime veya zaman bilgileri geçersiz. Yeniden dene.', { exact: true })).toBeVisible()
  // Existing editable work survives a failed request; a broken response never replaces it.
  await expect(page.locator('textarea').last()).toHaveValue('Kade Media')
})

test('dubbing stops incomplete translation before any speech request', async ({ page }) => {
  await setup(page, 'dubbing')
  await page.route('**/kadexai/api/transcribe', route => route.fulfill({ json: transcript }))
  await page.route('**/kadexai/api/subtitles/translate', route => route.fulfill({ json: { ceviriler: [{ index: 1, text: 'Kade Media', atlandi: true }], atlanan: 1 } }))
  let speechCalls = 0
  await page.route('**/kadexai/api/dubbing/tts', route => { speechCalls++; return route.fulfill({ json: {} }) })
  await page.getByRole('button', { name: 'Konuşmayı çöz' }).click()
  await expect(page.getByText('1 konuşma bölümü bulundu.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Dublajı üret', exact: true }).click()
  await expect(page.getByText(/Bazı bölümler çevrilemedi/)).toBeVisible()
  expect(speechCalls).toBe(0)
  await expect(page.locator('audio')).toHaveCount(0)
})

test('dubbing retries edited text without overwriting it with a new translation', async ({ page }, info) => {
  await setup(page, 'dubbing')
  await page.route('**/kadexai/api/transcribe', route => route.fulfill({ json: transcript }))
  let translations = 0
  await page.route('**/kadexai/api/subtitles/translate', route => { translations++; return route.fulfill({ json: { ceviriler: [{ index: 1, text: 'Original translation' }], atlanan: 0 } }) })
  const spoken: string[] = []
  await page.route('**/kadexai/api/dubbing/tts', route => {
    spoken.push(route.request().postDataJSON().segments[0].text)
    return route.fulfill({ status: 503, json: { error: 'Test ses servisi kapalı.' } })
  })
  await page.getByRole('button', { name: 'Konuşmayı çöz' }).click()
  await expect(page.getByText('1 konuşma bölümü bulundu.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Dublajı üret', exact: true }).click()
  await expect(page.getByText('Test ses servisi kapalı.', { exact: true })).toBeVisible()
  const edit = page.getByLabel('1. bölüm çevirisi')
  await edit.fill('My corrected translation')
  await page.getByRole('button', { name: 'Düzenlenen metni seslendir', exact: true }).click()
  await expect(page.getByText('Test ses servisi kapalı.', { exact: true })).toBeVisible()
  expect(translations).toBe(1)
  expect(spoken).toEqual(['Original translation', 'My corrected translation'])
  await expect(edit).toHaveValue('My corrected translation')
  await edit.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('dubbing-edited.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
