import assert from 'node:assert/strict'
import test from 'node:test'
import { getSignupPasswordError, mapSignupProviderError } from '../../lib/auth/passwordPolicy'

test('signup password policy matches the configured Supabase requirements', () => {
  assert.match(getSignupPasswordError('short') || '', /8–128/)
  assert.match(getSignupPasswordError('alllowercase1') || '', /büyük harf/)
  assert.match(getSignupPasswordError('ALLUPPERCASE1') || '', /küçük harf/)
  assert.match(getSignupPasswordError('NoDigitsHere') || '', /rakam/)
  assert.equal(getSignupPasswordError('ValidPass123'), null)
})

test('signup provider errors become actionable Turkish responses', () => {
  assert.deepEqual(mapSignupProviderError({ code: 'weak_password', status: 422 }), {
    status: 400,
    message: 'Parola en az 8 karakter; büyük harf, küçük harf ve rakam içermeli.',
  })
  assert.equal(mapSignupProviderError({ code: 'email_address_not_authorized' }).status, 503)
  assert.equal(mapSignupProviderError({ code: 'over_email_send_rate_limit', status: 429 }).status, 429)
  assert.match(
    mapSignupProviderError({ code: 'unexpected_failure', status: 500, message: 'Database error saving new user' }).message,
    /altyapısında geçici bir sorun/,
  )
})
