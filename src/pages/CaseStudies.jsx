import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineTrendingUp, HiOutlineArrowRight, HiOutlineLightningBolt } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './CaseStudies.css'
import './Blog.css'

const DEFAULT_CONTENT = {
  summaryStats: [
    { value: '%300+', labelTr: 'Ortalama Etkileşim Artışı', labelEn: 'Avg Engagement Growth', ikon: '📈' },
    { value: '10+', labelTr: 'Mutlu Marka', labelEn: 'Happy Brands', ikon: '👥' },
    { value: '5M+', labelTr: 'Toplam Erişim', labelEn: 'Total Reach', ikon: '👁' },
    { value: '6.8x', labelTr: 'En Yüksek ROAS', labelEn: 'Highest ROAS', ikon: '📊' },
  ],
  cases: [
    {
      id: 'flavora',
      client: 'Flavora',
      industryTr: 'Yiyecek & İçecek', industryEn: 'Food & Beverage',
      logo: '🍕', color: '#eac321',
      durationTr: '6 Ay', durationEn: '6 Months',
      platforms: ['Instagram', 'TikTok'],
      challengeTr: 'Flavora, yeni açılan bir restoran zinciri olarak dijital varlığını sıfırdan oluşturmak istiyordu. Marka bilinirliği düşüktü ve yerel pazarda rekabet yoğundu.',
      challengeEn: 'Flavora, as a newly opened restaurant chain, wanted to build its digital presence from scratch. Brand awareness was low and competition in the local market was intense.',
      solutionTr: 'Instagram ve TikTok odaklı bir strateji oluşturduk. Profesyonel fotoğraf çekimleri, viral TikTok içerikleri ve hedefli Meta Ads kampanyaları ile marka bilinirliğini hızla artırdık.',
      solutionEn: 'We created an Instagram and TikTok-focused strategy. We rapidly increased brand awareness through professional photography, viral TikTok content, and targeted Meta Ads campaigns.',
      metrics: [
        { labelTr: 'Takipçi Artışı', labelEn: 'Follower Growth', before: '0', after: '45K', change: '+45K', ikon: '👥' },
        { labelTr: 'Aylık Erişim', labelEn: 'Monthly Reach', before: '0', after: '1.2M', change: '+1.2M', ikon: '👁' },
        { labelTr: 'Etkileşim Oranı', labelEn: 'Engagement Rate', before: '0%', after: '8.5%', change: '8.5%', ikon: '📈' },
        { labelTr: 'Aylık Sipariş Artışı', labelEn: 'Monthly Order Growth', before: '-', after: '+320%', change: '+320%', ikon: '📊' },
      ],
      testimonialTextTr: 'Kade Media ile çalışmaya başladığımızdan beri sosyal medya etkileşimimiz inanılmaz arttı. İlk 6 ayda hedeflerimizin çok üzerinde sonuçlar aldık.',
      testimonialTextEn: 'Since we started working with Kade Media, our social media engagement has increased incredibly. In the first 6 months, we got results far beyond our targets.',
      testimonialName: 'Ahmet Yıldırım',
      testimonialRole: 'CEO, Flavora',
    },
    {
      id: 'techvibe',
      client: 'TechVibe',
      industryTr: 'Teknoloji', industryEn: 'Technology',
      logo: '💻', color: '#6C63FF',
      durationTr: '4 Ay', durationEn: '4 Months',
      platforms: ['Instagram', 'LinkedIn', 'YouTube'],
      challengeTr: 'TechVibe, B2B SaaS ürününün lansmanında hedef kitleye ulaşmakta zorlanıyordu. Organik büyüme yavaştı ve dönüşüm oranları düşüktü.',
      challengeEn: 'TechVibe was struggling to reach its target audience for its B2B SaaS product launch. Organic growth was slow and conversion rates were low.',
      solutionTr: 'LinkedIn thought leadership içerikleri, YouTube ürün tanıtım videoları ve Instagram\'da marka hikayesi anlatımı ile çok kanallı bir strateji uyguladık.',
      solutionEn: 'We implemented a multi-channel strategy with LinkedIn thought leadership content, YouTube product demo videos, and Instagram brand storytelling.',
      metrics: [
        { labelTr: 'Web Trafiği', labelEn: 'Web Traffic', before: '2K/ay', after: '28K/ay', change: '+1300%', ikon: '👁' },
        { labelTr: 'Lead Sayısı', labelEn: 'Lead Count', before: '15/ay', after: '180/ay', change: '+1100%', ikon: '👥' },
        { labelTr: 'Dönüşüm Oranı', labelEn: 'Conversion Rate', before: '0.8%', after: '4.2%', change: '+425%', ikon: '📈' },
        { labelTr: 'Kullanıcı Sayısı', labelEn: 'User Count', before: '500', after: '5K+', change: '+900%', ikon: '📊' },
      ],
      testimonialTextTr: 'Ürün lansmanımız için mükemmel bir strateji oluşturdular. İlk ayda 100K kullanıcıya ulaşmamızda büyük payları var.',
      testimonialTextEn: 'They created a perfect strategy for our product launch. They played a huge role in reaching 100K users in the first month.',
      testimonialName: 'Elif Özkan',
      testimonialRole: 'Marketing Director, TechVibe',
    },
    {
      id: 'greenlife',
      client: 'GreenLife',
      industryTr: 'E-Ticaret', industryEn: 'E-Commerce',
      logo: '🌿', color: '#2ECC71',
      durationTr: '8 Ay', durationEn: '8 Months',
      platforms: ['Instagram', 'TikTok', 'Facebook'],
      challengeTr: 'GreenLife, organik ürünlerini online satmak istiyordu ancak dijital reklam deneyimi yoktu. Reklam harcamaları verimsizdi ve ROAS düşüktü.',
      challengeEn: 'GreenLife wanted to sell their organic products online but had no digital advertising experience. Ad spend was inefficient and ROAS was low.',
      solutionTr: 'Kapsamlı bir funnel stratejisi oluşturduk. TikTok viral içerikleri ile farkındalık, Instagram retargeting ile değerlendirme ve Meta Ads ile dönüşüm aşamalarını optimize ettik.',
      solutionEn: 'We created a comprehensive funnel strategy. We optimized awareness through TikTok viral content, consideration through Instagram retargeting, and conversion through Meta Ads.',
      metrics: [
        { labelTr: 'E-Ticaret Satışları', labelEn: 'E-Commerce Sales', before: '₺25K/ay', after: '₺125K/ay', change: '+400%', ikon: '📊' },
        { labelTr: 'ROAS', labelEn: 'ROAS', before: '1.2x', after: '6.8x', change: '+467%', ikon: '📈' },
        { labelTr: 'Takipçi Artışı', labelEn: 'Follower Growth', before: '3K', after: '65K', change: '+2067%', ikon: '👥' },
        { labelTr: 'Aylık Site Trafiği', labelEn: 'Monthly Site Traffic', before: '5K', after: '80K', change: '+1500%', ikon: '👁' },
      ],
      testimonialTextTr: 'E-ticaret satışlarımız %400 arttı! Kade Media\'nın veri odaklı yaklaşımı ve yaratıcı içerikleri sayesinde organik büyüme hedeflerimize çok kısa sürede ulaştık.',
      testimonialTextEn: 'Our e-commerce sales increased by 400%! Thanks to Kade Media\'s data-driven approach and creative content, we reached our organic growth targets in a very short time.',
      testimonialName: 'Mehmet Kara',
      testimonialRole: 'Founder, GreenLife',
    },
  ],
}

