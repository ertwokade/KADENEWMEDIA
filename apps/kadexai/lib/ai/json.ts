export function extractJsonObject<T = Record<string, unknown>>(content: string): T | null {
  return extractJson<T>(content, '{', '}')
}

export function extractJsonArray<T = unknown[]>(content: string): T | null {
  return extractJson<T>(content, '[', ']')
}

function extractJson<T>(content: string, open: string, close: string): T | null {
  const clean = content
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(clean) as T
  } catch {
    const start = clean.indexOf(open)
    const end = clean.lastIndexOf(close)
    if (start === -1 || end === -1 || end <= start) return null

    try {
      return JSON.parse(clean.slice(start, end + 1)) as T
    } catch {
      return null
    }
  }
}

export function clampScore(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        return String(obj.baslik || obj.title || obj.metin || obj.text || '')
      }
      return ''
    })
    .map((item) => item.trim())
    .filter(Boolean)
}
