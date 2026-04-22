import { useEffect, useRef, useState } from 'react'
import './ProcessTimeline.css'

const DEFAULT_STEPS = [
  { title: 'Brief', desc: 'Hedeflerinizi ve markanızı dinliyoruz. Rakipleri, kitleyi ve mevcut verinizi analiz ediyoruz.' },
  { title: 'Strateji', desc: 'Mesaj mimarisi, kanal dağılımı, içerik takvimi ve KPI setini netleştiriyoruz.' },
  { title: 'Üretim', desc: 'Tasarım, video prodüksiyon ve copy ekipleri içeriği ortaya çıkarıyor.' },
  { title: 'Lansman', desc: 'Organik + reklam yayını. A/B testi ile iyileştirmeye başlıyoruz.' },
  { title: 'Ölçüm', desc: 'Haftalık raporlarla dönüşüm, etkileşim ve bütçe verimliliğini optimize ediyoruz.' },
]

export default function ProcessTimeline({ steps = DEFAULT_STEPS }) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const bar = progressRef.current
    if (!wrap || !bar) return

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height - vh * 0.6
      const scrolled = Math.max(0, Math.min(total, -rect.top + vh * 0.3))
      const pct = total > 0 ? (scrolled / total) * 100 : 0
      bar.style.setProperty('--progress', `${pct}%`)
      const idx = Math.min(steps.length - 1, Math.floor((pct / 100) * steps.length))
      setActiveIndex(pct > 2 ? idx : -1)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [steps.length])

  return (
    <div ref={wrapRef} className="process-timeline">
      <div className="process-timeline__line">
        <div ref={progressRef} className="process-timeline__progress" />
      </div>
      <ol className="process-timeline__list">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`process-timeline__step ${i <= activeIndex ? 'process-timeline__step--active' : ''}`}
          >
            <div className="process-timeline__node">
              <span className="process-timeline__num">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="process-timeline__body">
              <h3 className="process-timeline__title">{s.title}</h3>
              <p className="process-timeline__desc">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
