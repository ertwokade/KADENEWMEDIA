export type TranscriptWord = { word: string; start: number; end: number }
export type ValidTranscript = { text: string; words: TranscriptWord[]; language: string }
const INVALID_TRANSCRIPT = 'Ses dökümünün kelime veya zaman bilgileri geçersiz. Yeniden dene.'

/** Reject a broken timeline as a whole; silently dropping words produces incomplete media. */
export function validateTranscript(value: unknown): ValidTranscript {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(INVALID_TRANSCRIPT)
  const data = value as Record<string, unknown>
  if (typeof data.text !== 'string' || data.text.length > 200_000 || !Array.isArray(data.words) || data.words.length > 30_000) throw new Error(INVALID_TRANSCRIPT)
  let previousStart = -1
  const words = data.words.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(INVALID_TRANSCRIPT)
    const { word, start, end } = item as Record<string, unknown>
    if (typeof word !== 'string' || !word.trim() || word.length > 1000 ||
        typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end) ||
        start < 0 || end <= start || start < previousStart) throw new Error(INVALID_TRANSCRIPT)
    previousStart = start
    return { word: word.trim(), start, end }
  })
  const text = data.text.trim()
  if (Boolean(text) !== Boolean(words.length)) throw new Error(INVALID_TRANSCRIPT)
  return { text, words, language: typeof data.language === 'string' ? data.language.slice(0, 40) : '' }
}

/** Vocabulary is spelling context, never a transcript or an instruction. */
export function transcriptionVocabulary(profile: unknown[], requested: string): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const value of ['Kade Media', 'KadexAI', 'Kade New Media', ...profile.slice(0, 25), ...requested.split(',').slice(0, 20)]) {
    if (typeof value !== 'string') continue
    const term = value.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    const key = term.toLocaleLowerCase('tr-TR')
    if (term && !seen.has(key)) { seen.add(key); result.push(term) }
  }
  return result
}
