import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  OWNER_WORKSPACE_SLUG,
  isValidWorkspaceSlug,
  slugifyWorkspaceName,
  splitWorkspacePath,
  workspaceHref,
  workspaceSlugForUser,
} from '../../lib/workspace/slug'

test('panel rotaları alan adresi olarak kullanılamaz', () => {
  // Aksi halde kendine "dashboard" diyen bir kullanıcı paneli gölgeler.
  for (const ayrilmis of ['dashboard', 'api', 'login', 'logout', 'auth', 'legal',
    'onboarding', 'operations-kit', 'brand', 'settings', 'admin', '_next']) {
    assert.equal(isValidWorkspaceSlug(ayrilmis), false, `${ayrilmis} ayrılmış olmalı`)
  }
})

test('adres yalnızca güvenli karakterlerden oluşur', () => {
  for (const kotu of ['', 'a', 'A-Big', 'bos luk', 'nokta.li', 'egik/cizgi',
    '-bastan', 'sondan-', 'cok'.repeat(20), '../ust', '%2e%2e']) {
    assert.equal(isValidWorkspaceSlug(kotu), false, `${kotu} reddedilmeli`)
  }
  assert.equal(isValidWorkspaceSlug('kade'), true)
  assert.equal(isValidWorkspaceSlug('ayse-yilmaz'), true)
})

test('Türkçe adlar adrese doğru çevrilir', () => {
  assert.equal(slugifyWorkspaceName('Çağrı Öz'), 'cagri-oz')
  assert.equal(slugifyWorkspaceName('İstanbul Ajans'), 'istanbul-ajans')
  assert.equal(slugifyWorkspaceName('Ünlü  Şirket!!'), 'unlu-sirket')
})

test('sahibin adresi sabit, kimse onu alamaz', () => {
  const sahip = { id: '11111111-1111-1111-1111-111111111111', email: 'sahip@ornek.com' }
  assert.equal(workspaceSlugForUser(sahip, true), OWNER_WORKSPACE_SLUG)

  // Adı "Kade" olan bir müşteri sahibin adresini ele geçiremez.
  const musteri = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'kade@baskasi.com',
    user_metadata: { display_name: 'Kade' },
  }
  assert.notEqual(workspaceSlugForUser(musteri, false), OWNER_WORKSPACE_SLUG)

  // Metadata'ya elle 'kade' yazılsa bile geçerli olmaz.
  const kurcalayan = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'x@y.com',
    user_metadata: { workspace_slug: OWNER_WORKSPACE_SLUG },
  }
  assert.notEqual(workspaceSlugForUser(kurcalayan, false), OWNER_WORKSPACE_SLUG)
})

test('yol ayrıştırma gerçek rotaları alan sanmaz', () => {
  assert.deepEqual(splitWorkspacePath('/dashboard/title'), { slug: null, kalan: '/dashboard/title' })
  assert.deepEqual(splitWorkspacePath('/operations-kit/app.js'), { slug: null, kalan: '/operations-kit/app.js' })
  assert.deepEqual(splitWorkspacePath('/legal/gizlilik'), { slug: null, kalan: '/legal/gizlilik' })
  assert.deepEqual(splitWorkspacePath('/kade/dashboard/title'), { slug: 'kade', kalan: '/dashboard/title' })
})

test('bağlantı üretimi alan adresini iki kez eklemez', () => {
  assert.equal(workspaceHref('/dashboard/title', 'kade'), '/kadexai/kade/dashboard/title')
  assert.equal(workspaceHref('/kade/dashboard/title', 'kade'), '/kadexai/kade/dashboard/title')
  assert.equal(workspaceHref('/dashboard/title', null), '/kadexai/dashboard/title')
  assert.equal(workspaceHref('https://ornek.com/x', 'kade'), 'https://ornek.com/x')
})

test('proxy erişimi slug ile değil oturumla verir', async () => {
  const proxySource = await readFile(new URL('../../proxy.ts', import.meta.url), 'utf8')

  // Adresteki slug bir yetki kaynağı olmamalı: eşleşmediğinde erişim
  // verilmez, kullanıcı kendi alanına gönderilir.
  assert.match(proxySource, /urlSlug && kendiSlug && urlSlug !== kendiSlug/)
  assert.match(proxySource, /Bu çalışma alanına erişimin yok/)

  // Kullanıcının kendi adresi oturumdan hesaplanır, adresten okunmaz.
  // Sahip adresi kullanıcının kendi yazabildiği user_metadata'dan değil,
  // sunucudaki e-posta listesinden gelmeli.
  assert.match(proxySource, /workspaceSlugForUser\(user, isAllowedOwnerEmail\(user\.email\)\)/)

  // Sahiplik kontrolleri hâlâ oturuma bakıyor olmalı.
  assert.match(proxySource, /isAdminRoute && !isAllowedOwnerUser\(user\)/)
})
