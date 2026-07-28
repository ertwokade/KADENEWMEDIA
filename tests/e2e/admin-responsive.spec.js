import { test, expect } from '@playwright/test'
import { mockAdminApi, openAdmin, gotoSection, findOverflow } from './helpers/adminMock.js'

/**
 * Admin panelinin responsive ve kullanılabilirlik denetimi.
 *
 * Public sayfalarda yatay taşma testi zaten var; admin ekranları oturum
 * gerektirdiği için canlı denetime giremiyordu. Burada mock oturumla
 * 390 / 768 / 1440 genişliklerinde şunlar doğrulanır:
 *   • gövde yatay kaymıyor (tablo kendi içinde kayabilir)
 *   • geniş tablo kendi kapsayıcısında kaydırılabiliyor
 *   • modal viewport'u taşmıyor ve Escape ile kapanıyor
 *   • sabit üst çubuk içeriği örtmüyor
 *   • dokunma hedefleri yeterince büyük
 */

const VIEWPORTS = [
  { name: 'mobil', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'masaustu', width: 1440, height: 900 },
]

for (const vp of VIEWPORTS) {
  test.describe(`admin ${vp.name} (${vp.width}px)`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    test('gösterge panelinde yatay taşma yok', async ({ page }) => {
      await mockAdminApi(page)
      await openAdmin(page)

      const result = await findOverflow(page)
      expect(result.offenders, `taşan elemanlar:\n  ${result.offenders.join('\n  ')}`).toEqual([])
      expect(result.bodyScrolls, `scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`).toBe(false)
    })

    test('içerik yönetimi sekmelerinde yatay taşma yok', async ({ page }) => {
      await mockAdminApi(page)
      await openAdmin(page)
      await gotoSection(page, 'İÇERİK', 'İçerik Yönetimi')
      await expect(page.getByRole('heading', { name: /İçerik/ }).first()).toBeVisible()

      const result = await findOverflow(page)
      expect(result.offenders, `taşan elemanlar:\n  ${result.offenders.join('\n  ')}`).toEqual([])
    })

    test('uzun başlıklı blog tablosu gövdeyi taşırmaz', async ({ page }) => {
      await mockAdminApi(page)
      await openAdmin(page)
      await gotoSection(page, 'İÇERİK', 'Blog Yazıları')
      await expect(page.getByText('Sosyal medyada organik büyüme').first()).toBeVisible()

      const result = await findOverflow(page)
      expect(result.offenders, `taşan elemanlar:\n  ${result.offenders.join('\n  ')}`).toEqual([])

      // Tablo dar ekranda kendi kapsayıcısında kaydırılabilmeli; aksi hâlde
      // sütunlar okunamaz biçimde sıkışır.
      const scrollable = await page.evaluate(() => {
        const wrapper = document.querySelector('.admin-table-wrapper, .admin-table')?.closest('.admin-table-wrapper')
          || document.querySelector('.admin-table')?.parentElement
        if (!wrapper) return null
        const st = getComputedStyle(wrapper)
        return { overflowX: st.overflowX, canScroll: wrapper.scrollWidth > wrapper.clientWidth }
      })
      if (scrollable && scrollable.canScroll) {
        expect(['auto', 'scroll'], 'tablo kapsayıcısı kaydırılabilir olmalı').toContain(scrollable.overflowX)
      }
    })
  })
}

test.describe('admin modal davranışı', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('modal viewport\'u taşmaz ve Escape ile kapanır', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    const newButton = page.getByRole('button', { name: /Yeni/i }).first()
    if (await newButton.count() === 0) test.skip(true, 'bu bölümde modal açan düğme yok')
    await newButton.click()

    const modal = page.locator('.admin-modal').first()
    await expect(modal).toBeVisible()

    // Modal kutusu ekranın dışına taşmamalı.
    const box = await modal.boundingBox()
    const viewport = page.viewportSize()
    expect(box.x, 'modal soldan taşıyor').toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width, 'modal sağdan taşıyor').toBeLessThanOrEqual(viewport.width + 1)

    // Modal açıkken gövde yatay kaymamalı.
    const result = await findOverflow(page)
    expect(result.offenders, `modal açıkken taşma:\n  ${result.offenders.join('\n  ')}`).toEqual([])

    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()
  })
})

test.describe('admin sabit üst çubuk', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('sabit başlık ilk içeriği örtmüyor', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)

    const covered = await page.evaluate(() => {
      // Sabit/yapışkan üst çubuğu bul.
      const bars = [...document.querySelectorAll('header, .admin-topbar, .admin-header')]
        .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
      if (!bars.length) return null

      const bar = bars[0].getBoundingClientRect()
      const heading = document.querySelector('.admin-page-header h1, main h1, h1')
      if (!heading) return null
      const h = heading.getBoundingClientRect()

      // Başlığın üst kenarı çubuğun altından yukarıda kalıyorsa örtülüyor.
      return { overlaps: h.top < bar.bottom - 1, barBottom: Math.round(bar.bottom), headingTop: Math.round(h.top) }
    })

    if (covered === null) test.skip(true, 'sabit üst çubuk veya başlık yok')
    expect(covered.overlaps, `başlık üst çubuğun altında kalıyor (bar=${covered.barBottom}px, başlık=${covered.headingTop}px)`).toBe(false)
  })

  test('dokunma hedefleri yeterince büyük', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)

    const small = await page.evaluate(() => {
      const MIN = 24 // WCAG 2.1 AA (2.5.8) alt sınırı
      const offenders = []
      for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="tab"]')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (getComputedStyle(el).visibility === 'hidden') continue
        // Satır içi metin bağlantıları bu kuralın dışındadır.
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue
        if (r.height < MIN || r.width < MIN) {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || '?'} ${Math.round(r.width)}×${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 20)}"`)
        }
      }
      return [...new Set(offenders)].slice(0, 10)
    })

    expect(small, `24px altında dokunma hedefi:\n  ${small.join('\n  ')}`).toEqual([])
  })
})
