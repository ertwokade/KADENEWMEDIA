/**
 * Araçlar arası form aktarımı.
 *
 * Bir araçtan diğerine (Kanal Denetimi → Hook, Geçmiş → aracı aç, Takvime ekle)
 * geçerken girdiler adres parametresiyle taşınır. Hedef sayfa parametreleri bir
 * kez okur ve adresten siler; böylece sayfa yenilendiğinde form eski değerle
 * tekrar dolmaz.
 */

const MAX_VALUE = 2_000
const SKIPPED_KEYS = new Set(['model', 'profile', 'words', 'file'])

/** Kayıttaki girdilerden adres parametresi üretir; yalnız metin, sayı ve metin listeleri taşınır. */
export function prefillQuery(input: Record<string, unknown> | null | undefined): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input || {})) {
    if (SKIPPED_KEYS.has(key) || !/^[a-zA-Z][\w-]{0,40}$/.test(key)) continue
    if (typeof value === 'string' && value.trim()) params.set(key, value.slice(0, MAX_VALUE))
    else if (typeof value === 'number' && Number.isFinite(value)) params.set(key, String(value))
    else if (typeof value === 'boolean') params.set(key, value ? '1' : '0')
    else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      const list = (value as string[]).filter(Boolean)
      if (list.length) params.set(key, list.join(',').slice(0, MAX_VALUE))
    }
  }
  return params.toString()
}

export function withPrefill(route: string, input: Record<string, unknown> | null | undefined) {
  const query = prefillQuery(input)
  if (!query) return route
  return `${route}${route.includes('?') ? '&' : '?'}${query}`
}

/** İstenen parametreleri okur ve adresten kaldırır. Tarayıcı dışında boş döner. */
export function readPrefill<K extends string>(keys: readonly K[]): Partial<Record<K, string>> {
  if (typeof window === 'undefined') return {}
  const url = new URL(window.location.href)
  const out: Partial<Record<K, string>> = {}
  let changed = false
  for (const key of keys) {
    const value = url.searchParams.get(key)
    if (value === null) continue
    out[key] = value.slice(0, MAX_VALUE)
    url.searchParams.delete(key)
    changed = true
  }
  if (changed) window.history.replaceState(window.history.state, '', url)
  return out
}

export function splitList(value: string | undefined) {
  return (value || '').split(',').map((item) => item.trim()).filter(Boolean)
}
