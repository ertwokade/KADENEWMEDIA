import { expect, test } from '@playwright/test'

test('login and public assets keep the /kadexai base path', async ({ page, request }) => {
  const response = await page.goto('/kadexai/login')
  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).pathname).toBe('/kadexai/login')
  await expect(page.getByRole('img', { name: 'KADE' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'E-posta' })).toBeVisible()

  const manifest = await request.get('/kadexai/manifest.json')
  expect(manifest.status()).toBe(200)
  const body = await manifest.json()
  expect(body.start_url).toBe('/kadexai/dashboard')
  expect(body.scope).toBe('/kadexai/')
})

test('protected deep links redirect to base-path login without auth', async ({ page }) => {
  await page.goto('/kadexai/dashboard/title')
  expect(new URL(page.url()).pathname).toBe('/kadexai/login')
})

test('root variants and protected operations route never duplicate the base path', async ({ page, request }) => {
  const root = await request.get('/kadexai/', { maxRedirects: 0 })
  expect([200, 307, 308]).toContain(root.status())
  expect(root.headers().location || '').not.toContain('/kadexai/kadexai')

  await page.goto('/kadexai/operations-kit/index.html')
  expect(new URL(page.url()).pathname).toBe('/kadexai/login')
})

test('health endpoint exposes no secrets', async ({ request }) => {
  const response = await request.get('/kadexai/api/health')
  expect([200, 503]).toContain(response.status())
  const body = await response.json()
  expect(body.service).toBe('kadexai')
  expect(JSON.stringify(body)).not.toContain('API_KEY')
  expect(response.headers()['content-type']).toContain('application/json')
  expect(await response.text()).not.toContain('<!doctype html>')
})

test('anonymous auth recovery and payment boundaries fail closed', async ({ request }) => {
  const recoverySession = await request.get('/kadexai/api/auth/recovery-session')
  expect(recoverySession.status()).toBe(401)

  const updatePassword = await request.post('/kadexai/api/auth/update-password', {
    data: { password: 'valid-new-password' },
  })
  expect(updatePassword.status()).toBe(401)

  for (const endpoint of ['/kadexai/api/payments/status?orderId=00000000-0000-0000-0000-000000000000', '/kadexai/api/backend/health']) {
    const response = await request.get(endpoint)
    expect(response.status()).toBe(401)
  }
  const checkout = await request.post('/kadexai/api/payments/checkout', { data: { productId: 'sandbox-credit' } })
  expect(checkout.status()).toBe(401)
})

test('forged payment webhook never mutates an order', async ({ request }) => {
  const response = await request.post('/kadexai/api/payments/webhook', {
    headers: { 'x-kade-signature': '0'.repeat(64) },
    data: { eventId: 'forged-event', orderId: 'forged-order', status: 'paid' },
  })
  expect([400, 503]).toContain(response.status())
  expect(await response.json()).toHaveProperty('error')
})

test('paths outside /kadexai are not claimed by the app', async ({ request }) => {
  const response = await request.get('/dashboard')
  expect(response.status()).toBe(404)
})

test('protected data APIs reject anonymous reads and writes', async ({ request }) => {
  for (const endpoint of ['/kadexai/api/profile', '/kadexai/api/history', '/kadexai/api/calendar', '/kadexai/api/templates', '/kadexai/api/env-status']) {
    const read = await request.get(endpoint)
    expect(read.status(), `${endpoint} GET`).toBe(401)

    const write = await request.post(endpoint, { data: {} })
    expect(write.status(), `${endpoint} POST`).toBe(401)
  }
})

test('cross-site mutating requests are rejected before reaching handlers', async ({ request }) => {
  const response = await request.post('/kadexai/api/history', {
    headers: { Origin: 'https://evil.example' },
    data: {},
  })
  expect(response.status()).toBe(403)
})

test('public auth endpoints also reject cross-site POST requests', async ({ request }) => {
  const response = await request.post('/kadexai/api/auth/password', {
    headers: { Origin: 'https://evil.example' },
    data: { action: 'login', email: 'person@example.com', password: 'not-a-real-password' },
  })
  expect(response.status()).toBe(403)
})

test('same-origin auth POST is accepted by the CSRF gate', async ({ request }, testInfo) => {
  const response = await request.post('/kadexai/api/auth/password', {
    headers: { Origin: testInfo.project.use.baseURL as string },
    data: { action: 'login', email: 'invalid', password: 'valid-length-password' },
  })
  expect(response.status()).toBe(400)
})

test('login validation is server-side and rate limited', async ({ request }, testInfo) => {
  const payload = {
    action: 'login',
    email: `invalid-${testInfo.project.name}-${Date.now()}-${Math.random()}`,
    password: 'valid-length-password',
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await request.post('/kadexai/api/auth/password', { data: payload })
    expect(response.status()).toBe(400)
  }
  const limited = await request.post('/kadexai/api/auth/password', { data: payload })
  expect(limited.status()).toBe(429)
  expect(limited.headers()['retry-after']).toBeTruthy()
})

test('oversized AI payloads are rejected before provider execution', async ({ request }) => {
  const response = await request.post('/kadexai/api/assistant', {
    data: { question: 'x'.repeat(70_000) },
  })
  expect(response.status()).toBe(413)
})

test('auth callback blocks external redirect targets', async ({ request }) => {
  const response = await request.get('/kadexai/auth/callback?next=//evil.example', { maxRedirects: 0 })
  expect([307, 308]).toContain(response.status())
  const requestOrigin = new URL(response.url()).origin
  const location = new URL(response.headers().location || '', requestOrigin)
  expect([requestOrigin, 'https://kadenewmedia.com']).toContain(location.origin)
  expect(location.hostname).not.toBe('evil.example')
  expect(location.pathname).toBe('/kadexai/login')
})

test('login page has no critical browser console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/kadexai/login')
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('security headers are present on application responses', async ({ request }) => {
  const response = await request.get('/kadexai/login')
  expect(response.headers()['content-security-policy']).toContain("default-src 'self'")
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

test('transparent KADE logo is served under the base path', async ({ request }) => {
  const response = await request.get('/kadexai/brand/kade-logo.svg')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('image/svg+xml')
  const svg = await response.text()
  expect(svg).not.toContain('<rect')
})

test('removed tools have no surviving API endpoint', async ({ request }) => {
  for (const endpoint of ['/kadexai/api/generate/script', '/kadexai/api/generate/podcast', '/kadexai/api/generate/newsletter']) {
    const response = await request.post(endpoint, { data: {} })
    expect([401, 404]).toContain(response.status())
  }
})

test('password recovery page is available under the production prefix', async ({ page }) => {
  const response = await page.goto('/kadexai/reset-password')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Şifreni yenile' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'E-posta' })).toBeVisible()
})
