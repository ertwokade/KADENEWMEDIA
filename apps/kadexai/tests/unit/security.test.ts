import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { adminAuthEmail, isLoginIdentifier } from '../../lib/auth/adminIdentity'
import { canAccessOwnedResource } from '../../lib/security/ownership'
import {
  isAllowedOwnerUser,
  isKadeAdminUser,
  isSettingsOwnerEmail,
  isSettingsOwnerOnlyRoute,
  isSettingsOwnerUser,
} from '../../lib/featureAccess'
import { countedDistributedRateLimit, distributedRateLimit } from '../../lib/rateLimit'
import { getVercelGatewayToken } from '../../lib/ai/gatewayAuth'
import { config as proxyConfig, proxy } from '../../proxy'

test('user A cannot access a resource owned by user B', () => {
  assert.equal(canAccessOwnedResource('user-a', 'user-a'), true)
  assert.equal(canAccessOwnedResource('user-a', 'user-b'), false)
  assert.equal(canAccessOwnedResource('', 'user-b'), false)
})

test('settings are restricted to the single account owner email', () => {
  assert.equal(isSettingsOwnerEmail('thekademedia@gmail.com'), true)
  assert.equal(isSettingsOwnerEmail(' THEKADEMEDIA@GMAIL.COM '), true)
  assert.equal(isSettingsOwnerEmail('demirk314@gmail.com'), false)
  assert.equal(isSettingsOwnerEmail('another-owner@gmail.com'), false)
  assert.equal(isSettingsOwnerEmail(null), false)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/settings'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/api/env-status'), true)
  assert.equal(isSettingsOwnerOnlyRoute('/dashboard/title'), false)
})

test('service-role-issued admin identities receive KadexAI owner access', () => {
  const bridgedAdmin = {
    email: 'admin-account@sso.kadenewmedia.com',
    app_metadata: {
      kade_admin_id: '11111111-1111-1111-1111-111111111111',
      kade_admin_role: 'admin',
    },
  }
  const forgedEditor = {
    email: 'editor@sso.kadenewmedia.com',
    app_metadata: {
      kade_admin_id: '22222222-2222-2222-2222-222222222222',
      kade_admin_role: 'editor',
    },
  }

  assert.equal(isKadeAdminUser(bridgedAdmin), true)
  assert.equal(isSettingsOwnerUser(bridgedAdmin), true)
  assert.equal(isAllowedOwnerUser(bridgedAdmin), true)
  assert.equal(isKadeAdminUser(forgedEditor), false)
  assert.equal(isSettingsOwnerUser(forgedEditor), false)
})

test('admin login identifiers and bridged auth emails are normalized safely', () => {
  assert.equal(isLoginIdentifier('kadir_demir'), true)
  assert.equal(isLoginIdentifier('admin@example.com'), true)
  assert.equal(isLoginIdentifier('invalid username'), false)
  assert.equal(isLoginIdentifier('not-an-email@'), false)

  assert.equal(
    adminAuthEmail({ id: 'ADMIN-ID', email: ' ADMIN@EXAMPLE.COM ' }),
    'admin@example.com',
  )
  assert.equal(
    adminAuthEmail({ id: 'ADMIN-ID', email: null }),
    'admin-admin-id@sso.kadenewmedia.com',
  )
})

test('latest RLS migration uses explicit operations and isolates payment ownership', async () => {
  const sql = await readFile(new URL('../../supabase/migrations/202607170002_explicit_rls_and_payments.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /CREATE POLICY[\s\S][^;]+FOR ALL/i)
  assert.match(sql, /payment_orders_own_select[\s\S]+auth\.uid\(\) = user_id/)
  assert.doesNotMatch(sql, /CREATE POLICY payment_orders_own_insert/)
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.payment_orders FROM anon, authenticated/)
  assert.match(sql, /REVOKE ALL ON public\.payment_events FROM anon, authenticated/)
})

test('proxy forwards server request headers to route handlers', async () => {
  const source = await readFile(new URL('../../proxy.ts', import.meta.url), 'utf8')
  assert.match(source, /new Headers\(request\.headers\)/)
  assert.match(source, /NextResponse\.next\(\{ request: \{ headers: requestHeaders \} \}\)/)
  assert.doesNotMatch(source, /NextResponse\.next\(\{ request \}\)/)
})

test('proxy leaves the main-site API alone and still protects KadexAI routes', () => {
  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: '/api/auth?action=csrf' }), false)
  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: '/api/customer-portal' }), false)
  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: '/kadexai/api/assistant' }), true)
  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: '/kadexai/dashboard' }), true)
})

