import { redirect } from 'next/navigation'
import { withBasePath } from '@/lib/appConfig'

/**
 * A/B Başlık Testi, Viral Skor ile AYNI uca (/api/generate/viral-score) istek
 * atan ikinci bir arayüzdü. Karşılaştırma artık Viral Skor içinde opsiyonel
 * bir "karşılaştırılacak başlık" alanı olarak duruyor.
 *
 * Rota, kayıtlı bağlantılar ve tarayıcı geçmişi kırılmasın diye yönlendirme
 * olarak korunuyor.
 */
export default function ABTestRedirect() {
  redirect(withBasePath('/dashboard/viral-score'))
}
