import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineSparkles, HiOutlineChartBar } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getPartnersApi } from '../api'
import { BreadcrumbSchema } from '../components/StructuredData'
import { analytics } from '../utils/analytics'
import { isImageSource, toBadgeText } from '../utils/mediaValue'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import NotFound from './NotFound'
import './Partners.css'

export default function PartnerDetail() {
  const { id: slug } = useParams()
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getPartnersApi()
      .then(data => {
        if (cancelled) return
        const found = Array.isArray(data) ? data.find(p => p.slug === slug) : null
        setPartner(found || null)
        if (found) analytics.caseStudyView(found.name)
      })
      .catch(() => { if (!cancelled) setPartner(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  const name = partner?.name || ''
  const desc = partner ? (isEN ? (partner.longDescEn || partner.descEn || partner.longDescTr || partner.descTr) : (partner.longDescTr || partner.descTr)) : ''
  const services = partner ? (isEN ? (partner.servicesEn?.length ? partner.servicesEn : partner.servicesTr) : partner.servicesTr) || [] : []
  const results = partner ? (isEN ? (partner.resultsEn?.length ? partner.resultsEn : partner.resultsTr) : partner.resultsTr) || [] : []
  const category = partner ? (isEN ? (partner.categoryEn || partner.category) : partner.category) : ''

  useSEO({
    title: partner ? `${name} | Kade New Media` : 'Partnerler | Kade New Media',
    description: desc || undefined,
    path: `/partnerler/${slug}`,
    noindex: !partner,
  })

  if (loading) return <PageTransition><section className="section"><div className="container" /></section></PageTransition>
  if (!partner) return <NotFound />

  return (
    <PageTransition>
      <BreadcrumbSchema items={[{ name: isEN ? 'Partners' : 'Partnerler', path: '/partnerler' }, { name, path: `/partnerler/${slug}` }]} />

      <section className="partner-detail-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <Link to="/partnerler" className="partner-back">
              <HiOutlineArrowLeft size={14} /> {isEN ? 'All partners' : 'Tüm partnerler'}
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="partner-detail-header">
              {/* `logo` alanı hem görsel URL'si hem emoji tutabiliyor; emoji
                  <img src> olarak verilince tarayıcı göreli yol sanıp 404
                  isteği atıyordu. Ayrım isImageSource() ile yapılır. */}
              <div className="partner-detail-logo" style={{ borderColor: partner.color || 'var(--border-color)', background: `${partner.color || '#eac321'}15` }}>
                {isImageSource(partner.logo)
                  ? <img src={partner.logo} alt={name} loading="lazy" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                  : <span aria-hidden="true">{toBadgeText(partner.logo, name)}</span>}
              </div>
              <div>
                {category && <div className="partner-detail-category" style={{ color: partner.color || 'var(--primary)' }}>{category}</div>}
                <h1>{name}</h1>
              </div>
            </div>
          </FadeIn>
          {desc && <FadeIn delay={0.2}><p className="partner-detail-desc">{desc}</p></FadeIn>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="partner-detail-grid">
            {services.length > 0 && (
              <FadeIn>
                <div className="partner-detail-section glass-card">
                  <h3><HiOutlineSparkles size={18} /> {isEN ? 'Services' : 'Hizmetler'}</h3>
                  <div className="partner-service-tags">
                    {services.map((s, i) => <span key={i} className="partner-service-tag">{s}</span>)}
                  </div>
                </div>
              </FadeIn>
            )}
            {results.length > 0 && (
              <FadeIn delay={0.1}>
                <div className="partner-detail-section glass-card">
                  <h3><HiOutlineChartBar size={18} /> {isEN ? 'Results' : 'Sonuçlar'}</h3>
                  <div className="partner-results">
                    {results.map((r, i) => <div key={i} className="partner-result">{r}</div>)}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      <section className="section"><div className="container"><div className="portfolio-cta glass-card"><h2>{isEN ? 'Partnership inquiries' : 'İş ortaklığı görüşmeleri'}</h2><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
