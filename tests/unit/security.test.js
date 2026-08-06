import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { IDLE_TIMEOUT_SECONDS, createCsrfToken, createToken, isSessionIdle, sessionVersionMatches, verifyCsrfToken, verifyToken } from '../../server/api/_lib/auth.js'
import { isValidUserEmail } from '../../server/api/users.js'
import { validateMediaUpload } from '../../server/api/_lib/uploadValidation.js'
import { validateRequestBodySize } from '../../server/api/_lib/requestLimits.js'
import { isValidQueryId } from '../../server/api/_lib/validation.js'
import { reserveShopierOrder, verifyShopierSignature } from '../../server/api/shopier.js'
import { getShopierProduct, parseMoneyToMinor, validateShopierPayment } from '../../server/api/_lib/shopierCatalog.js'
import { reconcileShopierOrders } from '../../server/api/_lib/shopierReconciliation.js'
import { publicBlogFilter } from '../../server/api/blog.js'
import { sanitizePartnerUpdate } from '../../server/api/partners.js'
import { isKnownContentSection, isPublicContentSection } from '../../server/api/content.js'
import apiHandler from '../../api/[...path].js'

function responseDouble() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.payload = payload; return this },
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    getHeader(name) { return this.headers[name.toLowerCase()] },
  }
}

test('session version revokes tokens issued before a credential change', () => {
  assert.equal(sessionVersionMatches(undefined, undefined), true)
  assert.equal(sessionVersionMatches(2, 2), true)
  assert.equal(sessionVersionMatches(1, 2), false)
  assert.equal(sessionVersionMatches(7, 8), false, 'role changes must revoke the previous session version')
})

test('CSRF tokens are signed and tamper evident', () => {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'unit-test-jwt-secret-at-least-32-characters'
  try {
    const token = createCsrfToken()
    assert.equal(verifyCsrfToken(token), true)

    // Son karakteri SABİT '0' ile değiştirmek kararsızdı: token rastgele
    // üretildiği için son karakteri zaten '0' olduğunda "bozulmuş" token
    // orijinalin aynısı oluyor, doğrulama haklı olarak true dönüyor ve test
    // kırılıyordu. Ne sıklıkta olduğu alfabeye bağlı; 12 koşuda 1 kez görüldü.
    // Artık gerçekten farklı bir karakter seçilir.
    const lastChar = token.slice(-1)
    const tampered = `${token.slice(0, -1)}${lastChar === '0' ? '1' : '0'}`
    assert.notEqual(tampered, token, 'bozulmuş token orijinalden farklı olmalı')
    assert.equal(verifyCsrfToken(tampered), false)
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  }
})

test('API request size guard rejects oversized JSON', () => {
  const res = responseDouble()
  const allowed = validateRequestBodySize({ method: 'POST', headers: { 'content-length': String(70 * 1024) }, body: {} }, res, 'chat')
  assert.equal(allowed, false)
  assert.equal(res.statusCode, 413)
})

test('media validation checks file signature instead of trusting MIME', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString('base64')
  assert.equal(validateMediaUpload(png, 'image/png').ok, true)
  const forged = Buffer.from('<html><script>alert(1)</script></html>').toString('base64')
  const result = validateMediaUpload(forged, 'image/png')
  assert.equal(result.ok, false)
  assert.equal(result.status, 415)
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64')
  assert.equal(validateMediaUpload(svg, 'image/svg+xml').ok, false)
})

test('mass assignment drops protected partner fields', () => {
  const clean = sanitizePartnerUpdate({ name: 'Partner', role: 'admin', owner: 'attacker', status: 'approved', createdAt: 'forged' })
  assert.deepEqual(clean, { name: 'Partner' })
})

test('API query IDs accept legacy ObjectId and current Supabase UUID values', () => {
  assert.equal(isValidQueryId('507f1f77bcf86cd799439011'), true, '24 karakterlik eski Mongo ObjectId kabul edilmeli')
  // Supabase `gen_random_uuid()` v4 üretir: sürüm hanesi 4, variant hanesi 8/9/a/b.
  assert.equal(isValidQueryId('550e8400-e29b-41d4-a716-446655440000'), true, 'RFC 4122 v4 UUID kabul edilmeli')
  // Sürüm/variant haneleri uymayan dizi reddedilir; aksi hâlde dispatcher
  // rastgele UUID-benzeri girdiyi handler'a taşır.
  assert.equal(isValidQueryId('550e8400-e29b-11d4-c716-446655440000'), false, 'geçersiz variant reddedilmeli')
  assert.equal(isValidQueryId('00000000-0000-0000-0000-000000000000'), false, 'nil UUID reddedilmeli')
  assert.equal(isValidQueryId('not-an-id'), false, 'ID olmayan dize reddedilmeli')
})

