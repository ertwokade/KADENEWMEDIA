import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChartBar, HiOutlineArrowRight } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { FadeIn } from './Animations'
import './AuditScore.css'

function generateScore() {
  return {
    overall: Math.floor(Math.random() * 30) + 45,
    engagement: Math.floor(Math.random() * 40) + 35,
    contentQuality: Math.floor(Math.random() * 35) + 40,
    growthPotential: Math.floor(Math.random() * 30) + 50,
    consistency: Math.floor(Math.random() * 40) + 30,
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
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      setResult(generateScore())
      setLoading(false)
    }, 2000)
  }

  const getOverallColor = (s) => s >= 75 ? '#2ECC71' : s >= 50 ? '#FFA500' : '#FF4444'

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
                    <p>{t('audit.recommendation')}</p>
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
