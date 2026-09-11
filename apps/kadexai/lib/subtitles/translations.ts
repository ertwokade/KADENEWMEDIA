/** Dubbing must never speak an untranslated fallback as though it were translated. */
export function completeTranslations<T extends { index: number; text: string }>(source: T[], value: unknown): T[] {
  if (!Array.isArray(value) || value.length !== source.length) throw new Error('Çeviri eksik; seslendirme başlatılmadı.')
  const expected = new Set(source.map((cue) => cue.index))
  const translated = new Map<number, string>()
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Geçersiz çeviri.')
    const { index, text, atlandi } = item as Record<string, unknown>
    if (typeof index !== 'number' || !expected.has(index) || translated.has(index) || atlandi === true ||
        typeof text !== 'string' || !text.trim() || text.length > 3000) throw new Error('Çeviri eksik veya geçersiz; seslendirme başlatılmadı.')
    translated.set(index, text.trim())
  }
  return source.map((cue) => ({ ...cue, text: translated.get(cue.index)! }))
}
