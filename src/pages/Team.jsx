import { motion } from 'framer-motion'
import { HiOutlineUserGroup } from 'react-icons/hi'
import { FaLinkedinIn, FaInstagram } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Team.css'

// Yalnızca doğrulanmış gerçek kişi. Placeholder isimler kaldırıldı; ekip
// büyüdükçe (veya admin panelinden) buraya gerçek üyeler eklenir. Gerçek veri
// yoksa uydurma isim gösterilmez — bunun yerine açık pozisyonlar / roller sunulur.
const defaultTeam = [
  {
    name: 'Kadir Demir',
    roleTr: 'Kurucu & CEO',
    roleEn: 'Founder & CEO',
    bioTr: 'Dijital pazarlama ve sosyal medya stratejisi odaklı. Müşteri büyümesini ve ajans vizyonunu birlikte yönetiyor.',
    bioEn: 'Focused on digital marketing and social media strategy. Drives client growth and agency vision.',
    image: '/kadir.jpg',
    social: {},
    color: '#eac321',
  },
]

const socialIcons = { linkedin: FaLinkedinIn, instagram: FaInstagram }

export default function Team() {
  const { lang } = useLanguage()

  useSEO({
    title: lang === 'tr' ? 'Kade New Media Ekibi | İstanbul Dijital Pazarlama Ajansı' : 'Our Team | Kade New Media',
    description: lang === 'tr'
      ? 'Kade New Media’nın sosyal medya, içerik üretimi, reklam ve dijital projelerde birlikte çalışan İstanbul merkezli ekibiyle tanışın.'
      : 'Meet the Kade New Media team. Passionate and experienced digital marketing professionals.',
    path: '/ekip',
  })

  const team = defaultTeam

  return (
    <PageTransition>
      <section className="team-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineUserGroup size={14} />
              {lang === 'tr' ? 'Ekibimiz' : 'Our Team'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {lang === 'tr' ? 'Tutkulu Ekibimizle Tanışın' : 'Meet Our Passionate Team'}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {lang === 'tr'
                ? 'Deneyimli ve yaratıcı ekibimiz, markanızı dijital dünyada zirveye taşımak için çalışıyor.'
                : 'Our experienced and creative team works to take your brand to the top in the digital world.'}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="team-grid" staggerDelay={0.12}>
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <motion.div
                  className="team-card glass-card"
                  whileHover={{ y: -6 }}
                >
                  <div className="team-card-avatar" style={{ background: `${member.color}15`, borderColor: `${member.color}40` }}>
                    {member.image ? (
                      <img src={member.image} alt={member.name} />
                    ) : (
                      <span className="team-card-initials" style={{ color: member.color }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <h3 className="team-card-name">{member.name}</h3>
                  <span className="team-card-role" style={{ color: member.color }}>
                    {lang === 'tr' ? member.roleTr : member.roleEn}
                  </span>
                  <p className="team-card-bio">
                    {lang === 'tr' ? (member.bioTr || '') : (member.bioEn || '')}
                  </p>
                  {member.social && (
                    <div className="team-card-socials">
                      {Object.entries(member.social).map(([platform, url]) => {
                        const Icon = socialIcons[platform]
                        if (!Icon || !url || url === '#') return null
                        return (
                          <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="team-social-link" aria-label={platform}>
                            <Icon size={14} />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
