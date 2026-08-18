/**
 * KADE SEARCH ortak yardimcilari.
 * Hem sunucu (toplama/skorlama) hem tarayici (pano bicimlendirme) tarafindan
 * kullanilir; bu yuzden Node'a ozel API kullanmaz.
 */

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const nowIso = () => new Date().toISOString()

/** Turkce karakterleri de dogru ele alan normalizasyon. */
export function normalizeText(s: unknown = ''): string {
  return String(s ?? '')
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** "1.2M", "3,4 Mn", "12K", "1 234" gibi degerleri sayiya cevirir. */
export function parseCount(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v).trim().toLowerCase().replace(/\s/g, '')
  if (!s) return 0
  // "b" burada MİLYAR demektir; fmtCount da milyarı "B" ile yazar, ikisi tersine çevrilebilir.
  // Türkçe arayüzlerde "B" bazen "bin" anlamına geldiği için toplayıcılar sayfaları
  // hl=en ile ister (bkz. youtube toplayıcısı) — bu belirsizlik orada çözülür.
  const mult: Record<string, number> = { k: 1e3, bin: 1e3, m: 1e6, mn: 1e6, g: 1e9, t: 1e12 }
  const m = s.match(/^([\d.,]+)\s*([a-z]*)$/)
  if (!m) return 0
  let num = m[1]
  // 1.234.567 veya 1,234,567 -> binlik ayirici
  if (/^\d{1,3}([.,]\d{3})+$/.test(num)) num = num.replace(/[.,]/g, '')
  else num = num.replace(',', '.')
  const base = parseFloat(num)
  if (!Number.isFinite(base)) return 0
  const suffix = m[2]
  if (!suffix) return Math.round(base)
  if (suffix === 'b' || suffix === 'bn') return Math.round(base * 1e9)
  return Math.round(base * (mult[suffix] ?? 1))
}

/** Sayiyi insan okunur kisaltir: 1234567 -> "1.2M" */
export function fmtCount(n: unknown): string {
  const value = Number(n) || 0
  const abs = Math.abs(value)
  if (abs >= 1e12) return (value / 1e12).toFixed(1).replace(/\.0$/, '') + 'T'
  if (abs >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (abs >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(value))
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** ISO 8601 suresini (PT1M30S) saniyeye cevirir. */
export function parseIsoDuration(iso?: string | null): number {
  if (!iso) return 0
  const m = String(iso).match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/)
  if (!m) return 0
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0)
}

export function hoursBetween(a: string | number | Date, b: string | number | Date) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 36e5
}

export function uniqBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter((x) => {
    const k = keyFn(x)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Iki metin arasi Jaccard benzerligi (0-1). Capraz platform eslestirme icin. */
export function similarity(a: string, b: string): number {
  const ta = new Set(normalizeText(a).split(' ').filter((w) => w.length > 2))
  const tb = new Set(normalizeText(b).split(' ').filter((w) => w.length > 2))
  if (!ta.size || !tb.size) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / (ta.size + tb.size - inter)
}

/** Metinden hashtag'leri cikarir. */
export function extractHashtags(text = ''): string[] {
  return [...String(text).matchAll(/#([\p{L}\p{N}_]{2,40})/gu)].map((m) => m[1].toLocaleLowerCase('tr-TR'))
}

/**
 * Bagimliliksiz, kararli 64 bit karma (FNV-1a tabanli, 16 haneli hex).
 * Trend kimliklerini uretmek icin kullanilir; kriptografik amacli DEGILDIR.
 */
export function stableHash(...parts: Array<string | number | null | undefined>): string {
  const input = parts.map((p) => String(p ?? '')).join('|')
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 16)
}
