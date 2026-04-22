import { useEffect, useRef } from 'react'
import './CursorSpotlight.css'

export default function CursorSpotlight() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const glowRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100, tx: -100, ty: -100 })
  const rafRef = useRef(null)

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    const onMove = (e) => {
      posRef.current.tx = e.clientX
      posRef.current.ty = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`
      }
    }

    const onOver = (e) => {
      const t = e.target
      if (!t || !t.closest) return
      const interactive = t.closest('a, button, [role="button"], input, textarea, select, .magnetic, [data-cursor="hover"]')
      if (interactive) {
        ringRef.current?.classList.add('cursor-ring--hover')
      } else {
        ringRef.current?.classList.remove('cursor-ring--hover')
      }
    }

    const tick = () => {
      const p = posRef.current
      p.x += (p.tx - p.x) * 0.18
      p.y += (p.ty - p.y) * 0.18
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${p.x - 18}px, ${p.y - 18}px, 0)`
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${p.x - 140}px, ${p.y - 140}px, 0)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
