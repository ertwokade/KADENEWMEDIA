import { expect } from '@playwright/test'

/**
 * Admin paneli için paylaşılan API mock'u.
 *
 * Neden mock: gerçek admin kimlik bilgisi yok ve production veritabanına
 * test kaydı yazılmamalı. Mock, arayüzün API sözleşmesine göre doğru
 * davranıp davranmadığını (istek gövdesi, başarı/hata yolu, liste
 * tazeleme) doğrular — backend'in kendisini değil.
 */

export const adminUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'audit-admin',
  role: 'admin',
  permissions: {},
}

/** Uzun metinli, sınır durumu zorlayan blog kayıtları — tablo taşması için. */
export const blogFixtures = [
  {
    _id: '550e8400-e29b-41d4-a716-446655440101',
    slug: 'cok-uzun-basligi-olan-ornek-yazi',
    titleTr: 'Sosyal medyada organik büyüme için uçtan uca içerik stratejisi nasıl kurulur ve ölçülür',
    titleEn: 'How to build and measure an end-to-end organic growth content strategy',
    category: 'Strateji',
    status: 'published',
    publishedAt: '2026-01-15T10:00:00.000Z',
    author: 'Kade New Media',
  },
  {
    _id: '550e8400-e29b-41d4-a716-446655440102',
    slug: 'taslak-yazi',
    titleTr: 'Taslak yazı',
    titleEn: 'Draft post',
    category: 'Genel',
    status: 'draft',
    publishedAt: null,
    author: 'Kade New Media',
  },
]

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {boolean} [options.failPut]      PUT isteğini 422 ile reddet
 * @param {boolean} [options.failDelete]   DELETE isteğini 500 ile reddet
 * @param {Function} [options.onPut]       PUT gövdesini yakala
 * @param {Function} [options.onDelete]    DELETE URL'ini yakala
 * @param {Array} [options.blogs]          blog listesi (boş liste durumu için [])
 * @param {object} [options.content]       /api/content GET yanıtı
 */
export async function mockAdminApi(page, {
  failPut = false,
  failDelete = false,
  onPut = () => {},
  onDelete = () => {},
  blogs = blogFixtures,
  content = null,
} = {}) {
  let blogState = [...blogs]

  const contentPayload = content || [{
    section: 'footer',
    data: {
      email: 'once@example.test',
      phone: '+90 500 000 00 00',
      address: 'Test Sokak 1',
      city: 'İstanbul',
    },
  }]

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const action = url.searchParams.get('action')
    const method = request.method()

    if (url.pathname === '/api/auth' && action === 'session') {
      return route.fulfill({ json: { authenticated: true, user: adminUser } })
    }
    if (url.pathname === '/api/auth' && action === 'csrf') {
      return route.fulfill({ json: { csrfToken: 'admin-e2e-csrf-token' } })
    }

    if (url.pathname === '/api/content' && method === 'GET') {
      return route.fulfill({ json: contentPayload })
    }
    if (url.pathname === '/api/content' && method === 'PUT') {
      onPut(request.postDataJSON())
      if (failPut) return route.fulfill({ status: 422, json: { error: 'Doğrulama hatası' } })
      return route.fulfill({ json: { ok: true } })
    }

    if (url.pathname === '/api/blog' && method === 'GET') {
      return route.fulfill({ json: blogState })
    }
    if (url.pathname === '/api/blog' && method === 'DELETE') {
      onDelete(url.searchParams.get('id'))
      if (failDelete) return route.fulfill({ status: 500, json: { error: 'Sunucu hatası' } })
      // Silinen kayıt listeden gerçekten düşmeli — "silinen kayıt listede
      // kalıyor" hatasının regresyon koruması.
      blogState = blogState.filter((b) => b._id !== url.searchParams.get('id'))
      return route.fulfill({ json: { message: 'Post silindi' } })
    }

    return route.fulfill({ json: [] })
  })
}

/** Admin panelini açar ve oturumun yüklenmesini bekler. */
export async function openAdmin(page) {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Gösterge Paneli' })).toBeVisible()
}

/**
 * Kenar çubuğundaki bir bölüme gider. Mobilde kenar çubuğu gizli olduğu
 * için önce menü düğmesi açılır.
 */
export async function gotoSection(page, group, section) {
  // ≤1024px'te kenar çubuğu gizli; önce mobil menü düğmesiyle açılmalı.
  const menuToggle = page.locator('.mobile-menu-btn')
  if (await menuToggle.isVisible().catch(() => false)) {
    await menuToggle.click()
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
  }
  await page.getByRole('button', { name: group, exact: true }).click()
  await page.getByRole('button', { name: section, exact: true }).click()
}

/**
 * Sayfada yatay taşmaya yol açan elemanları döndürür.
 * `overflow-x` ile kendi içinde kaydırılabilen kapsayıcılar (tablo sarmalayıcı
 * gibi) taşma sayılmaz — asıl sorun GÖVDENİN yatay kaymasıdır.
 */
export async function findOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const limit = de.clientWidth + 2
    const offenders = []

    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      if (rect.right <= limit && rect.left >= -2) continue

      // Kendi scroll konteyneri içinde mi? O zaman tasarlanmış davranış.
      let node = el.parentElement
      let contained = false
      while (node && node !== document.body) {
        const st = getComputedStyle(node)
        if (['auto', 'scroll', 'hidden'].includes(st.overflowX)) { contained = true; break }
        node = node.parentElement
      }
      if (contained) continue

      const st = getComputedStyle(el)
      if (st.position === 'fixed' && (st.visibility === 'hidden' || st.opacity === '0')) continue

      offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || '(sınıfsız)'} → right=${Math.round(rect.right)} (limit ${limit})`)
      if (offenders.length >= 8) break
    }

    return {
      offenders,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      bodyScrolls: de.scrollWidth > de.clientWidth + 1,
    }
  })
}
