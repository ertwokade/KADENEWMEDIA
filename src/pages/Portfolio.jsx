import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlinePhotograph, HiOutlineArrowRight, HiOutlineExternalLink } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { partnersData } from '../data/content'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import PageHeroCanvas from '../components/PageHeroCanvas'
import './Portfolio.css'

const portfolioItems = [
  {
    id: 'flavora-campaign',
    partner: 'Flavora',
    titleTr: 'Flavora Sosyal Medya Kampanyası',
    titleEn: 'Flavora Social Media Campaign',
    descTr: 'Instagram ve TikTok platformlarında yürüttüğümüz kampanya ile marka bilinirliğini %300 artırdık.',
    descEn: 'We increased brand awareness by 300% with campaigns run on Instagram and TikTok platforms.',
    category: 'Social Media',
    color: '#FFD700',
    emoji: '🍕',
    metrics: { reach: '2M+', engagement: '%250', followers: '50K+' },
  },
  {
    id: 'techvibe-launch',
    partner: 'TechVibe',
    titleTr: 'TechVibe Ürün Lansmanı',
    titleEn: 'TechVibe Product Launch',
    descTr: '360 derece dijital pazarlama stratejisi ile ilk ayda 100K kullanıcıya ulaştık.',
    descEn: 'We reached 100K users in the first month with a 360-degree digital marketing strategy.',
    category: 'Launch',
    color: '#6C63FF',
    emoji: '💻',
    metrics: { reach: '5M+', conversion: '%180', downloads: '500K+' },
  },
  {
    id: 'greenlife-ecommerce',
    partner: 'GreenLife',
    titleTr: 'GreenLife E-Ticaret Büyümesi',
    titleEn: 'GreenLife E-Commerce Growth',
    descTr: 'Instagram odaklı strateji ve UGC kampanyaları ile e-ticaret satışlarını %400 artırdık.',
    descEn: 'We increased e-commerce sales by 400% with an Instagram-focused strategy and UGC campaigns.',
    category: 'E-Commerce',
    color: '#2ECC71',
    emoji: '🌿',
    metrics: { sales: '%400', followers: '80K+', ugc: '1000+' },
  },
  {
    id: 'urbanstyle-tiktok',
    partner: 'UrbanStyle',
    titleTr: 'UrbanStyle TikTok Viral Büyüme',
    titleEn: 'UrbanStyle TikTok Viral Growth',
    descTr: 'Z kuşağını hedefleyen TikTok stratejisi ile 10M+ görüntülenme ve viral büyüme elde ettik.',
    descEn: 'We achieved 10M+ views and viral growth with a TikTok strategy targeting Gen Z.',
    category: 'TikTok',
    color: '#E91E63',
    emoji: '👗',
    metrics: { views: '10M+', followers: '200K+', sales: '%500' },
  },
  {
    id: 'petpal-community',
    partner: 'PetPal',
    titleTr: 'PetPal Topluluk Yönetimi',
    titleEn: 'PetPal Community Management',
    descTr: 'Topluluk odaklı strateji ile 100K+ üyeli güçlü bir marka topluluğu oluşturduk.',
    descEn: 'We built a strong brand community of 100K+ members with a community-focused strategy.',
    category: 'Community',
    color: '#FFD700',
    emoji: '🐾',
    metrics: { members: '100K+', engagement: '%450', ugc: '30K+' },
  },
  {
    id: 'fitzone-digital',
    partner: 'FitZone',
    titleTr: 'FitZone Dijital Dönüşüm',
    titleEn: 'FitZone Digital Transformation',
    descTr: 'Video içerik ve influencer kampanyaları ile üyelik satışlarını %250 artırdık.',
    descEn: 'We increased membership sales by 250% with video content and influencer campaigns.',
    category: 'Fitness',
    color: '#00BCD4',
    emoji: '💪',
    metrics: { sales: '%250', views: '15M+', leads: '%180' },
  },
]

const categories = ['All', 'Social Media', 'Launch', 'E-Commerce', 'TikTok', 'Community', 'Fitness']

export default function Portfolio() {
  const { lang } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('All')

  useSEO({
    title: lang === 'tr' ? 'Portfolyo | Başarı Hikayelerimiz - Kade Media' : 'Portfolio | Our Success Stories - Kade Media',
    description: lang === 'tr'
      ? 'Kade Media portfolyo sayfası. Sosyal medya yönetimi, dijital pazarlama ve içerik üretimi alanındaki başarı hikayelerimiz.'
      : 'Kade Media portfolio page. Our success stories in social media management, digital marketing, and content production.',
    path: '/portfolio',
  })

  const filtered = activeCategory === 'All'
    ? portfolioItems
    : portfolioItems.filter(item => item.category === activeCategory)

  return (
    <PageTransition>
      <PageHeroCanvas type="portfolio" />
      <section className="portfolio-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlinePhotograph size={14} />
              {lang === 'tr' ? 'Portfolyo' : 'Portfolio'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {lang === 'tr' ? 'Başarı Hikayelerimiz' : 'Our Success Stories'}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {lang === 'tr'
                ? 'Markalarla birlikte elde ettiğimiz sonuçları ve projelerimizi keşfedin.'
                : 'Discover the results we achieved together with brands and our projects.'}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="portfolio-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`portfolio-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'All' ? (lang === 'tr' ? 'Tümü' : 'All') : cat}
                </button>
              ))}
            </div>
          </FadeIn>

          <StaggerContainer className="portfolio-grid" staggerDelay={0.1}>
            {filtered.map((item) => {
              const partnerData = partnersData.find(p => p.name === item.partner)
              return (
                <StaggerItem key={item.id}>
                  <motion.div
                    className="portfolio-card glass-card"
                    whileHover={{ y: -6 }}
                    layout
                  >
                    <div className="portfolio-card-header" style={{ borderBottom: `2px solid ${item.color}30` }}>
                      <div className="portfolio-card-emoji" style={{ background: `${item.color}15` }}>
                        <span>{item.emoji}</span>
                      </div>
                      <div>
                        <span className="portfolio-card-category" style={{ color: item.color }}>{item.category}</span>
                        <h3>{lang === 'tr' ? item.titleTr : item.titleEn}</h3>
                      </div>
                    </div>
                    <p className="portfolio-card-desc">
                      {lang === 'tr' ? item.descTr : item.descEn}
                    </p>
                    <div className="portfolio-metrics">
                      {Object.entries(item.metrics).map(([key, val]) => (
                        <div key={key} className="portfolio-metric">
                          <span className="portfolio-metric-value" style={{ color: item.color }}>{val}</span>
                          <span className="portfolio-metric-label">{key}</span>
                        </div>
                      ))}
                    </div>
                    {partnerData && (
                      <Link to={`/partnerler/${partnerData.id}`} className="portfolio-card-link">
                        {lang === 'tr' ? 'Detayları Gör' : 'View Details'}
                        <HiOutlineExternalLink size={14} />
                      </Link>
                    )}
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>

          <FadeIn delay={0.3}>
            <div className="portfolio-cta glass-card">
              <h3>{lang === 'tr' ? 'Projenizi Gerçeğe Dönüştürelim' : "Let's Bring Your Project to Life"}</h3>
              <p>
                {lang === 'tr'
                  ? 'Markanız için özel bir strateji oluşturalım. Ücretsiz keşif görüşmesi için hemen iletişime geçin.'
                  : "Let's create a custom strategy for your brand. Contact us for a free discovery call."}
              </p>
              <Link to="/iletisim" className="btn btn-primary">
                {lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Get Free Consultation'}
                <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