test('unauthenticated KadexAI routes keep the /kadexai prefix when redirecting', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    for (const path of ['/kadexai/dashboard', '/kadexai/onboarding', '/kadexai/dashboard/settings']) {
      const response = await proxy(new NextRequest(`https://kadenewmedia.com${path}`))
      assert.equal(response.status, 307)
      assert.equal(response.headers.get('location'), 'https://kadenewmedia.com/kadexai/login')
    }
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  }
})

test('operations kit static assets load without turning into login HTML', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    for (const path of ['/kadexai/operations-kit/app.js', '/kadexai/operations-kit/styles.css']) {
      const response = await proxy(new NextRequest(`https://kadenewmedia.com${path}`))
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('location'), null)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    }
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  }
})

test('WhatsApp trend selection survives the login redirect', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    const response = await proxy(new NextRequest(
      'https://kadenewmedia.com/kadexai/dashboard/trend-radar?trend=google%3Akeyword%3Aabc',
    ))
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://kadenewmedia.com/kadexai/login?next=%2Fdashboard%2Ftrend-radar%3Ftrend%3Dgoogle%253Akeyword%253Aabc',
    )
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  }
})

test('KadeSearch approval selection survives the login redirect', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    const response = await proxy(new NextRequest(
      'https://kadenewmedia.com/kadexai/dashboard/kade-search?trend=google%3Akeyword%3Aabc',
    ))
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get('location'),
      'https://kadenewmedia.com/kadexai/login?next=%2Fdashboard%2Fkade-search%3Ftrend%3Dgoogle%253Akeyword%253Aabc',
    )
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  }
})

test('proxy lets only configured cron routes reach their own secret guard', async () => {
  const previousCronSecret = process.env.CRON_SECRET
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  process.env.CRON_SECRET = 'unit-cron-secret'
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    for (const path of [
      '/kadexai/api/materials/sync',
      '/kadexai/api/kade-search/collect',
      '/kadexai/api/kade-search/daily-digest',
      '/kadexai/api/reports/weekly-site',
    ]) {
      const xHeaderResponse = await proxy(new NextRequest(`https://kadenewmedia.com${path}`, {
        headers: { 'x-cron-secret': 'unit-cron-secret' },
      }))
      assert.equal(xHeaderResponse.status, 200)
      assert.equal(xHeaderResponse.headers.get('x-middleware-next'), '1')

      const bearerResponse = await proxy(new NextRequest(`https://kadenewmedia.com${path}`, {
        headers: { authorization: 'Bearer unit-cron-secret' },
      }))
      assert.equal(bearerResponse.status, 200)
      assert.equal(bearerResponse.headers.get('x-middleware-next'), '1')
    }

    const invalidSecret = await proxy(new NextRequest(
      'https://kadenewmedia.com/kadexai/api/kade-search/daily-digest',
      { headers: { 'x-cron-secret': 'wrong-secret' } },
    ))
    assert.equal(invalidSecret.status, 503)

    const unrelatedApi = await proxy(new NextRequest(
      'https://kadenewmedia.com/kadexai/api/assistant',
      { headers: { 'x-cron-secret': 'unit-cron-secret' } },
    ))
    assert.equal(unrelatedApi.status, 503)
  } finally {
    if (previousCronSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previousCronSecret
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  }
})

test('KadexAI entry and reset-password links keep the /kadexai prefix', async () => {
  const homeSource = await readFile(new URL('../../app/kadexai/page.tsx', import.meta.url), 'utf8')
  const resetSource = await readFile(new URL('../../app/kadexai/reset-password/page.tsx', import.meta.url), 'utf8')
  assert.match(homeSource, /redirect\(withBasePath\(appRoutes\.dashboard\)\)/)
  assert.match(resetSource, /href=\{withBasePath\(appRoutes\.login\)\}/)
})

test('dashboard navigation always applies the physical /kadexai prefix', async () => {
  const dashboardSource = await readFile(new URL('../../app/kadexai/dashboard/page.tsx', import.meta.url), 'utf8')
  const sidebarSource = await readFile(new URL('../../components/layout/Sidebar.tsx', import.meta.url), 'utf8')
  assert.match(dashboardSource, /href=\{withBasePath\('\/dashboard\/title'\)\}/)
  assert.match(dashboardSource, /href=\{withBasePath\(href\)\}/)
  assert.match(sidebarSource, /href=\{withBasePath\(item\.href\)\}/)
  assert.match(sidebarSource, /stripBasePath\(usePathname\(\) \?\? ''\)/)
})

test('Gateway identity can be resolved from the active request explicitly', async () => {
  const request = new Request('https://example.com/api/generate/title', {
    headers: { 'x-vercel-oidc-token': 'unit-oidc-token' },
  })
  assert.equal(await getVercelGatewayToken(request), 'unit-oidc-token')
})

