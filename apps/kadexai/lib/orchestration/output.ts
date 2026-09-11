type JsonRecord = Record<string, unknown>
export class StepOutputError extends Error {}
const record = (value: unknown): value is JsonRecord => !!value && typeof value === 'object' && !Array.isArray(value)
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const list = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0

/** A malformed/truncated response must stop the pipeline, never become the next prompt. */
export function validateStepOutput(stepId: string, content: string): unknown {
  let value: unknown = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  for (let depth = 0; depth < 3 && typeof value === 'string'; depth++) {
    try { value = JSON.parse(value) } catch { throw new StepOutputError('Adımın yanıtı geçerli JSON değil veya yarıda kesildi. Akış durduruldu; yeniden deneyebilirsin.') }
  }
  const rowsHave = (rows: unknown, key: string) => list(rows) && rows.every(row => record(row) && nonempty(row[key]))
  const valid = stepId === 'title' ? list(value) && value.every(nonempty)
    : !record(value) ? false
    : stepId === 'hashtag' ? ['yuksek', 'orta', 'dusuk', 'niche'].every(key => Array.isArray(value[key]) && (value[key] as unknown[]).every(nonempty)) && ['yuksek', 'orta', 'dusuk', 'niche'].some(key => list(value[key]))
    : stepId === 'content-plan' ? nonempty(value.strateji) && rowsHave(value.gunler, 'baslik')
    : stepId === 'trends' ? rowsHave(value.sicak_trendler, 'konu') || rowsHave(value.yukselenler, 'konu')
    : stepId === 'competitor' ? record(value.rakip_profili) && nonempty(value.farklilasma_stratejisi) && rowsHave(value['fırsatlar'] ?? value.firsatlar, 'firsat')
    : false
  if (!valid) throw new StepOutputError('Adımın yanıtında gerekli alanlar eksik. Eksik veriyi sonraki araca taşımamak için akış durduruldu.')
  return value
}

/** Whole labelled text entries, not sliced JSON. Preserve Unicode and indicate omissions. */
export function stepContext(value: unknown, maxChars = 6000): string {
  const lines: string[] = []
  let length = 0
  let omitted = false
  const visit = (item: unknown, path: string, depth: number) => {
    if (depth > 6 || length >= maxChars - 80) { omitted = true; return }
    if (item == null) return
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      const raw = String(item).trim()
      if (!raw) return
      const chars = Array.from(raw)
      const line = `${path}: ${chars.slice(0, 450).join('')}${chars.length > 450 ? '… [metin kısaltıldı]' : ''}`
      if (length + line.length > maxChars - 80) { omitted = true; return }
      lines.push(line); length += line.length + 1
      return
    }
    const entries = Array.isArray(item) ? item.map((entry, i) => [String(i + 1), entry] as const) : record(item) ? Object.entries(item) : []
    for (const [key, child] of entries) visit(child, path ? `${path} / ${key}` : key, depth + 1)
  }
  visit(value, '', 0)
  if (omitted) lines.push('[Bağlam boyutu nedeniyle bazı alanlar aktarılmadı; eksik bilgiyi uydurma.]')
  return lines.join('\n')
}
