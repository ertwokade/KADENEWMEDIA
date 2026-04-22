import { useCallback, useRef, useState } from 'react'
import './BeforeAfter.css'

export default function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Önce',
  afterLabel = 'Sonra',
  alt = '',
  className = '',
}) {
  const [pos, setPos] = useState(50)
  const wrapRef = useRef(null)
  const draggingRef = useRef(false)

  const update = useCallback((clientX) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, p)))
  }, [])

  const onDown = (e) => {
    draggingRef.current = true
    const x = e.touches ? e.touches[0].clientX : e.clientX
    update(x)
  }

  const onMove = (e) => {
    if (!draggingRef.current) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    update(x)
  }

  const onUp = () => { draggingRef.current = false }

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4))
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4))
  }

  return (
    <div
      ref={wrapRef}
      className={`ba ${className}`}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      <img src={afterSrc} alt={`${alt} — ${afterLabel}`} className="ba__img" draggable="false" />
      <div className="ba__before" style={{ width: `${pos}%` }}>
        <img src={beforeSrc} alt={`${alt} — ${beforeLabel}`} className="ba__img" draggable="false" />
      </div>

      <span className="ba__tag ba__tag--before">{beforeLabel}</span>
      <span className="ba__tag ba__tag--after">{afterLabel}</span>

      <div
        className="ba__handle"
        style={{ left: `${pos}%` }}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-label="Önce/Sonra karşılaştırması"
        onKeyDown={onKey}
      >
        <div className="ba__handle-line" />
        <div className="ba__handle-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M8 6L2 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
