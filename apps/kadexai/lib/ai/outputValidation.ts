export type OutputRecord = Record<string, unknown>

export function asRecord(value: unknown): OutputRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as OutputRecord
    : null
}

export function asText(value: unknown, maxLength = 10_000): string {
  if (typeof value === 'string') return value.trim().slice(0, maxLength)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).slice(0, maxLength)
  return ''
}

export function asNumber(value: unknown, fallback = 0, min = 0, max = 100): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}

export function asTextList(value: unknown, limit = 50, itemMaxLength = 2_000): string[] {
  return Array.isArray(value)
    ? value.map((item) => asText(item, itemMaxLength)).filter(Boolean).slice(0, limit)
    : []
}

export function asRecordList<T>(value: unknown, mapper: (record: OutputRecord, index: number) => T | null, limit = 50): T[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, limit).flatMap((item, index) => {
    const record = asRecord(item)
    if (!record) return []
    const mapped = mapper(record, index)
    return mapped ? [mapped] : []
  })
}

export function asTextRecord(value: unknown, limit = 50): Record<string, string> {
  const record = asRecord(value)
  if (!record) return {}
  return Object.fromEntries(
    Object.entries(record)
      .slice(0, limit)
      .map(([key, item]) => [key.slice(0, 100), asText(item)])
      .filter(([, item]) => Boolean(item)),
  )
}
