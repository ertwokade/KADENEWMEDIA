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
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { partnersData } from '../data/content'
import PageTransition from '../components/PageTransition'
import HeroBackground from '../components/HeroBackground'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '../components/Animations'
import AuditScore from '../components/AuditScore'
import PageBgAnimation from '../components/PageBgAnimation'
import './Home.css'

const platforms = [
  { icon: FaInstagram, name: 'Instagram', url: 'https://instagram.com/kademediacom' },
  { icon: FaXTwitter, name: 'X', url: 'https://x.com/kademediacom' },
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
    { q: 'Kade Media ne tür hizmetler sunuyor?', a: 'Sosyal medya yönetimi, içerik üretimi, reklam yönetimi (Meta, Google, TikTok), influencer marketing, video prodüksiyon ve dijital strateji danışmanlığı hizmetleri sunuyoruz.' },
    { q: 'Minimum sözleşme süresi ne kadar?', a: 'Minimum 3 aylık sözleşme yapıyoruz. Dijital pazarlamada sonuçlar zaman alır, bu süre stratejimizin etkisini görmeniz için idealdir.' },
    { q: 'Reklam bütçesi paket fiyatına dahil mi?', a: 'Hayır, reklam bütçesi paket fiyatlarına dahil değildir. Reklam yönetim hizmeti dahildir ancak reklam harcaması ayrıca faturalandırılır.' },
    { q: 'Sonuçları ne zaman görmeye başlarım?', a: 'Organik büyüme stratejilerinde 1-3 ay içinde belirgin sonuçlar görülebilir. Reklam kampanyalarında ise ilk hafta içinde sonuçlar alınmaya başlanır.' },
    { q: 'Hangi sektörlere hizmet veriyorsunuz?', a: 'Yiyecek & içecek, teknoloji, moda, sağlık, fitness, e-ticaret ve daha birçok sektörde deneyimimiz var. Her sektöre özel stratejiler geliştiriyoruz.' },
  ],
  en: [
    { q: 'What kind of services does Kade Media offer?', a: 'We offer social media management, content production, ad management (Meta, Google, TikTok), influencer marketing, video production, and digital strategy consulting services.' },
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
  
  // Admin Panel Overrides State
  const [heroTexts, setHeroTexts] = useState({
    title1: t('hero.title1'),
    title2: t('hero.title2'),
    subtitle: t('hero.subtitle')
  })

  const [dynamicStats, setDynamicStats] = useState(null)
  const [dynamicFaq, setDynamicFaq] = useState(null)
  const [dynamicTestimonials, setDynamicTestimonials] = useState(null)

  // Load texts from API, always fallback to translation defaults
  useEffect(() => {
    const defaults = {
      title1: t('hero.title1'),
      title2: t('hero.title2'),
      subtitle: t('hero.subtitle'),
    }

    // Set defaults immediately so language switch is instant
    setHeroTexts(defaults)

    const loadFromApi = async () => {
      try {
        const heroData = await getContentApi('hero')
        if (heroData?.data?.[lang]) {
          setHeroTexts({
            title1: heroData.data[lang].title1 || defaults.title1,
            title2: heroData.data[lang].title2 || defaults.title2,
            subtitle: heroData.data[lang].subtitle || defaults.subtitle,
          })
        }
      } catch {
        // already set defaults above
      }

      try {
        const statsData = await getContentApi('stats')
        if (statsData?.data) {
          setDynamicStats(statsData.data)
        }
      } catch {
        // use defaults
      }

      try {
        const faqData = await getContentApi('faq')
        if (faqData?.data?.tr?.length) {
          setDynamicFaq(faqData.data)
        }
      } catch {}

      try {
        const testimonialsData = await getContentApi('testimonials')
        if (testimonialsData?.data?.items?.length) {
          setDynamicTestimonials(testimonialsData.data.items)
        }
      } catch {}
    }

    loadFromApi()
  }, [lang, t])

  const services = [
    { icon: HiOutlineGlobe, title: t('servicesSection.smm'), desc: t('servicesSection.smmDesc') },
    { icon: HiOutlineLightningBolt, title: t('servicesSection.content'), desc: t('servicesSection.contentDesc') },
    { icon: HiOutlineChartBar, title: t('servicesSection.ads'), desc: t('servicesSection.adsDesc') },
    { icon: HiOutlineUsers, title: t('servicesSection.influencer'), desc: t('servicesSection.influencerDesc') },
  ]

  const stats = [
    { number: dynamicStats?.clients || '10+', label: t('stats.clients') },
    { number: dynamicStats?.followers || '500+', label: t('stats.followers') },
    { number: dynamicStats?.campaigns || '50+', label: t('stats.campaigns') },
    { number: dynamicStats?.satisfaction || '98%', label: t('stats.satisfaction') },
  ]

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="hero">
        <PageBgAnimation type="home" />
        <div className="hero-3d">
          <HeroBackground />
        </div>
        <div className="grid-bg" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container hero-content">
          <FadeIn delay={0.3}>
            <h1 className="hero-title hero-gradient-text">
              {heroTexts.title1}
              <br />
              <span className="hero-highlight">{heroTexts.title2}</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="hero-subtitle">{heroTexts.subtitle}</p>
          </FadeIn>

          <FadeIn delay={0.5}>
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

          <FadeIn delay={0.6}>
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
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="stat-card glass-card">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
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
            {partnersData.slice(0, 6).map((partner) => (
              <StaggerItem key={partner.id}>
                <Link to={`/partnerler/${partner.id}`}>
                  <motion.div
                    className="partner-preview-card glass-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="partner-preview-logo" style={{ background: `${partner.color}12` }}>
                      <span>{partner.logo}</span>
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
            {(dynamicTestimonials || testimonials).map((item, i) => (
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
            {(dynamicFaq?.[lang] || faqData[lang]).map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <FAQItem faq={faq} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Score */}
      <AuditScore />

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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6!2d28.9080!3d41.0048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa5307e731e3f%3A0x4a3e2d8c9b7f1234!2sBiruni+%C3%9Cniversitesi+Teknopark!5e0!3m2!1str!2str!4v1"
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
