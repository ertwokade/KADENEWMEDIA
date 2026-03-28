import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineBriefcase,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Careers.css'

const jobsData = {
  tr: [
    {
      id: 1, title: 'Social Media Manager', department: 'Sosyal Medya', location: 'İstanbul (Hibrit)', type: 'Tam Zamanlı',
      description: 'Müşteri markalarının sosyal medya hesaplarını yönetecek, içerik stratejileri oluşturacak ve topluluk yönetimi yapacak deneyimli bir Social Media Manager arıyoruz.',
      requirements: ['En az 2 yıl sosyal medya yönetimi deneyimi', 'Instagram, Facebook, TikTok ve Twitter platformlarına hakimiyet', 'İçerik takvimi oluşturma ve yönetme becerisi', 'Analitik araçlara (Meta Business Suite, vb.) hakimiyet', 'Yaratıcı düşünme ve problem çözme yeteneği'],
    },
    {
      id: 2, title: 'Grafik Tasarımcı', department: 'Kreatif', location: 'İstanbul (Ofis)', type: 'Tam Zamanlı',
      description: 'Sosyal medya görselleri, marka kimlikleri ve reklam kreatifleri tasarlayacak yaratıcı ve detaycı bir Grafik Tasarımcı arıyoruz.',
      requirements: ['Adobe Creative Suite (Photoshop, Illustrator) hakimiyeti', 'Figma veya Canva deneyimi', 'Sosyal medya görsel tasarımı konusunda portföy', 'Tipografi ve renk teorisi bilgisi', 'Motion graphics bilgisi tercih sebebidir'],
    },
    {
      id: 3, title: 'Performance Marketing Uzmanı', department: 'Reklam', location: 'İstanbul (Hibrit)', type: 'Tam Zamanlı',
      description: 'Meta Ads, Google Ads ve TikTok Ads platformlarında reklam kampanyaları yönetecek, optimizasyon yapacak bir Performance Marketing Uzmanı arıyoruz.',
      requirements: ['En az 1 yıl dijital reklam yönetimi deneyimi', 'Meta Business Manager deneyimi', 'Google Ads sertifikası tercih sebebidir', 'A/B test ve optimizasyon deneyimi', 'Veri analizi ve raporlama becerisi'],
    },
    {
      id: 4, title: 'İçerik Yazarı (Copywriter)', department: 'Kreatif', location: 'Uzaktan', type: 'Tam Zamanlı',
      description: 'Sosyal medya postları, blog yazıları, reklam metinleri ve marka iletişimi için yaratıcı içerikler üretecek bir Copywriter arıyoruz.',
      requirements: ['Mükemmel Türkçe yazım ve dilbilgisi', 'Sosyal medya içerik yazarlığı deneyimi', 'SEO temel bilgisi', 'Farklı tonlarda (resmi, samimi, eğlenceli) yazabilme', 'İngilizce yazma becerisi tercih sebebidir'],
    },
    {
      id: 5, title: 'Video Editör', department: 'Kreatif', location: 'İstanbul (Ofis)', type: 'Yarı Zamanlı',
      description: 'Reels, TikTok videoları ve YouTube içerikleri için video düzenleme ve motion graphics yapacak bir Video Editör arıyoruz.',
      requirements: ['Adobe Premiere Pro ve After Effects deneyimi', 'Kısa form video (Reels, TikTok) düzenleme deneyimi', 'Motion graphics temel bilgisi', 'Trend takibi ve yaratıcı video fikirleri üretme', 'CapCut veya benzeri mobil araçlara hakimiyet'],
    },
  ],
  en: [
    {
      id: 1, title: 'Social Media Manager', department: 'Social Media', location: 'Istanbul (Hybrid)', type: 'Full-Time',
      description: 'We are looking for an experienced Social Media Manager to manage clients\' social media accounts, create content strategies, and handle community management.',
      requirements: ['At least 2 years of social media management experience', 'Proficiency in Instagram, Facebook, TikTok, and Twitter platforms', 'Ability to create and manage content calendars', 'Proficiency in analytics tools (Meta Business Suite, etc.)', 'Creative thinking and problem-solving skills'],
    },
    {
      id: 2, title: 'Graphic Designer', department: 'Creative', location: 'Istanbul (Office)', type: 'Full-Time',
      description: 'We are looking for a creative and detail-oriented Graphic Designer to design social media visuals, brand identities, and ad creatives.',
      requirements: ['Proficiency in Adobe Creative Suite (Photoshop, Illustrator)', 'Figma or Canva experience', 'Portfolio in social media visual design', 'Knowledge of typography and color theory', 'Motion graphics knowledge is a plus'],
    },
    {
      id: 3, title: 'Performance Marketing Specialist', department: 'Advertising', location: 'Istanbul (Hybrid)', type: 'Full-Time',
      description: 'We are looking for a Performance Marketing Specialist to manage and optimize ad campaigns on Meta Ads, Google Ads, and TikTok Ads platforms.',
      requirements: ['At least 1 year of digital advertising management experience', 'Meta Business Manager experience', 'Google Ads certification is a plus', 'A/B testing and optimization experience', 'Data analysis and reporting skills'],
    },
    {
      id: 4, title: 'Content Writer (Copywriter)', department: 'Creative', location: 'Remote', type: 'Full-Time',
      description: 'We are looking for a Copywriter to produce creative content for social media posts, blog articles, ad copy, and brand communication.',
      requirements: ['Excellent writing and grammar skills', 'Social media content writing experience', 'Basic SEO knowledge', 'Ability to write in different tones (formal, friendly, fun)', 'English writing skills are a plus'],
    },
    {
      id: 5, title: 'Video Editor', department: 'Creative', location: 'Istanbul (Office)', type: 'Part-Time',
      description: 'We are looking for a Video Editor for video editing and motion graphics for Reels, TikTok videos, and YouTube content.',
      requirements: ['Adobe Premiere Pro and After Effects experience', 'Short-form video (Reels, TikTok) editing experience', 'Basic motion graphics knowledge', 'Trend tracking and creative video idea generation', 'Proficiency in CapCut or similar mobile tools'],
    },
  ],
}

