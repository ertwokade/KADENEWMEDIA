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
import { useSiteContent } from '../hooks/useSiteContent'
import { ABOUT_CONTENT_FALLBACK } from '../data/about'
import { isImageSource, toBadgeText } from '../utils/mediaValue'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './About.css'

export default function About() {
  const { t, lang } = useLanguage()
  const { content } = useSiteContent('about', ABOUT_CONTENT_FALLBACK)
  const team = (content.team || ABOUT_CONTENT_FALLBACK.team).map((member) => {
    const media = member.image || member.avatar
    return {
      ...member,
      color: member.color || '#eac321',
      image: isImageSource(media) ? media : '',
      initials: isImageSource(media) ? '' : toBadgeText(media, member.name),
    }
  })
  /**
   * İstatistikler yalnızca GERÇEK bir değer girildiğinde gösterilir.
   *
   * Önceki sürüm boş değeri `'—'` ile dolduruyordu; admin'de içerik
   * girilmediğinde /hakkimizda'da üç kutu da anlamsız bir tire basıyordu.
   * Uydurma sayı üretmek de seçenek değil, bu yüzden değeri olmayan kutu
   * hiç render edilmez. Hiçbiri yoksa şerit tamamen kalkar ve metin
   * kendi ritmini korur.
   */
  const stats = [
    [content.experience, t('about.experience')],
    [content.teamSize, t('about.team')],
    [content.clients, t('about.happyClients')],
  ]
    .map(([value, label]) => [typeof value === 'string' ? value.trim() : value, label])
    .filter(([value]) => value !== undefined && value !== null && value !== '' && value !== '—')
  const storyP1 = lang === 'en'
    ? (content.storyEn || t('about.storyP1'))
    : (content.storyTr || t('about.storyP1'))
  const storyP2 = lang === 'en'
    ? (content.missionEn || t('about.storyP2'))
    : (content.missionTr || t('about.storyP2'))
  useSEO({
    title: 'Kade New Media Hakkında | New Media Ajansı İstanbul',
    description: 'Kade New Media, İstanbul merkezli bir new media ve dijital pazarlama ajansı — Kademedia ve Kadenewmedia adlarıyla da aranıyoruz.',
    keywords: 'kade media, kade, kademedia, kade new media, kadenewmedia, new media ajansı, medya ajansı istanbul, dijital ajans',
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
              {stats.length > 0 && (
                <div className="story-stats">
                  {stats.map(([value, label]) => (
                    <div className="story-stat" key={label}>
                      <span className="story-stat-number">{value}</span>
                      <span className="story-stat-label">{label}</span>
                    </div>
                  ))}
                </div>
              )}
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
                      src="/favicon.png"
                      alt="Kade New Media Logo"
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
                    {member.image ? (
                      <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <span style={{ color: member.color }}>
                        {member.initials}
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
