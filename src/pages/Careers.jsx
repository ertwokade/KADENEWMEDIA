import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineBriefcase,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlineX,
  HiOutlineUser,
  HiOutlinePhone,
} from 'react-icons/hi'
import { getContentApi, applyJobApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Careers.css'

const jobsData = {
  tr: [
    {
      id: 1, title: 'Sosyal Medya Yöneticisi', department: 'Sosyal Medya', location: 'İstanbul (Hibrit)', type: 'Yarı Zamanlı',
      description: 'Müşteri markalarının sosyal medya hesaplarını yönetecek, içerik stratejileri oluşturacak ve topluluk yönetimi yapacak deneyimli bir Social Media Manager arıyoruz. Esnek çalışma saatleri ve uzaktan çalışma imkânı.',
      requirements: ['En az 1 yıl sosyal medya yönetimi deneyimi', 'Instagram, Facebook, TikTok ve Twitter platformlarına hakimiyet', 'İçerik takvimi oluşturma ve yönetme becerisi', 'Analitik araçlara (Meta Business Suite, vb.) hakimiyet', 'Yaratıcı düşünme ve problem çözme yeteneği'],
    },
    {
      id: 2, title: 'Grafik Tasarımcı', department: 'Kreatif', location: 'Uzaktan', type: 'Yarı Zamanlı',
      description: 'Sosyal medya görselleri, marka kimlikleri ve reklam kreatifleri tasarlayacak yaratıcı ve detaycı bir Grafik Tasarımcı arıyoruz. Freelance veya yarı zamanlı çalışmaya uygun esnek model.',
      requirements: ['Adobe Creative Suite (Photoshop, Illustrator) hakimiyeti', 'Figma veya Canva deneyimi', 'Sosyal medya görsel tasarımı konusunda portföy', 'Tipografi ve renk teorisi bilgisi', 'Motion graphics bilgisi tercih sebebidir'],
    },
    {
      id: 3, title: 'Performans Pazarlama Uzmanı', department: 'Reklam', location: 'İstanbul (Hibrit)', type: 'Yarı Zamanlı',
      description: 'Meta Ads, Google Ads ve TikTok Ads platformlarında reklam kampanyaları yönetecek, optimizasyon yapacak bir Performance Marketing Uzmanı arıyoruz. Esnek çalışma saatleri mevcuttur.',
      requirements: ['Meta Business Manager deneyimi', 'Google Ads veya Meta Ads sertifikası tercih sebebidir', 'A/B test ve optimizasyon deneyimi', 'Veri analizi ve raporlama becerisi', 'Kampanya optimizasyonu konusunda pratik bilgi'],
    },
    {
      id: 4, title: 'İçerik Yazarı (Metin Yazarı)', department: 'Kreatif', location: 'Uzaktan', type: 'Yarı Zamanlı',
      description: 'Sosyal medya postları, blog yazıları, reklam metinleri ve marka iletişimi için yaratıcı içerikler üretecek bir Copywriter arıyoruz. Tamamen uzaktan çalışma imkânı.',
      requirements: ['Mükemmel Türkçe yazım ve dilbilgisi', 'Sosyal medya içerik yazarlığı deneyimi', 'SEO temel bilgisi', 'Farklı tonlarda (resmi, samimi, eğlenceli) yazabilme', 'İngilizce yazma becerisi tercih sebebidir'],
    },
    {
      id: 5, title: 'Video Editör', department: 'Kreatif', location: 'Uzaktan', type: 'Yarı Zamanlı',
      description: 'Reels, TikTok videoları ve YouTube içerikleri için video düzenleme ve motion graphics yapacak bir Video Editör arıyoruz. Proje bazlı veya yarı zamanlı çalışma modeli.',
      requirements: ['Adobe Premiere Pro veya DaVinci Resolve deneyimi', 'Kısa form video (Reels, TikTok) düzenleme deneyimi', 'Motion graphics temel bilgisi', 'Trend takibi ve yaratıcı video fikirleri üretme', 'CapCut veya benzeri mobil araçlara hakimiyet'],
    },
    {
      id: 6, title: 'Müşteri İlişkileri Yöneticisi', department: 'Hesap Yönetimi', location: 'İstanbul (Hibrit)', type: 'Yarı Zamanlı',
      description: 'Ajans müşterileriyle ilişkileri yönetecek, proje takibini yapacak ve müşteri memnuniyetini sağlayacak bir Account Manager arıyoruz.',
      requirements: ['Müşteri ilişkileri veya proje yönetimi deneyimi', 'Dijital pazarlama temel bilgisi', 'Güçlü iletişim ve sunum becerileri', 'Planlama ve organizasyon yeteneği', 'İngilizce iletişim becerisi tercih sebebidir'],
    },
    {
      id: 7, title: 'Fotoğrafçı & İçerik Üreticisi', department: 'Kreatif', location: 'İstanbul', type: 'Yarı Zamanlı',
      description: 'Sosyal medya çekimleri, ürün fotoğrafçılığı ve sahne arkası içerikleri için proje bazlı çalışacak bir fotoğrafçı arıyoruz.',
      requirements: ['Fotoğrafçılık portföyü (sosyal medya odaklı)', 'Temel Lightroom veya Photoshop bilgisi', 'Sosyal medya estetik anlayışı', 'Çekim organizasyonu yapabilme', 'Video çekimi yapabilmek tercih sebebidir'],
    },
  ],
  en: [
    {
      id: 1, title: 'Social Media Manager', department: 'Social Media', location: 'Istanbul (Hybrid)', type: 'Part-Time',
      description: 'We are looking for an experienced Social Media Manager to manage clients\' social media accounts, create content strategies, and handle community management. Flexible working hours available.',
      requirements: ['At least 1 year of social media management experience', 'Proficiency in Instagram, Facebook, TikTok, and Twitter platforms', 'Ability to create and manage content calendars', 'Proficiency in analytics tools (Meta Business Suite, etc.)', 'Creative thinking and problem-solving skills'],
    },
    {
      id: 2, title: 'Graphic Designer', department: 'Creative', location: 'Remote', type: 'Part-Time',
      description: 'We are looking for a creative and detail-oriented Graphic Designer to design social media visuals, brand identities, and ad creatives. Flexible freelance or part-time model.',
      requirements: ['Proficiency in Adobe Creative Suite (Photoshop, Illustrator)', 'Figma or Canva experience', 'Portfolio in social media visual design', 'Knowledge of typography and color theory', 'Motion graphics knowledge is a plus'],
    },
    {
      id: 3, title: 'Performance Marketing Specialist', department: 'Advertising', location: 'Istanbul (Hybrid)', type: 'Part-Time',
      description: 'We are looking for a Performance Marketing Specialist to manage and optimize ad campaigns on Meta Ads, Google Ads, and TikTok Ads platforms. Flexible working hours.',
      requirements: ['Meta Business Manager experience', 'Google Ads or Meta Ads certification is a plus', 'A/B testing and optimization experience', 'Data analysis and reporting skills', 'Practical knowledge of campaign optimization'],
    },
    {
      id: 4, title: 'Content Writer (Copywriter)', department: 'Creative', location: 'Remote', type: 'Part-Time',
      description: 'We are looking for a Copywriter to produce creative content for social media posts, blog articles, ad copy, and brand communication. Fully remote.',
      requirements: ['Excellent writing and grammar skills', 'Social media content writing experience', 'Basic SEO knowledge', 'Ability to write in different tones (formal, friendly, fun)', 'English writing skills are a plus'],
    },
    {
      id: 5, title: 'Video Editor', department: 'Creative', location: 'Remote', type: 'Part-Time',
      description: 'We are looking for a Video Editor for video editing and motion graphics for Reels, TikTok videos, and YouTube content. Project-based or part-time model.',
      requirements: ['Adobe Premiere Pro or DaVinci Resolve experience', 'Short-form video (Reels, TikTok) editing experience', 'Basic motion graphics knowledge', 'Trend tracking and creative video idea generation', 'Proficiency in CapCut or similar mobile tools'],
    },
    {
      id: 6, title: 'Account Manager', department: 'Account Management', location: 'Istanbul (Hybrid)', type: 'Part-Time',
      description: 'We are looking for an Account Manager to manage agency client relationships, track projects, and ensure client satisfaction.',
      requirements: ['Experience in client relations or project management', 'Basic digital marketing knowledge', 'Strong communication and presentation skills', 'Planning and organizational ability', 'English communication skills are a plus'],
    },
    {
      id: 7, title: 'Photographer & Content Creator', department: 'Creative', location: 'Istanbul', type: 'Part-Time',
      description: 'We are looking for a photographer for social media shoots, product photography, and behind-the-scenes content on a project basis.',
      requirements: ['Photography portfolio (social media focused)', 'Basic Lightroom or Photoshop knowledge', 'Social media aesthetic sense', 'Ability to organize shoots', 'Video shooting capability is a plus'],
    },
  ],
}

function JobCard({ job, lang, t }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', coverLetter: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await applyJobApi({ ...form, position: job.title })
      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', coverLetter: '' })
    } catch (err) {
      setError(err.message || (lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.'))
    } finally {
      setSubmitting(false)
    }
  }

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

            {/* Apply Form Toggle */}
            <div style={{ marginTop: 16 }}>
              {!showApply && !submitted && (
                <button
                  className="btn btn-primary job-apply-btn"
                  onClick={(e) => { e.stopPropagation(); setShowApply(true) }}
                >
                  <HiOutlineMail size={16} />
                  {t('careers.apply')}
                </button>
              )}

              {submitted && (
                <div style={{ padding: '16px 20px', background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 12, color: '#2ECC71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  ✅ {lang === 'tr' ? 'Başvurunuz alındı! En kısa sürede size dönüş yapacağız.' : 'Your application has been received! We will get back to you soon.'}
                </div>
              )}

              <AnimatePresence>
                {showApply && !submitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ marginTop: 16, padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent)' }}>
                          💼 {lang === 'tr' ? `${job.title} — Başvuru Formu` : `${job.title} — Application Form`}
                        </h4>
                        <button onClick={() => setShowApply(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                          <HiOutlineX size={18} />
                        </button>
                      </div>
                      <form onSubmit={handleApply}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                              {lang === 'tr' ? 'Ad Soyad *' : 'Full Name *'}
                            </label>
                            <input
                              type="text" required
                              value={form.name}
                              onChange={e => setForm({ ...form, name: e.target.value })}
                              placeholder={lang === 'tr' ? 'Adınız Soyadınız' : 'Your Full Name'}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                              {lang === 'tr' ? 'E-posta *' : 'Email *'}
                            </label>
                            <input
                              type="email" required
                              value={form.email}
                              onChange={e => setForm({ ...form, email: e.target.value })}
                              placeholder="ornek@email.com"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                            {lang === 'tr' ? 'Telefon' : 'Phone'}
                          </label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            placeholder="+90 5XX XXX XX XX"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                            {lang === 'tr' ? 'Ön Yazı / Kendinizi Tanıtın' : 'Cover Letter / Introduce Yourself'}
                          </label>
                          <textarea
                            rows={4}
                            value={form.coverLetter}
                            onChange={e => setForm({ ...form, coverLetter: e.target.value })}
                            placeholder={lang === 'tr' ? 'Neden bu pozisyon için uygun olduğunuzu düşündüğünüzü yazın...' : 'Tell us why you would be a great fit for this role...'}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        </div>
                        {error && <p style={{ color: '#E91E63', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                            <HiOutlineMail size={16} />
                            {submitting ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (lang === 'tr' ? 'Başvuruyu Gönder' : 'Submit Application')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Careers() {
  const { lang, t } = useLanguage()
  const [dynamicJobs, setDynamicJobs] = useState(null)

  useEffect(() => {
    getContentApi('careers')
      .then(res => {
        if (res?.data?.tr?.length) setDynamicJobs(res.data)
      })
      .catch(() => {})
  }, [])

  useSEO({
    title: 'Kariyer | Kade Media\'da Çalış',
    description: 'Kade Media kariyer fırsatları. Sosyal medya yöneticisi, içerik üreticisi ve dijital pazarlama uzmanı pozisyonları için başvurun. İstanbul hibrit çalışma.',
    keywords: 'sosyal medya ajansı kariyer, dijital pazarlama iş ilanı, sosyal medya yöneticisi iş, içerik üreticisi iş istanbul',
    path: '/kariyer',
  })
  const jobs = (dynamicJobs?.[lang] || dynamicJobs?.tr || jobsData[lang] || jobsData.tr)

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
                <JobCard job={job} lang={lang} t={t} />
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
