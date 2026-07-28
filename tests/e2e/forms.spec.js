import { test, expect } from '@playwright/test'

/**
 * Dönüşüm formlarının davranış denetimi.
 *
 * Backend mock'lanır: production'a gerçek başvuru/e-posta gönderilmemeli.
 * Doğrulanan şey arayüzün sözleşmesidir — özellikle "başarısız gönderimde
 * yanlış başarı mesajı" ve "çift gönderim" senaryoları.
 */

/**
 * @param {object} options
 * @param {number} [options.status]   API yanıt kodu
 * @param {number} [options.delayMs]  Yanıtı geciktir (çift gönderim testi)
 * @param {Function} [options.onPost] Gönderilen gövdeyi yakala
 */
async function mockContactApi(page, { status = 200, delayMs = 0, onPost = () => {} } = {}) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname === '/api/auth' && url.searchParams.get('action') === 'csrf') {
      return route.fulfill({ json: { csrfToken: 'forms-e2e-csrf' } })
    }

    if (url.pathname === '/api/contact' && request.method() === 'POST') {
      onPost(request.postDataJSON())
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      if (status >= 400) {
        return route.fulfill({ status, json: { error: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.' } })
      }
      return route.fulfill({ json: { ok: true } })
    }

    return route.fulfill({ json: [] })
  })
}

/** Formu geçerli verilerle doldurur (gönderme). */
async function fillContactForm(page, overrides = {}) {
  const data = {
    name: 'Ayşe Çağrı Öztürk',
    email: 'ayse.ozturk@example.test',
    message: 'Markamız için sosyal medya yönetimi ve içerik üretimi teklifi almak istiyoruz. Şubat ayında başlamayı planlıyoruz.',
    ...overrides,
  }

  await page.getByLabel(/Ad.*Soyad|İsim/i).first().fill(data.name)
  await page.getByLabel(/E-posta|Email/i).first().fill(data.email)
  const message = page.locator('textarea').first()
  await message.fill(data.message)
  return data
}

/**
 * KVKK onayını işaretler.
 * Onay kutusu özel tasarım nedeniyle görsel olarak gizli; gerçek kullanıcı
 * gibi etikete tıklanır.
 */
async function acceptKvkk(page) {
  // Onay kutusu görsel olarak gizli; işaretleme .checkbox-mark üzerinden
  // yapılır. Etiket metnine tıklamak KVKK/Gizlilik bağlantılarına denk
  // geldiği için kullanılmaz.
  await page.locator('.kvkk-consent .checkbox-mark').first().click()
  await expect(page.locator('.kvkk-consent input[type="checkbox"]')).toBeChecked()
}

