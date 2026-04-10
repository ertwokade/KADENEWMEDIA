import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineUserGroup } from 'react-icons/hi'
import { FaLinkedinIn, FaInstagram } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Team.css'

const defaultTeam = [
  {
    name: 'Kadir Demir',
    roleTr: 'Kurucu & CEO',
    roleEn: 'Founder & CEO',
    bioTr: 'Dijital pazarlama ve sosyal medya alanında 8+ yıl deneyim. Strateji ve büyüme odaklı liderlik.',
    bioEn: '8+ years of experience in digital marketing and social media. Strategy and growth-focused leadership.',
    image: null,
    social: { linkedin: '#', instagram: '#' },
    color: '#eac321',
  },
  {
    name: 'Ayşe Yılmaz',
    roleTr: 'Kreatif Direktör',
    roleEn: 'Creative Director',
    bioTr: 'Görsel hikaye anlatımı ve marka kimliği konularında uzman. Yaratıcı ekibin lideri.',
    bioEn: 'Expert in visual storytelling and brand identity. Leader of the creative team.',
    image: null,
    social: { linkedin: '#', instagram: '#' },
    color: '#E91E63',
  },
  {
    name: 'Mehmet Kaya',
    roleTr: 'Sosyal Medya Yöneticisi',
    roleEn: 'Social Media Manager',
    bioTr: 'Çok platformlu sosyal medya stratejileri ve topluluk yönetimi konusunda deneyimli.',
    bioEn: 'Experienced in multi-platform social media strategies and community management.',
    image: null,
    social: { linkedin: '#' },
    color: '#6C63FF',
  },
  {
    name: 'Zeynep Demir',
    roleTr: 'İçerik Stratejisti',
    roleEn: 'Content Strategist',
    bioTr: 'İçerik pazarlama ve SEO stratejileri ile markaların dijital büyümesini sağlıyor.',
    bioEn: 'Drives digital growth for brands with content marketing and SEO strategies.',
    image: null,
    social: { linkedin: '#', instagram: '#' },
    color: '#2ECC71',
  },
]

const socialIcons = { linkedin: FaLinkedinIn, instagram: FaInstagram }

export default function Team() {
  const { lang } = useLanguage()
  const [teamData, setTeamData] = useState(null)

  useSEO({
    title: lang === 'tr' ? 'Ekibimiz | Kade Media' : 'Our Team | Kade Media',
    description: lang === 'tr'
      ? 'Kade Media ekibi ile tanışın. Tutkulu ve deneyimli dijital pazarlama profesyonelleri.'
      : 'Meet the Kade Media team. Passionate and experienced digital marketing professionals.',
    path: '/ekip',
  })

  useEffect(() => {
    getContentApi('about')
      .then(res => {
        if (res?.data?.team?.length) setTeamData(res.data.team)
      })
      .catch(() => {})
  }, [])

  const team = teamData
    ? teamData.map((m, i) => ({ ...defaultTeam[i], ...m, color: defaultTeam[i]?.color || '#eac321' }))
    : defaultTeam

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
                        if (!Icon || !url) return null
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
