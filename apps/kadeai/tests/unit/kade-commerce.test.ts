import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHmac } from 'node:crypto'
import { getPaymentProduct, listPackages, buildProductId, periodDurationDays } from '../../lib/payments/catalog'
import { parseProductId } from '../../lib/payments/entitlements'
import { buildShopierForm, verifyShopierCallback, minorToDecimalString } from '../../lib/payments/shopier'

// ── Katalog / fiyat modeli ───────────────────────────────────────────────────

test('katalog 18 paket üretir (3 tier × 3 periyot × api dahil/hariç)', () => {
  assert.equal(listPackages().length, 18)
})

test('Pro aylık API-dahil fiyatı 999 TL (99900 kuruş)', () => {
  const p = getPaymentProduct('pro-monthly-api')
  assert.ok(p)
  assert.equal(p!.amountMinor, 99900)
  assert.equal(p!.currency, 'TRY')
})

test('API-hariç paket %40 indirimli', () => {
  const withApi = getPaymentProduct('pro-monthly-api')!.amountMinor
  const noApi = getPaymentProduct('pro-monthly-noapi')!.amountMinor
  assert.equal(noApi, Math.round(withApi * 0.6))
})

test('yıllık paket aylığın 10 katı (2 ay bedava)', () => {
  const monthly = getPaymentProduct('sinirsiz-monthly-api')!.amountMinor
  const yearly = getPaymentProduct('sinirsiz-yearly-api')!.amountMinor
  assert.equal(yearly, monthly * 10)
})

test('bilinmeyen ürün undefined döner (uydurma fiyat engellenir)', () => {
  assert.equal(getPaymentProduct('pro-monthly-api; DROP'), undefined)
  assert.equal(getPaymentProduct('hediye-sinirsiz'), undefined)
})

test('periyot süreleri doğru', () => {
  assert.equal(periodDurationDays('weekly'), 7)
  assert.equal(periodDurationDays('monthly'), 30)
  assert.equal(periodDurationDays('yearly'), 365)
})

// ── Yetki eşlemesi (parseProductId) ──────────────────────────────────────────

test('productId doğru plana çözülür', () => {
  assert.deepEqual(parseProductId('pro-monthly-api'), { tier: 'pro', period: 'monthly', apiIncluded: true })
  assert.deepEqual(parseProductId('baslangic-weekly-noapi'), { tier: 'baslangic', period: 'weekly', apiIncluded: false })
})

test('geçersiz productId null döner (yetki verilmez)', () => {
  assert.equal(parseProductId('sandbox-credit'), null)
  assert.equal(parseProductId('pro-monthly'), null)
  assert.equal(parseProductId('hacker-monthly-api'), null)
  assert.equal(parseProductId('pro-forever-api'), null)
})

test('buildProductId parseProductId ile tutarlı', () => {
  const id = buildProductId('sinirsiz', 'yearly', false)
  assert.equal(id, 'sinirsiz-yearly-noapi')
  assert.deepEqual(parseProductId(id), { tier: 'sinirsiz', period: 'yearly', apiIncluded: false })
})

// ── Shopier imza / callback ──────────────────────────────────────────────────

test('Shopier formu imza dahil tüm zorunlu alanları içerir', () => {
  const form = buildShopierForm(
    { orderId: 'order-abc', totalOrderValue: '999.00', productName: 'KadeAI Pro', buyer: { name: 'Ada', email: 'ada@test.co' } },
    { apiKey: 'KEY', apiSecret: 'SECRET' },
  )
  assert.equal(form.fields.platform_order_id, 'order-abc')
  assert.equal(form.fields.total_order_value, '999.00')
  assert.equal(form.fields.API_key, 'KEY')
  assert.ok(form.fields.signature.length > 0)
  assert.ok(form.fields.random_nr.length > 0)
})

test('geçerli Shopier callback doğrulanır, sahtesi reddedilir', () => {
  const secret = 'shopier-secret-uzun'
  const randomNr = '424242'
  const orderId = 'order-xyz'
  const validSig = createHmac('sha256', secret).update(`${randomNr}${orderId}`, 'utf8').digest('base64')
  const validBody = `platform_order_id=${orderId}&random_nr=${randomNr}&status=success&signature=${encodeURIComponent(validSig)}`

  const result = verifyShopierCallback(validBody, secret)
  assert.equal(result.orderId, orderId)
  assert.equal(result.status, 'paid')

  const forgedBody = `platform_order_id=${orderId}&random_nr=${randomNr}&status=success&signature=${encodeURIComponent('sahte-imza')}`
  assert.throws(() => verifyShopierCallback(forgedBody, secret), /imza doğrulanamadı/)
})

test('minorToDecimalString kuruşu doğru çevirir', () => {
  assert.equal(minorToDecimalString(99900), '999.00')
  assert.equal(minorToDecimalString(34965), '349.65')
})
