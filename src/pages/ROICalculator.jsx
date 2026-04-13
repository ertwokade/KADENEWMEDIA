import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCalculator, HiOutlineTrendingUp, HiOutlineEye,
  HiOutlineCursorClick, HiOutlineShoppingCart, HiOutlineArrowRight,
  HiOutlineLightningBolt,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './ROICalculator.css'
import './Blog.css'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', cpm: 35, ctr: 1.2, convRate: 2.5 },
  { id: 'tiktok', label: 'TikTok', cpm: 20, ctr: 1.8, convRate: 1.8 },
  { id: 'facebook', label: 'Facebook', cpm: 40, ctr: 0.9, convRate: 3.2 },
  { id: 'youtube', label: 'YouTube', cpm: 55, ctr: 0.7, convRate: 2.0 },
  { id: 'linkedin', label: 'LinkedIn', cpm: 80, ctr: 0.5, convRate: 4.5 },
]

const GOALS = {
  tr: [
    { id: 'awareness', label: 'Marka Bilinirliği', multiplier: 1.4 },
    { id: 'traffic', label: 'Web Sitesi Trafiği', multiplier: 1.0 },
    { id: 'leads', label: 'Lead / Müşteri Adayı', multiplier: 0.8 },
    { id: 'sales', label: 'Satış / E-Ticaret', multiplier: 0.6 },
  ],
  en: [
    { id: 'awareness', label: 'Brand Awareness', multiplier: 1.4 },
    { id: 'traffic', label: 'Website Traffic', multiplier: 1.0 },
    { id: 'leads', label: 'Lead Generation', multiplier: 0.8 },
    { id: 'sales', label: 'Sales / E-Commerce', multiplier: 0.6 },
  ],
}

