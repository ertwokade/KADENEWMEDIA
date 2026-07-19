import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { createCsrfToken, sessionVersionMatches, verifyCsrfToken } from '../../server/api/_lib/auth.js'
import { validateMediaUpload } from '../../server/api/_lib/uploadValidation.js'
import { validateRequestBodySize } from '../../server/api/_lib/requestLimits.js'
import { reserveShopierOrder, verifyShopierSignature } from '../../server/api/shopier.js'
import { getShopierProduct, parseMoneyToMinor, validateShopierPayment } from '../../server/api/_lib/shopierCatalog.js'
import { reconcileShopierOrders } from '../../server/api/_lib/shopierReconciliation.js'
import { publicBlogFilter } from '../../server/api/blog.js'
import { sanitizePartnerUpdate } from '../../server/api/partners.js'
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
    assert.equal(verifyCsrfToken(`${token.slice(0, -1)}0`), false)
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
  const inserts = []
  let entitlementsGranted = 0
  const collection = {
    async insertOne(order) {
      if (inserts.some((item) => item.shopierOrderId === order.shopierOrderId)) {
        const error = new Error('duplicate')
        error.code = 11000
        throw error
      }
      inserts.push(order)
    },
  }
  async function processReplay() {
    if (await reserveShopierOrder(collection, { shopierOrderId: 'order-1' })) entitlementsGranted += 1
  }
  await Promise.all(Array.from({ length: 20 }, () => processReplay()))
  assert.equal(inserts.length, 1)
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
  const orders = [
    { _id: 'a', shopierOrderId: 'order-a', state: 'processing', receivedAt: new Date(0) },
    { _id: 'b', shopierOrderId: 'order-b', state: 'completed_with_record_error', receivedAt: new Date(0) },
  ]
  const collections = {
    shopier_orders: {
      find() {
        return { sort() { return this }, limit() { return this }, async toArray() { return orders.filter((order) => ['processing', 'completed_with_record_error'].includes(order.state)) } }
      },
      async updateOne(filter, update) {
        const order = orders.find((item) => item._id === filter._id && filter.state.$in.includes(item.state))
        if (!order) return { modifiedCount: 0 }
        Object.assign(order, update.$set)
        return { modifiedCount: 1 }
      },
    },
    customers: {
      async findOne(filter) {
        return filter['packages.shopierOrderId'] === 'order-a'
          ? { _id: { toString: () => 'customer-a' }, packages: [{ id: 'package-a', shopierOrderId: 'order-a' }] }
          : null
      },
    },
  }
  const db = { collection: (name) => collections[name] }
  assert.deepEqual(await reconcileShopierOrders(db, { staleBefore: new Date() }), { inspected: 2, reconciled: 1, needsReview: 1 })
  assert.equal(orders[0].state, 'completed_reconciled')
  assert.equal(orders[1].state, 'needs_review')
  assert.deepEqual(await reconcileShopierOrders(db, { staleBefore: new Date() }), { inspected: 0, reconciled: 0, needsReview: 0 })
})

test('public blog filter excludes drafts and future publication dates', () => {
  const now = new Date('2026-07-19T00:00:00.000Z')
  const filter = publicBlogFilter(now)
  assert.deepEqual(filter.published, { $ne: false })
  assert.deepEqual(filter.$or.at(-1), { publishAt: { $lte: now } })
})
