import { test, expect } from '@playwright/test'
import { mockAdminApi, openAdmin, gotoSection, blogFixtures } from './helpers/adminMock.js'

/**
 * Admin CRUD davranış denetimi.
 *
 * Gerçek admin kimlik bilgisi olmadığı ve production veritabanına test
 * kaydı yazılmaması gerektiği için backend mock'lanır. Doğrulanan şey
 * ARAYÜZÜN davranışıdır — istenen tipik hatalar:
 *   • butona basınca hiçbir şey olmaması
 *   • başarı mesajı verip veriyi kaydetmemesi
 *   • network hatasında başarı bildirimi
 *   • silinen kaydın listede kalması
 *   • modalın kapanmaması
 *   • boş liste durumunun bozuk olması
 *   • çift gönderim
 */

test.describe('admin blog CRUD', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('liste kayıtları gösterir ve yayın durumunu ayırt eder', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    await expect(page.getByText(blogFixtures[0].titleTr)).toBeVisible()
    await expect(page.getByText(blogFixtures[1].titleTr)).toBeVisible()
  })

  test('boş liste durumu bozuk görünmez', async ({ page }) => {
    await mockAdminApi(page, { blogs: [] })
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    const empty = page.locator('.admin-empty-state')
    await expect(empty).toBeVisible()
    // "Yükleniyor..." kalıcı olarak takılı kalmamalı.
    await expect(empty).not.toContainText('Yükleniyor')
  })

  test('silme onayı iptal edilirse istek gönderilmez', async ({ page }) => {
    let deleteCalls = 0
    await mockAdminApi(page, { onDelete: () => { deleteCalls += 1 } })
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    page.once('dialog', (dialog) => dialog.dismiss())
    await page.getByRole('button', { name: /^Sil$/ }).first().click()

    await page.waitForTimeout(400)
    expect(deleteCalls, 'onay iptal edildiği hâlde silme isteği gitti').toBe(0)
    await expect(page.getByText(blogFixtures[0].titleTr)).toBeVisible()
  })

  test('onaylanan silme sonrası kayıt listeden düşer', async ({ page }) => {
    let deletedId = null
    await mockAdminApi(page, { onDelete: (id) => { deletedId = id } })
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /^Sil$/ }).first().click()

    await expect.poll(() => deletedId).toBe(blogFixtures[0]._id)
    await expect(page.getByRole('status')).toContainText('silindi')
    // Liste gerçekten tazelenmeli — "silinen kayıt listede kalıyor" regresyonu.
    await expect(page.getByText(blogFixtures[0].titleTr)).toHaveCount(0)
  })

  test('silme başarısız olursa başarı bildirimi gösterilmez', async ({ page }) => {
    await mockAdminApi(page, { failDelete: true })
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /^Sil$/ }).first().click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
    // Kayıt listede kalmalı: silinmedi.
    await expect(page.getByText(blogFixtures[0].titleTr)).toBeVisible()
  })

  test('yeni kayıt modalı açılır ve kapanır', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'Blog Yazıları')

    await page.getByRole('button', { name: /Yeni Yazı/i }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Odak modalın içine taşınmış olmalı (klavye kullanıcısı arkada kalmamalı).
    const focusInside = await page.evaluate(() => {
      const box = document.querySelector('.admin-modal')
      return box ? box.contains(document.activeElement) : false
    })
    expect(focusInside, 'modal açıldığında odak içine taşınmadı').toBe(true)

    await page.getByRole('button', { name: 'Kapat' }).click()
    await expect(modal).toBeHidden()
  })
})

test.describe('admin içerik kaydetme', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  async function openFooterEditor(page) {
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'İçerik Yönetimi')
    await page.getByRole('tab', { name: /Footer/ }).click()
    await expect(page.getByRole('heading', { name: 'Footer & İletişim Bilgileri' })).toBeVisible()
  }

  test('kaydetme doğru section ve gövdeyle gider', async ({ page }) => {
    let saved = null
    await mockAdminApi(page, { onPut: (body) => { saved = body } })
    await openFooterEditor(page)

    await page.getByLabel('E-posta').fill('yeni@example.test')
    await page.getByLabel('Instagram').fill('https://instagram.com/kade')
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect.poll(() => saved).not.toBeNull()
    expect(saved.section).toBe('footer')
    expect(saved.data.email).toBe('yeni@example.test')
    expect(saved.data.instagram).toBe('https://instagram.com/kade')
    // Dokunulmayan alanlar gövdede korunmalı — kısmi kayıt veri kaybettirmemeli.
    expect(saved.data.phone).toBe('+90 500 000 00 00')
    await expect(page.getByRole('status')).toContainText('İçerik güncellendi!')
  })

  test('API hatası başarı gibi gösterilmez', async ({ page }) => {
    await mockAdminApi(page, { failPut: true })
    await openFooterEditor(page)

    await page.getByLabel('E-posta').fill('hata@example.test')
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page.getByRole('alert')).toContainText('Doğrulama hatası')
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('hedef sayfası olmayan sekme açıkça uyarır', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'İçerik Yönetimi')

    await page.getByRole('tab', { name: /Basın/ }).click()
    const notice = page.locator('.admin-content-notice--no-page')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('sitede yok')
    // Yönetici hangi URL'nin 404 döndüğünü görebilmeli.
    await expect(notice).toContainText('/basin')
  })

  test('kodda sabit metin taşıyan sekme de bunu bildirir', async ({ page }) => {
    await mockAdminApi(page)
    await openAdmin(page)
    await gotoSection(page, 'İÇERİK', 'İçerik Yönetimi')

    await page.getByRole('tab', { name: /Hero/ }).click()
    await expect(page.locator('.admin-content-notice--static')).toBeVisible()
  })
})
