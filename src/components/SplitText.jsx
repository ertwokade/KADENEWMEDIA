import { useEffect, useRef } from 'react'
import './SplitText.css'

export default function SplitText({
  text,
  by = 'char',
  delay = 0,
  stagger = 40,
  className = '',
  as: Tag = 'span',
  once = true,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('split-text--visible')
            if (once) io.unobserve(el)
          } else if (!once) {
            el.classList.remove('split-text--visible')
          }
        })
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once])

  const units = by === 'word'
    ? text.split(/(\s+)/)
    : [...text]

  void Tag
  return (
    <Tag ref={ref} className={`split-text ${className}`} aria-label={text}>
      {units.map((u, i) => {
        if (/^\s+$/.test(u)) return <span key={i} className="split-text__space">{u}</span>
        return (
          <span
            key={i}
            className="split-text__unit"
            style={{ transitionDelay: `${delay + i * stagger}ms` }}
            aria-hidden="true"
          >
            <span className="split-text__inner">{u}</span>
          </span>
        )
      })}
    </Tag>
  )
}
