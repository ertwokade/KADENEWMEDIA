import { useEffect, useRef } from 'react'

/**
 * Giriş ekranlarındaki vurgu parıltısını imlece bağlar.
 *
 * Sitenin gövdesinde aynı etki `kade-site.js` içinde `--pointer-x/--pointer-y`
 * yazılarak yapılıyor; React tarafındaki giriş ekranları o script'i yüklemediği
 * için karşılığı burada duruyor. Değerler kapsayıcıya yazılır, `document`e
 * değil — böylece etki giriş ekranından çıkınca kendiliğinden biter.
 *
 * Dokunmatik cihazlarda imleç yok: orada hiç bağlanmaz, boşuna dinleyici
 * ve boşuna reflow olmasın.
 */
export function useGatePointer() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return undefined

    let frame = 0
    const onMove = (event) => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const { width, height, left, top } = node.getBoundingClientRect()
        node.style.setProperty('--pointer-x', `${((event.clientX - left) / width) * 100}%`)
        node.style.setProperty('--pointer-y', `${((event.clientY - top) / height) * 100}%`)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}
