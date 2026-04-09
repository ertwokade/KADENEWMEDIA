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
      id: 1, title: 'Sosyal Medya Uzmanı', department: 'Sosyal Medya', location: 'İstanbul (Hibrit)', type: 'Tam Zamanlı',
      description: 'En az 5 aktif müşteri hesabını yönetecek, içerik takvimi hazırlayacak, haftalık raporlar sunacak ve topluluk yönetimi yapacak, ajans deneyimli bir sosyal medya uzmanı arıyoruz.',
      requirements: [
        'En az 1 yıl ajans veya marka tarafında sosyal medya deneyimi',
        'Instagram, TikTok, LinkedIn platformlarında aktif yönetim deneyimi',
        'Meta Business Suite ve içerik takvimi araçlarına (Notion, Trello vb.) hakimiyet',
        'Aynı anda birden fazla müşteri hesabını yönetebilme kapasitesi',
        'Analitik okuma ve rapor yazma becerisi',
        'Canva veya benzeri tasarım araçlarında temel bilgi',
      ],
    },
    {
      id: 2, title: 'Grafik Tasarımcı', department: 'Kreatif', location: 'Uzaktan / Hibrit', type: 'Tam Zamanlı',
      description: 'Sosyal medya kreatifleri, marka kimlik çalışmaları ve dijital reklam görselleri üretecek, ajans temposuna ayak uyduracak bir grafik tasarımcı arıyoruz. Günlük teslimat kapasitesi yüksek, hızlı geri bildirim uygulayabilen biri olmasını bekliyoruz.',
      requirements: [
        'Adobe Photoshop ve Illustrator\'da ileri düzey hakimiyet',
        'Figma\'da çalışma deneyimi',
        'Sosyal medya formatlarına (Story, Reels kapağı, carousel, banner) hakim olma',
        'Marka kılavuzuna sadık kalarak üretim yapabilme',
        'Canva Pro deneyimi (müşteri onay süreçleri için)',
        'Portföyde ajans veya marka projesi örnekleri zorunlu',
      ],
    },
    {
      id: 3, title: 'Reklam Yöneticisi (Meta & Google)', department: 'Performans', location: 'İstanbul (Hibrit)', type: 'Tam Zamanlı',
      description: 'Müşterilerimize ait Meta Ads ve Google Ads hesaplarını yönetecek, reklam bütçelerini optimize edecek, haftalık performans raporları hazırlayacak bir reklam uzmanı arıyoruz. Aylık toplam reklam bütçesi 500.000 TL üzerindedir.',
      requirements: [
        'Meta Business Manager\'da kampanya kurulum ve optimizasyon deneyimi',
        'Google Ads (Search, Display, YouTube) deneyimi',
        'A/B test yürütme ve kreatif yorumlama becerisi',
        'Pixel entegrasyonu ve conversion takibi konusunda bilgi',
        'Raporlama için Google Looker Studio veya benzeri araç deneyimi',
        'Meta Ads veya Google Ads sertifikası tercih sebebidir',
      ],
    },
    {
      id: 4, title: 'İçerik Yazarı & Metin Yazarı', department: 'Kreatif', location: 'Uzaktan', type: 'Yarı Zamanlı',
      description: 'Müşteri markalarımız için sosyal medya metinleri, reklam kopyaları, blog yazıları ve e-posta içerikleri yazacak, marka tonunu doğru yansıtabilen bir içerik yazarı arıyoruz.',
      requirements: [
        'Sosyal medya metin yazarlığında deneyim (en az 1 yıl)',
        'Mükemmel Türkçe yazım, dil bilgisi ve noktalama',
        'Farklı marka tonlarında (kurumsal, samimi, eğlenceli) yazabilme',
        'Hashtag stratejisi ve SEO uyumlu metin üretme bilgisi',
        'Reklam kopyası yazma deneyimi (Meta veya Google Ads)',
        'İngilizce metin yazabilmek tercih sebebidir',
      ],
    },
    {
      id: 5, title: 'Video Editörü', department: 'Kreatif', location: 'Uzaktan', type: 'Yarı Zamanlı',
      description: 'Müşteri markalarımız için Reels, TikTok ve YouTube Shorts formatında kısa video içerikler düzenleyecek, gerektiğinde motion grafik ekleyebilecek bir video editörü arıyoruz.',
      requirements: [
        'CapCut, Adobe Premiere Pro veya DaVinci Resolve ile aktif kullanım',
        'Kısa form video düzenleme portföyü (Reels / TikTok)',
        'Ses senkronizasyonu, altyazı ekleme ve renk düzeltme becerisi',
        'Trend ses ve format takibi yapabilme',
        'Motion grafik (After Effects / CapCut efektleri) bilgisi tercih sebebidir',
        'Hızlı teslimat kapasitesi — günde 2-3 video teslim edebilme',
      ],
    },
    {
      id: 6, title: 'Müşteri Deneyimi Sorumlusu', department: 'Hesap Yönetimi', location: 'İstanbul (Hibrit)', type: 'Tam Zamanlı',
      description: 'Mevcut müşterilerimizle düzenli iletişim kuracak, brifing toplantılarını yönetecek, onay süreçlerini takip edecek ve müşteri memnuniyetini ölçecek bir hesap sorumlusu arıyoruz.',
      requirements: [
        'Dijital ajans veya pazarlama sektöründe müşteri ilişkileri deneyimi',
        'Müşteri brifing yazma ve toplantı yönetimi becerisi',
        'Çoklu proje takibi ve deadline yönetimi',
        'Güçlü yazılı ve sözlü iletişim',
        'Notion, Asana veya benzeri proje yönetim araçlarına hakimiyet',
        'İngilizce iletişim yapabilmek (uluslararası müşteriler için)',
      ],
    },
    {
      id: 7, title: 'İçerik Üreticisi & Fotoğrafçı', department: 'Kreatif', location: 'İstanbul', type: 'Proje Bazlı',
      description: 'Ürün fotoğrafçılığı, mekan çekimleri ve sosyal medya odaklı sahne kurguları için müşteri ziyaretlerine çıkacak, çektiği görselleri düzenleyerek teslim edecek bir içerik üreticisi arıyoruz.',
      requirements: [
        'Sosyal medya odaklı fotoğraf portföyü zorunlu',
        'Telefon veya mirrorless kamera ile çekim deneyimi',
        'Lightroom veya Snapseed ile temel renk düzeltme',
        'Sosyal medya estetik anlayışı ve trend takibi',
        'İstanbul içi ulaşım esnekliği',
        'Video çekimi ve kısa video üretimi tercih sebebidir',
      ],
    },
  ],
  en: [
    {
      id: 1, title: 'Social Media Specialist', department: 'Social Media', location: 'Istanbul (Hybrid)', type: 'Full-Time',
      description: 'We are looking for an agency-experienced social media specialist to manage at least 5 active client accounts, prepare content calendars, deliver weekly reports, and handle community management.',
      requirements: [
        'At least 1 year of social media experience in an agency or brand side',
        'Active management experience on Instagram, TikTok, and LinkedIn',
        'Proficiency in Meta Business Suite and content calendar tools (Notion, Trello, etc.)',
        'Capacity to manage multiple client accounts simultaneously',
        'Analytics reading and report writing skills',
        'Basic knowledge of Canva or similar design tools',
      ],
    },
    {
      id: 2, title: 'Graphic Designer', department: 'Creative', location: 'Remote / Hybrid', type: 'Full-Time',
      description: 'We are looking for a graphic designer to produce social media creatives, brand identity materials, and digital ad visuals at agency pace — someone with high daily delivery capacity who can apply feedback quickly.',
      requirements: [
        'Advanced proficiency in Adobe Photoshop and Illustrator',
        'Figma experience',
        'Familiarity with social media formats (Story, Reels cover, carousel, banner)',
        'Ability to produce within brand guidelines',
        'Canva Pro experience (for client approval workflows)',
        'Portfolio must include agency or brand project examples',
      ],
    },
    {
      id: 3, title: 'Ad Manager (Meta & Google)', department: 'Performance', location: 'Istanbul (Hybrid)', type: 'Full-Time',
      description: 'We are looking for an ad specialist to manage Meta Ads and Google Ads accounts for our clients, optimize ad budgets, and prepare weekly performance reports. Total monthly ad budget managed exceeds 500,000 TRY.',
      requirements: [
        'Campaign setup and optimization experience in Meta Business Manager',
        'Google Ads (Search, Display, YouTube) experience',
        'A/B testing and creative interpretation skills',
        'Knowledge of pixel integration and conversion tracking',
        'Reporting experience with Google Looker Studio or similar tools',
        'Meta Ads or Google Ads certification is a plus',
      ],
    },
    {
      id: 4, title: 'Content Writer & Copywriter', department: 'Creative', location: 'Remote', type: 'Part-Time',
      description: 'We are looking for a content writer who can accurately reflect brand tone — writing social media captions, ad copy, blog posts, and email content for our client brands.',
      requirements: [
        'Experience in social media copywriting (at least 1 year)',
        'Excellent Turkish writing, grammar, and punctuation',
        'Ability to write in different brand tones (corporate, friendly, fun)',
        'Knowledge of hashtag strategy and SEO-compatible writing',
        'Ad copy writing experience (Meta or Google Ads)',
        'Ability to write in English is a plus',
      ],
    },
    {
      id: 5, title: 'Video Editor', department: 'Creative', location: 'Remote', type: 'Part-Time',
      description: 'We are looking for a video editor to edit short-form video content in Reels, TikTok, and YouTube Shorts formats for our client brands, with the ability to add motion graphics when needed.',
      requirements: [
        'Active use of CapCut, Adobe Premiere Pro, or DaVinci Resolve',
        'Short-form video editing portfolio (Reels / TikTok)',
        'Audio sync, subtitle addition, and color correction skills',
        'Ability to track trending sounds and formats',
        'Motion graphics knowledge (After Effects / CapCut effects) is a plus',
        'Fast delivery capacity — ability to deliver 2-3 videos per day',
      ],
    },
    {
      id: 6, title: 'Client Success Manager', department: 'Account Management', location: 'Istanbul (Hybrid)', type: 'Full-Time',
      description: 'We are looking for an account manager to communicate regularly with existing clients, manage briefing meetings, track approval processes, and measure client satisfaction.',
      requirements: [
        'Client relations experience in a digital agency or marketing sector',
        'Client briefing writing and meeting management skills',
        'Multi-project tracking and deadline management',
        'Strong written and verbal communication',
        'Proficiency in Notion, Asana, or similar project management tools',
        'English communication ability (for international clients)',
      ],
    },
    {
      id: 7, title: 'Content Creator & Photographer', department: 'Creative', location: 'Istanbul', type: 'Project-Based',
      description: 'We are looking for a content creator for product photography, location shoots, and social media-focused scene setups who will visit clients, edit the photos, and deliver them.',
      requirements: [
        'Social media-focused photography portfolio required',
        'Shooting experience with phone or mirrorless camera',
        'Basic color correction with Lightroom or Snapseed',
        'Social media aesthetic sense and trend awareness',
        'Transportation flexibility within Istanbul',
        'Video shooting and short video production experience is a plus',
      ],
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
