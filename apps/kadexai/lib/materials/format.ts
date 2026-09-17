// "1.0B" milyar gibi okunuyordu; Türkçe kısaltma açık yazılır: "1 bin", "2,4 Mn".
export function sayiMetni(deger: number | null) {
  if (deger == null) return null
  const kisa = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })
  if (deger >= 1_000_000_000) return `${kisa(deger / 1_000_000_000)} Mr`
  if (deger >= 1_000_000) return `${kisa(deger / 1_000_000)} Mn`
  if (deger >= 1_000) return `${kisa(deger / 1_000)} bin`
  return String(deger)
}
