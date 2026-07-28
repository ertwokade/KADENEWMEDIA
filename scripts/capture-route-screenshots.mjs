#!/usr/bin/env node
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:4173'
const OUT_DIR = fileURLToPath(new URL('../docs/design-references/', import.meta.url))
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

const PUBLIC_ROUTES = [
  { slug: 'home', route: '/' },
  { slug: 'hakkimizda', route: '/hakkimizda' },
  { slug: 'hizmetler', route: '/hizmetler' },
  { slug: 'hizmet-detay', route: '/hizmetler/icerik-uretimi' },
  { slug: 'portfolio', route: '/portfolio' },
  { slug: 'paketler', route: '/paketler' },
  { slug: 'sss', route: '/sss' },
  { slug: 'iletisim', route: '/iletisim' },
  { slug: 'teklif-al', route: '/teklif-al' },
  { slug: 'kariyer', route: '/kariyer' },
]

const adminUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'gorsel-denetim',
  role: 'admin',
  permissions: {},
}

async function installSafePublicRoutes(page) {
  await page.route('**/api/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 204, body: '' })
      return
    }
    await route.continue()
  })
}

async function installAdminFixture(page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const action = url.searchParams.get('action')
    if (url.pathname === '/api/auth' && action === 'session') {
      await route.fulfill({ json: { authenticated: true, user: adminUser } })
      return
    }
    if (url.pathname === '/api/auth' && action === 'csrf') {
      await route.fulfill({ json: { csrfToken: 'screenshot-csrf-token' } })
      return
    }
    if (url.pathname === '/api/content' && request.method() === 'GET') {
      await route.fulfill({
        json: [{
          section: 'footer',
          data: {
            email: 'hello@kademedia.com',
            phone: '0506 729 34 23',
            address: 'Kade New Media',
            city: 'İstanbul',
          },
        }],
      })
      return
    }
    await route.fulfill({ json: [] })
  })
}

await mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
const files = []

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  })

  for (const target of PUBLIC_ROUTES) {
    const page = await context.newPage()
    await installSafePublicRoutes(page)
    await page.goto(new URL(target.route, BASE).href, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    const filename = `after-${target.slug}-${viewport.name}-${stamp}.png`
    await page.screenshot({ path: `${OUT_DIR}${filename}`, fullPage: true })
    files.push(filename)
    console.log(`✓ ${target.route} ${viewport.width}x${viewport.height} → ${filename}`)
    await page.close()
  }

  const admin = await context.newPage()
  await installAdminFixture(admin)
  await admin.goto(new URL('/admin', BASE).href, { waitUntil: 'domcontentloaded' })
  await admin.getByRole('heading', { name: 'Gösterge Paneli' }).waitFor()
  let filename = `after-admin-dashboard-${viewport.name}-${stamp}.png`
  await admin.screenshot({ path: `${OUT_DIR}${filename}`, fullPage: true })
  files.push(filename)

  if (viewport.width < 900) await admin.locator('.mobile-menu-btn').click()
  await admin.getByRole('button', { name: 'İÇERİK' }).click()
  await admin.getByRole('button', { name: 'İçerik Yönetimi' }).click()
  await admin.getByRole('tab', { name: /Footer/ }).click()
  await admin.getByRole('heading', { name: 'Footer & İletişim Bilgileri' }).waitFor()
  filename = `after-admin-content-footer-${viewport.name}-${stamp}.png`
  await admin.screenshot({ path: `${OUT_DIR}${filename}`, fullPage: true })
  files.push(filename)
  console.log(`✓ /admin içerik ${viewport.width}x${viewport.height} → ${filename}`)
  await admin.close()
  await context.close()
}

await browser.close()
console.log(`\n${files.length} ekran görüntüsü kaydedildi: ${OUT_DIR}`)
