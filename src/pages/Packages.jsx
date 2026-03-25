import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineStar,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Packages.css'

export default function Packages() {
  const { lang, t } = useLanguage()
  const isEN = lang === 'en'

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
      features: [
        t('packages.feat_4platform'), t('packages.feat_40content'), t('packages.feat_proDesign'),
        t('packages.feat_weeklyReport'), t('packages.feat_community'), t('packages.feat_calendar'),
        t('packages.feat_basicAds'), t('packages.feat_4reels'), t('packages.feat_competitorAnalysis'),
      ],
      notIncluded: [t('packages.feat_influencerMarketing')],
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
            {packages.map((pkg) => (
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
                    
                    {pkg.tier === 'starter' ? (
                      <>
                        {/* Show price for Başlangıç */}
                        <div className="package-price">
                          <span className="currency">{isEN ? '$' : '₺'}</span>
                          <span className="amount">{isEN ? pkg.priceUSD : pkg.priceTRY}</span>
                          <span className="period">{t('packages.month')}</span>
                        </div>
                        <div className="package-price-alt">
                          ≈ {isEN ? `₺${pkg.priceTRY}` : `$${pkg.priceUSD}`} {t('packages.month')}
                        </div>
                      </>
                    ) : pkg.tier === 'enterprise' ? (
                      <>
                        {/* Show price for Kurumsal */}
                        <div className="package-price">
                          <span className="currency">{isEN ? '$' : '₺'}</span>
                          <span className="amount">{isEN ? t('packages.enterprisePriceUSD') : t('packages.enterprisePrice')}</span>
                          <span className="period">{t('packages.month')}</span>
                        </div>
                        <div className="package-price-note">
                          {t('packages.enterprisePriceNote')}
                        </div>
                      </>
                    ) : (
                      /* Discovery call CTA for Pro */
                      <div className="package-discovery">
                        <Link to="/iletisim" className="btn btn-primary package-discovery-btn">
                          {t('packages.discoveryCall')}
                          <HiOutlineArrowRight size={16} />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="package-features">
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
                  </div>

                  <Link
                    to="/iletisim"
                    className={`btn ${pkg.popular ? 'btn-primary' : 'btn-outline'} package-btn`}
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
