import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { STATIC_PAGES, escapeXml, normalizeSiteBaseUrl } from '../../server/api/sitemap.js'

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
