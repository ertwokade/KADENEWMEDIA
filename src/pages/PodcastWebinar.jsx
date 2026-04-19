import { Link } from 'react-router-dom'
import { HiOutlineMicrophone, HiOutlineVideoCamera, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tools.css'

const items = [
  { type: 'Webinar', title: '2026 Sosyal Medya Stratejisi', date: '30 Nisan 2026', icon: HiOutlineVideoCamera },
  { type: 'Podcast', title: 'Ajansla Çalışırken Brief Nasıl Verilir?', date: 'Yayında', icon: HiOutlineMicrophone },
  { type: 'Webinar', title: 'Meta Ads Bütçe Planlama Atölyesi', date: '14 Mayıs 2026', icon: HiOutlineVideoCamera },
]

export default function PodcastWebinar() {
  useSEO({
    title: 'Podcast & Webinar | Kade Media',
    description: 'Sosyal medya, reklam ve içerik üretimi üzerine Kade Media podcast ve webinar arşivi.',
    path: '/podcast-webinar',
  })

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineMicrophone size={14} /> Podcast & Webinar</div>
            <h1 className="section-title">Ajans bilgisini <span>açık kaynak</span> paylaşıyoruz</h1>
            <p className="section-subtitle">Webinar, canlı yayın ve podcast içerikleriyle markaların dijital ekiplerine pratik rehberler.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="services-grid" staggerDelay={0.12}>
            {items.map(item => (
              <StaggerItem key={item.title}>
                <div className="tool-card glass-card">
                  <item.icon size={28} style={{ color: 'var(--primary)' }} />
                  <p className="tool-muted">{item.type} · {item.date}</p>
                  <h3>{item.title}</h3>
                  <Link to="/iletisim" className="btn btn-outline">Katılım bilgisi al <HiOutlineArrowRight size={16} /></Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
