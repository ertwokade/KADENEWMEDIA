const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,30}$/

export type AdminIdentity = {
  id: string
  email: string | null
}

export function isLoginIdentifier(value: string) {
  return USERNAME_PATTERN.test(value) || (value.length <= 254 && EMAIL_PATTERN.test(value))
}

export function adminAuthEmail(account: AdminIdentity) {
  const email = String(account.email || '').trim().toLocaleLowerCase('en-US')
  if (EMAIL_PATTERN.test(email)) return email
  return `admin-${account.id.toLocaleLowerCase('en-US')}@sso.kadenewmedia.com`
}
