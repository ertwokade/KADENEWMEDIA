import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineBadgeCheck,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlineLightningBolt,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { partnersData as staticPartners } from '../data/content'
import { getPartnersApi } from '../api'
import { analytics } from '../utils/analytics'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Partners.css'

export default function PartnerDetail() {
  const { id } = useParams()
  const { lang, t } = useLanguage()

  // Try to find in static data first
  const staticPartner = staticPartners.find((p) => p.id === id || p.slug === id) || null
  const [partner, setPartner] = useState(staticPartner)
  // If not found in static, we need to wait for API before deciding to redirect
  const [apiLoading, setApiLoading] = useState(!staticPartner)

  useEffect(() => {
    getPartnersApi()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const found = data.find((p) =>
            p.id === id || p.slug === id || String(p._id) === id
          )
          if (found) setPartner(found)
        }
      })
      .catch(() => {})
      .finally(() => setApiLoading(false))
  }, [id])

  useEffect(() => {
    if (partner) analytics.caseStudyView(partner.name)
  }, [partner])

  const name = partner?.name || ''
  const desc = partner ? (lang === 'tr' ? partner.longDescTr : partner.longDescEn) : ''
  const shortDesc = partner ? (lang === 'tr' ? partner.descTr : partner.descEn) : ''
  const services = partner ? ((lang === 'tr' ? partner.servicesTr : partner.servicesEn) || []) : []
  const results = partner ? ((lang === 'tr' ? partner.resultsTr : partner.resultsEn) || []) : []
  const category = partner ? (lang === 'tr' ? partner.category : partner.categoryEn) : ''

  const metaTitle = name ? `${name} Vaka Çalışması | Kade Media` : 'Partner | Kade Media'
  const metaDesc = shortDesc || (name ? `${name} için gerçekleştirdiğimiz dijital pazarlama çalışması ve elde ettiğimiz sonuçlar.` : '')

  useSEO({ title: metaTitle, description: metaDesc, path: `/partnerler/${id}` })

  // While API is loading and no static data found, show loading
  if (apiLoading) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!partner) return <Navigate to="/partnerler" replace />

  return (
    <PageTransition>
      {/* Hero */}
      <section className="partner-detail-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-100px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <Link to="/partnerler" className="partner-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineArrowLeft size={16} />
              {t('partners.backToPartners')}
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="partner-detail-header">
              <div
                className="partner-detail-logo"
                style={{ background: `${partner.color}15`, borderColor: `${partner.color}30` }}
                aria-label={`${name} logosu`}
              >
                {partner.logo && (partner.logo.startsWith('data:') || partner.logo.startsWith('http'))
                  ? <img src={partner.logo} alt={name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: 8 }} />
                  : <span style={{ fontSize: '2.5rem' }}>{partner.logo}</span>
                }
              </div>
              <div>
                <div className="section-badge" style={{ justifyContent: 'flex-start', marginBottom: 8 }}>
                  <HiOutlineLightningBolt size={12} />
                  Vaka Çalışması
                </div>
                <h1>{name}</h1>
                <span className="partner-detail-category" style={{ color: partner.color }}>
                  {category}
                </span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="partner-detail-desc">{desc}</p>
          </FadeIn>
        </div>
      </section>

      {/* Results KPIs */}
      {results.length > 0 && (
        <section className="section" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="container">
            <FadeIn>
              <StaggerContainer className="partner-kpi-grid" staggerDelay={0.1}>
                {results.map((r, i) => (
                  <StaggerItem key={i}>
                    <motion.div
                      className="partner-kpi-card glass-card"
                      whileHover={{ scale: 1.04, y: -3 }}
                      style={{ borderTop: `3px solid ${partner.color}` }}
                    >
                      <div className="partner-kpi-value" style={{ color: partner.color }}>{r.split(' ')[0] || r}</div>
                      <div className="partner-kpi-label">{r.split(' ').slice(1).join(' ') || ''}</div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Services + Results Detail */}
      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="partner-detail-grid">
            <FadeIn direction="left">
              <div className="partner-detail-section glass-card">
                <h3>
                  <HiOutlineBadgeCheck size={20} />
                  {t('partners.services')}
                </h3>
                <div className="partner-service-tags">
                  {services.map((s) => (
                    <span key={s} className="partner-service-tag">{s}</span>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="partner-detail-section glass-card">
                <h3>
                  <HiOutlineChartBar size={20} />
                  {t('partners.results')}
                </h3>
                <div className="partner-results">
                  {results.map((r) => (
                    <div key={r} className="partner-result">{r}</div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* CTA */}
          <FadeIn delay={0.3}>
            <div className="partner-cta-section glass-card" style={{ marginTop: 40, textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>🚀</div>
              <h3 style={{ color: 'var(--white)', fontSize: '1.4rem', marginBottom: 12 }}>
                {lang === 'tr' ? 'Markanız İçin Benzer Sonuçlar İstiyorsanız' : 'Want Similar Results for Your Brand?'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
                {lang === 'tr'
                  ? 'Ücretsiz keşif görüşmesiyle markanız için özel bir strateji hazırlayalım.'
                  : "Let's prepare a custom strategy for your brand with a free discovery call."}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/iletisim"
                  className="btn btn-primary"
                  onClick={() => analytics.ctaClick('case-study-cta', '/iletisim')}
                >
                  {lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Get a Free Consultation'}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/partnerler" className="btn btn-outline">
                  {lang === 'tr' ? 'Diğer Vaka Çalışmaları' : 'Other Case Studies'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
