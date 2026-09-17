/**
 * Materyal kayıtlarını kullanıcıya göstermeden önce düzeltir.
 * Veritabanı kaydı değiştirilmez; yalnız yanıt biçimlenir.
 */

type MaterialLike = { source?: string | null; kind?: string | null; title?: string | null; duration_sec?: number | null }

/**
 * Kapanan arşiv kaynağının sitemap'i her videoya 60 sn yazıyordu; canlı ölçümde
 * gerçek süreler 5–20 sn çıktı. Bu değer süre bilgisi değil, yer tutucu.
 */
export function trustedDuration(row: MaterialLike): number | null {
  const value = row.duration_sec
  if (value == null || !Number.isFinite(value) || value <= 0) return null
  if (row.source === 'arsivhub' && value === 60) return null
  return value
}

// Çocukları küçük düşüren veya mahrem anını teşhir eden başlıklar listelenmez.
const CHILD = /(çocu[kğ]|bebe[kğ]|kız\s*çocu|oğlan|ufaklık|velet)/i
const DEGRADING = /(tuvalet|sıçar|sıçıyor|işer|osur|altına|kusan|kusuyor|çıplak|donu|ağlayan|ağlatan|dilenci|satılık|dövülen|dövüyor|tokat|aşağıla|rezil|alay|dalga geç|yanarken)/i

export function isSensitiveMaterial(row: MaterialLike): boolean {
  const title = (row.title ?? '').toLocaleLowerCase('tr-TR')
  return CHILD.test(title) && DEGRADING.test(title)
}

export function presentMaterials<T extends MaterialLike>(rows: T[]) {
  const visible = rows
    .filter((row) => !isSensitiveMaterial(row))
    .map((row) => ({ ...row, duration_sec: trustedDuration(row) }))
  return { visible, hidden: rows.length - visible.length }
}
