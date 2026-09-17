/**
 * Alıntı doğrulama.
 *
 * Model "alıntı" diye kaynakta geçmeyen cümleler, kelimesi değiştirilmiş
 * ifadeler ("görüşmesiyle" → "görüşüyle") üretebiliyor. Alıntı yalnız kaynakta
 * birebir geçiyorsa kabul edilir ve kaynaktaki özgün yazımıyla döndürülür.
 * Büyük/küçük harf, tırnak biçimi, boşluk ve sondaki noktalama farkı göz ardı
 * edilir; kelime değişikliği kabul edilmez.
 */

const QUOTE_CHARS = /[“”„«»"'’‘`]/g

function fold(char: string) {
  return char.toLocaleLowerCase('tr-TR')
}

/** Karşılaştırma için normalize edilmiş metin ve her karakterin kaynaktaki konumu. */
function normalizeWithMap(text: string) {
  let out = ''
  const map: number[] = []
  let lastWasSpace = true
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (QUOTE_CHARS.test(ch)) { QUOTE_CHARS.lastIndex = 0; continue }
    QUOTE_CHARS.lastIndex = 0
    if (/\s/.test(ch)) {
      if (!lastWasSpace) { out += ' '; map.push(i); lastWasSpace = true }
      continue
    }
    out += fold(ch)
    map.push(i)
    lastWasSpace = false
  }
  return { out: out.trimEnd(), map }
}

export function verbatimQuote(quote: string, source: string): string | null {
  const cleaned = quote.replace(QUOTE_CHARS, '').replace(/\s+/g, ' ').trim().replace(/[.,;:!?…—–-]+$/u, '').trim()
  if (cleaned.length < 12) return null
  const needle = normalizeWithMap(cleaned).out
  const haystack = normalizeWithMap(source)
  const index = haystack.out.indexOf(needle)
  if (index === -1) return null
  const start = haystack.map[index]
  const end = haystack.map[index + needle.length - 1]
  let original = source.slice(start, end + 1)
  // Kaynakta cümleyi bitiren noktalama varsa korunur.
  const next = source[end + 1]
  if (next && /[.!?…]/.test(next)) original += next
  return original.replace(/\s+/g, ' ').trim()
}