export default function ROICalculator() {
  const { lang } = useLanguage()
  const [budget, setBudget] = useState(5000)
  const [platform, setPlatform] = useState('instagram')
  const [goal, setGoal] = useState('traffic')
  const [showResults, setShowResults] = useState(false)

  useSEO({
    title: lang === 'tr' ? 'ROI Hesaplayıcı | Reklam Bütçe Planlama' : 'ROI Calculator | Ad Budget Planning',
    description: lang === 'tr'
      ? 'Sosyal medya reklam bütçenizle ne kadar erişim, tıklama ve dönüşüm elde edebileceğinizi hesaplayın.'
      : 'Calculate how much reach, clicks, and conversions you can get with your social media ad budget.',
    keywords: 'roi hesaplayıcı, reklam bütçe hesaplayıcı, sosyal medya roi, instagram reklam maliyeti, tiktok reklam maliyeti',
    path: '/roi-hesaplayici',
  })

  const platformData = PLATFORMS.find(p => p.id === platform)
  const goalData = (GOALS[lang] || GOALS.tr).find(g => g.id === goal)

  const impressions = Math.round((budget / platformData.cpm) * 1000 * goalData.multiplier)
  const clicks = Math.round(impressions * (platformData.ctr / 100))
  const conversions = Math.round(clicks * (platformData.convRate / 100))
  const cpc = clicks > 0 ? (budget / clicks).toFixed(2) : 0
  const costPerConversion = conversions > 0 ? (budget / conversions).toFixed(0) : 0

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  return (
    <PageTransition>
      <section className="blog-hero">
        <PageBgAnimation type="packages" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineCalculator size={14} />
              {lang === 'tr' ? 'ROI Hesaplayıcı' : 'ROI Calculator'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
              {lang === 'tr' ? 'Bütçenizle Ne ' : 'What Can You '}
              <span className="gradient-text">{lang === 'tr' ? 'Kazanırsınız?' : 'Achieve?'}</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle" style={{ maxWidth: 600, margin: '0 auto' }}>
              {lang === 'tr'
                ? 'Aylık reklam bütçenizi girin, platformunuzu ve hedefinizi seçin — tahmini sonuçları anında görün.'
                : 'Enter your monthly ad budget, choose your platform and goal — see estimated results instantly.'}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="roi-layout">
            {/* Input Panel */}
            <FadeIn>
              <div className="roi-input-panel glass-card">
                <h3>{lang === 'tr' ? 'Parametrelerinizi Seçin' : 'Select Your Parameters'}</h3>

                {/* Budget Slider */}
                <div className="roi-field">
                  <label>{lang === 'tr' ? 'Aylık Reklam Bütçesi' : 'Monthly Ad Budget'}</label>
                  <div className="roi-budget-display">
                    <span className="roi-budget-value">₺{budget.toLocaleString('tr-TR')}</span>
                    <span className="roi-budget-usd">~${Math.round(budget / 34)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="roi-slider"
                  />
                  <div className="roi-slider-labels">
                    <span>₺1.000</span>
                    <span>₺100.000</span>
                  </div>
                </div>

                {/* Platform */}
                <div className="roi-field">
                  <label>{lang === 'tr' ? 'Platform' : 'Platform'}</label>
                  <div className="roi-options">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        className={`roi-option ${platform === p.id ? 'active' : ''}`}
                        onClick={() => setPlatform(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div className="roi-field">
                  <label>{lang === 'tr' ? 'Hedefiniz' : 'Your Goal'}</label>
                  <div className="roi-options">
                    {(GOALS[lang] || GOALS.tr).map(g => (
                      <button
                        key={g.id}
                        className={`roi-option ${goal === g.id ? 'active' : ''}`}
                        onClick={() => setGoal(g.id)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary roi-calculate-btn" onClick={() => setShowResults(true)}>
                  <HiOutlineCalculator size={18} />
                  {lang === 'tr' ? 'Sonuçları Hesapla' : 'Calculate Results'}
                </button>
              </div>
            </FadeIn>

            {/* Results Panel */}
            <FadeIn delay={0.15}>
              <div className={`roi-results-panel glass-card ${showResults ? 'active' : ''}`}>
                <h3>{lang === 'tr' ? 'Tahmini Sonuçlar' : 'Estimated Results'}</h3>
                <p className="roi-results-note">
                  {lang === 'tr' ? 'Aylık tahmini performans metrikleri' : 'Monthly estimated performance metrics'}
                </p>

                <div className="roi-results-grid">
                  <motion.div className="roi-result-card" animate={showResults ? { scale: [0.9, 1] } : {}}>
                    <HiOutlineEye size={24} style={{ color: '#eac321' }} />
                    <div className="roi-result-value">{formatNumber(impressions)}</div>
                    <div className="roi-result-label">{lang === 'tr' ? 'Gösterim' : 'Impressions'}</div>
                  </motion.div>

                  <motion.div className="roi-result-card" animate={showResults ? { scale: [0.9, 1] } : {}} transition={{ delay: 0.05 }}>
                    <HiOutlineCursorClick size={24} style={{ color: '#6C63FF' }} />
                    <div className="roi-result-value">{formatNumber(clicks)}</div>
                    <div className="roi-result-label">{lang === 'tr' ? 'Tıklama' : 'Clicks'}</div>
                    <div className="roi-result-sub">CPC: ₺{cpc}</div>
                  </motion.div>

                  <motion.div className="roi-result-card" animate={showResults ? { scale: [0.9, 1] } : {}} transition={{ delay: 0.1 }}>
                    <HiOutlineShoppingCart size={24} style={{ color: '#2ECC71' }} />
                    <div className="roi-result-value">{formatNumber(conversions)}</div>
                    <div className="roi-result-label">{lang === 'tr' ? 'Dönüşüm' : 'Conversions'}</div>
                    <div className="roi-result-sub">{lang === 'tr' ? 'Dönüşüm Başına' : 'Per Conv.'}: ₺{costPerConversion}</div>
                  </motion.div>

                  <motion.div className="roi-result-card" animate={showResults ? { scale: [0.9, 1] } : {}} transition={{ delay: 0.15 }}>
                    <HiOutlineTrendingUp size={24} style={{ color: '#E91E63' }} />
                    <div className="roi-result-value">{platformData.ctr}%</div>
                    <div className="roi-result-label">CTR</div>
                    <div className="roi-result-sub">{lang === 'tr' ? 'Tıklama Oranı' : 'Click-Through Rate'}</div>
                  </motion.div>
                </div>

                <div className="roi-disclaimer">
                  {lang === 'tr'
                    ? '* Bu değerler sektör ortalamalarına dayalı tahminlerdir. Gerçek sonuçlar strateji, içerik kalitesi ve hedef kitleye göre değişir.'
                    : '* These are estimates based on industry averages. Actual results vary based on strategy, content quality, and target audience.'}
                </div>

                <div className="roi-cta-box">
                  <HiOutlineLightningBolt size={20} style={{ color: '#eac321' }} />
                  <div>
                    <strong>{lang === 'tr' ? 'Bu rakamları gerçeğe dönüştürelim' : 'Let\'s turn these numbers into reality'}</strong>
                    <p>{lang === 'tr' ? 'Uzman ekibimiz markanıza özel strateji ile bu sonuçların üzerine çıkabilir.' : 'Our expert team can exceed these results with a strategy tailored to your brand.'}</p>
                  </div>
                  <Link to="/iletisim" className="btn btn-primary">
                    {lang === 'tr' ? 'Ücretsiz Görüşme' : 'Free Consultation'} <HiOutlineArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
