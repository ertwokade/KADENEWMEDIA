const SENSITIVE_KEY = /authorization|cookie|password|token|secret|prompt|content|email|phone|address/i

export function scrubTelemetryValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubTelemetryValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[Filtered]' : scrubTelemetryValue(nested),
    ])
  )
}
