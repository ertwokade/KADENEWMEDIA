'use client'

import { SiriWave } from '@/components/ui/siri-wave'

/**
 * Asistanın "düşünüyor" küresi.
 *
 * SiriWave shader'ı tam spektrum (spectral4 / hue2rgb) çalışıyor; panelde
 * tek altın rengi kullandığımız için olduğu gibi bırakılınca başka bir ürüne
 * ait gibi duruyordu. Shader'a dokunmak yerine tuvali grileştirip üstüne
 * altın bir katman çarpıyoruz: hareket aynı kalıyor, renk bizim oluyor.
 */
export default function KadeOrb({ size = 72 }: { size?: number }) {
  return (
    <span
      className="kade-orb"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Asistan düşünüyor"
    >
      <SiriWave variant="wave" size={size} renderScale={0.6} className="kade-orb-canvas" />
      <span className="kade-orb-tint" aria-hidden="true" />
    </span>
  )
}
