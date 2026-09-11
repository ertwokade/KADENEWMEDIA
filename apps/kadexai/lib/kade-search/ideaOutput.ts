import { parseHashtagGroups } from '../ai/hashtags'

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function list(value: unknown, count: number, length: number) {
  return Array.isArray(value) ? [...new Set(value.map((item) => text(item, length)).filter(Boolean))].slice(0, count) : []
}

/** AI output must contain a usable hook, structure and CTA before replacing a template. */
export function normalizeIdeaOutput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const item = value as Record<string, unknown>
  const trendId = text(item.trendId, 100)
  const kanca = text(item.kanca, 500)
  const kurgu = list(item.kurgu, 8, 300)
  const cta = text(item.cta, 240)
  if (!trendId || !kanca || kurgu.length < 3 || !cta) return null
  const difficulty = item.zorluk && typeof item.zorluk === 'object' ? item.zorluk as Record<string, unknown> : {}
  const level = text(difficulty.level, 40)
  const note = text(difficulty.note, 240)
  const time = '(?:[01]\\d|2[0-3]):[0-5]\\d'
  const validTime = new RegExp(`^${time}(?:-${time})?$`)
  return {
    trendId, kanca, kurgu, cta,
    alternatifKancalar: list(item.alternatifKancalar, 3, 500),
    hashtagler: parseHashtagGroups(JSON.stringify(Array.isArray(item.hashtagler) ? item.hashtagler : []), 12).niche,
    zorluk: note && ['Düşük', 'Orta', 'Yüksek', 'Çok yüksek'].includes(level) ? { level, note } : null,
    paylasimSaati: list(item.paylasimSaati, 40, 40).filter((value) => validTime.test(value)).slice(0, 3),
    neden: text(item.neden, 500),
  }
}
