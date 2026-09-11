import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Run only against an isolated loopback dev server with KADE_DISABLE_AUTH=1.
// Every data API is mocked; no AI request, upload or social publication occurs.
test.skip(process.env.E2E_LOCAL_UI !== '1', 'Local mocked UI regression suite')

const output = {
  title: 'Haftalık paket', sourceSummary: 'Kaynak özeti', thread: [], linkedIn: '',
  newsletter: { subject: '', body: '' }, shortVideos: { reels: 'Reels senaryosu', tiktok: '', shorts: '' },
  captions: { instagram: 'İstanbul için açıklama 🎬', tiktok: 'TikTok açıklaması', youtube: 'YouTube açıklaması' },
  summary: [], quotes: [], evidence: [],
}

async function mockData(page: Page) {
  await page.route('**/kadexai/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/content-studio') ? {
      runs: [{ id: 'fixture', source_title: 'Test kaynak', source_url: null, output, model: 'test', created_at: '2026-09-05T10:00:00Z' }], voice: null,
    } : path.endsWith('/config') ? { settingsAccess: false, availableModels: [] }
      : path.endsWith('/stats') ? { trends: 1, snapshots: 1, links: 0, alerts: 0, kaynaklar: [], lastRun: null }
      : path.endsWith('/ideas') ? { fikirler: ['sablon', 'ai'].map((uretim) => ({
        trendId: uretim, baslik: `Örnek ${uretim}`, uretim, kaynak: {}, kategori: 'Teknoloji',
        format: { label: 'Öğretici', aciklama: '' }, kanca: 'Kanca', alternatifKancalar: [],
        kurgu: ['Giriş', 'Anlatım', 'Sonuç'], cta: 'Kaydet', hashtagler: ['#teknoloji'], sesOnerisi: null,
        zorluk: { level: 'Belirsiz', note: 'Yeterli ölçüm yok' }, paylasimSaati: ['19:00-21:00'], neden: 'Taslak önerisi',
      })) } : { trendler: [], liste: [] }
    await route.fulfill({ json: body })
  })
}

test('install prompt can be dismissed by keyboard and stays away from tool forms', async ({ page }, info) => {
  await mockData(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true }))
  await page.goto('/kadexai/dashboard')
  const close = page.getByRole('button', { name: 'Kurulum önerisini kapat' })
  await expect(close).toBeVisible()
  const box = await close.boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({ path: info.outputPath('install-inline.png') })
  await close.focus()
  await page.keyboard.press('Enter')
  await expect(close).toHaveCount(0)
  await page.reload()
  await expect(close).toHaveCount(0)
  await page.evaluate(() => localStorage.removeItem('kadexai-install-dismissed'))
  await page.goto('/kadexai/dashboard/hook')
  await expect(close).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Bilgileri tamamla', exact: true })).toHaveAttribute('href', '/kadexai/onboarding')
  expect(errors).toEqual([])
})

test('install prompt closes even if storage becomes unavailable', async ({ page }) => {
  await mockData(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true }))
  await page.goto('/kadexai/dashboard')
  const close = page.getByRole('button', { name: 'Kurulum önerisini kapat' })
  await expect(close).toBeVisible()
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage disabled', 'SecurityError') } })
  await close.click()
  await expect(close).toHaveCount(0)
})

test('materials distinguish service failure from empty filters and unknown counts', async ({ page }) => {
  await mockData(page)
  let failed = true
  await page.route('**/kadexai/api/materials?*', route => route.fulfill(failed
    ? { status: 503, json: { error: 'Materyal servisi kullanılamıyor' } }
    : { json: { materyaller: [], istatistik: { toplam: 553, sonKosu: null }, canCollect: false } }))
  await page.goto('/kadexai/dashboard/materyal')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Materyal servisi kullanılamıyor')
  await expect(page.getByText('Henüz materyal eklenmemiş.')).toHaveCount(0)
  await expect(page.getByText('Havuzda 0 materyal', { exact: false })).toHaveCount(0)
  failed = false
  await page.getByRole('button', { name: 'Yeniden dene', exact: true }).click()
  await page.getByLabel('Materyal başlığında ara').fill('bulunamayan')
  await expect(page.getByText('Bu filtrelerle eşleşen materyal yok.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kütüphaneyi tazele' })).toHaveCount(0)
})

