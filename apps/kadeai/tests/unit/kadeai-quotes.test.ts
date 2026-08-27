import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABEL,
  QuoteValidationError,
  validateQuoteInput,
} from '../../lib/quotes/quoteRules'

const valid = {
  firstName: 'Ada',
  lastName: 'Yılmaz',
  email: 'ADA@example.com',
  useCase: 'Ayda 200 kısa video için başlık ve açıklama üretmek istiyoruz.',
}

test('§15 pipeline durumlarının tamamı tanımlı ve etiketli', () => {
  assert.deepEqual([...QUOTE_STATUSES], [
    'new', 'reviewing', 'offer_prepared', 'sent',
    'accepted', 'rejected', 'payment_pending', 'completed',
  ])
  for (const status of QUOTE_STATUSES) {
    assert.ok(QUOTE_STATUS_LABEL[status], `${status} için etiket yok`)
  }
})

test('e-posta normalize edilir, zorunlu alanlar doğrulanır', () => {
  const parsed = validateQuoteInput(valid)
  assert.equal(parsed.email, 'ada@example.com')
  assert.equal(parsed.apiNeeded, false)
  assert.deepEqual(parsed.requestedFeatures, [])
})

test('geçersiz e-posta ve kısa kullanım metni reddedilir', () => {
  assert.throws(() => validateQuoteInput({ ...valid, email: 'ada@' }), QuoteValidationError)
  assert.throws(() => validateQuoteInput({ ...valid, useCase: 'kısa' }), QuoteValidationError)
  assert.throws(() => validateQuoteInput({ ...valid, firstName: '   ' }), QuoteValidationError)
})

test('katalog dışı ekip büyüklüğü reddedilir', () => {
  assert.throws(() => validateQuoteInput({ ...valid, teamSize: '9999' }), QuoteValidationError)
  assert.equal(validateQuoteInput({ ...valid, teamSize: '6-20' }).teamSize, '6-20')
})

test('istemci status veya payment_order_id enjekte edemez', () => {
  const parsed = validateQuoteInput({ ...valid, status: 'completed', payment_order_id: 'x', user_id: 'başkası' }) as unknown as Record<string, unknown>
  assert.equal(parsed.status, undefined)
  assert.equal(parsed.payment_order_id, undefined)
  assert.equal(parsed.user_id, undefined)
})

test('özellik listesi 20 ile sınırlanır ve boşlar atılır', () => {
  const parsed = validateQuoteInput({
    ...valid,
    requestedFeatures: [...Array(30).keys()].map((index) => `özellik-${index}`).concat(['', '   ']),
  })
  assert.equal(parsed.requestedFeatures?.length, 20)
})
