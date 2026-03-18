import { motion } from 'framer-motion'
import {
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiOutlineEye,
  HiOutlineBadgeCheck,
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './About.css'

const values = [
  {
    icon: HiOutlineLightBulb,
    title: 'Yaratıcılık',
    desc: 'Her marka için özgün ve yaratıcı çözümler üretiyoruz.',
  },
  {
    icon: HiOutlineEye,
    title: 'Şeffaflık',
    desc: 'Tüm süreçlerimizde şeffaf ve açık iletişim sağlıyoruz.',
  },
  {
    icon: HiOutlineBadgeCheck,
    title: 'Kalite',
    desc: 'Her içerik ve her kampanyada en yüksek kaliteyi hedefliyoruz.',
  },
  {
    icon: HiOutlineHeart,
    title: 'Tutku',
    desc: 'İşimizi tutkuyla yapıyor, markanızı kendi markamız gibi sahipleniyoruz.',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Takım Ruhu',
    desc: 'Deneyimli ekibimizle birlikte güçlü sonuçlar elde ediyoruz.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Güvenilirlik',
    desc: 'Verdiğimiz sözleri tutarak güvene dayalı ilişkiler kuruyoruz.',
  },
]

const team = [
  { name: 'Kade', role: 'Founder & CEO', color: '#FFD700' },
  { name: 'Ayşe Yılmaz', role: 'Creative Director', color: '#FFA500' },
  { name: 'Mehmet Kaya', role: 'Social Media Manager', color: '#FFD700' },
  { name: 'Zeynep Demir', role: 'Content Strategist', color: '#FFA500' },
]

export default function About() {
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
              Hakkımızda
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              Dijital Dünyanın <span>Yaratıcı</span> Gücü
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Kade Media olarak markaların dijital dünyada büyümesine yardımcı olan tutkulu
              bir ekibiz.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Story */}
      <section className="section about-story">
        <div className="container">
          <div className="story-grid">
            <FadeIn direction="left" className="story-content">
              <h2>
                Hikayemiz
              </h2>
              <p>
                Kade Media, sosyal medyanın gücüne inanan ve bu gücü markalar için
                kullanan bir dijital pazarlama ajansıdır. Kurulduğumuz günden bu yana
                yüzlerce markaya dijital dünyada büyümeleri için yol gösterdik.
              </p>
              <p>
                Deneyimli ekibimiz, yaratıcı içerik üretimi, stratejik sosyal medya
                yönetimi ve veri odaklı reklam kampanyaları ile markanızı dijital dünyada
                öne çıkarıyor. Her markayı benzersiz bir hikaye olarak görüyor ve bu
                hikayeyi en etkili şekilde anlatıyoruz.
              </p>
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-number">5+</span>
                  <span className="story-stat-label">Yıllık Deneyim</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">20+</span>
                  <span className="story-stat-label">Uzman Ekip</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-number">150+</span>
                  <span className="story-stat-label">Mutlu Müşteri</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn direction="right" className="story-visual">
              <div className="visual-card glass-card">
                <div className="visual-inner">
                  <div className="visual-logo">kade</div>
                  <div className="visual-subtitle">media</div>
                  <div className="visual-tagline">Dijitalde Fark Yaratın</div>
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
                Değerlerimiz
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                Bizi <span>Farklı</span> Kılan Değerler
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
                <span>Ekibimiz</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="section-subtitle">
                Tutkulu ve deneyimli ekibimizle tanışın.
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
