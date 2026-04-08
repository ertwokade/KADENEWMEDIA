import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineStar,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { getContentApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import { analytics } from '../utils/analytics'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Packages.css'

// Exchange rate cache
const RATE_CACHE_KEY = 'kade_usd_try_rate'
const RATE_CACHE_TTL = 60 * 60 * 1000 // 1 hour — fresh rates
const FALLBACK_RATE = 38.5 // fallback TRY per USD

async function fetchExchangeRate() {
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY)
    if (cached) {
      const { rate, ts } = JSON.parse(cached)
      if (Date.now() - ts < RATE_CACHE_TTL && rate > 0) return rate
    }
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) return FALLBACK_RATE
    const data = await res.json()
    const rate = data?.rates?.TRY
    if (rate && rate > 0) {
      localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
      return rate
    }
  } catch { /* fallback */ }
  return FALLBACK_RATE
}

function convertTRYtoUSD(tryAmount, rate) {
  if (!rate || !tryAmount) return null
  const num = parseFloat(String(tryAmount).replace(/\./g, '').replace(',', '.'))
  if (isNaN(num)) return null
  return Math.round(num / rate)
}

function convertUSDtoTRY(usdAmount, rate) {
  if (!rate || !usdAmount) return null
  const num = parseFloat(String(usdAmount).replace(/\./g, '').replace(',', '.'))
  if (isNaN(num)) return null
  return Math.round(num * rate).toLocaleString('tr-TR')
}

function CompCell({ val }) {
  if (val === true) return <span className="comp-yes">✓</span>
  if (val === false) return <span className="comp-no">✗</span>
  return <span className="comp-maybe">~</span>
}

