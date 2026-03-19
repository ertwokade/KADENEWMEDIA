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
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './About.css'

const team = [
  { name: 'Kade', role: 'Founder & CEO', color: '#FFD700' },
  { name: 'Ayşe Yılmaz', role: 'Creative Director', color: '#FFD700' },
  { name: 'Mehmet Kaya', role: 'Social Media Manager', color: '#FFD700' },
  { name: 'Zeynep Demir', role: 'Content Strategist', color: '#FFD700' },
]

export default function About() {
  const { t } = useLanguage()

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
      {/* Hero */}
      <section className="about-hero">
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
              <p>{t('about.storyP1')}</p>
              <p>{t('about.storyP2')}</p>
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-number">5+</span>
                  <span className="story-stat-label">{t('about.experience')}</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">20+</span>
                  <span className="story-stat-label">{t('about.team')}</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">150+</span>
                  <span className="story-stat-label">{t('about.happyClients')}</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn direction="right" className="story-visual">
              <div className="visual-card glass-card">
                <div className="visual-inner">
                  <div className="visual-logo">kade</div>
                  <div className="visual-subtitle">media</div>
                  <div className="visual-tagline">{t('about.visualTagline')}</div>
                </div>
                <div className="visual-dots">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="visual-dot"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                      }}
                    />
                  ))}
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
                    <span style={{ color: member.color }}>
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
