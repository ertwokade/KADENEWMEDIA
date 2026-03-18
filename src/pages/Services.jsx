import { motion } from 'framer-motion'
import {
  HiOutlineGlobe,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineCamera,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlinePencilAlt,
  HiOutlineSpeakerphone,
} from 'react-icons/hi'
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaLinkedinIn } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Services.css'

export default function Services() {
  const { t } = useLanguage()

  const services = [
    {
      icon: HiOutlineGlobe,
      title: t('services.smm'),
      desc: t('services.smmDesc'),
      features: [t('services.smmFeat1'), t('services.smmFeat2'), t('services.smmFeat3'), t('services.smmFeat4')],
      platforms: [FaInstagram, FaFacebookF, FaXTwitter, FaTiktok],
    },
    {
      icon: HiOutlinePencilAlt,
      title: t('services.contentTitle'),
      desc: t('services.contentDesc'),
      features: [t('services.contentFeat1'), t('services.contentFeat2'), t('services.contentFeat3'), t('services.contentFeat4')],
      platforms: [FaInstagram, FaTiktok, FaYoutube],
    },
    {
      icon: HiOutlineChartBar,
      title: t('services.adsTitle'),
      desc: t('services.adsDesc'),
      features: [t('services.adsFeat1'), t('services.adsFeat2'), t('services.adsFeat3'), t('services.adsFeat4')],
      platforms: [FaFacebookF, FaInstagram, FaTiktok],
    },
    {
      icon: HiOutlineSpeakerphone,
      title: t('services.influencerTitle'),
      desc: t('services.influencerDesc'),
      features: [t('services.influencerFeat1'), t('services.influencerFeat2'), t('services.influencerFeat3'), t('services.influencerFeat4')],
      platforms: [FaInstagram, FaYoutube, FaTiktok],
    },
    {
      icon: HiOutlineFilm,
      title: t('services.videoTitle'),
      desc: t('services.videoDesc'),
      features: [t('services.videoFeat1'), t('services.videoFeat2'), t('services.videoFeat3'), t('services.videoFeat4')],
      platforms: [FaInstagram, FaTiktok, FaYoutube],
    },
    {
      icon: HiOutlineChatAlt2,
      title: t('services.strategyTitle'),
      desc: t('services.strategyDesc'),
      features: [t('services.strategyFeat1'), t('services.strategyFeat2'), t('services.strategyFeat3'), t('services.strategyFeat4')],
      platforms: [FaLinkedinIn, FaInstagram, FaFacebookF],
    },
  ]

  const process = [
    { step: '01', title: t('services.processStep1'), desc: t('services.processStep1Desc') },
    { step: '02', title: t('services.processStep2'), desc: t('services.processStep2Desc') },
    { step: '03', title: t('services.processStep3'), desc: t('services.processStep3Desc') },
    { step: '04', title: t('services.processStep4'), desc: t('services.processStep4Desc') },
  ]

  return (
    <PageTransition>
      {/* Hero */}
      <section className="services-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineLightningBolt size={14} />
              {t('services.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('services.title')} <span>{t('services.titleHighlight')}</span> {t('services.titleEnd')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('services.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <StaggerContainer className="services-detail-grid" staggerDelay={0.1}>
            {services.map((service) => (
              <StaggerItem key={service.title}>
                <motion.div
                  className="service-detail-card glass-card"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="service-detail-header">
                    <div className="service-detail-icon">
                      <service.icon size={28} />
                    </div>
                    <h3>{service.title}</h3>
                  </div>
                  <p className="service-detail-desc">{service.desc}</p>
                  <div className="service-features">
                    {service.features.map((feature) => (
                      <span key={feature} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="service-platforms">
                    {service.platforms.map((Platform, i) => (
                      <span key={i} className="platform-tag">
                        <Platform size={14} />
                      </span>
                    ))}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Process */}
      <section className="section process-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineCamera size={14} />
                {t('services.processBadge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                {t('services.processTitle')} <span>{t('services.processHighlight')}</span>?
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">
                {t('services.processSubtitle')}
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="process-grid" staggerDelay={0.15}>
            {process.map((item, index) => (
              <StaggerItem key={item.step}>
                <div className="process-card glass-card">
                  <div className="process-step">{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  {index < process.length - 1 && (
                    <div className="process-connector" />
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
