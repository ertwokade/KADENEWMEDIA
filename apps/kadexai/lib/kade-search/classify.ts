/**
 * Siniflandirma: metinden kategori, alt kategoriler ve icerik formatlarini cikarir.
 * Puanlama = anahtar kelime esleme + kelime siniri bonusu + platform ipucu.
 */
import { CATEGORIES, FORMATS } from './taxonomy'
import { normalizeText, extractHashtags } from './util'
import type { EnrichedTrendItem, RawTrendItem } from './types'

// YouTube videoCategoryId -> kendi kategorimiz
export const YT_CATEGORY_MAP: Record<number, string> = {
  1: 'film', 2: 'otomobil', 10: 'muzik', 15: 'hayvan', 17: 'fitness', 18: 'film',
  19: 'seyahat', 20: 'oyun', 21: 'yasam', 22: 'yasam', 23: 'komedi', 24: 'unlu',
  25: 'haber', 26: 'diy', 27: 'egitim', 28: 'teknoloji', 29: 'toplum', 30: 'film',
  31: 'film', 32: 'film', 33: 'film', 34: 'komedi', 35: 'film', 36: 'film',
  37: 'aile', 42: 'film', 43: 'film', 44: 'film',
}

// TikTok Creative Center sektor etiketleri -> kategori
export const TT_INDUSTRY_MAP: Record<string, string> = {
  'apparel & accessories': 'moda',
  'beauty & personal care': 'guzellik',
  'food & beverage': 'yemek',
  games: 'oyun',
  'sports & outdoor': 'fitness',
  travel: 'seyahat',
  education: 'egitim',
  'financial services': 'finans',
  health: 'saglik',
  'home improvement': 'ev',
  pets: 'hayvan',
  'tech & electronics': 'teknoloji',
  'vehicle & transportation': 'otomobil',
  entertainment: 'film',
  'life services': 'yasam',
  'business services': 'isyeri',
  'news & entertainment': 'haber',
  'baby, kids & maternity': 'aile',
}

function scoreKeywords(text: string, keywords: string[]) {
  let score = 0
  const hits: string[] = []
  for (const kw of keywords) {
    const k = normalizeText(kw)
    if (!k) continue
    if (!text.includes(k)) continue

    const boundary = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
    if (boundary.test(text)) {
      // Tam kelime eslesmesi: uzun kelime = daha guclu sinyal
      score += 2 + Math.min(k.length / 10, 1.5)
    } else if (k.length >= 6) {
      // Parcali eslesmeye yalnizca uzun kelimelerde kredi ver.
      score += 0.6
    } else continue
    hits.push(kw)
  }
  return { score, hits }
}

export function classifyCategory(item: RawTrendItem) {
  // [ÇIKARIM] / [DEMO VERİ] kalip metinleri siniflandirmayi kirletmesin diye atilir
  const description = String(item.description ?? '').replace(/\[(ÇIKARIM|DEMO VERİ)\][\s\S]*/i, '')

  const parts = [
    item.title,
    description,
    item.author,
    (item.tags || []).join(' '),
    (item.hashtags || []).join(' '),
    item.hint,
  ]
    .filter(Boolean)
    .join(' ')
  const text = normalizeText(parts)

  const results: Array<{ key: string; score: number; hits: string[] }> = []
  for (const [key, def] of Object.entries(CATEGORIES)) {
    if (!def.keywords.length) continue
    const { score, hits } = scoreKeywords(text, def.keywords)
    if (score > 0) results.push({ key, score, hits })
  }

  // Platform ipuclari agirlik ekler
  const ytCat = YT_CATEGORY_MAP[Number(item.ytCategoryId)]
  if (ytCat) {
    const existing = results.find((r) => r.key === ytCat)
    if (existing) existing.score += 4
    else results.push({ key: ytCat, score: 4, hits: ['youtube-kategori'] })
  }
  const ttCat = TT_INDUSTRY_MAP[normalizeText(item.industry || '')]
  if (ttCat) {
    const existing = results.find((r) => r.key === ttCat)
    if (existing) existing.score += 3.5
    else results.push({ key: ttCat, score: 3.5, hits: ['tiktok-sektor'] })
  }
  // Cikarim kayitlari kaynak trendin kategorisini miras alir
  if (item.sourceCategory && CATEGORIES[item.sourceCategory]) {
    const existing = results.find((r) => r.key === item.sourceCategory)
    if (existing) existing.score += 6
    else results.push({ key: item.sourceCategory, score: 6, hits: ['kaynak-trend'] })
  }

  results.sort((a, b) => b.score - a.score)
  if (!results.length) return { category: 'diger', subcategories: [] as string[], confidence: 0, matched: [] as string[] }

  const top = results[0]
  const total = results.reduce((s, r) => s + r.score, 0)
  return {
    category: top.key,
    subcategories: results.slice(1, 4).filter((r) => r.score >= top.score * 0.4).map((r) => r.key),
    confidence: Math.min(1, top.score / Math.max(total, 1) + Math.min(top.score / 12, 0.5)),
    matched: top.hits.slice(0, 6),
  }
}

