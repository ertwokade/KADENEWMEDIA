/**
 * API hata mesajlarını kullanıcıya gösterilmeden önce süzer.
 *
 * Sunucu normalde jenerik Türkçe mesajlar döndürür ("Sunucu hatası",
 * "Doğrulama hatası"). Ancak beklenmedik bir noktada ORM/sürücü hatası
 * yanıta sızarsa — ör. `SequelizeConnectionError: password authentication
 * failed for user "postgres" at /var/task/db.js:42` — istemci bunu olduğu
 * gibi ekrana basıyordu. Bu; veritabanı türünü, kullanıcı adını, dosya
 * yolunu ve yığın izini ziyaretçiye açar.
 *
 * Savunma derinliği: sunucu tarafı zaten sanitize etse de istemci de
 * teknik görünen mesajları jenerik karşılığıyla değiştirir. Anlamlı,
 * kullanıcıya yönelik mesajlar (doğrulama uyarıları gibi) korunur.
 */

const GENERIC = 'İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.'

/**
 * Teknik sızıntı işaretleri. Biri bile eşleşirse mesaj kullanıcıya
 * gösterilmez.
 */
const TECHNICAL_PATTERNS = [
  /\b[A-Z][A-Za-z]*(Error|Exception)\b/,        // SequelizeConnectionError, TypeError…
  /\bat\s+\/?[\w./\\-]+:\d+/,                    // at /var/task/db.js:42
  /(^|[\s"'(])(\/(var|usr|home|opt|etc|tmp|root)\/|[A-Za-z]:\\)/, // mutlak dosya yolları
  /\b(postgres|postgresql|mysql|mongodb|sqlite|redis|supabase)\b/i,
  /\b(ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNRESET)\b/,
  /\b(password|passwd|secret|token|api[_-]?key|authentication failed)\b/i,
  /\b\d{1,3}(\.\d{1,3}){3}(:\d+)?\b/,           // IP adresi / IP:port
  /\bnode_modules\b|\bstack\b.*\bat\b/i,
  /\b(SELECT|INSERT|UPDATE|DELETE)\b.+\bFROM\b/i, // ham SQL
  /^\s*[{[]/,                                     // ham JSON/nesne dökümü
]

/** Mesaj kullanıcıya gösterilebilir mi? */
export function isSafeUserMessage(message) {
  if (typeof message !== 'string') return false
  const text = message.trim()
  if (!text) return false
  // Aşırı uzun mesajlar genelde yığın izidir.
  if (text.length > 300) return false
  return !TECHNICAL_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Gösterilecek metni verir: mesaj güvenliyse kendisi, değilse jenerik metin.
 * @param {unknown} message  API'den veya Error'dan gelen metin
 * @param {string} [fallback] Bağlama özel jenerik mesaj
 */
export function toUserMessage(message, fallback = GENERIC) {
  const text = typeof message === 'string' ? message : message?.message
  return isSafeUserMessage(text) ? text.trim() : fallback
}

export { GENERIC as GENERIC_ERROR_MESSAGE }
export default toUserMessage
