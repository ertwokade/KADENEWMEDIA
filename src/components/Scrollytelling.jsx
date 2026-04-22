import { useEffect, useRef, useState } from 'react'
import './Scrollytelling.css'

const DEFAULT_CHAPTERS = [
  {
    metric: '+312%',
    label: 'Etkileşim artışı',
    title: 'Flavora — 30 günde sosyal medya dönüşümü',
    desc: 'Kitle segmentasyonu ve yeniden marka sesiyle kısa videoda etkileşim 3 kattan fazla arttı.',
    color: '#eac321',
  },
  {
    metric: '4.7x',
    label: 'ROAS',
    title: 'TechVibe — reklam verimliliği',
    desc: 'Google & Meta kampanyalarını tek funnel\'a bağladık; tıklama başı maliyet %48 düştü.',
    color: '#6C63FF',
  },
  {
    metric: '+100K',
    label: 'İlk ay kullanıcı',
    title: 'GreenLife — lansman kampanyası',
    desc: 'İçerik + influencer iş birliği ile 30 gün içinde 100.000 yeni kullanıcıya ulaştık.',
    color: '#2ECC71',
  },
]

export default function Scrollytelling({ chapters = DEFAULT_CHAPTERS }) {
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)
  const chapterRefs = useRef([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.dataset.idx)
            setActive(idx)
          }
        })
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )

    chapterRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const current = chapters[active] || chapters[0]

  return (
    <div ref={wrapRef} className="scrolly">
      <div className="scrolly__sticky">
        <div
          className="scrolly__visual"
          style={{ '--accent': current.color }}
          key={active}
        >
          <div className="scrolly__metric">{current.metric}</div>
          <div className="scrolly__metric-label">{current.label}</div>
          <div className="scrolly__rings" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div className="scrolly__dots">
            {chapters.map((_, i) => (
              <span
                key={i}
                className={`scrolly__dot ${i === active ? 'scrolly__dot--active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="scrolly__chapters">
        {chapters.map((c, i) => (
          <section
            key={i}
            data-idx={i}
            ref={(el) => (chapterRefs.current[i] = el)}
            className={`scrolly__chapter ${i === active ? 'scrolly__chapter--active' : ''}`}
          >
            <span className="scrolly__num">0{i + 1}</span>
            <h3 className="scrolly__title">{c.title}</h3>
            <p className="scrolly__desc">{c.desc}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
