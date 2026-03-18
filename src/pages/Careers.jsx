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
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Careers.css'

const jobs = [
  {
    id: 1,
    title: 'Social Media Manager',
    department: 'Sosyal Medya',
    location: 'İstanbul (Hibrit)',
    type: 'Tam Zamanlı',
    description: 'Müşteri markalarının sosyal medya hesaplarını yönetecek, içerik stratejileri oluşturacak ve topluluk yönetimi yapacak deneyimli bir Social Media Manager arıyoruz.',
    requirements: [
      'En az 2 yıl sosyal medya yönetimi deneyimi',
      'Instagram, Facebook, TikTok ve Twitter platformlarına hakimiyet',
      'İçerik takvimi oluşturma ve yönetme becerisi',
      'Analitik araçlara (Meta Business Suite, vb.) hakimiyet',
      'Yaratıcı düşünme ve problem çözme yeteneği',
    ],
  },
  {
    id: 2,
    title: 'Grafik Tasarımcı',
    department: 'Kreatif',
    location: 'İstanbul (Ofis)',
    type: 'Tam Zamanlı',
    description: 'Sosyal medya görselleri, marka kimlikleri ve reklam kreatifleri tasarlayacak yaratıcı ve detaycı bir Grafik Tasarımcı arıyoruz.',
    requirements: [
      'Adobe Creative Suite (Photoshop, Illustrator) hakimiyeti',
      'Figma veya Canva deneyimi',
      'Sosyal medya görsel tasarımı konusunda portföy',
      'Tipografi ve renk teorisi bilgisi',
      'Motion graphics bilgisi tercih sebebidir',
    ],
  },
  {
    id: 3,
    title: 'Performance Marketing Uzmanı',
    department: 'Reklam',
    location: 'İstanbul (Hibrit)',
    type: 'Tam Zamanlı',
    description: 'Meta Ads, Google Ads ve TikTok Ads platformlarında reklam kampanyaları yönetecek, optimizasyon yapacak bir Performance Marketing Uzmanı arıyoruz.',
    requirements: [
      'En az 1 yıl dijital reklam yönetimi deneyimi',
      'Meta Business Manager deneyimi',
      'Google Ads sertifikası tercih sebebidir',
      'A/B test ve optimizasyon deneyimi',
      'Veri analizi ve raporlama becerisi',
    ],
  },
  {
    id: 4,
    title: 'İçerik Yazarı (Copywriter)',
    department: 'Kreatif',
    location: 'Uzaktan',
    type: 'Tam Zamanlı',
    description: 'Sosyal medya postları, blog yazıları, reklam metinleri ve marka iletişimi için yaratıcı içerikler üretecek bir Copywriter arıyoruz.',
    requirements: [
      'Mükemmel Türkçe yazım ve dilbilgisi',
      'Sosyal medya içerik yazarlığı deneyimi',
      'SEO temel bilgisi',
      'Farklı tonlarda (resmi, samimi, eğlenceli) yazabilme',
      'İngilizce yazma becerisi tercih sebebidir',
    ],
  },
  {
    id: 5,
    title: 'Video Editör',
    department: 'Kreatif',
    location: 'İstanbul (Ofis)',
    type: 'Yarı Zamanlı',
    description: 'Reels, TikTok videoları ve YouTube içerikleri için video düzenleme ve motion graphics yapacak bir Video Editör arıyoruz.',
    requirements: [
      'Adobe Premiere Pro ve After Effects deneyimi',
      'Kısa form video (Reels, TikTok) düzenleme deneyimi',
      'Motion graphics temel bilgisi',
      'Trend takibi ve yaratıcı video fikirleri üretme',
      'CapCut veya benzeri mobil araçlara hakimiyet',
    ],
  },
]

const perks = [
  { icon: '🏠', title: 'Hibrit Çalışma', desc: 'Ofis ve uzaktan çalışma esnekliği' },
  { icon: '📚', title: 'Eğitim Desteği', desc: 'Kurs ve sertifika desteği' },
  { icon: '🎯', title: 'Kariyer Gelişimi', desc: 'Net kariyer yolu ve mentorluk' },
  { icon: '🎉', title: 'Sosyal Etkinlikler', desc: 'Ekip etkinlikleri ve team building' },
  { icon: '💰', title: 'Performans Primi', desc: 'Başarıya dayalı prim sistemi' },
  { icon: '🌴', title: 'Ekstra İzin', desc: 'Doğum günü izni ve ek yıllık izin' },
]

function JobCard({ job }) {
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
        <button className="job-toggle" aria-label="Detayları göster">
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
              <h4>Aranan Nitelikler:</h4>
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
              Başvur
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Careers() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="careers-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineBriefcase size={14} />
              Kariyer
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              Ekibimize <span>Katılın</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Tutkulu, yaratıcı ve dinamik ekibimizle birlikte dijital dünyada fark yaratın.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Perks */}
      <section className="section perks-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">Neden <span>Kade Media</span>?</h2>
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
              <h2 className="section-title">Açık <span>Pozisyonlar</span></h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="section-subtitle">
                Aşağıdaki pozisyonlardan size uygun olanına başvurabilirsiniz.
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="jobs-list" staggerDelay={0.1}>
            {jobs.map((job) => (
              <StaggerItem key={job.id}>
                <JobCard job={job} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.2}>
            <div className="jobs-cta">
              <p>Aradığınız pozisyonu bulamadınız mı?</p>
              <a href="mailto:kariyer@kademedia.com" className="btn btn-outline">
                <HiOutlineMail size={16} />
                Açık Başvuru Gönderin
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
