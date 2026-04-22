import { useEffect, useRef } from 'react'
import './Underline.css'

export default function Underline({ children, variant = 'curve', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('underline-word--draw')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const path = variant === 'straight'
    ? 'M 2 10 L 298 10'
    : variant === 'double'
      ? 'M 2 8 Q 150 2 298 8 M 4 16 Q 150 12 296 14'
      : 'M 2 14 Q 80 2 150 10 T 298 8'

  return (
    <span ref={ref} className={`underline-word underline-word--${variant} ${className}`}>
      <span className="underline-word__text">{children}</span>
      <svg
        className="underline-word__svg"
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </span>
  )
}
