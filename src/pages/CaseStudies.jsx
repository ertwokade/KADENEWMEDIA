import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineTrendingUp, HiOutlineEye, HiOutlineUsers,
  HiOutlineChartBar, HiOutlineArrowRight, HiOutlineLightningBolt,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './CaseStudies.css'
import './Blog.css'

const caseStudies = [
  {
    id: 'flavora',
    client: 'Flavora',
    industry: { tr: 'Yiyecek & İçecek', en: 'Food & Beverage' },
    logo: '🍕',
    color: '#eac321',
    duration: { tr: '6 Ay', en: '6 Months' },
    platforms: ['Instagram', 'TikTok'],
    services: { tr: ['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi'], en: ['Social Media Management', 'Content Production', 'Ad Management'] },
    challenge: {
      tr: 'Flavora, yeni açılan bir restoran zinciri olarak dijital varlığını sıfırdan oluşturmak istiyordu. Marka bilinirliği düşüktü ve yerel pazarda rekabet yoğundu.',
      en: 'Flavora, as a newly opened restaurant chain, wanted to build its digital presence from scratch. Brand awareness was low and competition in the local market was intense.',
    },
    solution: {
      tr: 'Instagram ve TikTok odaklı bir strateji oluşturduk. Profesyonel fotoğraf çekimleri, viral TikTok içerikleri ve hedefli Meta Ads kampanyaları ile marka bilinirliğini hızla artırdık.',
      en: 'We created an Instagram and TikTok-focused strategy. We rapidly increased brand awareness through professional photography, viral TikTok content, and targeted Meta Ads campaigns.',
    },
    metrics: [
      { label: { tr: 'Takipçi Artışı', en: 'Follower Growth' }, before: '0', after: '45K', change: '+45K', icon: HiOutlineUsers },
      { label: { tr: 'Aylık Erişim', en: 'Monthly Reach' }, before: '0', after: '1.2M', change: '+1.2M', icon: HiOutlineEye },
      { label: { tr: 'Etkileşim Oranı', en: 'Engagement Rate' }, before: '0%', after: '8.5%', change: '8.5%', icon: HiOutlineTrendingUp },
      { label: { tr: 'Aylık Sipariş Artışı', en: 'Monthly Order Growth' }, before: '-', after: '+320%', change: '+320%', icon: HiOutlineChartBar },
    ],
    testimonial: {
      text: { tr: 'Kade Media ile çalışmaya başladığımızdan beri sosyal medya etkileşimimiz inanılmaz arttı. İlk 6 ayda hedeflerimizin çok üzerinde sonuçlar aldık.', en: 'Since we started working with Kade Media, our social media engagement has increased incredibly. In the first 6 months, we got results far beyond our targets.' },
      name: 'Ahmet Yıldırım',
      role: 'CEO, Flavora',
    },
  },
  {
    id: 'techvibe',
    client: 'TechVibe',
    industry: { tr: 'Teknoloji', en: 'Technology' },
    logo: '💻',
    color: '#6C63FF',
    duration: { tr: '4 Ay', en: '4 Months' },
    platforms: ['Instagram', 'LinkedIn', 'YouTube'],
    services: { tr: ['Dijital Strateji', 'İçerik Pazarlama', 'Video Prodüksiyon'], en: ['Digital Strategy', 'Content Marketing', 'Video Production'] },
    challenge: {
      tr: 'TechVibe, B2B SaaS ürününün lansmanında hedef kitleye ulaşmakta zorlanıyordu. Organik büyüme yavaştı ve dönüşüm oranları düşüktü.',
      en: 'TechVibe was struggling to reach its target audience for its B2B SaaS product launch. Organic growth was slow and conversion rates were low.',
    },
    solution: {
      tr: 'LinkedIn thought leadership içerikleri, YouTube ürün tanıtım videoları ve Instagram\'da marka hikayesi anlatımı ile çok kanallı bir strateji uyguladık.',
      en: 'We implemented a multi-channel strategy with LinkedIn thought leadership content, YouTube product demo videos, and Instagram brand storytelling.',
    },
    metrics: [
      { label: { tr: 'Web Trafiği', en: 'Web Traffic' }, before: '2K/ay', after: '28K/ay', change: '+1300%', icon: HiOutlineEye },
      { label: { tr: 'Lead Sayısı', en: 'Lead Count' }, before: '15/ay', after: '180/ay', change: '+1100%', icon: HiOutlineUsers },
      { label: { tr: 'Dönüşüm Oranı', en: 'Conversion Rate' }, before: '0.8%', after: '4.2%', change: '+425%', icon: HiOutlineTrendingUp },
      { label: { tr: 'Kullanıcı Sayısı', en: 'User Count' }, before: '500', after: '5K+', change: '+900%', icon: HiOutlineChartBar },
    ],
    testimonial: {
      text: { tr: 'Ürün lansmanımız için mükemmel bir strateji oluşturdular. İlk ayda 100K kullanıcıya ulaşmamızda büyük payları var.', en: 'They created a perfect strategy for our product launch. They played a huge role in reaching 100K users in the first month.' },
      name: 'Elif Özkan',
      role: 'Marketing Director, TechVibe',
    },
  },
  {
    id: 'greenlife',
    client: 'GreenLife',
    industry: { tr: 'E-Ticaret', en: 'E-Commerce' },
    logo: '🌿',
    color: '#2ECC71',
    duration: { tr: '8 Ay', en: '8 Months' },
    platforms: ['Instagram', 'TikTok', 'Facebook'],
    services: { tr: ['Reklam Yönetimi', 'Sosyal Medya Yönetimi', 'İçerik Üretimi'], en: ['Ad Management', 'Social Media Management', 'Content Production'] },
    challenge: {
      tr: 'GreenLife, organik ürünlerini online satmak istiyordu ancak dijital reklam deneyimi yoktu. Reklam harcamaları verimsizdi ve ROAS düşüktü.',
      en: 'GreenLife wanted to sell their organic products online but had no digital advertising experience. Ad spend was inefficient and ROAS was low.',
    },
    solution: {
      tr: 'Kapsamlı bir funnel stratejisi oluşturduk. TikTok viral içerikleri ile farkındalık, Instagram retargeting ile değerlendirme ve Meta Ads ile dönüşüm aşamalarını optimize ettik.',
      en: 'We created a comprehensive funnel strategy. We optimized awareness through TikTok viral content, consideration through Instagram retargeting, and conversion through Meta Ads.',
    },
    metrics: [
      { label: { tr: 'E-Ticaret Satışları', en: 'E-Commerce Sales' }, before: '₺25K/ay', after: '₺125K/ay', change: '+400%', icon: HiOutlineChartBar },
      { label: { tr: 'ROAS', en: 'ROAS' }, before: '1.2x', after: '6.8x', change: '+467%', icon: HiOutlineTrendingUp },
      { label: { tr: 'Takipçi Artışı', en: 'Follower Growth' }, before: '3K', after: '65K', change: '+2067%', icon: HiOutlineUsers },
      { label: { tr: 'Aylık Site Trafiği', en: 'Monthly Site Traffic' }, before: '5K', after: '80K', change: '+1500%', icon: HiOutlineEye },
    ],
    testimonial: {
      text: { tr: 'E-ticaret satışlarımız %400 arttı! Kade Media\'nın veri odaklı yaklaşımı ve yaratıcı içerikleri sayesinde organik büyüme hedeflerimize çok kısa sürede ulaştık.', en: 'Our e-commerce sales increased by 400%! Thanks to Kade Media\'s data-driven approach and creative content, we reached our organic growth targets in a very short time.' },
      name: 'Mehmet Kara',
      role: 'Founder, GreenLife',
    },
  },
]

