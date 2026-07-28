/**
 * Hareket tercihleri — bileşenlerden bağımsız yardımcılar.
 *
 * Ayrı dosyada tutulur çünkü bir modül hem bileşen hem yardımcı export
 * ettiğinde Fast Refresh çalışmaz.
 */

/** Kullanıcı hareketi azaltmayı tercih etmiş mi? */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** IntersectionObserver destekleniyor mu? Desteklenmiyorsa içerik hemen görünür. */
export function supportsObserver() {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window
}
