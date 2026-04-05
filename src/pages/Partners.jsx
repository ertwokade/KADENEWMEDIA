import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineArrowRight, HiOutlineOfficeBuilding } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { partnersData as staticPartners } from '../data/content'
import { getPartnersApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import PageHeroCanvas from '../components/PageHeroCanvas'
import './Partners.css'

export default function Partners() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Referanslarımız | Partner Markalar',
    description: 'Kade Media\'nın çalıştığı markalar ve referanslar. Sosyal medya yönetimi ve dijital pazarlama alanında başarıyla hizmet verdiğimiz partnerlerimiz.',
    keywords: 'kade media referanslar, sosyal medya ajansı müşterileri, dijital pazarlama partner markalar',
    path: '/partnerler',
  })
  const [partnersData, setPartnersData] = useState(staticPartners)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await getPartnersApi()
        if (data && data.length > 0) {
          setPartnersData(data)
        }
      } catch {
        // static data fallback
      }
    }
    fetchPartners()
  }, [])

  return (
    <PageTransition>
      <PageHeroCanvas type="partners" />
      <section className="partners-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineOfficeBuilding size={14} />
              {t('partnersSection.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('partners.heroTitle')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">{t('partners.heroSubtitle')}</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="partners-grid" staggerDelay={0.1}>
            {partnersData.map((partner, idx) => (
              <StaggerItem key={partner.id || partner._id || idx}>
                <Link to={`/partnerler/${partner.id}`}>
                  <motion.div
                    className="partner-card glass-card"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="partner-logo-large" style={{ background: `${partner.color}15`, borderColor: `${partner.color}30` }}>
                      <span style={{ fontSize: '2.5rem' }}>{partner.logo}</span>
                    </div>
                    <div className="partner-card-info">
                      <span className="partner-category" style={{ color: partner.color }}>
                        {lang === 'tr' ? partner.category : partner.categoryEn}
                      </span>
                      <h3>{partner.name}</h3>
                      <p>{lang === 'tr' ? partner.descTr : partner.descEn}</p>
                    </div>
                    <div className="partner-card-arrow">
                      <HiOutlineArrowRight size={18} />
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