export default function CaseStudies() {
  const { lang } = useLanguage()
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [activeCase, setActiveCase] = useState(null)

  useSEO({
    title: lang === 'tr' ? 'Başarı Hikayeleri | Müşteri Sonuçları' : 'Case Studies | Client Results',
    description: lang === 'tr'
      ? 'Kade Media müşterilerinin gerçek başarı hikayeleri. Sosyal medya yönetimi ve dijital pazarlama ile elde edilen somut sonuçlar.'
      : 'Real success stories from Kade Media clients. Concrete results achieved through social media management and digital marketing.',
    keywords: 'sosyal medya başarı hikayeleri, dijital pazarlama sonuçları, instagram büyüme, tiktok başarı, reklam kampanyası sonuçları',
    path: '/basari-hikayeleri',
  })

  useEffect(() => {
    let cancelled = false
    getContentApi('caseStudies')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setContent(prev => ({
            ...prev,
            ...data,
            summaryStats: Array.isArray(data.summaryStats) && data.summaryStats.length ? data.summaryStats : prev.summaryStats,
            cases: Array.isArray(data.cases) && data.cases.length ? data.cases : prev.cases,
          }))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const selectedCase = activeCase ? content.cases.find(c => c.id === activeCase) : null
  const pickLang = (tr, en) => (lang === 'tr' ? tr : en) || tr || en || ''

  return (
    <PageTransition>
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <StaggerContainer className="case-summary-grid">
            {content.summaryStats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="case-summary-card glass-card">
                  <span style={{ fontSize: '1.6rem' }}>{stat.ikon || '📊'}</span>
                  <div className="case-summary-value">{stat.value}</div>
                  <div className="case-summary-label">{pickLang(stat.labelTr, stat.labelEn)}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="case-grid">
            {content.cases.map((cs, i) => (
              <FadeIn key={cs.id || i} delay={i * 0.1}>
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
                      <span className="case-card-industry">{pickLang(cs.industryTr, cs.industryEn)}</span>
                    </div>
                  </div>

                  <div className="case-card-platforms">
                    {(cs.platforms || []).map(p => <span key={p} className="case-platform-tag">{p}</span>)}
                    <span className="case-duration-tag">{pickLang(cs.durationTr, cs.durationEn)}</span>
                  </div>

                  <div className="case-card-metrics">
                    {(cs.metrics || []).slice(0, 2).map((m, mi) => (
                      <div key={mi} className="case-mini-metric">
                        <span className="case-mini-change" style={{ color: cs.color }}>{m.change}</span>
                        <span className="case-mini-label">{pickLang(m.labelTr, m.labelEn)}</span>
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
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{pickLang(selectedCase.industryTr, selectedCase.industryEn)} • {pickLang(selectedCase.durationTr, selectedCase.durationEn)}</p>
                </div>
              </div>

              <div className="case-modal-body">
                <div className="case-section">
                  <h4>{lang === 'tr' ? '🎯 Zorluk' : '🎯 Challenge'}</h4>
                  <p>{pickLang(selectedCase.challengeTr, selectedCase.challengeEn)}</p>
                </div>

                <div className="case-section">
                  <h4>{lang === 'tr' ? '💡 Çözümümüz' : '💡 Our Solution'}</h4>
                  <p>{pickLang(selectedCase.solutionTr, selectedCase.solutionEn)}</p>
                </div>

                <div className="case-section">
                  <h4>{lang === 'tr' ? '📊 Sonuçlar' : '📊 Results'}</h4>
                  <div className="case-metrics-grid">
                    {(selectedCase.metrics || []).map((m, i) => (
                      <div key={i} className="case-metric-card" style={{ borderLeft: `3px solid ${selectedCase.color}` }}>
                        <span style={{ fontSize: '1.3rem' }}>{m.ikon || '📈'}</span>
                        <div className="case-metric-label">{pickLang(m.labelTr, m.labelEn)}</div>
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

                {(selectedCase.testimonialTextTr || selectedCase.testimonialTextEn) && (
                  <div className="case-section case-testimonial" style={{ borderLeft: `3px solid ${selectedCase.color}` }}>
                    <p>"{pickLang(selectedCase.testimonialTextTr, selectedCase.testimonialTextEn)}"</p>
                    <strong>{selectedCase.testimonialName}</strong>
                    <span>{selectedCase.testimonialRole}</span>
                  </div>
                )}

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