test('materials paginate, expose failed previews and keep the modal keyboard-accessible', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name.startsWith('mobile') ? 390 : 1440, height: 1000 })
  await mockData(page)
  const row = { source: 'arsivhub', kind: 'photo', description: null, page_url: 'https://arsivhub.com/example', media_url: 'https://str.arsivhub.com/example.jpg', thumbnail: null, duration_sec: null, view_count: null, published_at: null }
  await page.route('**/kadexai/api/materials?*', route => {
    const offset = Number(new URL(route.request().url()).searchParams.get('offset'))
    return route.fulfill({ json: { materyaller: Array.from({ length: offset ? 1 : 60 }, (_, i) => ({ ...row, id: String(offset + i), title: `Materyal ${offset + i}` })), istatistik: { toplam: 61, sonKosu: null }, canCollect: true } })
  })
  await page.route('**/kadexai/api/materials/thumbnail?*', route => route.fulfill({ status: 502, body: '' }))
  await page.route('**/kadexai/api/materials/sync', route => route.fulfill({ json: { toplam: { found: 61, inserted: 1 }, sonuclar: [{ ok: true }, { ok: false, skipped: true }] } }))
  await page.goto('/kadexai/dashboard/materyal')
  const preview = page.getByRole('button', { name: 'Materyal 0 önizle', exact: true })
  await expect(preview).toContainText('Küçük resim yüklenemedi')
  await preview.click()
  const dialog = page.getByRole('dialog', { name: 'Materyal 0', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('status')).toContainText('Önizleme açılamadı')
  await expect(dialog.getByRole('link', { name: 'Kaynak sayfasını aç' })).toHaveAttribute('href', row.page_url)
  await dialog.screenshot({ path: info.outputPath('material-preview.png') })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(preview).toBeFocused()
  await page.getByRole('button', { name: 'Daha fazla materyal göster' }).click()
  await expect(page.getByRole('button', { name: 'Materyal 60 önizle', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Daha fazla materyal göster' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Kütüphaneyi tazele' }).click()
  await expect(page.getByText('1 kaynak tamamlanamadı veya yapılandırılmamış.', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a late material response cannot overwrite a newer search', async ({ page }) => {
  await mockData(page)
  let started!: () => void
  const pending = new Promise<void>(resolve => { started = resolve })
  let release!: () => void
  const delayed = new Promise<void>(resolve => { release = resolve })
  await page.route('**/kadexai/api/materials?*', async route => {
    const q = new URL(route.request().url()).searchParams.get('q')
    if (q === 'eski') { started(); await delayed }
    await route.fulfill({ json: { materyaller: [], istatistik: { toplam: q === 'eski' ? 10 : 20, sonKosu: null } } })
  })
  await page.goto('/kadexai/dashboard/materyal')
  await page.getByLabel('Materyal başlığında ara').fill('eski')
  await pending
  await page.getByLabel('Materyal başlığında ara').fill('yeni')
  const newResponse = page.waitForResponse(response => response.url().includes('q=yeni'))
  await newResponse
  const oldResponse = page.waitForResponse(response => response.url().includes('q=eski'))
  release()
  await oldResponse
  await expect(page.getByText('Havuzda 20 materyal', { exact: false })).toBeVisible()
  await expect(page.getByText('Havuzda 10 materyal', { exact: false })).toHaveCount(0)
})

test('history isolates browser accounts and preserves a record when deletion fails', async ({ page }) => {
  await mockData(page)
  const fixture = { tool: 'title', model: 'gemini', output: 'Bu hesabın çıktısı', input_data: {}, created_at: '2026-09-06T10:00:00Z' }
  await page.addInitScript((entry) => localStorage.setItem('kade-generation-history', JSON.stringify([
    { ...entry, id: 'local-other', owner_id: 'other', output: 'Başka hesabın gizli çıktısı' },
    { ...entry, id: 'local-legacy', output: 'Sahibi doğrulanmamış çıktı' },
  ])), fixture)
  let failed = true
  let deleted = false
  await page.route('**/kadexai/api/history', route => {
    if (route.request().method() === 'DELETE') {
      if (failed) return route.fulfill({ status: 500, json: { error: 'Test hatası' } })
      deleted = true
      return route.fulfill({ json: { success: true } })
    }
    return route.fulfill({ json: { ownerId: 'own', history: deleted ? [] : [{ ...fixture, id: 'remote-own' }] } })
  })
  await page.goto('/kadexai/dashboard/history')
  await expect(page.getByText(fixture.output, { exact: true })).toBeVisible()
  await expect(page.getByText('Başka hesabın gizli çıktısı', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Sahibi doğrulanmamış çıktı', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Kaydı sil', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Kayıt silinemedi')
  await expect(page.getByText(fixture.output, { exact: true })).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Kaydı sil', exact: true }).click()
  await expect(page.getByText('Henüz kaydedilmiş içerik yok', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kade-generation-history') || '[]').length)).toBe(2)
})

test('history API failure is visible instead of an empty or cached history', async ({ page }) => {
  await mockData(page)
  await page.route('**/kadexai/api/history', route => route.fulfill({ status: 503, json: { error: 'Geçmiş servisi kullanılamıyor' } }))
  await page.goto('/kadexai/dashboard/history')
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Geçmiş servisi kullanılamıyor')
  await expect(page.getByText('Henüz kaydedilmiş içerik yok', { exact: true })).toHaveCount(0)
})

test('AutoSocial exports the selected platform caption without uploading the video', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name.startsWith('mobile') ? 390 : 1440, height: 1000 })
  await mockData(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const mutations: string[] = []
  page.on('request', (request) => { if (request.method() !== 'GET') mutations.push(request.url()) })
  await page.goto('/kadexai/dashboard/content-studio?run=fixture')
  await page.getByText('AutoSocial’a aktar · yerel dosya', { exact: true }).click()
  const panel = page.locator('details').filter({ hasText: 'AutoSocial’a aktar' })
  await expect(panel.getByRole('button', { name: 'Açıklama dosyasını indir' })).toBeDisabled()
  await panel.getByLabel('Yayın platformu').selectOption('tiktok')
  await expect(panel.getByLabel('TikTok açıklaması')).toHaveValue('TikTok açıklaması')
  await panel.locator('input[type=file]').setInputFiles({ name: 'Klip 01.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fixture-not-real-video') })
  const pending = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Açıklama dosyasını indir' }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('Klip 01.description')
  expect(await readFile((await download.path())!, 'utf8')).toBe('TikTok açıklaması')
  await expect(panel.getByRole('status')).toContainText('Henüz hiçbir paylaşım yapılmadı')
  expect(mutations).toEqual([])
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await panel.screenshot({ path: info.outputPath('autosocial.png') })
})

test('Radar distinguishes AI output from fallback and labels times as suggestions', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name.startsWith('mobile') ? 390 : 1440, height: 1000 })
  await mockData(page)
  await page.goto('/kadexai/dashboard/trend-radar')
  await page.getByRole('button', { name: 'İçerik Fikirleri', exact: true }).click()
  await expect(page.getByText('Hazır şablon · AI kişiselleştirmesi tamamlanamadı', { exact: false })).toBeVisible()
  await expect(page.getByText('Kanca, kurgu ve CTA AI ile kişiselleştirildi.', { exact: false })).toBeVisible()
  await expect(page.getByText('Saat dilimi: İstanbul.', { exact: false })).toHaveCount(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Radar CSV downloads truthful measurements and failed watchlist edits remain visible', async ({ page }) => {
  await mockData(page)
  await page.route('**/kadexai/api/kade-search/trends?*', route => route.fulfill({ json: { trendler: [{
    id: 'csv-fixture', title: '=1+1', platform: 'youtube', kind: 'video', category: null,
    score: null, velocity: 0, snapshot_count: 1, link_count: 0, inferred: false, breakdown: { hizOlculdu: false },
  }] } }))
  await page.route('**/kadexai/api/kade-search/watchlist*', route => route.fulfill(route.request().method() === 'GET'
    ? { json: { liste: [{ id: 'watch-1', term: 'yapay zeka', normalized: 'yapay zeka' }] } }
    : { status: 500, json: { error: 'Yerel test hatası' } }))
  await page.goto('/kadexai/dashboard/trend-radar')
  await expect(page.getByText('Hız için yeterli doğrulanmış ölçüm yok', { exact: true })).toBeVisible()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV dışa aktar' }).click()
  const download = await pending
  const csv = await readFile((await download.path())!, 'utf8')
  expect(csv).toContain('"\'=1+1"')
  expect(csv).toContain('"","Yeterli doğrulanmış ölçüm yok"')
  const input = page.getByPlaceholder('örn. yapay zeka')
  await input.fill('korunacak terim')
  await page.getByRole('button', { name: 'Ekle', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Terim eklenemedi')
  await expect(input).toHaveValue('korunacak terim')
  await page.getByRole('button', { name: 'yapay zeka terimini kaldır' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Terim kaldırılamadı')
  await expect(page.getByRole('button', { name: 'yapay zeka terimini kaldır' })).toBeVisible()
})

test('Radar and ideas preserve explicit global filters; summary-only filters are disabled', async ({ page }, info) => {
  await mockData(page)
  await page.goto('/kadexai/dashboard/trend-radar')
  await page.getByLabel('Ülke', { exact: true }).selectOption('all')
  await page.getByLabel('Dil', { exact: true }).selectOption('all')
  await page.getByRole('button', { name: 'YouTube', exact: true }).click()
  await page.getByPlaceholder('Kelime, şarkı, kanal...').fill('kamera')
  await page.getByPlaceholder('Kelime, şarkı, kanal...').press('Enter')
  for (const [button, endpoint] of [['Erken Radar', 'radar'], ['İçerik Fikirleri', 'ideas']]) {
    const pending = page.waitForRequest(request => new URL(request.url()).pathname.endsWith(`/kade-search/${endpoint}`))
    await page.getByRole('button', { name: button, exact: true }).click()
    const params = new URL((await pending).url()).searchParams
    expect(params.get('country')).toBe('all')
    expect(params.get('language')).toBe('all')
    expect(params.get('platform')).toBe('youtube')
    expect(params.get('q')).toBe('kamera')
  }
  await page.getByRole('button', { name: 'Kategori Nabzı', exact: true }).click()
  await expect(page.getByLabel('Ülke', { exact: true })).toBeDisabled()
  await expect(page.getByText('Kategori Nabzı tüm kaynakların son 7 günlük genel özetidir;', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Trendler', exact: true }).click()
  await expect(page.getByLabel('Ülke', { exact: true })).toBeEnabled()
  await page.screenshot({ path: info.outputPath('radar-filters.png'), fullPage: true })
})

test('a delayed Radar response cannot overwrite a newer country filter', async ({ page }) => {
  await mockData(page)
  let releaseOld!: () => void
  let started!: () => void
  const oldPending = new Promise<void>(resolve => { releaseOld = resolve })
  const oldStarted = new Promise<void>(resolve => { started = resolve })
  await page.route('**/kadexai/api/kade-search/trends?*', async route => {
    const country = new URL(route.request().url()).searchParams.get('country')
    if (country === 'TR') { started(); await oldPending }
    await route.fulfill({ json: { trendler: [{ id: country, title: `${country} filtre sonucu`, platform: 'youtube', kind: 'video', snapshot_count: 1, link_count: 0 }] } })
  })
  try {
    await page.goto('/kadexai/dashboard/trend-radar')
    await oldStarted
    await page.getByLabel('Ülke', { exact: true }).selectOption('US')
    await expect(page.getByRole('heading', { name: 'US filtre sonucu' })).toBeVisible()
    const response = page.waitForResponse(res => new URL(res.url()).pathname.endsWith('/kade-search/trends') && new URL(res.url()).searchParams.get('country') === 'TR')
    releaseOld()
    await (await response).finished()
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect(page.getByRole('heading', { name: 'US filtre sonucu' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'TR filtre sonucu' })).toHaveCount(0)
  } finally { releaseOld() }
})