/** Icerikteki format kaliplarini tespit eder. */
export function detectFormats(item: RawTrendItem): string[] {
  const description = String(item.description ?? '').replace(/\[(ÇIKARIM|DEMO VERİ)\][\s\S]*/i, '')
  const text = normalizeText([item.title, description, (item.hashtags || []).join(' ')].filter(Boolean).join(' '))
  const found: Array<{ key: string; score: number }> = []
  for (const [key, def] of Object.entries(FORMATS)) {
    const { score } = scoreKeywords(text, def.keywords)
    if (score >= 2) found.push({ key, score })
  }

  // Yapisal ipuclari
  const dur = item.duration_sec ?? 0
  if (dur > 0 && dur <= 60 && !found.length) found.push({ key: 'edit', score: 1 })
  if (/\d+\s*(sey|madde|ipucu|neden|adim|tip|thing|reason|step)/.test(text)) found.push({ key: 'liste', score: 3 })
  if (/(bolum|part|episode)\s*\d+/.test(text)) found.push({ key: 'mikroDram', score: 3 })
  if (/\?$|\?\s/.test(item.title || '')) found.push({ key: 'soru', score: 2 })

  return [...new Set(found.sort((a, b) => b.score - a.score).map((f) => f.key))].slice(0, 4)
}

/** Dil tahmini (kaba ama isimizi goruyor). */
export function detectLanguage(item: RawTrendItem): string {
  // Baslik aciklamadan daha guvenilir sinyaldir
  const title = String(item.title || '')
  if (/[ğışçöüĞİŞÇÖÜ]/.test(title)) return 'tr'
  const raw = `${title} ${item.description || ''}`
  if (/[ğışçöüĞİŞÇÖÜ]/.test(raw) && !/[a-z]{4,}\s(the|and|is|of)\s/i.test(title)) return 'tr'
  const t = normalizeText(raw)
  const trWords = ['ve', 'bir', 'icin', 'ile', 'bu', 'ne', 'nasil', 'cok', 'daha', 'ama', 'gibi', 'kadar']
  const enWords = ['the', 'and', 'for', 'with', 'this', 'what', 'how', 'you', 'best', 'your']
  const count = (list: string[]) => list.filter((w) => new RegExp(`(^| )${w}( |$)`).test(t)).length
  const tr = count(trWords)
  const en = count(enWords)
  if (tr > en) return 'tr'
  if (en > tr) return 'en'
  return item.country === 'TR' ? 'tr' : 'en'
}

/** Toplanan ham item'i tam siniflandirilmis hale getirir. */
export function enrich(item: RawTrendItem): EnrichedTrendItem {
  const hashtags = [...(item.hashtags || []), ...extractHashtags(`${item.title || ''} ${item.description || ''}`)]
  const withTags: RawTrendItem = { ...item, hashtags: [...new Set(hashtags)] }
  const cat = classifyCategory(withTags)
  return {
    ...withTags,
    normalized: normalizeText(`${item.title || ''} ${item.author || ''}`),
    category: cat.category,
    subcategories: cat.subcategories,
    categoryConfidence: cat.confidence,
    formats: detectFormats(withTags),
    language: item.language ?? detectLanguage(withTags),
  }
}
