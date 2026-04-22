import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getContentApi } from '../api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineGlobe,
  HiOutlineUsers,
  HiOutlinePlay,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineOfficeBuilding,
  HiOutlineChatAlt2,
} from 'react-icons/hi'
import {
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
  FaQuoteLeft,
} from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { partnersData as staticPartnersData } from '../data/content'
import { getPartnersApi } from '../api'
import PageTransition from '../components/PageTransition'
import HeroBackground from '../components/HeroBackground'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '../components/Animations'
import AuditScore from '../components/AuditScore'
import PageBgAnimation from '../components/PageBgAnimation'
import LazyYouTubeEmbed from '../components/LazyYouTubeEmbed'
import CountUp from '../components/CountUp'
import './Home.css'

const platforms = [
  { icon: FaInstagram, name: 'Instagram', url: 'https://instagram.com/kademediacom' },
  { icon: FaYoutube, name: 'YouTube', url: 'https://www.youtube.com/@kademediacom' },
  { icon: FaTiktok, name: 'TikTok', url: 'https://tiktok.com/@kademediacom' },
  { icon: FaLinkedinIn, name: 'LinkedIn', url: 'https://www.linkedin.com/company/kademediaagency' },
]

const testimonials = [
  {
    nameTr: 'Ahmet Yıldırım',
    nameEn: 'Ahmet Yıldırım',
    roleTr: 'CEO, Flavora',
    roleEn: 'CEO, Flavora',
    textTr: 'Kade Media ile çalışmaya başladığımızdan beri sosyal medya etkileşimimiz %300 arttı. Profesyonel ekipleri ve yaratıcı içerikleriyle markamızı bambaşka bir seviyeye taşıdılar.',
    textEn: 'Since we started working with Kade Media, our social media engagement has increased by 300%. They took our brand to a whole new level with their professional team and creative content.',
    avatar: 'AY',
    color: '#eac321',
  },
  {
    nameTr: 'Elif Özkan',
    nameEn: 'Elif Özkan',
    roleTr: 'Marketing Director, TechVibe',
    roleEn: 'Marketing Director, TechVibe',
    textTr: 'Ürün lansmanımız için mükemmel bir strateji oluşturdular. İlk ayda 100K kullanıcıya ulaşmamızda büyük payları var. Kesinlikle tavsiye ediyorum.',
    textEn: 'They created a perfect strategy for our product launch. They played a huge role in reaching 100K users in the first month. Highly recommended.',
    avatar: 'EÖ',
    color: '#6C63FF',
  },
  {
    nameTr: 'Mehmet Kara',
    nameEn: 'Mehmet Kara',
    roleTr: 'Founder, GreenLife',
    roleEn: 'Founder, GreenLife',
    textTr: 'E-ticaret satışlarımız %400 arttı! Kade Media\'nın veri odaklı yaklaşımı ve yaratıcı içerikleri sayesinde organik büyüme hedeflerimize çok kısa sürede ulaştık.',
    textEn: 'Our e-commerce sales increased by 400%! Thanks to Kade Media\'s data-driven approach and creative content, we reached our organic growth targets in a very short time.',
    avatar: 'MK',
    color: '#2ECC71',
  },
]