test('anonymous content access is limited to the explicit public section allow-list', () => {
  assert.equal(isKnownContentSection('footer'), true)
  assert.equal(isPublicContentSection('footer'), true)
  assert.equal(isKnownContentSection('calendar'), true)
  assert.equal(isPublicContentSection('calendar'), false)
  assert.equal(isKnownContentSection('typo-section'), false)
  assert.equal(isPublicContentSection('typo-section'), false)
})

test('API dispatcher applies no-store even to unknown endpoints', async () => {
  const res = responseDouble()
  await apiHandler({ method: 'GET', query: { path: ['does-not-exist'] }, headers: {}, url: '/api/does-not-exist' }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.headers['cache-control'], 'private, no-store, max-age=0')
})

test('Shopier webhook signature rejects forged payloads', () => {
  const secret = 'unit-test-shopier-secret'
  const body = {
    random_nr: 'random-1',
    status: '1',
    buyer_email: 'buyer@example.test',
    product_price: '299.00',
  }
  const signed = { ...body, signature: createHmac('sha256', secret).update('random-1' + '1' + 'buyer@example.test' + '299.00').digest('base64') }
  assert.equal(verifyShopierSignature(signed, secret), true)
  assert.equal(verifyShopierSignature({ ...signed, product_price: '1.00' }, secret), false)
})

test('Shopier order reservation is an atomic replay gate', async () => {
  // Not: gerçek kod Mongo'dan Supabase'e taşındığından (bkz. server/api/shopier.js),
  // bu mock artık `supabase.from(table).insert(order)` şeklindeki PostgREST arayüzünü
  // taklit ediyor; benzersizlik `kade_shopier_orders_order_id_uidx` unique index'i ile
  // aynı şekilde 23505 (unique_violation) hatasıyla temsil ediliyor.
  const inserted = []
  let entitlementsGranted = 0
  const supabase = {
    from() {
      return {
        async insert(order) {
          if (inserted.some((item) => item.shopier_order_id === order.shopier_order_id)) {
            return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
          }
          inserted.push(order)
          return { error: null }
        },
      }
    },
  }
  async function processReplay() {
    if (await reserveShopierOrder(supabase, { shopier_order_id: 'order-1' })) entitlementsGranted += 1
  }
  await Promise.all(Array.from({ length: 20 }, () => processReplay()))
  assert.equal(inserted.length, 1)
  assert.equal(entitlementsGranted, 1)
})

test('Shopier product catalog is server-owned and validates amount, currency and enablement', () => {
  const env = { SHOPIER_ENABLED_PRODUCTS: 'kade-kit-baslangic-monthly', SHOPIER_WEBHOOK_CURRENCY: 'TRY' }
  const product = getShopierProduct('kade-kit-baslangic-monthly', env)
  assert.equal(product.unitAmountMinor, 29900)
  assert.equal(parseMoneyToMinor('299.00'), 29900)
  assert.equal(validateShopierPayment({ product_reference: product.providerProductId, product_price: '299.00' }, env).ok, true)
  assert.equal(validateShopierPayment({ product_reference: product.providerProductId, product_price: '298.99' }, env).reason, 'amount_mismatch')
  assert.equal(validateShopierPayment({ product_reference: product.providerProductId, product_price: '299.00', currency: 'USD' }, env).reason, 'currency_mismatch')
  assert.equal(validateShopierPayment({ product_reference: 'kade-kit-pro-monthly', product_price: '599.00' }, env).reason, 'product_disabled')
  assert.equal(validateShopierPayment({ product_reference: 'unknown', product_price: '1.00' }, env).reason, 'unknown_product')
})

