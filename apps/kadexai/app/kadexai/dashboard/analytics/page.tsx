import { redirect } from 'next/navigation'
import { withBasePath } from '@/lib/appConfig'

/**
 * Analitik Dashboard ile Sosyal Medya Analizi aynı işi yapıyordu: hesap
 * metriklerini alıp büyüme stratejisi üretiyorlardı. Sosyal Medya Analizi
 * bunun üstüne bio, son içerikler ve hedefi de sorduğu için üst kümesiydi;
 * Analitik'in tek katkısı metrikleri serbest metin yerine adı konmuş
 * alanlarla sormasıydı. O alanlar Sosyal Medya Analizi formuna taşındı.
 *
 * Rota, kayıtlı bağlantılar ve tarayıcı geçmişi kırılmasın diye yönlendirme
 * olarak korunuyor. /api/generate/analytics ucu olduğu gibi duruyor.
 */
export default function AnalyticsRedirect() {
  redirect(withBasePath('/dashboard/social-audit'))
}
