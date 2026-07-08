import { useEffect, useRef } from 'react'

// Kade arrow cursor — lags behind the pointer, grows over interactive elements.
export default function KadeCursor() {
  const el = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const cur = { ...pos }
    let raf
    const onMove = (e) => { pos.x = e.clientX; pos.y = e.clientY }
    const loop = () => {
      cur.x += (pos.x - cur.x) * 0.2; cur.y += (pos.y - cur.y) * 0.2
      if (el.current) el.current.style.transform = `translate(${cur.x}px, ${cur.y}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const sel = 'a, button, [data-magnetic], input, textarea, select'
    const over = (e) => { if (e.target.closest(sel)) el.current?.classList.add('hover') }
    const out = (e) => { if (e.target.closest(sel)) el.current?.classList.remove('hover') }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerout', out)
    document.body.classList.add('kade-cursor-on')
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      document.body.classList.remove('kade-cursor-on')
    }
  }, [])
  return (
    <div ref={el} className="kade-cursor" aria-hidden>
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <path d="M9 6 L9 33 L16 26 L21 37 L26 35 L21 24 L31 24 Z" fill="#e0a81f" stroke="#17130a" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
