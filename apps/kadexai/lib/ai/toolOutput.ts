import { extractJsonArray } from './json'
import { asRecord, asRecordList, asText, asTextList } from './outputValidation'
import { parseStructuredOutput } from './structured'

export interface GeneratedHook {
  hook: string
  tip: string
  neden: string
}

export interface GeneratedTranslation {
  ceviri: string
  bolumler: Array<{ orijinal: string; ceviri: string; telaffuz: string; zamanlama: string; not: string }>
  kulturel_notlar: string[]
  genel_yonerge: string
}

/** Başlık aracı yalnız söz verdiği JSON metin listesini kabul eder. */
export function normalizeTitleOutput(content: string, limit = 10): string[] {
  const parsed = extractJsonArray<unknown[]>(content)
  if (!Array.isArray(parsed)) return []
  return parsed
    .map(item => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean)
    .map(item => item.slice(0, 300))
    .slice(0, Math.min(20, Math.max(1, limit)))
}

/** Hook aracı sohbet önsözünü kart gibi göstermez; yalnız tam kartları kabul eder. */
export function normalizeHookOutput(content: string, limit = 20): GeneratedHook[] {
  const parsed = extractJsonArray<unknown[]>(content)
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap(item => {
    const row = asRecord(item)
    if (!row) return []
    const hook = typeof row.hook === 'string' ? row.hook.trim().slice(0, 800) : ''
    if (!hook) return []
    return [{
      hook,
      tip: typeof row.tip === 'string' ? row.tip.trim().slice(0, 80) || 'genel' : 'genel',
      neden: typeof row.neden === 'string' ? row.neden.trim().slice(0, 600) : '',
    }]
  }).slice(0, Math.min(30, Math.max(1, limit)))
}

/** Eksik/bozuk çeviri JSON'u dublajda tamamlanmış içerik sayılmaz. */
export function normalizeTranslationOutput(content: string): GeneratedTranslation | null {
  const value = asRecord(parseStructuredOutput(content))
  if (!value) return null
  const ceviri = typeof value.ceviri === 'string' ? value.ceviri.trim().slice(0, 20_000) : ''
  if (!ceviri) return null
  const bolumler = asRecordList(value.bolumler, row => {
    const orijinal = typeof row.orijinal === 'string' ? row.orijinal.trim().slice(0, 4_000) : ''
    const translated = typeof row.ceviri === 'string' ? row.ceviri.trim().slice(0, 4_000) : ''
    if (!orijinal || !translated) return null
    return {
      orijinal,
      ceviri: translated,
      telaffuz: asText(row.telaffuz, 1_000),
      zamanlama: asText(row.zamanlama, 500),
      not: asText(row.not, 1_000),
    }
  }, 200)
  return {
    ceviri,
    bolumler,
    kulturel_notlar: asTextList(value.kulturel_notlar, 30, 1_000),
    genel_yonerge: asText(value.genel_yonerge, 3_000),
  }
}