test.describe('iletişim formu', () => {
  test('KVKK onayı olmadan gönderim engellenir', async ({ page }) => {
    let posted = false
    await mockContactApi(page, { onPost: () => { posted = true } })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    await fillContactForm(page)
    // KVKK kutusu işaretlenmeden gönder.
    await page.getByRole('button', { name: /Gönder/i }).first().click()

    await page.waitForTimeout(500)
    expect(posted, 'KVKK onayı yokken istek gönderildi').toBe(false)
    // Kullanıcı neden gönderilmediğini görmeli.
    await expect(page.locator('form')).toContainText(/KVKK|onay/i)
  })

  test('geçersiz e-posta backend\'e gitmez', async ({ page }) => {
    let posted = false
    await mockContactApi(page, { onPost: () => { posted = true } })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    await fillContactForm(page, { email: 'gecersiz-adres' })
    await acceptKvkk(page)
    await page.getByRole('button', { name: /Gönder/i }).first().click()

    await page.waitForTimeout(500)
    expect(posted, 'geçersiz e-posta ile istek gönderildi').toBe(false)
  })

  test('kısa mesaj reddedilir', async ({ page }) => {
    let posted = false
    await mockContactApi(page, { onPost: () => { posted = true } })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    await fillContactForm(page, { message: 'Merhaba' })
    await acceptKvkk(page)
    await page.getByRole('button', { name: /Gönder/i }).first().click()

    await page.waitForTimeout(500)
    expect(posted, '20 karakterden kısa mesaj gönderildi').toBe(false)
    await expect(page.locator('form')).toContainText(/20 karakter/i)
  })

  test('geçerli gönderim Türkçe karakterleri bozmadan iletir ve /tesekkur\'a yönlendirir', async ({ page }) => {
    let body = null
    await mockContactApi(page, { onPost: (data) => { body = data } })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    const data = await fillContactForm(page)
    await acceptKvkk(page)
    await page.getByRole('button', { name: /Gönder/i }).first().click()

    await expect.poll(() => body).not.toBeNull()
    expect(body.name).toBe(data.name)          // Ayşe Çağrı Öztürk
    expect(body.email).toBe(data.email)
    expect(body.consent).toBe(true)            // KVKK onayı gövdeye girmeli

    await expect(page).toHaveURL(/\/tesekkur/, { timeout: 5000 })
  })

  test('API hatasında başarı gösterilmez ve /tesekkur\'a gidilmez', async ({ page }) => {
    await mockContactApi(page, { status: 500 })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    await fillContactForm(page)
    await acceptKvkk(page)
    await page.getByRole('button', { name: /Gönder/i }).first().click()

    // Hata mesajı görünmeli.
    await expect(page.locator('form')).toContainText(/gönderilemedi|hata/i, { timeout: 5000 })
    // Başarı yönlendirmesi OLMAMALI.
    await page.waitForTimeout(1500)
    expect(page.url()).not.toContain('/tesekkur')
  })

  test('gönderim sırasında buton kilitlenir (çift gönderim koruması)', async ({ page }) => {
    let postCount = 0
    await mockContactApi(page, { delayMs: 1200, onPost: () => { postCount += 1 } })
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    await fillContactForm(page)
    await acceptKvkk(page)

    const submit = page.getByRole('button', { name: /Gönder/i }).first()
    await submit.click()
    // İstek uçarken tekrar tıklamayı dene.
    await page.waitForTimeout(200)
    await submit.click({ force: true }).catch(() => { /* devre dışıysa tıklanamaz — beklenen */ })

    await page.waitForTimeout(1600)
    expect(postCount, 'aynı form iki kez gönderildi').toBe(1)
  })

  test('hassas teknik hata kullanıcıya sızmaz', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/auth') return route.fulfill({ json: { csrfToken: 'x' } })
      if (url.pathname === '/api/contact') {
        // Sunucudan sızan bir yığın izi taklidi.
        return route.fulfill({
          status: 500,
          json: { error: 'SequelizeConnectionError: password authentication failed for user "postgres" at /var/task/db.js:42' },
        })
      }
      return route.fulfill({ json: [] })
    })

    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')
    await fillContactForm(page)
    await acceptKvkk(page)
    await page.getByRole('button', { name: /Gönder/i }).first().click()
    await page.waitForTimeout(1200)

    const visible = await page.locator('form').innerText()
    expect(visible, 'veritabanı/dosya yolu bilgisi kullanıcıya gösteriliyor').not.toMatch(/postgres|\/var\/task|Sequelize/i)
  })
})

test.describe('form erişilebilirliği', () => {
  for (const route of ['/iletisim', '/teklif-al']) {
    test(`${route}: her girdinin bağlı etiketi var`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const unlabelled = await page.evaluate(() => {
        const offenders = []
        for (const el of document.querySelectorAll('input, textarea, select')) {
          if (el.type === 'hidden') continue
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue

          const hasLabel = Boolean(
            (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
            el.closest('label') ||
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby'),
          )
          if (!hasLabel) offenders.push(`${el.tagName.toLowerCase()}[name=${el.name || '?'}]`)
        }
        return offenders
      })

      expect(unlabelled, `etiketsiz alan: ${unlabelled.join(', ')}`).toEqual([])
    })
  }

  test('zorunlu alanlar işaretli', async ({ page }) => {
    await page.goto('/iletisim')
    await page.waitForLoadState('networkidle')

    const requiredCount = await page.locator('[required], [aria-required="true"]').count()
    expect(requiredCount, 'hiçbir alan zorunlu olarak işaretlenmemiş').toBeGreaterThan(0)
  })
})
