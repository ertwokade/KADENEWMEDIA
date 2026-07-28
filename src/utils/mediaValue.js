/**
 * Görsel alanlarında hem URL hem emoji/harf saklanabiliyor.
 *
 * Örnek: partner kayıtlarının `logo` alanı veritabanında emoji tutuyor
 * ("🍕", "🌿"). Bu değer <img src> olarak verildiğinde tarayıcı onu göreli
 * bir yol sanıp `/partnerler/%F0%9F%8D%95` isteği atıyor, 404 alıyor ve
 * kırık görsel ikonu gösteriyordu.
 *
 * Bu yardımcı, bir alanın gerçekten yüklenebilir bir kaynağa mı yoksa
 * metin/emoji rozetine mi işaret ettiğini tek yerde belirler.
 */

const LOADABLE_PREFIX = /^(https?:\/\/|\/\/|\/|data:image\/|blob:)/i;
const IMAGE_EXT = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i;

/**
 * Değer <img src> olarak güvenle kullanılabilir mi?
 * `javascript:` gibi şemalar bilerek dışarıda bırakılır.
 */
export function isImageSource(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!LOADABLE_PREFIX.test(trimmed)) return false;
  // Uzantısız CDN/Supabase yollarını da kabul et; asıl amaç emoji ve
  // kısa metinleri elemek.
  return IMAGE_EXT.test(trimmed) || trimmed.length > 12;
}

/**
 * Değer görsel değilse rozet/baş harf olarak gösterilecek kısa metni verir.
 * `fallback` genelde kaydın adıdır; ondan ilk harf alınır.
 */
export function toBadgeText(value, fallback = '') {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed && !isImageSource(trimmed) && [...trimmed].length <= 4) return trimmed;
  return String(fallback).trim().charAt(0).toLocaleUpperCase('tr-TR');
}
