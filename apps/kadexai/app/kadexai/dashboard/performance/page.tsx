import { redirect } from 'next/navigation'
import { withBasePath } from '@/lib/appConfig'

/**
 * Performans Tahmini, Viral Skor ile aynı başlığı aynı 0-100 ölçeğinde
 * puanlayan ikinci bir arayüzdü; hatta kendi çıktısında A/B alternatifleri
 * de üretiyordu, yani zaten birleştirilmiş olan A/B aracını da tekrar
 * ediyordu. Tek gerçek farkı thumbnail ve nişi hesaba katıp CTR ile ilk 48
 * saat tahmini eklemesiydi; bu iki alan artık Viral Skor formunda opsiyonel
 * olarak duruyor ve dolduğunda aynı tahminler aynı kartta gösteriliyor.
 *
 * Rota, kayıtlı bağlantılar ve tarayıcı geçmişi kırılmasın diye yönlendirme
 * olarak korunuyor. /api/generate/performance ucu olduğu gibi duruyor.
 */
export default function PerformanceRedirect() {
  redirect(withBasePath('/dashboard/viral-score'))
}
