import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineStar,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { getContentApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import { analytics } from '../utils/analytics'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Packages.css'

export default function Packages() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Paketler & Fiyatlar | Sosyal Medya Hizmet Paketleri',
    description: 'Kade Media sosyal medya yönetim paketleri. Starter, Growth ve Pro paketlerimizle uygun fiyata profesyonel dijital pazarlama hizmeti alın.',
    keywords: 'sosyal medya paketleri, sosyal medya fiyatları, instagram yönetim paketi, dijital pazarlama fiyatları, sosyal medya yönetim ücreti',
    path: '/paketler',
  })
  const isEN = lang === 'en'

  const [dynamicItems, setDynamicItems] = useState(null)

  useEffect(() => {
    getContentApi('packages')
      .then(res => {
        if (res?.data?.items?.length) setDynamicItems(res.data.items)
      })
      .catch(() => {})
  }, [])

  const dynamicPackages = dynamicItems
    ? dynamicItems.map(item => ({
        name: isEN ? item.nameEn : item.nameTr,
        tier: (item.nameTr || item.nameEn || '').toLowerCase().replace(/\s+/g, '-'),
        priceTRY: item.priceTRY,
        priceUSD: item.priceUSD,
        desc: isEN ? item.descEn : item.descTr,
        popular: !!item.popular,
        features: ((isEN ? item.featuresEn : item.featuresTr) || '').split(',').map(f => f.trim()).filter(Boolean),
        notIncluded: [],
      }))
    : null

  const packages = [
    {
      name: t('packages.starter'),
      tier: 'starter',
      priceTRY: '7.500',
      priceUSD: '220',
      desc: t('packages.starterDesc'),
      popular: false,
      features: [
        t('packages.feat_2platform'), t('packages.feat_20content'), t('packages.feat_basicDesign'),
        t('packages.feat_monthlyReport'), t('packages.feat_community'), t('packages.feat_calendar'),
      ],
      notIncluded: [
        t('packages.feat_adManagement'), t('packages.feat_videoContent'), t('packages.feat_influencerMarketing'),
      ],
    },
    {
      name: t('packages.pro'),
      tier: 'pro',
      priceTRY: '15.000',
      priceUSD: '440',
      desc: t('packages.proDesc'),
      popular: true,
      features: [],
      notIncluded: [],
      isCustom: true,
    },
    {
      name: t('packages.enterprise'),
      tier: 'enterprise',
      priceTRY: '30.000',
      priceUSD: '880',
      desc: t('packages.enterpriseDesc'),
      popular: false,
      features: [
        t('packages.feat_allPlatforms'), t('packages.feat_unlimitedContent'), t('packages.feat_premiumDesign'),
        t('packages.feat_instantReport'), t('packages.feat_community'), t('packages.feat_calendar'),
        t('packages.feat_advancedAds'), t('packages.feat_12reels'), t('packages.feat_competitorAnalysis'),
        t('packages.feat_influencerMarketing'), t('packages.feat_crisisManagement'), t('packages.feat_strategist'),
      ],
      notIncluded: [],
    },
  ]

  const faqs = [
    { q: t('packages.faq1q'), a: t('packages.faq1a') },
    { q: t('packages.faq2q'), a: t('packages.faq2a') },
    { q: t('packages.faq3q'), a: t('packages.faq3a') },
    { q: t('packages.faq4q'), a: t('packages.faq4a') },
  ]

  return (
    <PageTransition>
      {/* Hero */}
      <section className="packages-hero">
        <PageBgAnimation type="packages" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineSparkles size={14} />
              {t('packages.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('packages.title')} <span>{t('packages.titleHighlight')}</span> {t('packages.titleEnd')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('packages.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section">
        <div className="container">
          <StaggerContainer className="packages-grid" staggerDelay={0.15}>
            {(dynamicPackages || packages).map((pkg) => (
              <StaggerItem key={pkg.name}>
                <motion.div
                  className={`package-card glass-card ${pkg.popular ? 'popular' : ''}`}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {pkg.popular && (
                    <div className="popular-badge">
                      <HiOutlineStar size={14} />
                      {t('packages.popular')}
                    </div>
                  )}
                  <div className="package-header">
                    <h3>{pkg.name}</h3>
                    <p className="package-desc">{pkg.desc}</p>
                    
                    {pkg.tier === 'pro' ? (
                      <div className="package-discovery">
                        <Link to="/iletisim" className="btn btn-primary package-discovery-btn">
                          {t('packages.discoveryCall')}
                          <HiOutlineArrowRight size={16} />
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="package-price">
                          <span className="currency">{isEN ? '$' : '₺'}</span>
                          <span className="amount">{isEN ? pkg.priceUSD : pkg.priceTRY}</span>
                          <span className="period">{t('packages.month')}</span>
                        </div>
                        <div className="package-price-alt">
                          ≈ {isEN ? `₺${pkg.priceTRY}` : `$${pkg.priceUSD}`} {t('packages.month')}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="package-features">
                    {pkg.isCustom ? (
                      <div className="custom-package-info">
                        <p>{t('packages.proCustomDesc')}</p>
                      </div>
                    ) : (
                      <>
                        {pkg.features.map((feature) => (
                          <div key={feature} className="feature-item included">
                            <HiOutlineCheck size={16} />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {pkg.notIncluded.map((feature) => (
                          <div key={feature} className="feature-item not-included">
                            <span className="dash">—</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <Link
                    to="/iletisim"
                    className={`btn ${pkg.popular ? 'btn-primary' : 'btn-outline'} package-btn`}
                    onClick={() => analytics.packageClick(pkg.name)}
                  >
                    {pkg.tier === 'starter' ? t('packages.startNow') : t('packages.discoveryCall')}
                    <HiOutlineArrowRight size={16} />
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">
                {t('packages.faqTitle')} <span>{t('packages.faqHighlight')}</span>
              </h2>
            </FadeIn>
          </div>

          <StaggerContainer className="faq-grid" staggerDelay={0.1}>
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <div className="faq-card glass-card">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