function JobCard({ job, t }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className={`job-card glass-card ${isOpen ? 'open' : ''}`}
      layout
    >
      <div className="job-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="job-info">
          <h3>{job.title}</h3>
          <div className="job-meta">
            <span className="job-tag">
              <HiOutlineOfficeBuilding size={14} />
              {job.department}
            </span>
            <span className="job-tag">
              <HiOutlineLocationMarker size={14} />
              {job.location}
            </span>
            <span className="job-tag">
              <HiOutlineClock size={14} />
              {job.type}
            </span>
          </div>
        </div>
        <button className="job-toggle" aria-label={t('careers.showDetails')}>
          {isOpen ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="job-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="job-desc">{job.description}</p>
            <div className="job-requirements">
              <h4>{t('careers.requirements')}</h4>
              <ul>
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <a
              href={`mailto:kariyer@kademedia.com?subject=Başvuru: ${job.title}`}
              className="btn btn-primary job-apply-btn"
            >
              <HiOutlineMail size={16} />
              {t('careers.apply')}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Careers() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Kariyer | Kade Media\'da Çalış',
    description: 'Kade Media kariyer fırsatları. Sosyal medya yöneticisi, içerik üreticisi ve dijital pazarlama uzmanı pozisyonları için başvurun. İstanbul hibrit çalışma.',
    keywords: 'sosyal medya ajansı kariyer, dijital pazarlama iş ilanı, sosyal medya yöneticisi iş, içerik üreticisi iş istanbul',
    path: '/kariyer',
  })
  const jobs = jobsData[lang] || jobsData.tr

  const perks = [
    { icon: '🏠', title: t('careers.hybridWork'), desc: t('careers.hybridWorkDesc') },
    { icon: '📚', title: t('careers.education'), desc: t('careers.educationDesc') },
    { icon: '🎯', title: t('careers.careerGrowth'), desc: t('careers.careerGrowthDesc') },
    { icon: '🎉', title: t('careers.socialEvents'), desc: t('careers.socialEventsDesc') },
    { icon: '💰', title: t('careers.bonus'), desc: t('careers.bonusDesc') },
    { icon: '🌴', title: t('careers.extraLeave'), desc: t('careers.extraLeaveDesc') },
  ]

  return (
    <PageTransition>
      {/* Hero */}
      <section className="careers-hero">
        <PageBgAnimation type="careers" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineBriefcase size={14} />
              {t('careers.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('careers.title')} <span>{t('careers.titleHighlight')}</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('careers.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Perks */}
      <section className="section perks-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">{t('careers.whyTitle')} <span>{t('careers.whyHighlight')}</span>?</h2>
            </FadeIn>
          </div>
          <StaggerContainer className="perks-grid" staggerDelay={0.08}>
            {perks.map((perk) => (
              <StaggerItem key={perk.title}>
                <motion.div className="perk-card glass-card" whileHover={{ y: -4 }}>
                  <span className="perk-emoji">{perk.icon}</span>
                  <h4>{perk.title}</h4>
                  <p>{perk.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Job Listings */}
      <section className="section jobs-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">{t('careers.openPositions')} <span>{t('careers.openHighlight')}</span></h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="section-subtitle">
                {t('careers.openSubtitle')}
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="jobs-list" staggerDelay={0.1}>
            {jobs.map((job) => (
              <StaggerItem key={job.id}>
                <JobCard job={job} t={t} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.2}>
            <div className="jobs-cta">
              <p>{t('careers.notFound')}</p>
              <a href="mailto:kariyer@kademedia.com" className="btn btn-outline">
                <HiOutlineMail size={16} />
                {t('careers.openApplication')}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
