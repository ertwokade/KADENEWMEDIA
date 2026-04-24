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

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Kade Media Sosyal Medya Paketleri',
      url: 'https://kademedia.com.tr/paketler',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Başlangıç Paketi', url: 'https://kademedia.com.tr/paketler#starter' },
        { '@type': 'ListItem', position: 2, name: 'Profesyonel Paket', url: 'https://kademedia.com.tr/paketler#professional' },
        { '@type': 'ListItem', position: 3, name: 'Kurumsal Paket', url: 'https://kademedia.com.tr/paketler#enterprise' },
        { '@type': 'ListItem', position: 4, name: 'Özel Paket', url: 'https://kademedia.com.tr/paketler#custom' },
      ],
    }
    let el = document.getElementById('jsonld-packages')
    if (el) { el.textContent = JSON.stringify(schema) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-packages'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(schema)
      document.head.appendChild(s)
    }
    return () => { document.getElementById('jsonld-packages')?.remove() }
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
      tier: 'start',
      tag: isEN ? 'Giriş' : 'Giriş',
      name: isEN ? 'Start-Up' : 'Start-Up',
      tagline: isEN ? 'Strategy & vertical video first.' : 'Strateji ve dikey video önce.',
      desc: isEN
        ? 'For brands just starting to build a digital presence. We define your voice, produce vertical content, and set the foundation.'
        : 'Dijital varlığını oluşturmaya yeni başlayan markalar için. Sesini belirliyor, dikey içerik üretiyor, temeli atıyoruz.',
      features: [
        isEN ? 'Brand strategy & positioning' : 'Marka stratejisi & konumlandırma',
        isEN ? '2 platforms (Instagram + TikTok)' : '2 platform (Instagram + TikTok)',
        isEN ? '8 vertical videos / month' : 'Ayda 8 dikey video',
        isEN ? 'Caption & hashtag strategy' : 'Caption & hashtag stratejisi',
        isEN ? 'Monthly growth report' : 'Aylık büyüme raporu',
      ],
      popular: false,
      color: 'rgba(255,255,255,0.06)',
    },
    {
      tier: 'growth',
      tag: isEN ? 'Growth' : 'Büyüme',
      name: isEN ? 'Growth' : 'Büyüme',
      tagline: isEN ? 'Full management + ads + 12 Reels.' : 'Tam yönetim + reklam + 12 Reels.',
      desc: isEN
        ? 'For brands ready to scale. Social media management, Reels production, and ad campaigns that deliver real results.'
        : 'Ölçeklenmeye hazır markalar için. Sosyal medya yönetimi, Reels prodüksiyonu ve gerçek sonuç getiren reklam kampanyaları.',
      features: [
        isEN ? 'Everything in Start-Up' : 'Start-Up\'taki her şey',
        isEN ? '4 platforms' : '4 platform',
        isEN ? '12 Reels / month' : 'Ayda 12 Reels',
        isEN ? 'Meta & TikTok Ads management' : 'Meta & TikTok Ads yönetimi',
        isEN ? 'Competitor analysis' : 'Rakip analizi',
        isEN ? 'Bi-weekly performance review' : '2 haftada bir performans inceleme',
        isEN ? 'Community management' : 'Topluluk yönetimi',
      ],
      popular: true,
      color: 'rgba(234,195,33,0.06)',
    },
    {
      tier: 'premium',
      tag: isEN ? 'Premium' : 'Premium',
      name: isEN ? 'Premium' : 'Premium',
      tagline: isEN ? 'Full production + influencer marketing.' : 'Tam prodüksiyon + influencer marketing.',
      desc: isEN
        ? 'The complete package. Studio-level production, influencer campaigns, and a dedicated strategist — the LumiFem model.'
        : 'Tam paket. Stüdyo kalitesinde prodüksiyon, influencer kampanyaları ve özel strateji danışmanı — LumiFem modeli.',
      features: [
        isEN ? 'Everything in Growth' : 'Büyüme\'deki her şey',
        isEN ? 'Studio-level production shoots' : 'Stüdyo kalitesinde prodüksiyon çekimleri',
        isEN ? 'Influencer marketing campaigns' : 'Influencer marketing kampanyaları',
        isEN ? 'Dedicated strategy consultant' : 'Özel strateji danışmanı',
        isEN ? 'Weekly reporting & calls' : 'Haftalık rapor & görüşme',
        isEN ? 'Crisis management' : 'Kriz yönetimi',
        isEN ? 'Priority response (4h)' : 'Öncelikli yanıt (4 saat)',
      ],
      popular: false,
      color: 'rgba(108,99,255,0.06)',
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

      {/* Urgency Banner */}
      <div className="packages-urgency-bar">
        <span className="urgency-dot" />
        <span>
          {isEN
            ? 'Only 3 client spots remaining this month — '
            : 'Bu ay yalnızca 3 müşteri yerimiz kaldı — '}
        </span>
        <a href="/iletisim" className="urgency-link">
          {isEN ? 'Reserve your spot now' : 'Şimdi yerinizi ayırtın'}
          <HiOutlineArrowRight size={13} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
        </a>
      </div>

      {/* Pricing Cards */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                {isEN ? <>Find the <span>Right Package</span> for You</> : <>Sana <span>Uygun Paketi</span> Seçelim</>}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle" style={{ maxWidth: 540, margin: '0 auto' }}>
                {isEN
                  ? "Prices are personalized based on your brand's needs. Book a free call and we'll figure it out together."
                  : 'Fiyatlar markanın ihtiyacına göre kişiselleştirilir. Ücretsiz görüşme rezerv et, birlikte belirleyelim.'}
              </p>
            </FadeIn>
          </div>
          <StaggerContainer className="packages-grid packages-grid-3" staggerDelay={0.12}>
            {packages.map((pkg) => (
              <StaggerItem key={pkg.tier}>
                <motion.div
                  className={`package-card glass-card pkg-v2 ${pkg.popular ? 'popular' : ''}`}
                  style={{ background: pkg.color }}
                  whileHover={{ scale: 1.02, y: -6 }}
                >
                  {pkg.popular && (
                    <div className="popular-badge">
                      <HiOutlineStar size={14} />
                      {isEN ? 'Most Popular' : 'En Çok Tercih Edilen'}
                    </div>
                  )}
                  <div className="pkg-tag">{pkg.tag}</div>
                  <h3 className="pkg-name">{pkg.name}</h3>
                  <p className="pkg-tagline">{pkg.tagline}</p>
                  <p className="package-desc">{pkg.desc}</p>

                  <div className="package-features">
                    {pkg.features.map((feature) => (
                      <div key={feature} className="feature-item included">
                        <HiOutlineCheck size={15} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={`https://wa.me/905067293423?text=${encodeURIComponent(isEN ? `Hi Kadir, I'm interested in the ${pkg.name} package. Can we talk?` : `Merhaba Kadir, ${pkg.name} paketi hakkında konuşmak istiyorum.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn ${pkg.popular ? 'btn-primary' : 'btn-outline'} package-btn`}
                    onClick={() => analytics.packageClick(pkg.name)}
                  >
                    {isEN ? "Let's Find Your Package" : 'Senin Paketini Seçelim'}
                    <HiOutlineArrowRight size={16} />
                  </a>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.4}>
            <div className="packages-bottom-note">
              <p>
                {isEN
                  ? "Not sure which one? That's fine — we'll figure it out in a 15-minute call."
                  : 'Hangisi uygun emin değil misin? Normal — 15 dakikalık görüşmede birlikte belirleriz.'}
              </p>
              <a
                href={`https://wa.me/905067293423?text=${encodeURIComponent(isEN ? 'Hi Kadir, I need help choosing a package.' : 'Merhaba Kadir, hangi paketi seçeceğime karar veremiyorum, yardımcı olur musun?')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {isEN ? '15-min Free Call' : '15 Dk Ücretsiz Görüşme'}
                <HiOutlineArrowRight size={16} />
              </a>
            </div>
          </FadeIn>
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