test('distributed AI quota enforces cost, daily limit and idempotency locally', async () => {
  const identity = `unit-${Date.now()}-${Math.random()}`
  const now = 1_750_000_000_000
  const first = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 5,
    idempotencyKey: 'request-1',
    now,
  })
  assert.equal(first.allowed, true)
  const duplicate = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 5,
    idempotencyKey: 'request-1',
    now,
  })
  assert.equal(duplicate.status, 409)
  const dailyExceeded = await distributedRateLimit('unit-ai', {
    identity,
    minuteLimit: 10,
    dailyLimit: 6,
    cost: 2,
    idempotencyKey: 'request-2',
    now,
  })
  assert.equal(dailyExceeded.reason, 'daily_limit')
})

test('distributed quota fails closed in production without a backend', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN
  Reflect.set(process.env, 'NODE_ENV', 'production')
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  try {
    const result = await distributedRateLimit('unit-production', { identity: 'user-1' })
    assert.equal(result.status, 503)
    assert.equal(result.reason, 'backend_unavailable')
  } finally {
    if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Reflect.set(process.env, 'NODE_ENV', previousNodeEnv)
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken
  }
})

test('Supabase history counts provide conservative distributed quota fallback', () => {
  const allowed = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 30, dailyLimit: 500 }, 4, 42)
  assert.equal(allowed.allowed, true)
  assert.equal(allowed.remaining, 25)

  const minuteLimited = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 5, dailyLimit: 500 }, 5, 42)
  assert.equal(minuteLimited.allowed, false)
  assert.equal(minuteLimited.reason, 'minute_limit')

  const dailyLimited = countedDistributedRateLimit({ identity: 'user-1', minuteLimit: 30, dailyLimit: 50 }, 1, 50)
  assert.equal(dailyLimited.allowed, false)
  assert.equal(dailyLimited.reason, 'daily_limit')
})

// ── Route Handler'lar middleware'e tek başına güvenmez ─────────────────────

test('oturum gerektiren her API route handler kendi kontrolünü de yapar', async () => {
  // proxy.ts (middleware) tek bir `matcher` regex'ine dayanıyor. Bir rota
  // taşınır, matcher daraltılır ya da bir handler middleware'in kapsamadığı
  // bir yoldan çağrılırsa korumanın tamamı sessizce düşer. Bu yüzden korunan
  // her handler ayrıca requireApiUser() çağırır.
  const { readdir } = await import('node:fs/promises')
  const { join, relative } = await import('node:path')

  /* Rotalar tek dağıtım mimarisinde app/kadexai/api/ altına taşındı; URL'leri
     /kadexai/api/* olarak aynı kaldı (bkz. apps/kadexai/next.config.ts). */
  const API_ROOT = new URL('../../app/kadexai/api/', import.meta.url).pathname

  async function routeFiles(dir: string): Promise<string[]> {
    const out: string[] = []
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) out.push(...await routeFiles(full))
      else if (entry.name === 'route.ts') out.push(full)
    }
    return out
  }

  // Oturum ÖNCESİ çalışması gereken ya da başka bir mekanizmayla korunan uçlar.
  // Buraya bir yol eklemek bilinçli bir güvenlik kararıdır — gerekçesiz eklemeyin.
  const EXEMPT = new Map<string, string>([
    ['health/route.ts', 'ayakta mı kontrolü, veri döndürmez'],
    ['auth/password/route.ts', 'giriş akışı — oturum henüz yok'],
    ['auth/recovery/route.ts', 'şifre sıfırlama — oturum henüz yok'],
    ['auth/recovery-session/route.ts', 'şifre sıfırlama — oturum henüz yok'],
    ['auth/logout/route.ts', 'çıkış; oturum yoksa da güvenle çalışmalı'],
    ['payments/webhook/route.ts', 'PSP imzasıyla doğrulanır, oturum taşımaz'],
    ['payments/admin/pricing/route.ts', 'sunucular-arası sır (hasValidAdminSecret)'],
    ['payments/admin/custom-offer/route.ts', 'sunucular-arası sır (hasValidAdminSecret)'],
    ['packages/route.ts', 'genel paket kataloğu — giriş öncesi fiyat sayfasında okunur'],
    ['legal/route.ts', 'yayınlanmış yasal metinler — mevzuat gereği giriş yapmadan da okunabilmeli'],
  ])

  // Kabul edilen iki biçim:
  //  1) paylaşılan yardımcılar,
  //  2) handler içinde supabase.auth.getUser() + `if (!user)` erken dönüşü.
  // İkincisinde yalnız getUser() çağrısı yetmez; dönen değer kontrol edilmezse
  // sorgu anonim kimlikle çalışır ve RLS tek savunma hattı olarak kalır.
  const HELPER_GUARD = /requireApiUser|requireReaderAccess|requireCollectorAccess|assertAuthenticatedUser|getAuthenticatedUser|hasValidAdminSecret|hasAuthenticatedUser/
  const isGuarded = (source: string) =>
    HELPER_GUARD.test(source)
    || (/auth\.getUser\(\)/.test(source) && /if \(!user\)/.test(source))

  const unguarded: string[] = []
  for (const file of await routeFiles(API_ROOT)) {
    const rel = relative(API_ROOT, file)
    if (EXEMPT.has(rel)) {
      // Muaf tutulan uçlar da tamamen korumasız kalmamalı: ya kendi sırrını
      // doğrular ya da bilinçli olarak herkese açıktır. Yalnızca varlığı
      // kayıt altına alınır ki liste sessizce büyümesin.
      continue
    }
    if (!isGuarded(await readFile(file, 'utf8'))) unguarded.push(rel)
  }

  assert.deepEqual(
    unguarded,
    [],
    `Bu route handler'lar yalnızca middleware'e güveniyor: ${unguarded.join(', ')}`,
  )
})

