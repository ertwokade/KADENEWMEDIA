/**
 * Gemini görsel modeli seçimi ve hata sınıflandırması.
 *
 * Görsel model kimlikleri sık emekliye ayrılıyor; sabit bir kimlik (ör.
 * gemini-2.5-flash-image) kaldırıldığında her istek aynı genel hatayla
 * düşüyordu. Tanımlı model bulunamazsa anahtarın gerçekten erişebildiği
 * görsel modeli Google'ın model listesinden seçilir.
 */

export interface GeminiModelInfo {
  name?: string
  supportedGenerationMethods?: string[]
}

/** Listeden generateContent destekleyen görsel modelini seçer; önizleme olmayanı ve daha yeni sürümü tercih eder. */
export function pickGeminiImageModel(models: GeminiModelInfo[]): string | null {
  const candidates = models
    .map((model) => ({
      id: String(model.name ?? '').replace(/^models\//, ''),
      methods: Array.isArray(model.supportedGenerationMethods) ? model.supportedGenerationMethods : [],
    }))
    .filter((model) => /^gemini-[\w.-]*image/i.test(model.id) && model.methods.includes('generateContent'))
  if (!candidates.length) return null
  const version = (id: string) => Number(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0)
  candidates.sort((a, b) =>
    Number(/preview|exp/i.test(a.id)) - Number(/preview|exp/i.test(b.id))
    || version(b.id) - version(a.id))
  return candidates[0].id
}

/** Sağlayıcı durum kodunu kullanıcıya gösterilebilir, sır içermeyen Türkçe nedene çevirir. */
export function geminiImageError(status: number) {
  if (status === 429) return 'Gemini görsel kotası doldu; biraz sonra yeniden dene.'
  if (status === 401 || status === 403) return 'Gemini anahtarının görsel üretim izni yok.'
  if (status === 404) return 'Tanımlı Gemini görsel modeli artık kullanılamıyor.'
  if (status === 400) return 'Gemini görsel isteğini reddetti; istemi sadeleştirip yeniden dene.'
  return `Gemini görsel isteği tamamlanamadı (HTTP ${status}).`
}

/** Model kimliği hatası mı (yeniden model seçimi gerekir)? */
export function isGeminiModelUnavailable(status: number, message: string) {
  return status === 404 || (status === 400 && /model|not found|not supported|unsupported/i.test(message))
}