test('Shopier reconciliation never grants an entitlement and is state-idempotent', async () => {
  // Not: gerçek kod Supabase/PostgREST kullanıyor (bkz. server/api/_lib/shopierReconciliation.js);
  // bu mock o zincirleme sorgu arayüzünü (.from().select().in().lte().order().limit(),
  // .from().update().eq().in()) taklit ediyor. Sadece `order-a`nın gerçek bir
  // `kade_customer_packages` kaydı var; bu yüzden yalnız o sipariş uzlaştırılabilir,
  // `order-b` ise entitlement bulunamadığı için `needs_review` olarak işaretlenmeli —
  // reconciliation asla kendisi bir entitlement OLUŞTURMAMALI.
  const RECONCILABLE_STATES = ['processing', 'completed_with_record_error']
  const orders = [
    { id: 'a', shopier_order_id: 'order-a', state: 'processing' },
    { id: 'b', shopier_order_id: 'order-b', state: 'completed_with_record_error' },
  ]
  const packagesByOrderId = { 'order-a': { id: 'package-a', customer_id: 'customer-a' } }

  const supabase = {
    from(table) {
      if (table === 'kade_shopier_orders') {
        return {
          select() {
            return {
              in() {
                return {
                  lte() {
                    return {
                      order() {
                        return {
                          limit() {
                            return {
                              data: orders
                                .filter((o) => RECONCILABLE_STATES.includes(o.state))
                                .map(({ id, shopier_order_id }) => ({ id, shopier_order_id })),
                              error: null,
                            }
                          },
                        }
                      },
                    }
                  },
                }
              },
            }
          },
          update(patch) {
            return {
              eq(_col, id) {
                return {
                  in(_col2, states) {
                    const order = orders.find((o) => o.id === id && states.includes(o.state))
                    if (!order) return { error: null, count: 0 }
                    Object.assign(order, patch)
                    return { error: null, count: 1 }
                  },
                }
              },
            }
          },
        }
      }
      if (table === 'kade_customer_packages') {
        return {
          select() {
            return {
              eq(_col, shopierOrderId) {
                return {
                  limit() {
                    return {
                      maybeSingle() {
                        return { data: packagesByOrderId[shopierOrderId] || null, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      }
      throw new Error(`beklenmeyen tablo: ${table}`)
    },
  }

  assert.deepEqual(await reconcileShopierOrders(supabase, { staleBefore: new Date() }), { inspected: 2, reconciled: 1, needsReview: 1 })
  assert.equal(orders[0].state, 'completed_reconciled')
  assert.equal(orders[1].state, 'needs_review')
  assert.deepEqual(await reconcileShopierOrders(supabase, { staleBefore: new Date() }), { inspected: 0, reconciled: 0, needsReview: 0 })
})

test('public blog filter excludes drafts and future publication dates', () => {
  const now = new Date('2026-07-19T00:00:00.000Z')
  const filter = publicBlogFilter(now)
  assert.deepEqual(filter.published, { $ne: false })
  assert.deepEqual(filter.$or.at(-1), { publishAt: { $lte: now } })
})

test('kullanıcıya gösterilen hata mesajları teknik sızıntı içermez', async () => {
  const { isSafeUserMessage, toUserMessage, GENERIC_ERROR_MESSAGE } =
    await import('../../src/utils/userMessage.js')

  // Sunucudan sızabilecek gerçek desenler — hiçbiri ekrana basılmamalı.
  const leaks = [
    'SequelizeConnectionError: password authentication failed for user "postgres" at /var/task/db.js:42',
    'TypeError: Cannot read properties of undefined (reading "id")',
    'connect ECONNREFUSED 127.0.0.1:5432',
    'Error: getaddrinfo ENOTFOUND db.supabase.co',
    'at /home/runner/app/server/api/blog.js:118',
    'SELECT id, title FROM kade_blogs WHERE slug = $1',
    '{"code":"23502","details":null,"hint":null}',
    'Invalid api_key provided: sk_live_51H...',
  ]
  for (const message of leaks) {
    assert.equal(isSafeUserMessage(message), false, `sızıntı geçti: ${message}`)
    assert.equal(toUserMessage(message), GENERIC_ERROR_MESSAGE, `sızıntı gösterildi: ${message}`)
  }

  // Kullanıcıya yönelik anlamlı mesajlar korunmalı — jenerikleştirmek
  // doğrulama geri bildirimini işe yaramaz hâle getirir.
  const safe = [
    'Doğrulama hatası',
    'Bu e-posta adresi zaten kayıtlı.',
    'Mesajınız en az 20 karakter olmalı.',
    'Yetkisiz erişim',
    'Çok fazla istek. 5 dakika sonra tekrar deneyin.',
    'Dosya boyutu çok büyük (max 2MB)',
  ]
  for (const message of safe) {
    assert.equal(isSafeUserMessage(message), true, `geçerli mesaj engellendi: ${message}`)
    assert.equal(toUserMessage(message), message)
  }

  // Boş/eksik girdi jenerik mesaja düşer.
  assert.equal(toUserMessage(null), GENERIC_ERROR_MESSAGE)
  assert.equal(toUserMessage(''), GENERIC_ERROR_MESSAGE)
  assert.equal(toUserMessage(new Error('Doğrulama hatası')), 'Doğrulama hatası')
})

// ── Yönetici oturumu: hareketsizlik sınırı ────────────────────────────────

test('hareketsizlik sınırı aşılan oturum düşer', () => {
  const now = 1_800_000_000
  // Sınır içinde: oturum ayakta.
  assert.equal(isSessionIdle({ lastSeen: now - IDLE_TIMEOUT_SECONDS + 60 }, now), false)
  // Tam sınırda hâlâ geçerli, bir saniye sonrası değil.
  assert.equal(isSessionIdle({ lastSeen: now - IDLE_TIMEOUT_SECONDS }, now), false)
  assert.equal(isSessionIdle({ lastSeen: now - IDLE_TIMEOUT_SECONDS - 1 }, now), true)
})

test('lastSeen taşımayan token hareketsiz sayılır', () => {
  // Fail-closed: alanı olmayan eski token'lar (ve elle üretilmiş olanlar)
  // sınırsız oturum elde edememeli.
  const now = 1_800_000_000
  for (const payload of [{}, { lastSeen: null }, { lastSeen: 'dun' }, { lastSeen: 0 }, { lastSeen: -1 }]) {
    assert.equal(isSessionIdle(payload, now), true, `hareketsiz sayılmalı: ${JSON.stringify(payload)}`)
  }
})

test('createToken lastSeen damgası basar', () => {
  process.env.JWT_SECRET ||= 'x'.repeat(48)
  const before = Math.floor(Date.now() / 1000)
  const decoded = verifyToken(createToken({ id: 'u1', username: 'kade', role: 'admin' }))
  assert.ok(decoded, 'token doğrulanabilmeli')
  assert.ok(decoded.lastSeen >= before, 'lastSeen şimdiki zamanı taşımalı')
  assert.equal(isSessionIdle(decoded), false, 'yeni token hareketsiz sayılmamalı')
})

// ── Yönetici hesabında e-posta zorunlu ────────────────────────────────────

test('yönetici hesabı e-postasız oluşturulamaz', () => {
  // Canlıda `kade` (Admin) kullanıcısının e-postası boştu; şifre sıfırlama
  // ve güvenlik bildirimi akışlarının hiçbiri o hesap için çalışmıyordu.
  for (const invalid of ['', '   ', 'kade', 'kade@', '@kade.com', 'a b@c.com', null, undefined, 42]) {
    assert.equal(isValidUserEmail(invalid), false, `geçersiz sayılmalı: ${String(invalid)}`)
  }
  assert.equal(isValidUserEmail('thekademedia@gmail.com'), true)
  assert.equal(isValidUserEmail('  Kade@Example.CO  '), true)
  assert.equal(isValidUserEmail(`${'a'.repeat(250)}@b.co`), false, '254 karakter sınırı')
})

// ── Formlar kişisel veriyi adres çubuğuna yazmaz ──────────────────────────

test('kişisel veri toplayan formlar POST ile gönderilir', async () => {
  // Varsayılan method GET: JS kapalıysa ya da hydration başarısız olursa ad,
  // e-posta, telefon ve mesaj query string'e yazılır; oradan tarayıcı
  // geçmişine, Referer başlığına ve sunucu erişim loglarına sızar.
  const { readFile } = await import('node:fs/promises')
  for (const page of ['src/pages/Contact.jsx', 'src/pages/QuoteRequest.jsx']) {
    const source = await readFile(new URL(`../../${page}`, import.meta.url), 'utf8')
    for (const [, attrs] of source.matchAll(/<form([^>]*)>/g)) {
      assert.match(attrs, /method="post"/, `${page}: form method="post" olmalı`)
    }
  }
})

test('form onay kutularının name ve id değeri var', async () => {
  // name olmadan alan hiçbir gönderimde taşınmaz; id olmadan da <label
  // htmlFor> bağı kurulamaz.
  const { readFile } = await import('node:fs/promises')
  for (const page of ['src/pages/Contact.jsx', 'src/pages/QuoteRequest.jsx']) {
    const source = await readFile(new URL(`../../${page}`, import.meta.url), 'utf8')
    for (const [tag] of source.matchAll(/<input[^>]*type="checkbox"[^>]*\/?>/gs)) {
      assert.match(tag, /\sname=/, `${page}: onay kutusunda name yok → ${tag.slice(0, 90)}`)
      assert.match(tag, /\sid=/, `${page}: onay kutusunda id yok → ${tag.slice(0, 90)}`)
    }
  }
})

test('iletişim formu honeypot değerini sunucuya taşır', async () => {
  // İstemci kontrolü yalnız formu dolduran botu eler; doğrudan API'ye POST
  // atan bot için sunucu tarafı kontrol şart.
  const { readFile } = await import('node:fs/promises')
  const page = await readFile(new URL('../../src/pages/Contact.jsx', import.meta.url), 'utf8')
  assert.match(page, /website: honeypot/, 'honeypot API isteğine eklenmeli')

  const api = await readFile(new URL('../../server/api/contact.js', import.meta.url), 'utf8')
  assert.match(api, /typeof website === 'string' && website\.trim\(\)/, 'sunucu honeypot kontrolü yapmalı')
})

// ── Sistem Sağlığı paneli gerçeği raporlar ───────────────────────────────

test('isteğe bağlı ortam değişkenleri eksik gibi gösterilmez', async () => {
  // Panel eskiden tek bir kırmızı ✕ kullanıyordu: SITE_URL tanımsızken
  // "eksik" görünüyordu, oysa kullanıldığı üç yerin hepsinde çalışan bir
  // varsayılanı var. Zorunlu bir değişkenin gerçekten eksik olmasıyla aynı
  // görünmek uyarıyı değersizleştiriyordu.
  const { ENV_CHECKS, CLIENT_CHECKS } = await import('../../server/api/system-health.js')

  const siteUrl = ENV_CHECKS.find((check) => check.key === 'SITE_URL')
  assert.ok(siteUrl, 'SITE_URL kontrolü listede olmalı')
  assert.equal(siteUrl.optional, true, 'SITE_URL isteğe bağlı işaretlenmeli')

  // İsteğe bağlı her değişken, eksikken ne olduğunu söylemeli.
  for (const check of [...ENV_CHECKS, ...CLIENT_CHECKS].filter((c) => c.optional)) {
    assert.ok(check.note && check.note.length > 20, `${check.key}: eksikken ne olduğu yazılmalı`)
  }

  // Zorunlu sayılanlar gerçekten zorunlu olmalı: bunlar yoksa uygulama çalışmaz.
  const required = ENV_CHECKS.filter((c) => !c.optional).map((c) => c.key)
  assert.deepEqual(required, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'])
})

test('istemci build değişkenleri sunucu listesinde yer almaz', async () => {
  // VITE_ önekli değişkenler istemci bundle'ına gömülür; sunucu çalışma
  // zamanında process.env'den okunmaları güvenilir değil. Sunucu listesine
  // eklenirlerse panel doğru yapılandırmada bile "eksik" gösterir.
  const { ENV_CHECKS, CLIENT_CHECKS } = await import('../../server/api/system-health.js')

  for (const check of ENV_CHECKS) {
    assert.doesNotMatch(check.key, /^VITE_/, `${check.key} sunucudan okunamaz, CLIENT_CHECKS'e taşınmalı`)
  }
  assert.ok(
    CLIENT_CHECKS.some((check) => check.key === 'VITE_GA_ID'),
    'VITE_GA_ID istemci listesinde raporlanmalı',
  )
})