const faqData = {
  tr: [
    { q: 'Kade Media ne tür hizmetler sunuyor?', a: 'Sosyal medya yönetimi, içerik üretimi, reklam yönetimi (Meta, Google, TikTok), video prodüksiyon ve dijital strateji danışmanlığı hizmetleri sunuyoruz.' },
    { q: 'Minimum sözleşme süresi ne kadar?', a: 'Minimum 3 aylık sözleşme yapıyoruz. Dijital pazarlamada sonuçlar zaman alır, bu süre stratejimizin etkisini görmeniz için idealdir.' },
    { q: 'Reklam bütçesi paket fiyatına dahil mi?', a: 'Hayır, reklam bütçesi paket fiyatlarına dahil değildir. Reklam yönetim hizmeti dahildir ancak reklam harcaması ayrıca faturalandırılır.' },
    { q: 'Sonuçları ne zaman görmeye başlarım?', a: 'Organik büyüme stratejilerinde 1-3 ay içinde belirgin sonuçlar görülebilir. Reklam kampanyalarında ise ilk hafta içinde sonuçlar alınmaya başlanır.' },
    { q: 'Hangi sektörlere hizmet veriyorsunuz?', a: 'Yiyecek & içecek, teknoloji, moda, sağlık, fitness, e-ticaret ve daha birçok sektörde deneyimimiz var. Her sektöre özel stratejiler geliştiriyoruz.' },
  ],
  en: [
    { q: 'What kind of services does Kade Media offer?', a: 'We offer social media management, content production, ad management (Meta, Google, TikTok), video production, and digital strategy consulting services.' },
    { q: 'What is the minimum contract period?', a: 'We require a minimum 3-month contract. Results in digital marketing take time, and this period is ideal for seeing the impact of our strategy.' },
    { q: 'Is the ad budget included in the package price?', a: 'No, the ad budget is not included in package prices. Ad management service is included, but ad spend is billed separately.' },
    { q: 'When will I start seeing results?', a: 'Organic growth strategies can show significant results within 1-3 months. For ad campaigns, results can be seen within the first week.' },
    { q: 'Which industries do you serve?', a: 'We have experience in food & beverage, technology, fashion, health, fitness, e-commerce, and many more sectors. We develop custom strategies for each industry.' },
  ],
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div className={`faq-item glass-card ${open ? 'open' : ''}`} layout>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{faq.q}</span>
        {open ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="faq-answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Home() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Sosyal Medya Ajansı İstanbul | Dijital Pazarlama',
    description: 'Kade Media, İstanbul merkezli profesyonel sosyal medya yönetimi ve dijital pazarlama ajansı. Instagram, TikTok, YouTube yönetimi, içerik üretimi ve reklam danışmanlığı.',
    keywords: 'sosyal medya ajansı istanbul, dijital pazarlama ajansı, instagram yönetimi, tiktok yönetimi, sosyal medya yönetimi, içerik üretimi ajansı, kade media',
    path: '/',
  })

  // Hero text from translations — API can override
  const heroDefaults = {
    title1: t('hero.title1'),
    title2: t('hero.title2'),
    subtitle: t('hero.subtitle'),
  }
  const [heroOverride, setHeroOverride] = useState(null)
  const [dynamicStats, setDynamicStats] = useState(null)
  const [dynamicFaq, setDynamicFaq] = useState(null)
  const [dynamicTestimonials, setDynamicTestimonials] = useState(null)
  const [partnersData, setPartnersData] = useState(staticPartnersData)

  // FAQ Schema Markup (Google Rich Snippets)
  useEffect(() => {
    const faqItems = dynamicFaq?.[lang]?.length > 0 ? dynamicFaq[lang] : faqData[lang]
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }
    const el = document.getElementById('jsonld-faq')
    if (el) { el.textContent = JSON.stringify(faqSchema) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-faq'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(faqSchema)
      document.head.appendChild(s)
    }
    return () => { document.getElementById('jsonld-faq')?.remove() }
  }, [lang, dynamicFaq])

  // LocalBusiness Schema
  useEffect(() => {
    const bizSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Kade Media',
      description: 'İstanbul merkezli profesyonel sosyal medya yönetimi ve dijital pazarlama ajansı.',
      url: 'https://kademedia.com.tr',
      logo: 'https://kademedia.com.tr/logo.png',
      telephone: '+905067293423',
      email: 'hello@kademedia.com',
      address: { '@type': 'PostalAddress', streetAddress: 'Biruni Teknopark', addressLocality: 'Zeytinburnu', addressRegion: 'İstanbul', addressCountry: 'TR' },
      areaServed: { '@type': 'Country', name: 'Turkey' },
      priceRange: '₺₺',
      openingHours: 'Mo-Fr 09:00-18:00',
      sameAs: [
        'https://instagram.com/kademediacom',
        'https://www.youtube.com/@kademediacom',
        'https://tiktok.com/@kademediacom',
        'https://www.linkedin.com/company/kademediaagency',
      ],
    }
    const el = document.getElementById('jsonld-business')
    if (el) { el.textContent = JSON.stringify(bizSchema) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-business'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(bizSchema)
      document.head.appendChild(s)
    }
    return () => { document.getElementById('jsonld-business')?.remove() }
  }, [])

  // Load overrides from API once
  useEffect(() => {
    let cancelled = false
    const loadFromApi = async () => {
      try {
        const heroData = await getContentApi('hero')
        if (!cancelled && heroData?.data) setHeroOverride(heroData.data)
      } catch { /* use defaults */ }

      try {
        const statsData = await getContentApi('stats')
        if (!cancelled && statsData?.data) setDynamicStats(statsData.data)
      } catch { /* use defaults */ }

      try {
        const faqRes = await getContentApi('faq')
        if (!cancelled && faqRes?.data?.tr?.length) setDynamicFaq(faqRes.data)
      } catch { /* use defaults */ }

      try {
        const testimonialsData = await getContentApi('testimonials')
        if (!cancelled && testimonialsData?.data?.items?.length) setDynamicTestimonials(testimonialsData.data.items)
      } catch { /* use defaults */ }

      try {
        const apiPartners = await getPartnersApi()
        if (!cancelled && Array.isArray(apiPartners) && apiPartners.length > 0) {
          // Merge: API partners override static by id, new ones appended
          const idMap = new Map(apiPartners.map(p => [p.id || p.slug, p]))
          const merged = staticPartnersData.map(p => idMap.get(p.id) || p)
          const existingIds = new Set(staticPartnersData.map(p => p.id))
          const newPartners = apiPartners.filter(p => !existingIds.has(p.id))
          setPartnersData([...merged, ...newPartners])
        }
      } catch { /* use static */ }
    }

    loadFromApi()
    return () => { cancelled = true }
  }, [])

  // Derive hero texts: always use current translation, override only if API has data for current lang
  const heroTexts = {
    title1: heroOverride?.[lang]?.title1 || heroDefaults.title1,
    title2: heroOverride?.[lang]?.title2 || heroDefaults.title2,
    subtitle: heroOverride?.[lang]?.subtitle || heroDefaults.subtitle,
  }

  const services = [
    { icon: HiOutlineGlobe, title: t('servicesSection.smm'), desc: t('servicesSection.smmDesc') },
    { icon: HiOutlineLightningBolt, title: t('servicesSection.content'), desc: t('servicesSection.contentDesc') },
    { icon: HiOutlineChartBar, title: t('servicesSection.ads'), desc: t('servicesSection.adsDesc') },
    { icon: HiOutlinePlay, title: t('contact.videoProduction'), desc: t('services.videoDesc') },
  ]

  const stats = [
    { number: dynamicStats?.clients ?? '10+', label: t('stats.clients') },
    { number: dynamicStats?.followers ?? '500+', label: t('stats.followers') },
    { number: dynamicStats?.campaigns ?? '50+', label: t('stats.campaigns') },
    { number: dynamicStats?.satisfaction ?? '98%', label: t('stats.satisfaction') },
  ]

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-3d">
          <HeroBackground />
        </div>
        <div className="grid-bg" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container hero-content">
          <FadeIn delay={0.1}>
            <h1 className="hero-title hero-gradient-text">
              {heroTexts.title1}
              <br />
              <span className="hero-highlight">{heroTexts.title2}</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="hero-subtitle">{heroTexts.subtitle}</p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="hero-actions">
              <Link to="/iletisim" className="btn btn-primary">
                {t('hero.cta1')}
                <HiOutlineArrowRight size={18} />
              </Link>
              <Link to="/hizmetler" className="btn btn-outline">
                <HiOutlinePlay size={18} />
                {t('hero.cta2')}
              </Link>
            </div>
          </FadeIn>


          <FadeIn delay={0.3}>
            <div className="hero-platforms">
              <span className="platforms-label">{t('hero.platforms')}</span>
              <div className="platform-icons">
                {platforms.map((p, i) => (
                  <motion.a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="platform-icon"
                    whileHover={{ scale: 1.2, y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    title={p.name}
                  >
                    <p.icon size={20} />
                  </motion.a>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="hero-scroll-indicator">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="scroll-dot"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <StaggerContainer className="stats-grid" staggerDelay={0.1}>
            {stats.map((stat) => {
              const raw = String(stat.number)
              const match = raw.match(/^([\d.,]+)(.*)$/)
              const num = match ? parseFloat(match[1].replace(',', '.')) : null
              const suffix = match ? match[2] : ''
              return (
                <StaggerItem key={stat.label}>
                  <div className="stat-card glass-card">
                    <div className="stat-number">
                      {num != null && !Number.isNaN(num) ? (
                        <CountUp to={num} suffix={suffix} duration={1600} decimals={Number.isInteger(num) ? 0 : 1} />
                      ) : (
                        raw
                      )}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section services-preview">
        <div className="glow-effect" style={{ top: '-100px', right: '-100px' }} />
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineLightningBolt size={14} />
                {t('servicesSection.badge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                {t('servicesSection.title')} <span>{t('servicesSection.titleHighlight')}</span> {t('servicesSection.titleEnd')}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">{t('servicesSection.subtitle')}</p>
            </FadeIn>
          </div>

          <StaggerContainer className="services-grid" staggerDelay={0.1}>
            {services.map((service, index) => (
              <StaggerItem key={index}>
                <motion.div className="service-card glass-card" whileHover={{ scale: 1.02 }}>
                  <div className="service-icon-wrapper">
                    <service.icon size={28} />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                  <div className="service-number">0{index + 1}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.3}>
            <div className="services-cta">
              <Link to="/hizmetler" className="btn btn-outline">
                {t('servicesSection.viewAll')}
                <HiOutlineArrowRight size={18} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Partners Preview */}
      <section className="section partners-preview-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineOfficeBuilding size={14} />
                {t('partnersSection.badge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                <span>{t('partnersSection.title')}</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">{t('partnersSection.subtitle')}</p>
            </FadeIn>
          </div>

          <StaggerContainer className="partners-preview-grid" staggerDelay={0.08}>
            {partnersData.slice(0, 6).map((partner, idx) => (
              <StaggerItem key={partner.id || partner.slug || String(partner._id) || idx}>
                <Link to={`/partnerler/${partner.id || partner.slug || String(partner._id)}`}>
                  <motion.div
                    className="partner-preview-card glass-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="partner-preview-logo" style={{ background: `${partner.color}12` }}>
                      {partner.logo && (partner.logo.startsWith('data:') || partner.logo.startsWith('http'))
                        ? <img src={partner.logo} alt={partner.name} style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: 4 }} />
                        : <span>{partner.logo}</span>
                      }
                    </div>
                    <h4>{partner.name}</h4>
                    <span className="partner-preview-category" style={{ color: partner.color }}>
                      {lang === 'tr' ? partner.category : partner.categoryEn}
                    </span>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.3}>
            <div className="services-cta">
              <Link to="/partnerler" className="btn btn-outline">
                {t('partnersSection.viewAll')}
                <HiOutlineArrowRight size={18} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials-section">
        <div className="glow-effect" style={{ top: '50%', left: '-200px', transform: 'translateY(-50%)' }} />
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineChatAlt2 size={14} />
                {t('testimonials.badge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                <span>{t('testimonials.title')}</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">{t('testimonials.subtitle')}</p>
            </FadeIn>
          </div>

          <StaggerContainer className="testimonials-grid" staggerDelay={0.15}>
            {(dynamicTestimonials?.length > 0 ? dynamicTestimonials : testimonials).map((item, i) => (
              <StaggerItem key={i}>
                <motion.div className="testimonial-card glass-card" whileHover={{ y: -4 }}>
                  <FaQuoteLeft className="testimonial-quote" size={24} />
                  <p className="testimonial-text">
                    {lang === 'tr' ? item.textTr : item.textEn}
                  </p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar" style={{ background: `${item.color}25`, color: item.color }}>
                      {item.avatar}
                    </div>
                    <div>
                      <span className="testimonial-name">{lang === 'tr' ? item.nameTr : item.nameEn}</span>
                      <span className="testimonial-role">{lang === 'tr' ? item.roleTr : item.roleEn}</span>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-home-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineChatAlt2 size={14} />
                {t('faq.badge')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                <span>{t('faq.title')}</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">{t('faq.subtitle')}</p>
            </FadeIn>
          </div>

          <div className="faq-list">
            {(dynamicFaq?.[lang]?.length > 0 ? dynamicFaq[lang] : faqData[lang]).map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <FAQItem faq={faq} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Score */}
      <AuditScore />

      {/* Video Showreel */}
      <section className="section video-showreel-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlinePlay size={14} />
                {lang === 'tr' ? 'Video İçeriklerimiz' : 'Our Videos'}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                {lang === 'tr' ? <>YouTube'da <span>Kade Media</span></> : <>Kade Media on <span>YouTube</span></>}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">
                {lang === 'tr'
                  ? 'Sosyal medya ipuçları, vaka çalışmaları ve ajans içeriklerimizi YouTube kanalımızda takip edin.'
                  : 'Follow social media tips, case studies, and agency content on our YouTube channel.'}
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <div className="video-showreel-embed glass-card">
              <div className="video-embed-wrapper">
                <LazyYouTubeEmbed
                  embedSrc="https://www.youtube.com/embed?listType=user_uploads&list=kademediacom&rel=0&autoplay=1"
                  title="Kade Media YouTube"
                  channelUrl="https://www.youtube.com/@kademediacom"
                  thumbnail="/og-image.svg"
                />
              </div>
              <div className="video-showreel-cta">
                <a
                  href="https://www.youtube.com/@kademediacom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <FaYoutube size={18} />
                  {lang === 'tr' ? 'Kanalı Takip Et' : 'Subscribe to Channel'}
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Location */}
      <section className="section location-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineOfficeBuilding size={14} />
                {t('contact.locationTitle')}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                Biruni <span>Teknopark</span>
              </h2>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <div className="location-card glass-card">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6!2d28.906!3d41.004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa5307e731e3f%3A0x6b0e61f4c5c9a6e8!2sBiruni+Teknopark!5e0!3m2!1str!2str!4v1700000000000"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '16px', display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Biruni Teknopark"
              />
              <div className="location-footer">
                <span className="location-address">📍 Biruni Teknopark, Kazlıçeşme, Zeytinburnu/İstanbul</span>
                <a
                  href="https://maps.app.goo.gl/Zy5j7cpcwP5y99Wx7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  {t('contact.getDirections')}
                  <HiOutlineArrowRight size={16} />
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="grid-bg" />
        <div className="container">
          <ScaleIn>
            <div className="cta-content glass-card">
              <h2>
                {t('cta.title1')} <span>{t('cta.titleHighlight')}</span> {t('cta.title2')}
              </h2>
              <p>{t('cta.subtitle')}</p>
              <div className="cta-actions">
                <Link to="/iletisim" className="btn btn-primary">
                  {t('cta.btn1')}
                  <HiOutlineArrowRight size={18} />
                </Link>
                <Link to="/paketler" className="btn btn-outline">
                  {t('cta.btn2')}
                </Link>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>
    </PageTransition>
  )
}
