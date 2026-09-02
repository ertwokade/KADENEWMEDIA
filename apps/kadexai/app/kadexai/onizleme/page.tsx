import { notFound } from 'next/navigation'
import OnizlemeIcerik from './OnizlemeIcerik'

/*
 * Rota istek anında çalışmalı. Öntanımlı davranışta kabuk 200 ile akıyor,
 * `notFound()` ise sonradan devreye giriyordu: sayfa "404" yazıyor ama HTTP
 * durumu 200 kalıyordu — yani yumuşak 404. Arama motoru ve izleme araçları
 * sayfayı var sayıyordu.
 */
export const dynamic = 'force-dynamic'

/**
 * Yeni bileşenlerin yerel önizlemesi.
 *
 * Panelin tamamı giriş istiyor; tasarımı görmek için her seferinde oturum
 * açmak gerekiyordu. Bu sayfa yalnızca geliştirmede açılır, üretimde 404
 * döner — dışarıya sızacak bir yüzey bırakmıyor.
 */
export default function OnizlemePage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <OnizlemeIcerik />
}
