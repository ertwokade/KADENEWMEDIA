import { notFound } from 'next/navigation'
import OnizlemeIcerik from './OnizlemeIcerik'

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
