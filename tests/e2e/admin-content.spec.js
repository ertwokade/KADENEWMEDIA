import { test, expect } from '@playwright/test'

const adminUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'audit-admin',
  role: 'admin',
  permissions: {},
}

async function mockAdminApi(page, { failPut = false, onPut = () => {} } = {}) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const action = url.searchParams.get('action')

    if (url.pathname === '/api/auth' && action === 'session') {
      return route.fulfill({ json: { authenticated: true, user: adminUser } })
    }
    if (url.pathname === '/api/auth' && action === 'csrf') {
      return route.fulfill({ json: { csrfToken: 'admin-e2e-csrf-token' } })
    }
    if (url.pathname === '/api/content' && request.method() === 'GET') {
      return route.fulfill({
        json: [{
          section: 'footer',
          data: {
            email: 'once@example.test',
            phone: '+90 500 000 00 00',
            address: 'Test Sokak 1',
            city: 'İstanbul',
          },
        }],
      })
    }
    if (url.pathname === '/api/content' && request.method() === 'PUT') {
      const body = request.postDataJSON()
      onPut(body)
      if (failPut) {
        return route.fulfill({ status: 422, json: { error: 'Doğrulama hatası' } })
      }
      return route.fulfill({ json: { ok: true } })
    }

    return route.fulfill({ json: [] })
  })
}

async function openFooterEditor(page) {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Gösterge Paneli' })).toBeVisible()
  await page.getByRole('button', { name: 'İÇERİK' }).click()
  await page.getByRole('button', { name: 'İçerik Yönetimi' }).click()
  await page.getByRole('tab', { name: /Footer/ }).click()
  await expect(page.getByRole('heading', { name: 'Footer & İletişim Bilgileri' })).toBeVisible()
}

test.describe('admin içerik CRUD', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('footer değişikliğini doğru section ile kaydeder ve başarı bildirir', async ({ page }) => {
    let savedBody = null
    await mockAdminApi(page, { onPut: (body) => { savedBody = body } })
    await openFooterEditor(page)

    await page.getByLabel('E-posta').fill('yeni@example.test')
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect.poll(() => savedBody).not.toBeNull()
    expect(savedBody.section).toBe('footer')
    expect(savedBody.data.email).toBe('yeni@example.test')
    await expect(page.getByRole('status')).toContainText('İçerik güncellendi!')
  })

  test('API doğrulama hatasını başarı gibi göstermez', async ({ page }) => {
    await mockAdminApi(page, { failPut: true })
    await openFooterEditor(page)

    await page.getByLabel('E-posta').fill('hata@example.test')
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page.getByRole('alert')).toContainText('Doğrulama hatası')
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})