export default function Packages() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Paketler & Fiyatlar | Sosyal Medya Hizmet Paketleri',
    description: 'Kade Media sosyal medya yönetim paketleri. Başlangıç, Profesyonel, Kurumsal ve Özel olmak üzere 4 farklı paketle uygun fiyata profesyonel dijital pazarlama hizmeti alın.',
    keywords: 'sosyal medya paketleri, sosyal medya fiyatları, instagram yönetim paketi, dijital pazarlama fiyatları, sosyal medya yönetim ücreti',
    path: '/paketler',
  })
  const isEN = lang === 'en'

  const [dynamicItems, setDynamicItems] = useState(null)
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_RATE)

  useEffect(() => {
    getContentApi('packages')
      .then(res => {
        if (res?.data?.items?.length) setDynamicItems(res.data.items)
      })
      .catch(() => {})
    fetchExchangeRate().then(rate => { if (rate) setExchangeRate(rate) })
  }, [])

  const dynamicPackages = dynamicItems
    ? dynamicItems.map(item => ({
        name: isEN ? item.nameEn : item.nameTr,
        tier: (item.nameTr || item.nameEn || '').toLowerCase().replace(/\s+/g, '-'),
        priceTRY: item.priceTRY,
        priceUSD: item.priceUSD,
        desc: isEN ? item.descEn : item.descTr,
        popular: !!item.popular,
        features: ((isEN ? item.featuresEn : item.featuresTr) || '').split(',').map(f => f.trim()).filter(Boolean),
        notIncluded: [],
      }))
    : null

  const packages = [
    {
      name: isEN ? 'Starter' : 'Başlangıç',
      tier: 'starter',
      priceTRY: '11.900',
      priceUSD: null,
      desc: isEN ? 'Perfect for small businesses and startups taking their first steps in social media.' : 'Sosyal medyada ilk adımlarını atan küçük işletmeler ve startuplar için ideal.',
      popular: false,
      features: [
        isEN ? '2 Platforms (Instagram + 1)' : '2 Platform (Instagram + 1)',
        isEN ? '16 posts/month' : 'Ayda 16 içerik',
        isEN ? 'Basic graphic design' : 'Temel grafik tasarım',
        isEN ? 'Community management' : 'Topluluk yönetimi',
        isEN ? 'Content calendar' : 'İçerik takvimi',
        isEN ? 'Monthly performance report' : 'Aylık performans raporu',
      ],
      notIncluded: [
        isEN ? 'Ad management' : 'Reklam yönetimi',
        isEN ? 'Video content (Reels)' : 'Video içerik (Reels)',
        isEN ? 'Competitor analysis' : 'Rakip analizi',
      ],
    },
    {
      name: isEN ? 'Professional' : 'Profesyonel',
      tier: 'professional',
      priceTRY: '24.900',
      priceUSD: null,
      desc: isEN ? 'For growing brands that want comprehensive social media management and ad support.' : 'Kapsamlı sosyal medya yönetimi ve reklam desteği isteyen büyüyen markalar için.',
      popular: true,
      features: [
        isEN ? '4 Platforms' : '4 Platform',
        isEN ? '30 posts/month' : 'Ayda 30 içerik',
        isEN ? 'Professional design' : 'Profesyonel tasarım',
        isEN ? 'Community management' : 'Topluluk yönetimi',
        isEN ? 'Content calendar' : 'İçerik takvimi',
        isEN ? 'Bi-weekly reporting' : '2 haftada bir raporlama',
        isEN ? 'Basic ad management' : 'Temel reklam yönetimi',
        isEN ? '4 Reels/month' : 'Ayda 4 Reels',
        isEN ? 'Competitor analysis' : 'Rakip analizi',
      ],
      notIncluded: [],
    },
    {
      name: isEN ? 'Enterprise' : 'Kurumsal',
      tier: 'enterprise',
      priceTRY: '54.900',
      priceUSD: null,
      desc: isEN ? 'Full-service digital marketing solution for large brands seeking maximum growth.' : 'Maksimum büyüme hedefleyen büyük markalar için tam kapsamlı dijital pazarlama çözümü.',
      popular: false,
      features: [
        isEN ? 'All platforms' : 'Tüm platformlar',
        isEN ? 'Unlimited content' : 'Sınırsız içerik',
        isEN ? 'Premium design' : 'Premium tasarım',
        isEN ? 'Community management' : 'Topluluk yönetimi',
        isEN ? 'Content calendar' : 'İçerik takvimi',
        isEN ? 'Weekly reporting' : 'Haftalık raporlama',
        isEN ? 'Advanced ad management' : 'Gelişmiş reklam yönetimi',
        isEN ? '12 Reels/month' : 'Ayda 12 Reels',
        isEN ? 'Competitor analysis' : 'Rakip analizi',
        isEN ? 'Crisis management' : 'Kriz yönetimi',
        isEN ? 'Dedicated strategist' : 'Özel strateji danışmanı',
        isEN ? 'Priority support' : 'Öncelikli destek',
      ],
      notIncluded: [],
    },
    {
      name: isEN ? 'Custom' : 'Özel',
      tier: 'custom',
      priceTRY: null,
      priceUSD: null,
      desc: isEN ? 'Fully tailored solutions designed specifically for your brand\'s unique needs.' : 'Markanızın benzersiz ihtiyaçlarına özel tasarlanmış çözümler.',
      popular: false,
      isCustom: true,
      features: [
        isEN ? 'Everything in Enterprise' : 'Kurumsaldaki her şey',
        isEN ? 'Custom strategy & roadmap' : 'Özel strateji ve yol haritası',
        isEN ? 'Multi-brand management' : 'Çoklu marka yönetimi',
        isEN ? 'International market support' : 'Uluslararası pazar desteği',
        isEN ? 'Dedicated team' : 'Size özel ekip',
        isEN ? 'SLA agreement' : 'SLA anlaşması',
      ],
      notIncluded: [],
    },
  ]

  const faqs = [
    { q: t('packages.faq1q'), a: t('packages.faq1a') },
    { q: t('packages.faq2q'), a: t('packages.faq2a') },
    { q: t('packages.faq3q'), a: t('packages.faq3a') },
    { q: t('packages.faq4q'), a: t('packages.faq4a') },
  ]

  return (
    <PageTransition>
      {/* Hero */}
      <section className="packages-hero">
        <PageBgAnimation type="packages" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineSparkles size={14} />
              {t('packages.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('packages.title')} <span>{t('packages.titleHighlight')}</span> {t('packages.titleEnd')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('packages.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section">
        <div className="container">
          <StaggerContainer className="packages-grid" staggerDelay={0.15}>
            {(dynamicPackages || packages).map((pkg) => (
              <StaggerItem key={pkg.name}>
                <motion.div
                  className={`package-card glass-card ${pkg.popular ? 'popular' : ''}`}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {pkg.popular && (
                    <div className="popular-badge">
                      <HiOutlineStar size={14} />
                      {t('packages.popular')}
                    </div>
                  )}
                  <div className="package-header">
                    <h3>{pkg.name}</h3>
                    <p className="package-desc">{pkg.desc}</p>
                    
                    {pkg.isCustom ? (
                      <div className="package-price custom-price">
                        <span className="amount" style={{ fontSize: '1.5rem' }}>{isEN ? 'Custom Pricing' : 'Özel Fiyatlandırma'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="package-price">
                          <span className="currency">₺</span>
                          <span className="amount">{pkg.priceTRY}</span>
                          <span className="period">{t('packages.month')}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="package-features">
                    {pkg.features.map((feature) => (
                      <div key={feature} className="feature-item included">
                        <HiOutlineCheck size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {pkg.notIncluded.map((feature) => (
                      <div key={feature} className="feature-item not-included">
                        <span className="dash">—</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/iletisim"
                    className={`btn ${pkg.popular ? 'btn-primary' : 'btn-outline'} package-btn`}
                    onClick={() => analytics.packageClick(pkg.name)}
                  >
                    {pkg.isCustom ? (isEN ? 'Get Quote' : 'Teklif Al') : pkg.popular ? (isEN ? 'Get Started' : 'Hemen Başla') : (isEN ? 'Discovery Call' : 'Keşif Görüşmesi')}
                    <HiOutlineArrowRight size={16} />
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">
                {t('packages.faqTitle')} <span>{t('packages.faqHighlight')}</span>
              </h2>
            </FadeIn>
          </div>

          <StaggerContainer className="faq-grid" staggerDelay={0.1}>
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <div className="faq-card glass-card">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
