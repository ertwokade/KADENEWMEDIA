import { useEffect, useState } from 'react'
import { HiOutlineMailOpen } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tools.css'

const FALLBACK = [
  { title: 'Nisan 2026 Sosyal Medya Trendleri', date: '12 Nisan 2026', desc: 'Reels dağıtımı, TikTok arama ve LinkedIn carousel performansı.' },
  { title: 'KOBİler için reklam bütçesi rehberi', date: '29 Mart 2026', desc: 'Meta ve Google Ads bütçesini ilk 90 gün nasıl bölüştürmeli?' },
  { title: 'İçerik takvimi örnekleri', date: '15 Mart 2026', desc: 'Restoran, klinik ve e-ticaret markaları için örnek yayın planları.' },
]

export default function NewsletterArchive() {
  const [items, setItems] = useState(FALLBACK)

  useSEO({
    title: 'Bülten Arşivi | Kade Media',
    description: 'Kade Media newsletter arşivi: sosyal medya trendleri, reklam rehberleri ve içerik pazarlama notları.',
    path: '/bulten-arsivi',
  })

  useEffect(() => {
    getContentApi('newsletterArchive')
      .then(res => {
        const data = res?.data || res
        if (Array.isArray(data?.items) && data.items.length) setItems(data.items)
      })
      .catch(() => {})
  }, [])

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineMailOpen size={14} /> Bülten Arşivi</div>
            <h1 className="section-title">Gönderdiğimiz <span>en iyi notlar</span> burada</h1>
            <p className="section-subtitle">Newsletter içeriklerini public arşive taşıyarak SEO ve otorite etkisini artırıyoruz.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="faq-grid" staggerDelay={0.1}>
            {items.map((item, i) => (
              <StaggerItem key={i}>
                <article className="tool-card glass-card">
                  <p className="tool-muted">{item.date}</p>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
