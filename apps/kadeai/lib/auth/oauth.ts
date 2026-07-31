export type OAuthErrorLike = {
  code?: string | null
  message?: string | null
}

export function mapGoogleOAuthError(error: OAuthErrorLike) {
  const code = (error.code || '').toLowerCase()
  const message = (error.message || '').toLowerCase()
  const combined = `${code} ${message}`

  if (
    code === 'provider_disabled'
    || code === 'oauth_provider_not_supported'
    || combined.includes('provider is not enabled')
    || combined.includes('unsupported provider')
  ) {
    return 'Google ile giriş henüz etkin değil. Lütfen normal giriş yöntemini kullan veya yöneticine bildir.'
  }

  if (
    code === 'access_denied'
    || combined.includes('access denied')
    || combined.includes('cancel')
    || combined.includes('closed by user')
  ) {
    return 'Google ile giriş iptal edildi.'
  }

  if (
    code === 'flow_state_not_found'
    || code === 'flow_state_expired'
    || code === 'bad_oauth_state'
    || combined.includes('oauth state')
  ) {
    return 'Google oturumu doğrulanamadı. Lütfen tekrar deneyin.'
  }

  return 'Google ile giriş tamamlanamadı. Lütfen tekrar deneyin veya normal giriş yöntemini kullanın.'
}
