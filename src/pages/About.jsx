import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiOutlineEye,
  HiOutlineBadgeCheck,
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import PageHeroCanvas from '../components/PageHeroCanvas'
import './About.css'

const defaultTeam = [
  { name: 'Kadir Demir', roleTr: 'Kurucu & CEO', roleEn: 'Founder & CEO', color: '#eac321' },
  { name: 'Ayşe Yılmaz', roleTr: 'Kreatif Direktör', roleEn: 'Creative Director', color: '#eac321' },
  { name: 'Mehmet Kaya', roleTr: 'Sosyal Medya Yöneticisi', roleEn: 'Social Media Manager', color: '#eac321' },
  { name: 'Zeynep Demir', roleTr: 'İçerik Stratejisti', roleEn: 'Content Strategist', color: '#eac321' },
]

const defaultStats = { experience: '8+', teamSize: '5+', clients: '100+' }

export default function About() {
  const { t, lang } = useLanguage()
  const [aboutData, setAboutData] = useState(null)

  useEffect(() => {
    getContentApi('about')
      .then((res) => {
        if (res && res.data) setAboutData(res.data)
      })
      .catch(() => {})
  }, [])

  const team = aboutData?.team?.length
    ? aboutData.team.map((m) => ({ ...m, color: '#eac321' }))
    : defaultTeam
  const stats = {
    experience: aboutData?.experience || defaultStats.experience,
    teamSize: aboutData?.teamSize || defaultStats.teamSize,
    clients: aboutData?.clients || defaultStats.clients,
  }
  const storyP1 = aboutData
    ? (lang === 'en' ? aboutData.storyEn : aboutData.storyTr) || t('about.storyP1')
    : t('about.storyP1')
  const storyP2 = aboutData
    ? (lang === 'en' ? aboutData.missionEn : aboutData.missionTr) || t('about.storyP2')
    : t('about.storyP2')
  useSEO({
    title: 'Hakkımızda | İstanbul Sosyal Medya Ajansı',
    description: 'Kade Media, İstanbul Biruni Teknopark\'ta kurulu sosyal medya ve dijital pazarlama ajansı. Ekibimiz, vizyonumuz ve değerlerimiz hakkında bilgi edinin.',
    keywords: 'kade media hakkında, sosyal medya ajansı istanbul, dijital ajans ekibi, biruni teknopark ajans, kademedia',
    path: '/hakkimizda',
  })

  const values = [
    { icon: HiOutlineLightBulb, title: t('about.creativity'), desc: t('about.creativityDesc') },
    { icon: HiOutlineEye, title: t('about.transparency'), desc: t('about.transparencyDesc') },
    { icon: HiOutlineBadgeCheck, title: t('about.quality'), desc: t('about.qualityDesc') },
    { icon: HiOutlineHeart, title: t('about.passion'), desc: t('about.passionDesc') },
    { icon: HiOutlineUserGroup, title: t('about.teamwork'), desc: t('about.teamworkDesc') },
    { icon: HiOutlineShieldCheck, title: t('about.reliability'), desc: t('about.reliabilityDesc') },
  ]

  return (
    <PageTransition>
      <PageHeroCanvas type="about" />
      {/* Hero */}
      <section className="about-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineUserGroup size={14} />
              {t('about.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('about.title')} <span>{t('about.titleHighlight')}</span> {t('about.titleEnd')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('about.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Story */}
      <section className="section about-story">
        <div className="container">
          <div className="story-grid">
            <FadeIn direction="left" className="story-content">
              <h2>{t('about.storyTitle')}</h2>
              <p>{storyP1}</p>
              <p>{storyP2}</p>
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-number">{stats.experience}</span>
                  <span className="story-stat-label">{t('about.experience')}</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">{stats.teamSize}</span>
                  <span className="story-stat-label">{t('about.team')}</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">{stats.clients}</span>
                  <span className="story-stat-label">{t('about.happyClients')}</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn direction="right" className="story-visual">
              <div className="visual-card glass-card">
                <div className="lightning-container">
                  {/* Dış parlama halkaları */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="lightning-ring"
                      animate={{
                        scale: [1, 1.8 + i * 0.4, 1],
                        opacity: [0.25 - i * 0.06, 0, 0.25 - i * 0.06],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.6,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                  {/* Logo — gerçek dosyadan yükleniyor */}
                  <motion.div
                    className="lightning-bolt-wrapper"
                    animate={{
                      filter: [
                        'drop-shadow(0 0 12px #eac321) drop-shadow(0 0 30px rgba(234,195,33,0.3))',
                        'drop-shadow(0 0 28px #eac321) drop-shadow(0 0 60px rgba(234,195,33,0.5))',
                        'drop-shadow(0 0 12px #eac321) drop-shadow(0 0 30px rgba(234,195,33,0.3))',
                      ],
                      scale: [1, 1.04, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.img
                      src="/logo-icon.svg"
                      alt="Kade Media Logo"
                      className="lightning-svg"
                      animate={{ rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      draggable={false}
                    />
                  </motion.div>
                  <motion.div
                    className="lightning-label"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span>kade</span>media
                  </motion.div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section values-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineHeart size={14} />
                {t('about.valuesBadge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                {t('about.valuesTitle')} <span>{t('about.valuesTitleHighlight')}</span> {t('about.valuesTitleEnd')}
              </h2>
            </FadeIn>
          </div>

          <StaggerContainer className="values-grid" staggerDelay={0.1}>
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <motion.div className="value-card glass-card" whileHover={{ scale: 1.03, y: -3 }}>
                  <div className="value-icon">
                    <value.icon size={26} />
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Team */}
      <section className="section team-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">
                <span>{t('about.teamTitle')}</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="section-subtitle">
                {t('about.teamSubtitle')}
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="team-grid" staggerDelay={0.1}>
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <motion.div className="team-card glass-card" whileHover={{ y: -5 }}>
                  <div
                    className="team-avatar"
                    style={{ background: `linear-gradient(135deg, ${member.color}40, ${member.color}10)` }}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <span style={{ color: member.color }}>
                        {member.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h4>{member.name}</h4>
                  <p>{lang === 'en' ? (member.roleEn || member.roleTr) : (member.roleTr || member.roleEn)}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link to="/ekip" className="btn btn-outline">
                {lang === 'en' ? 'Meet the Full Team' : 'Tüm Ekibi Tanıyın'} →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
