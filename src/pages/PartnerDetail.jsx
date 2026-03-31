import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineBadgeCheck, HiOutlineChartBar } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { partnersData as staticPartners } from '../data/content'
import { getPartnersApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Partners.css'

export default function PartnerDetail() {
  const { id } = useParams()
  const { lang, t } = useLanguage()
  const [partner, setPartner] = useState(() => staticPartners.find((p) => p.id === id))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const data = await getPartnersApi()
        if (Array.isArray(data) && data.length > 0) {
          const found = data.find((p) => p.id === id)
          if (found) {
            setPartner(found)
          } else if (!partner) {
            setNotFound(true)
          }
        }
      } catch {
        if (!partner) setNotFound(true)
      }
    }
    fetchPartner()
  }, [id])

  if (notFound) return <Navigate to="/partnerler" replace />
  if (!partner) return null

  const desc = lang === 'tr' ? partner.longDescTr : partner.longDescEn
  const services = (lang === 'tr' ? partner.servicesTr : partner.servicesEn) || []
  const results = (lang === 'tr' ? partner.resultsTr : partner.resultsEn) || []
  const category = lang === 'tr' ? partner.category : partner.categoryEn

  return (
    <PageTransition>
      <section className="partner-detail-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-100px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <Link to="/partnerler" className="partner-back">
              {t('partners.backToPartners')}
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="partner-detail-header">
              <div
                className="partner-detail-logo"
                style={{ background: `${partner.color}15`, borderColor: `${partner.color}30` }}
              >
                {partner.logo}
              </div>
              <div>
                <h1>{partner.name}</h1>
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

      <section className="section">
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
        </div>
      </section>
    </PageTransition>
  )
}
