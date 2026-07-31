import assert from 'node:assert/strict'
import test from 'node:test'
import { mapGoogleOAuthError } from '../../lib/auth/oauth'

test('disabled Google provider receives an actionable response', () => {
  assert.match(mapGoogleOAuthError({ code: 'provider_disabled' }), /henüz etkin değil/)
  assert.match(mapGoogleOAuthError({ message: 'Unsupported provider: provider is not enabled' }), /normal giriş/)
})

test('cancelled and expired Google flows receive safe Turkish responses', () => {
  assert.equal(mapGoogleOAuthError({ code: 'access_denied' }), 'Google ile giriş iptal edildi.')
  assert.match(mapGoogleOAuthError({ code: 'flow_state_expired' }), /doğrulanamadı/)
})

test('unknown provider details are not exposed to users', () => {
  const response = mapGoogleOAuthError({ code: 'unexpected_failure', message: 'private provider details' })
  assert.doesNotMatch(response, /private provider details/)
  assert.match(response, /normal giriş/)
})
