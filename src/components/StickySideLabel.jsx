import { useEffect, useState } from 'react'
import './StickySideLabel.css'

export default function StickySideLabel({ sections = [] }) {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sections.length) return

    const pick = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.3
      const elems = sections
        .map((s) => ({ id: s.id, el: document.getElementById(s.id) }))
        .filter((x) => x.el)

      let idx = 0
      elems.forEach((x, i) => {
        if (x.el.offsetTop <= scrollY) idx = i
      })
      setActive(idx)
      setVisible(window.scrollY > window.innerHeight * 0.4)
    }

    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [sections])

  if (!sections.length) return null

  const current = sections[active]

  return (
    <aside
      className={`side-label ${visible ? 'side-label--visible' : ''}`}
      aria-hidden={!visible}
    >
      <span className="side-label__num">{String(active + 1).padStart(2, '0')}</span>
      <span className="side-label__bar" />
      <span className="side-label__text">{current?.label || ''}</span>
    </aside>
  )
}
