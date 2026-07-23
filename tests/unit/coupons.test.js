import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyCouponDiscount, isCouponCurrentlyValid, isValidCouponCode, normalizeCouponCode } from '../../server/api/_lib/coupons.js'

test('coupon code validation rejects malformed codes', () => {
  assert.equal(isValidCouponCode('KADE2026'), true)
  assert.equal(isValidCouponCode('ab'), false) // too short
  assert.equal(isValidCouponCode('a'.repeat(33)), false) // too long
  assert.equal(isValidCouponCode('kade 2026'), false) // lowercase/space
  assert.equal(isValidCouponCode(''), false)
  assert.equal(isValidCouponCode(null), false)
})

test('normalizeCouponCode trims and uppercases', () => {
  assert.equal(normalizeCouponCode('  kade2026  '), 'KADE2026')
  assert.equal(normalizeCouponCode(undefined), '')
})

test('inactive or missing coupon is never valid', () => {
  assert.equal(isCouponCurrentlyValid(null).ok, false)
  assert.equal(isCouponCurrentlyValid({ active: false }).ok, false)
})

test('coupon respects valid_from/valid_until window', () => {
  const now = new Date('2026-07-23T00:00:00Z')
  const notStarted = { active: true, validFrom: '2026-08-01T00:00:00Z' }
  const expired = { active: true, validUntil: '2026-07-01T00:00:00Z' }
  const withinWindow = { active: true, validFrom: '2026-07-01T00:00:00Z', validUntil: '2026-08-01T00:00:00Z' }

  assert.equal(isCouponCurrentlyValid(notStarted, { now }).reason, 'not_started')
  assert.equal(isCouponCurrentlyValid(expired, { now }).reason, 'expired')
  assert.equal(isCouponCurrentlyValid(withinWindow, { now }).ok, true)
})

test('coupon respects max_uses/used_count', () => {
  const exhausted = { active: true, maxUses: 5, usedCount: 5 }
  const available = { active: true, maxUses: 5, usedCount: 4 }
  assert.equal(isCouponCurrentlyValid(exhausted).reason, 'max_uses_reached')
  assert.equal(isCouponCurrentlyValid(available).ok, true)
})

test('coupon applies_to restricts eligible packages', () => {
  const scoped = { active: true, appliesTo: ['sosyal-medya-starter'] }
  assert.equal(isCouponCurrentlyValid(scoped, { packageRef: 'sosyal-medya-growth' }).reason, 'not_applicable_to_package')
  assert.equal(isCouponCurrentlyValid(scoped, { packageRef: 'sosyal-medya-starter' }).ok, true)
  // Empty appliesTo == applies to every package
  assert.equal(isCouponCurrentlyValid({ active: true, appliesTo: [] }, { packageRef: 'anything' }).ok, true)
})

test('percent discount never produces a negative or larger-than-original amount', () => {
  assert.equal(applyCouponDiscount(10000, { discountType: 'percent', discountValue: 20 }), 8000)
  assert.equal(applyCouponDiscount(10000, { discountType: 'percent', discountValue: 100 }), 0)
  assert.equal(applyCouponDiscount(10000, { discountType: 'percent', discountValue: 999 }), 0) // clamped to 100%
  assert.equal(applyCouponDiscount(10000, { discountType: 'percent', discountValue: -50 }), 10000) // clamped to 0%
})

test('fixed discount is clamped between 0 and the original amount', () => {
  assert.equal(applyCouponDiscount(10000, { discountType: 'fixed', discountValue: 30 }), 7000) // -3000 minor
  assert.equal(applyCouponDiscount(10000, { discountType: 'fixed', discountValue: 500 }), 0) // would go negative, clamped
})

test('applyCouponDiscount is a no-op for invalid unit amounts or missing coupon', () => {
  assert.equal(applyCouponDiscount(0, { discountType: 'percent', discountValue: 50 }), 0)
  assert.equal(applyCouponDiscount(-5, { discountType: 'percent', discountValue: 50 }), -5)
  assert.equal(applyCouponDiscount(10000, null), 10000)
})
