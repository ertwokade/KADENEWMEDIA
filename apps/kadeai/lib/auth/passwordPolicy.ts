export const SIGNUP_PASSWORD_HINT = 'En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.'

export type AuthProviderErrorLike = {
  code?: string
  status?: number
  message?: string
}

export function getSignupPasswordError(password: string) {
  if (password.length < 8 || password.length > 128) {
    return 'Parola 8–128 karakter arasında olmalıdır.'
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return `Parola ${SIGNUP_PASSWORD_HINT.toLocaleLowerCase('tr-TR')}`
  }
  return null
}

export function mapSignupProviderError(error: AuthProviderErrorLike) {
  const code = String(error.code || '').toLocaleLowerCase('en-US')
  const message = String(error.message || '').toLocaleLowerCase('en-US')

  if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already exists/.test(message)) {
    return {
      status: 400,
      message: 'Bu e-posta kullanılamıyor. Giriş yapmayı veya şifreni sıfırlamayı dene.',
    }
  }
  if (code === 'weak_password' || /weak password|password.*(weak|characters)/.test(message)) {
    return { status: 400, message: `Parola ${SIGNUP_PASSWORD_HINT.toLocaleLowerCase('tr-TR')}` }
  }
  if (code === 'email_address_invalid' || /email address.*invalid/.test(message)) {
    return { status: 400, message: 'Geçerli ve kullanılabilir bir e-posta adresi girin.' }
  }
  if (code === 'email_address_not_authorized') {
    return {
      status: 503,
      message: 'Kayıt e-postası şu anda bu adrese gönderilemiyor. Lütfen destek ekibine bildirin.',
    }
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) {
    return {
      status: 429,
      message: 'Çok fazla kayıt veya e-posta isteği yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
    }
  }
  if (code === 'email_provider_disabled' || code === 'signup_disabled' || code === 'provider_disabled') {
    return {
      status: 503,
      message: 'Yeni kullanıcı kaydı şu anda kullanılamıyor. Lütfen destek ekibine bildirin.',
    }
  }
  if (code === 'captcha_failed') {
    return { status: 400, message: 'Güvenlik doğrulaması tamamlanamadı. Sayfayı yenileyip tekrar deneyin.' }
  }
  if ((error.status && error.status >= 500) || /database error saving new user|unexpected failure/.test(message)) {
    return {
      status: 503,
      message: 'Hesap oluşturma altyapısında geçici bir sorun var. Lütfen kısa süre sonra tekrar deneyin.',
    }
  }

  return { status: 400, message: 'Kayıt işlemi tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.' }
}
