import { createElement, useEffect, useRef } from 'react'
import './SectionHeading.css'

export default function SectionHeading({
  eyebrow,
  number,
  children,
  align = 'left',
  as: Tag = 'h2',
  className = '',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('section-heading--visible')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`section-heading section-heading--${align} ${className}`}
    >
      {number && <span className="section-heading__number" aria-hidden="true">{number}</span>}
      {eyebrow && (
        <span className="section-heading__eyebrow">
          <span className="section-heading__stroke" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      {createElement(Tag, { className: 'section-heading__title' }, children)}
    </div>
  )
}
