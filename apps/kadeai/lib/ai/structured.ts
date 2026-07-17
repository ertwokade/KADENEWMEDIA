export type StructuredOutput = Record<string, unknown>

/**
 * Model yanıtındaki JSON kod bloğunu güvenli biçimde ayıklar.
 * Parse edilemeyen veya yarıda kesilen yanıtlar boş nesneye dönüşmez;
 * arayüzün kullanıcıya ham sonucu gösterebilmesi için `raw` olarak korunur.
 */
export function parseStructuredOutput(content: string): StructuredOutput {
  const trimmed = content.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start >= 0 && end > start) {
    try {
      const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as StructuredOutput
      }
    } catch {
      // Ham yanıt aşağıda korunuyor.
    }
  }

  return { raw: trimmed || 'Model boş bir yanıt döndürdü.' }
}
