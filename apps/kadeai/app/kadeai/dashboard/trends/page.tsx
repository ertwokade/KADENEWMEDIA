import { redirect } from 'next/navigation'
import { withBasePath } from '@/lib/appConfig'

/**
 * Trend Bulucu, modele "şu an ne trend?" diye soruyordu — yani veri olmadan
 * güncel olgu üretiyordu. Trend Radar aynı soruyu gerçek toplayıcı verisiyle
 * yanıtlıyor (YouTube, TikTok, Reddit, Google Trends, müzik listeleri).
 *
 * Niş bazlı trend fikri üretme yeteneği kaybolmadı: Akışlar → İçerik Sprinti
 * akışının ilk adımı olarak duruyor ve çıktısı rakip analizi ile içerik
 * planına besleniyor.
 */
export default function TrendsRedirect() {
  redirect(withBasePath('/dashboard/trend-radar'))
}
