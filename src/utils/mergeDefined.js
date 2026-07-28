/**
 * `override` içindeki YALNIZCA dolu alanları `base` üzerine yazar.
 *
 * Admin panelinde boş bırakılmış bir alan, statik/kodda tanımlı değeri
 * silmemelidir: yönetici "Instagram" kutusunu boş bıraktı diye sitedeki
 * e-posta adresinin kaybolması beklenen davranış değil.
 *
 * Boş sayılanlar: null, undefined, yalnız boşluk içeren string, boş dizi.
 */
export function mergeDefined(base, override) {
  const out = { ...base }
  for (const [key, value] of Object.entries(override || {})) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

export default mergeDefined
