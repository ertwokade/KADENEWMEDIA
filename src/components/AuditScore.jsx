import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChartBar, HiOutlineArrowRight } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { FadeIn } from './Animations'
import './AuditScore.css'

// Deterministic hash for consistent scores per username
function hashString(str) {
  let hash = 0
  const cleaned = str.replace('@', '').toLowerCase().trim()
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Deterministic pseudo-random from seed
function seededRandom(seed, index) {
  const x = Math.sin(seed + index * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function generateRealisticScore(username) {
  const hash = hashString(username)
  
  // Base overall quality (weighted random in range 25-85)
  const baseQuality = Math.floor(seededRandom(hash, 0) * 60) + 25
  
  // Each metric is correlated with base quality but with variation
  const engagement = Math.max(15, Math.min(95, 
    baseQuality + Math.floor((seededRandom(hash, 1) - 0.5) * 30)
  ))
  
  const contentQuality = Math.max(20, Math.min(90,
    baseQuality + Math.floor((seededRandom(hash, 2) - 0.5) * 25)
  ))
  
  const growthPotential = Math.max(30, Math.min(95,
    // Growth potential is inversely related to current quality (room to grow)
    Math.floor(95 - baseQuality * 0.4 + seededRandom(hash, 3) * 30)
  ))
  
  const consistency = Math.max(15, Math.min(85,
    baseQuality + Math.floor((seededRandom(hash, 4) - 0.5) * 35)
  ))
  
  // Overall is weighted average
  const overall = Math.round(
    engagement * 0.3 + contentQuality * 0.25 + growthPotential * 0.2 + consistency * 0.25
  )
  
  return {
    overall: Math.max(20, Math.min(90, overall)),
    engagement,
    contentQuality,
    growthPotential,
    consistency,
  }
}

function getRecommendation(score, t, lang) {
  if (score.overall >= 75) {
    return lang === 'tr' 
      ? 'Harika performans! Profesyonel destek ile skorunuzu daha da yukarı taşıyabilirsiniz.'
      : 'Great performance! With professional support, you can push your score even higher.'
  } else if (score.overall >= 50) {
    return lang === 'tr'
      ? 'İyi bir temel var! Etkileşim ve içerik stratejinizi geliştirerek önemli bir atılım yapabilirsiniz.'
      : 'You have a good foundation! By improving your engagement and content strategy, you can make a significant leap.'
  } else {
    return lang === 'tr'
      ? 'Hesabınızda önemli iyileştirme fırsatları var. Profesyonel destek ile kısa sürede fark yaratabilirsiniz!'
      : 'There are significant improvement opportunities for your account. With professional support, you can make a difference quickly!'
  }
}

function ScoreBar({ label, score, delay }) {
  const getColor = (s) => s >= 75 ? '#2ECC71' : s >= 50 ? '#FFA500' : '#FF4444'
  return (
    <motion.div
      className="score-bar-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="score-bar-header">
        <span>{label}</span>
        <span style={{ color: getColor(score) }}>{score}/100</span>
      </div>
      <div className="score-bar-track">
        <motion.div
          className="score-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          style={{ background: getColor(score) }}
        />
      </div>
    </motion.div>
  )
}

export default function AuditScore() {
  const { t, lang } = useLanguage()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(generateRealisticScore(username))
      setLoading(false)
    }, 2000)
  }

  const getOverallColor = (s) => s >= 75 ? '#2ECC71' : s >= 50 ? '#FFA500' : '#FF4444'
  const getOverallLabel = (s) => {
    if (s >= 75) return lang === 'tr' ? 'Çok İyi' : 'Very Good'
    if (s >= 50) return lang === 'tr' ? 'Orta' : 'Average'
    return lang === 'tr' ? 'Geliştirilmeli' : 'Needs Improvement'
  }

  return (
    <section className="section audit-section">
      <div className="container">
        <div className="section-header">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineChartBar size={14} />
              {t('audit.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="section-title">
              {t('audit.title')} <span>{t('audit.titleHighlight')}</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">{t('audit.subtitle')}</p>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <div className="audit-card glass-card">
            <form className="audit-form" onSubmit={handleSubmit}>
              <div className="audit-input-group">
                <input
                  type="text"
                  className="audit-input"
                  placeholder={t('audit.placeholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <motion.button
                  type="submit"
                  className="btn btn-primary audit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="audit-loader" />
                  ) : (
                    <>
                      {t('audit.button')}
                      <HiOutlineArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <AnimatePresence>
              {result && (
                <motion.div
                  className="audit-result"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="audit-result-header">
                    <h3>{t('audit.result')}: @{username.replace('@', '')}</h3>
                  </div>

                  <div className="audit-scores">
                    <div className="audit-overall">
                      <motion.div
                        className="overall-circle"
                        style={{ borderColor: getOverallColor(result.overall) }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                      >
                        <span className="overall-number" style={{ color: getOverallColor(result.overall) }}>
                          {result.overall}
                        </span>
                        <span className="overall-label">{t('audit.overallScore')}</span>
                        <span className="overall-status" style={{ color: getOverallColor(result.overall), fontSize: '0.7rem', fontWeight: 600, marginTop: '2px' }}>
                          {getOverallLabel(result.overall)}
                        </span>
                      </motion.div>
                    </div>

                    <div className="audit-details">
                      <ScoreBar label={t('audit.engagement')} score={result.engagement} delay={0.4} />
                      <ScoreBar label={t('audit.contentQuality')} score={result.contentQuality} delay={0.5} />
                      <ScoreBar label={t('audit.growthPotential')} score={result.growthPotential} delay={0.6} />
                      <ScoreBar label={t('audit.consistency')} score={result.consistency} delay={0.7} />
                    </div>
                  </div>

                  <motion.div
                    className="audit-recommendation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <p>{getRecommendation(result, t, lang)}</p>
                    <Link to="/iletisim" className="btn btn-primary">
                      {t('audit.ctaButton')}
                      <HiOutlineArrowRight size={16} />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
