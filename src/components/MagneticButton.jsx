import { useRef, useCallback } from 'react'

export default function MagneticButton({
  as: Tag = 'button',
  strength = 0.28,
  children,
  className = '',
  ...rest
}) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`
    const inner = el.querySelector('.magnetic__inner')
    if (inner) {
      inner.style.transform = `translate3d(${x * strength * 0.5}px, ${y * strength * 0.5}px, 0)`
    }
  }, [strength])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
    const inner = el.querySelector('.magnetic__inner')
    if (inner) inner.style.transform = ''
  }, [])

  return (
    <Tag
      ref={ref}
      className={`magnetic ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      <span className="magnetic__inner">{children}</span>
    </Tag>
  )
}
