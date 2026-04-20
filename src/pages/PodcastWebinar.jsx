import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineMicrophone, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tools.css'

const DEFAULT_CONTENT = {
  heroBadge: 'Podcast & Webinar',
  heroTitleBefore: 'Ajans bilgisini',
  heroTitleHighlight: 'açık kaynak',
  heroTitleAfter: ' paylaşıyoruz',
  heroSubtitle: 'Webinar, canlı yayın ve podcast içerikleriyle markaların dijital ekiplerine pratik rehberler.',
  ctaLabel: 'Katılım bilgisi al',
  ctaLink: '/iletisim',
  items: [
    { type: 'Webinar', title: '2026 Sosyal Medya Stratejisi', date: '30 Nisan 2026', ikon: '🎥' },
    { type: 'Podcast', title: 'Ajansla Çalışırken Brief Nasıl Verilir?', date: 'Yayında', ikon: '🎙️' },
    { type: 'Webinar', title: 'Meta Ads Bütçe Planlama Atölyesi', date: '14 Mayıs 2026', ikon: '🎥' },
  ],
}

export default function PodcastWebinar() {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useSEO({
    title: 'Podcast & Webinar | Kade Media',
    description: 'Sosyal medya, reklam ve içerik üretimi üzerine Kade Media podcast ve webinar arşivi.',
    path: '/podcast-webinar',
  })

  useEffect(() => {
    let cancelled = false
    getContentApi('podcastWebinar')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setContent(prev => ({
            ...prev,
            ...data,
            items: Array.isArray(data.items) && data.items.length ? data.items : prev.items,
          }))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const isExternal = /^https?:\/\//.test(content.ctaLink || '')

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineMicrophone size={14} /> {content.heroBadge}</div>
            <h1 className="section-title">
              {content.heroTitleBefore} <span>{content.heroTitleHighlight}</span>{content.heroTitleAfter}
            </h1>
            <p className="section-subtitle">{content.heroSubtitle}</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="services-grid" staggerDelay={0.12}>
            {content.items.map((item, i) => (
              <StaggerItem key={`${item.title}-${i}`}>
                <div className="tool-card glass-card">
                  <span style={{ fontSize: '1.8rem' }}>{item.ikon || '🎥'}</span>
                  <p className="tool-muted">{item.type} · {item.date}</p>
                  <h3>{item.title}</h3>
                  {isExternal ? (
                    <a href={content.ctaLink} target="_blank" rel="noreferrer" className="btn btn-outline">
                      {content.ctaLabel} <HiOutlineArrowRight size={16} />
                    </a>
                  ) : (
                    <Link to={content.ctaLink} className="btn btn-outline">
                      {content.ctaLabel} <HiOutlineArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
