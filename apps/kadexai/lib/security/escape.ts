/**
 * HTML özel karakterlerini kaçışlar. Sunucu tarafında üretilen HTML'e
 * (ör. Shopier yönlendirme formu) kullanıcı/sipariş verisi gömülürken XSS'i önler.
 */
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}
