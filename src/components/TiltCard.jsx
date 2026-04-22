import { useCallback, useRef } from 'react'
import './TiltCard.css'

export default function TiltCard({
  children,
  max = 8,
  glare = true,
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rx = (0.5 - y) * max
    const ry = (x - 0.5) * max
    el.style.setProperty('--tilt-rx', `${rx}deg`)
    el.style.setProperty('--tilt-ry', `${ry}deg`)
    el.style.setProperty('--glare-x', `${x * 100}%`)
    el.style.setProperty('--glare-y', `${y * 100}%`)
  }, [max])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-rx', '0deg')
    el.style.setProperty('--tilt-ry', '0deg')
  }, [])

  return (
    <Tag
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      <div className="tilt-card__inner">
        {children}
        {glare && <div className="tilt-card__glare" aria-hidden="true" />}
      </div>
    </Tag>
  )
}