test('admin sırrı sabit zamanlı karşılaştırılır', async () => {
  // `provided === secret` ilk farklı baytta kısa devre yapar; yanıt süresi
  // üzerinden sır bayt bayt tahmin edilebilir.
  for (const route of ['pricing', 'custom-offer']) {
    const source = await readFile(
      new URL(`../../app/kadexai/api/payments/admin/${route}/route.ts`, import.meta.url),
      'utf8',
    )
    assert.match(source, /hasValidAdminSecret/, `${route}: paylaşılan doğrulayıcıyı kullanmalı`)
    assert.doesNotMatch(source, /provided === secret/, `${route}: kısa devre yapan karşılaştırma kalmış`)
  }

  const helper = await readFile(new URL('../../lib/auth/adminSecret.ts', import.meta.url), 'utf8')
  assert.match(helper, /timingSafeEqual/, 'sabit zamanlı karşılaştırma kullanılmalı')
  assert.match(helper, /if \(!secret\) return false/, 'sır tanımsızsa kapalı düşmeli')
})

test('custom teklifler 15 dakikadan uzun üretilemez ve expired webhook yetki vermez', async () => {
  const offers = await readFile(new URL('../../lib/payments/offers.ts', import.meta.url), 'utf8')
  assert.match(offers, /requestedValidity[\s\S]*:\s*15/)
  assert.match(offers, /Math\.min\([\s\S]*15/)

  const webhook = await readFile(new URL('../../app/kadexai/api/payments/webhook/route.ts', import.meta.url), 'utf8')
  const expiryCheck = webhook.indexOf("order.status === 'expired'")
  assert.ok(expiryCheck > -1, 'expired sipariş açıkça reddedilmeli')
  assert.match(webhook, /status:\s*'expired'/)

  // Ölçülen değişmez: expired bir sipariş yetki ÜRETEMEZ.
  //
  // Bunu 'grantEntitlementForOrder' metninin dosyada nerede geçtiğine bakarak
  // ölçmek yanıltıcı: grant tek bir yardımcıya taşındığında tanım, POST'un
  // üstüne çıkıyor ve kontrol gerçek bir sorun olmadan düşüyor. Bu yüzden
  // ÇAĞRI YERLERİ kontrol ediliyor.
  // `await` şart: fonksiyon TANIMI da eşleşirse (POST'un üstünde durur)
  // kontrol gerçek bir sorun olmadan düşer.
  const grantCallSites = [...webhook.matchAll(/await ensureEntitlement\(/g)].map((match) => match.index ?? -1)
  assert.ok(grantCallSites.length > 0, 'yetki verme çağrısı bulunmalı')
  for (const site of grantCallSites) {
    assert.ok(expiryCheck < site, 'expiry kontrolü her yetki verme çağrısından önce gelmeli')
  }

  // grantEntitlementForOrder yalnız o yardımcının içinden çağrılmalı; başka
  // bir yerden doğrudan çağrılırsa expiry kontrolü atlanabilirdi.
  const directGrantCalls = [...webhook.matchAll(/await grantEntitlementForOrder\(/g)]
  assert.equal(directGrantCalls.length, 1, 'grantEntitlementForOrder tek bir yerden çağrılmalı')
})

test('BYOK sırları doğrudan istemciye açılamaz', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/202608260004_user_provider_keys.sql', import.meta.url), 'utf8')
  assert.match(migration, /REVOKE ALL ON public\.user_provider_keys FROM anon, authenticated/)

  const route = await readFile(new URL('../../app/kadexai/api/provider-keys/route.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(route, /decryptSecret|encrypted_secret/)
  assert.match(route, /listUserProviderKeyStatus/)

  const keyStore = await readFile(new URL('../../lib/ai/userProviderKeys.ts', import.meta.url), 'utf8')
  assert.match(keyStore, /encryptSecret\(clean\)/)
  assert.match(keyStore, /key_hint/)
})
