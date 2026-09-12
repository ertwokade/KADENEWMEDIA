export const HASHTAG_GROUPS = ['yuksek', 'orta', 'dusuk', 'niche'] as const
export type HashtagGroups = Record<typeof HASHTAG_GROUPS[number], string[]>

function normalizeTag(tag: string): string {
  return tag.normalize('NFC')
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Bütün üretim araçları aynı etiket yazımını kullanır; düz metin korunur. */
export function normalizeGeneratedHashtags(content: string): string {
  return content.replace(/(^|\\[nrt]|[\s"'[(,;])#([\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*)/gu,
    (_match, prefix: string, tag: string) => `${prefix}#${normalizeTag(tag)}`)
}

/** Yapılandırılmış araç çıktıları için ortak, sınırlı hashtag listesi. */
export function normalizeHashtagList(value: unknown, count = 30): string[] {
  if (!Array.isArray(value)) return []
  return parseHashtagGroups(JSON.stringify(value), count).niche
}

/** Model cevabı güvenilmezdir: yalnız metin etiketleri, toplam sınır ve tekilleştirme. */
export function parseHashtagGroups(content: string, count = 30): HashtagGroups {
  const groups: HashtagGroups = { yuksek: [], orta: [], dusuk: [], niche: [] }
  const limit = Number.isInteger(count) ? Math.min(50, Math.max(1, count)) : 30
  const seen = new Set<string>()
  const add = (group: keyof HashtagGroups, value: unknown) => {
    if (typeof value !== 'string' || seen.size >= limit) return
    const clean = value.trim()
    if (!/^#?[\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*$/u.test(clean)) return
    const tag = `#${normalizeTag(clean.replace(/^#/, ''))}`
    if (tag.length > 101 || seen.has(tag)) return
    seen.add(tag)
    groups[group].push(tag)
  }
  const trimmed = content.trim()
  const fence = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)
  let parsed: unknown
  try { parsed = JSON.parse(fence ? fence[1] : trimmed) } catch { /* düz metin yanıtı */ }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    for (const group of HASHTAG_GROUPS) {
      const values = (parsed as Record<string, unknown>)[group]
      if (Array.isArray(values)) values.forEach(value => add(group, value))
    }
  } else if (Array.isArray(parsed)) {
    parsed.forEach(value => add('niche', value))
  } else if (parsed === undefined) {
    for (const match of trimmed.matchAll(/(?:^|[\s"'[(,;])#([\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*)/gu)) {
      add('niche', match[1])
    }
  }
  return groups
}