export default function CaseStudies() {
  const { lang } = useLanguage()
  const [activeCase, setActiveCase] = useState(null)

  useSEO({
    title: lang === 'tr' ? 'Başarı Hikayeleri | Müşteri Sonuçları' : 'Case Studies | Client Results',
    description: lang === 'tr'
      ? 'Kade Media müşterilerinin gerçek başarı hikayeleri. Sosyal medya yönetimi ve dijital pazarlama ile elde edilen somut sonuçlar.'
      : 'Real success stories from Kade Media clients. Concrete results achieved through social media management and digital marketing.',
    keywords: 'sosyal medya başarı hikayeleri, dijital pazarlama sonuçları, instagram büyüme, tiktok başarı, reklam kampanyası sonuçları',
    path: '/basari-hikayeleri',
  })

  const selectedCase = activeCase ? caseStudies.find(c => c.id === activeCase) : null

  return (
    <PageTransition>
      {/* Hero */}
      <section className="blog-hero">
        <PageBgAnimation type="home" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineTrendingUp size={14} />
              {lang === 'tr' ? 'Başarı Hikayeleri' : 'Case Studies'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
              {lang === 'tr' ? 'Gerçek Sonuçlar, ' : 'Real Results, '}
              <span className="gradient-text">{lang === 'tr' ? 'Gerçek Büyüme' : 'Real Growth'}</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle" style={{ maxWidth: 640, margin: '0 auto' }}>
              {lang === 'tr'
                ? 'Müşterilerimizle birlikte elde ettiğimiz somut sonuçları ve büyüme hikayelerini keşfedin.'
                : 'Discover the concrete results and growth stories we achieved together with our clients.'}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <StaggerContainer className="case-summary-grid">
            {[
              { value: '%300+', label: { tr: 'Ortalama Etkileşim Artışı', en: 'Avg Engagement Growth' }, icon: HiOutlineTrendingUp },
              { value: '10+', label: { tr: 'Mutlu Marka', en: 'Happy Brands' }, icon: HiOutlineUsers },
              { value: '5M+', label: { tr: 'Toplam Erişim', en: 'Total Reach' }, icon: HiOutlineEye },
              { value: '6.8x', label: { tr: 'En Yüksek ROAS', en: 'Highest ROAS' }, icon: HiOutlineChartBar },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="case-summary-card glass-card">
                  <stat.icon size={24} style={{ color: '#eac321' }} />
                  <div className="case-summary-value">{stat.value}</div>
                  <div className="case-summary-label">{stat.label[lang]}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Case Study Cards */}
      <section className="section">
        <div className="container">
          <div className="case-grid">
            {caseStudies.map((cs, i) => (
              <FadeIn key={cs.id} delay={i * 0.1}>
                <motion.div
                  className="case-card glass-card"
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveCase(cs.id)}
                  style={{ borderTop: `3px solid ${cs.color}`, cursor: 'pointer' }}
                >
                  <div className="case-card-header">
                    <div className="case-card-logo" style={{ background: `${cs.color}20`, color: cs.color }}>{cs.logo}</div>
                    <div>
                      <h3>{cs.client}</h3>
                      <span className="case-card-industry">{cs.industry[lang]}</span>
                    </div>
                  </div>

                  <div className="case-card-platforms">
                    {cs.platforms.map(p => <span key={p} className="case-platform-tag">{p}</span>)}
                    <span className="case-duration-tag">{cs.duration[lang]}</span>
                  </div>

                  <div className="case-card-metrics">
                    {cs.metrics.slice(0, 2).map((m, mi) => (
                      <div key={mi} className="case-mini-metric">
                        <span className="case-mini-change" style={{ color: cs.color }}>{m.change}</span>
                        <span className="case-mini-label">{m.label[lang]}</span>
                      </div>
                    ))}
                  </div>

                  <button className="case-card-cta">
                    {lang === 'tr' ? 'Detayları Gör' : 'View Details'} <HiOutlineArrowRight size={14} />
                  </button>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Modal */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            className="case-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActiveCase(null)}
          >
            <motion.div
              className="case-modal glass-card"
              initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="case-modal-close" onClick={() => setActiveCase(null)}>✕</button>

              <div className="case-modal-header" style={{ borderBottom: `2px solid ${selectedCase.color}20` }}>
                <div className="case-card-logo" style={{ background: `${selectedCase.color}20`, color: selectedCase.color, fontSize: 32, width: 64, height: 64 }}>{selectedCase.logo}</div>
                <div>
                  <h2>{selectedCase.client}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{selectedCase.industry[lang]} • {selectedCase.duration[lang]}</p>
                </div>
              </div>

              <div className="case-modal-body">
                <div className="case-section">
                  <h4>{lang === 'tr' ? '🎯 Zorluk' : '🎯 Challenge'}</h4>
                  <p>{selectedCase.challenge[lang]}</p>
                </div>

                <div className="case-section">
                  <h4>{lang === 'tr' ? '💡 Çözümümüz' : '💡 Our Solution'}</h4>
                  <p>{selectedCase.solution[lang]}</p>
                </div>

                <div className="case-section">
                  <h4>{lang === 'tr' ? '📊 Sonuçlar' : '📊 Results'}</h4>
                  <div className="case-metrics-grid">
                    {selectedCase.metrics.map((m, i) => (
                      <div key={i} className="case-metric-card" style={{ borderLeft: `3px solid ${selectedCase.color}` }}>
                        <m.icon size={20} style={{ color: selectedCase.color }} />
                        <div className="case-metric-label">{m.label[lang]}</div>
                        <div className="case-metric-row">
                          <span className="case-metric-before">{m.before}</span>
                          <span className="case-metric-arrow">→</span>
                          <span className="case-metric-after" style={{ color: selectedCase.color }}>{m.after}</span>
                        </div>
                        <div className="case-metric-change" style={{ color: selectedCase.color }}>{m.change}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="case-section case-testimonial" style={{ borderLeft: `3px solid ${selectedCase.color}` }}>
                  <p>"{selectedCase.testimonial.text[lang]}"</p>
                  <strong>{selectedCase.testimonial.name}</strong>
                  <span>{selectedCase.testimonial.role}</span>
                </div>

                <div className="case-modal-cta">
                  <p>{lang === 'tr' ? 'Sıradaki başarı hikayesi sizinki olsun.' : 'Let the next success story be yours.'}</p>
                  <Link to="/iletisim" className="btn btn-primary" onClick={() => setActiveCase(null)}>
                    {lang === 'tr' ? 'Ücretsiz Strateji Görüşmesi Al' : 'Get a Free Strategy Call'}
                    <HiOutlineArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="case-bottom-cta glass-card">
              <HiOutlineLightningBolt size={32} style={{ color: '#eac321' }} />
              <h2>{lang === 'tr' ? 'Markanızı Büyütmeye Hazır mısınız?' : 'Ready to Grow Your Brand?'}</h2>
              <p>{lang === 'tr'
                ? 'Ücretsiz 30 dakikalık strateji görüşmesi ile markanız için özel bir büyüme planı oluşturalım.'
                : 'Let us create a custom growth plan for your brand with a free 30-minute strategy call.'}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">
                  {lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Get a Free Consultation'} <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/paketler" className="btn btn-outline">
                  {lang === 'tr' ? 'Paketleri İncele' : 'View Packages'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
