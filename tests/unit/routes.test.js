import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { STATIC_PAGES, escapeXml, normalizeSiteBaseUrl } from '../../server/api/sitemap.js'
import { transformHtml } from '../../haoqi-clone/kade-html-transform.mjs'

test('critical public and protected route declarations remain present', async () => {
  const source = await readFile(new URL('../../src/App.jsx', import.meta.url), 'utf8')
  for (const route of ['/', '/hizmetler', '/iletisim', '/giris', '/giris/danismanlik', '/admin', '/musteri-panel', '/organizasyon-kiti', '/portfolio/:slug', '/fiyat-hesaplama', '/basin', '/neden-biz', '/referans-programi', '/podcast-webinar', '/bulten-arsivi']) {
    assert.match(source, new RegExp(`path=["']${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`), route)
  }
})

test('sitemap contains only public indexable routes', () => {
  const privatePrefixes = ['/admin', '/giris', '/musteri-panel', '/organizasyon-kiti', '/kadeai', '/api']
  for (const page of STATIC_PAGES) {
    assert.equal(privatePrefixes.some((prefix) => page.loc === prefix || page.loc.startsWith(`${prefix}/`)), false, page.loc)
  }
})

test('sitemap XML escaping handles hostile URL characters', () => {
  assert.equal(escapeXml('/x?<tag>&q="value"'), '/x?&lt;tag&gt;&amp;q=&quot;value&quot;')
})

test('sitemap base accepts only credential-free HTTP origins', () => {
  assert.equal(normalizeSiteBaseUrl('https://example.com/path?q=1'), 'https://example.com')
  assert.equal(normalizeSiteBaseUrl('javascript:alert(1)'), 'https://kadenewmedia.com')
  assert.equal(normalizeSiteBaseUrl('https://user:pass@example.com'), 'https://kadenewmedia.com')
})

test('homepage snapshot ships crawlable Kade metadata and one semantic title', async () => {
  const source = await readFile(new URL('../../haoqi-clone/index.html', import.meta.url), 'utf8')
  const html = transformHtml(source)
  assert.match(html, /<html\b[^>]*lang="tr"/i)
  assert.equal((html.match(/<h1\b/gi) || []).length, 1)
  assert.equal((html.match(/rel="canonical"/gi) || []).length, 1)
  assert.match(html, /name="robots" content="index, follow, max-image-preview:large/i)
  assert.match(html, /https:\/\/kadenewmedia\.com\/#organization/)
  assert.match(html, /https:\/\/kadenewmedia\.com\/#website/)
})

test('Kadir profile remains available when the profile API has no row', async () => {
  const source = await readFile(new URL('../../src/pages/LinkProfile.jsx', import.meta.url), 'utf8')
  assert.match(source, /const resolved = data \|\| FALLBACK_PROFILES\[slug\] \|\| null/)
})

test('dynamic public pages are server-validated before the SPA shell is served', async () => {
  const [vercelConfig, dispatcher, renderer] = await Promise.all([
    readFile(new URL('../../apps/kadeai/vercel.json', import.meta.url), 'utf8'),
    readFile(new URL('../../api/[...path].js', import.meta.url), 'utf8'),
    readFile(new URL('../../server/api/dynamicPage.js', import.meta.url), 'utf8'),
  ])
  for (const type of ['blog', 'partner', 'portfolio', 'profile']) {
    assert.match(vercelConfig, new RegExp(`type=${type}`), type)
  }
  assert.match(dispatcher, /'dynamic-page': dynamicPage/)
  assert.match(renderer, /res\.status\(page \? 200 : 404\)\.send\(html\)/)
  assert.match(renderer, /`\/@\$\{slug\}`/)
})
