import { createHash } from 'node:crypto'

const PWNED_PASSWORDS_RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const CHECK_TIMEOUT_MS = 3_000

export type PasswordExposureResult =
  | { checked: true; compromised: boolean; count: number }
  | { checked: false; compromised: false; count: 0 }

/**
 * Checks a password with HIBP's free k-anonymity endpoint. The password and
 * its complete hash never leave the server; only the first five SHA-1
 * characters are sent. Padding makes response sizes less revealing.
 */
export async function checkPasswordExposure(
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PasswordExposureResult> {
  const hash = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)

  try {
    const response = await fetchImpl(`${PWNED_PASSWORDS_RANGE_URL}${prefix}`, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'KadexAI-password-security',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    })
    if (!response.ok) return { checked: false, compromised: false, count: 0 }

    for (const line of (await response.text()).split(/\r?\n/)) {
      const separator = line.indexOf(':')
      if (separator < 1 || line.slice(0, separator).toUpperCase() !== suffix) continue
      const count = Number.parseInt(line.slice(separator + 1), 10)
      return {
        checked: true,
        compromised: Number.isFinite(count) && count > 0,
        count: Number.isFinite(count) ? count : 0,
      }
    }
    return { checked: true, compromised: false, count: 0 }
  } catch {
    return { checked: false, compromised: false, count: 0 }
  }
}

export async function getLeakedPasswordError(password: string) {
  const exposure = await checkPasswordExposure(password)
  if (!exposure.checked) {
    return {
      status: 503,
      message: 'Parola güvenliği şu anda doğrulanamıyor. Lütfen kısa süre sonra tekrar deneyin.',
    }
  }
  if (exposure.compromised) {
    return {
      status: 400,
      message: 'Bu parola bilinen veri ihlallerinde bulunuyor. Lütfen farklı ve benzersiz bir parola seçin.',
    }
  }
  return null
}
