import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChartBar, HiOutlineArrowRight, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { analytics } from '../utils/analytics'
import { subscribeNewsletterApi } from '../api'
import { FadeIn } from './Animations'
import './AuditScore.css'

const questions = {
  tr: [
    {
      question: 'Kaç platformda aktifsiniz?',
      options: [
        { label: '1-2', points: 5 },
        { label: '3-4', points: 15 },
        { label: '5+', points: 20 },
      ],
    },
    {
      question: 'Haftada kaç içerik paylaşıyorsunuz?',
      options: [
        { label: '0-2', points: 5 },
        { label: '3-5', points: 15 },
        { label: '6+', points: 20 },
      ],
    },
    {
      question: 'Takipçi sayınız nedir?',
      options: [
        { label: '0 - 1K', points: 5 },
        { label: '1K - 10K', points: 10 },
        { label: '10K+', points: 20 },
      ],
    },
    {
      question: 'Ortalama etkileşim oranınız?',
      options: [
        { label: 'Düşük', points: 5 },
        { label: 'Orta', points: 10 },
        { label: 'Yüksek', points: 20 },
      ],
    },
    {
      question: 'Düzenli rapor alıyor musunuz?',
      options: [
        { label: 'Hayır', points: 0 },
        { label: 'Evet', points: 20 },
      ],
    },
  ],
  en: [
    {
      question: 'How many platforms are you active on?',
      options: [
        { label: '1-2', points: 5 },
        { label: '3-4', points: 15 },
        { label: '5+', points: 20 },
      ],
    },
    {
      question: 'How many posts do you share per week?',
      options: [
        { label: '0-2', points: 5 },
        { label: '3-5', points: 15 },
        { label: '6+', points: 20 },
      ],
    },
    {
      question: 'What is your follower count?',
      options: [
        { label: '0 - 1K', points: 5 },
        { label: '1K - 10K', points: 10 },
        { label: '10K+', points: 20 },
      ],
    },
    {
      question: 'What is your average engagement rate?',
      options: [
        { label: 'Low', points: 5 },
        { label: 'Medium', points: 10 },
        { label: 'High', points: 20 },
      ],
    },
    {
      question: 'Do you receive regular reports?',
      options: [
        { label: 'No', points: 0 },
        { label: 'Yes', points: 20 },
      ],
    },
  ],
}

function getResultData(score, lang) {
  if (score <= 40) {
    return {
      level: lang === 'tr' ? 'Kritik' : 'Critical',
      emoji: '🔴',
      color: '#FF4444',
      message:
        lang === 'tr'
          ? 'Sosyal medya stratejinizde acil iyileştirme gerekiyor. Profesyonel destek ile kısa sürede büyük fark yaratabilirsiniz!'
          : 'Your social media strategy needs urgent improvement. With professional support, you can make a big difference quickly!',
    }
  }
  if (score <= 70) {
    return {
      level: lang === 'tr' ? 'Gelişime Açık' : 'Room for Growth',
      emoji: '🟡',
      color: '#eac321',
      message:
        lang === 'tr'
          ? 'İyi bir temel var! Profesyonel destekle stratejinizi güçlendirerek önemli bir atılım yapabilirsiniz.'
          : 'You have a good foundation! With professional support, you can strengthen your strategy and make a significant leap.',
    }
  }
  return {
    level: lang === 'tr' ? 'İyi' : 'Good',
    emoji: '🟢',
    color: '#2ECC71',
    message:
      lang === 'tr'
        ? 'Harika performans! Doğru yoldasınız. Profesyonel destek ile skorunuzu daha da yukarı taşıyabilirsiniz.'
        : 'Great performance! You\'re on the right track. With professional support, you can push your score even higher.',
  }
}

export default function AuditScore() {
  const { t, lang } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [gateEmail, setGateEmail] = useState('')
  const [gateStatus, setGateStatus] = useState(null) // null | 'loading' | 'error'
  const [pendingScore, setPendingScore] = useState(null)

  const currentQuestions = questions[lang] || questions.tr
  const totalQuestions = currentQuestions.length
  const progress = ((currentStep) / totalQuestions) * 100

  const handleAnswer = (points) => {
    const newAnswers = [...answers, points]
    setAnswers(newAnswers)

    if (currentStep === 0) analytics.auditStart()

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Last question — show email gate before result
      const score = newAnswers.reduce((sum, pts) => sum + pts, 0)
      setPendingScore(score)
      setShowEmailGate(true)
    }
  }

  const handleGateSubmit = async (e) => {
    e.preventDefault()
    if (!gateEmail.includes('@')) { setGateStatus('error'); return }
    setGateStatus('loading')
    try { await subscribeNewsletterApi(gateEmail) } catch { /* proceed anyway */ }
    analytics.auditComplete(pendingScore, gateEmail)
    setGateStatus(null)
    setShowEmailGate(false)
    setIsCalculating(true)
    setTimeout(() => { setIsCalculating(false); setShowResult(true) }, 1200)
  }

  const handleGateSkip = () => {
    analytics.auditComplete(pendingScore, '')
    setShowEmailGate(false)
    setIsCalculating(true)
    setTimeout(() => { setIsCalculating(false); setShowResult(true) }, 1200)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setAnswers([])
    setShowResult(false)
    setIsCalculating(false)
    setShowEmailGate(false)
    setGateEmail('')
    setGateStatus(null)
    setPendingScore(null)
  }

  const totalScore = pendingScore ?? answers.reduce((sum, pts) => sum + pts, 0)
  const resultData = getResultData(totalScore, lang)

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
            <AnimatePresence mode="wait">
              {!showResult && !isCalculating && (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Progress Bar */}
                  <div className="audit-progress">
                    <div className="audit-progress-bar">
                      <motion.div
                        className="audit-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className="audit-progress-text">
                      {currentStep + 1} / {totalQuestions}
                    </span>
                  </div>

                  {/* Question */}
                  <h3 className="audit-question">
                    {currentQuestions[currentStep].question}
                  </h3>

                  {/* Options */}
                  <div className="audit-options">
                    {currentQuestions[currentStep].options.map((option, i) => (
                      <motion.button
                        key={i}
                        className="audit-option-btn"
                        onClick={() => handleAnswer(option.points)}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {showEmailGate && (
                <motion.div
                  key="email-gate"
                  className="audit-email-gate"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="audit-gate-icon">
                    <HiOutlineLockClosed size={32} />
                  </div>
                  <h3 className="audit-gate-title">
                    {lang === 'tr' ? 'Skorunuzu görmek için e-postanızı girin' : 'Enter your email to see your score'}
                  </h3>
                  <p className="audit-gate-desc">
                    {lang === 'tr'
                      ? 'Sosyal medya performansınızı ve iyileştirme önerilerini ücretsiz olarak alacaksınız.'
                      : 'You\'ll receive your social media performance score and improvement tips for free.'}
                  </p>
                  <form className="audit-gate-form" onSubmit={handleGateSubmit}>
                    <div className="audit-gate-input-row">
                      <HiOutlineMail size={18} />
                      <input
                        type="email"
                        placeholder={lang === 'tr' ? 'ornek@email.com' : 'your@email.com'}
                        value={gateEmail}
                        onChange={e => { setGateEmail(e.target.value); setGateStatus(null) }}
                        autoFocus
                      />
                    </div>
                    {gateStatus === 'error' && (
                      <p className="audit-gate-error">
                        {lang === 'tr' ? 'Geçerli bir e-posta girin' : 'Enter a valid email'}
                      </p>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={gateStatus === 'loading'}>
                      {gateStatus === 'loading'
                        ? (lang === 'tr' ? 'Yükleniyor...' : 'Loading...')
                        : (lang === 'tr' ? 'Skorum Nedir?' : 'Show My Score')}
                      <HiOutlineArrowRight size={16} />
                    </button>
                  </form>
                  <button className="audit-gate-skip" onClick={handleGateSkip}>
                    {lang === 'tr' ? 'E-posta vermeden devam et' : 'Continue without email'}
                  </button>
                  <p className="audit-gate-note">
                    {lang === 'tr' ? 'Spam göndermiyoruz • İstediğiniz zaman çıkın' : 'No spam • Unsubscribe anytime'}
                  </p>
                </motion.div>
              )}

              {isCalculating && (
                <motion.div
                  key="calculating"
                  className="audit-calculating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="audit-calc-spinner" />
                  <p>
                    {lang === 'tr' ? 'Skorunuz hesaplanıyor...' : 'Calculating your score...'}
                  </p>
                </motion.div>
              )}

              {showResult && (
                <motion.div
                  key="result"
                  className="audit-result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Score Circle */}
                  <div className="audit-result-top">
                    <motion.div
                      className="audit-score-circle"
                      style={{ borderColor: resultData.color }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <span className="audit-score-number" style={{ color: resultData.color }}>
                        {totalScore}
                      </span>
                      <span className="audit-score-max">/100</span>
                    </motion.div>

                    <motion.div
                      className="audit-result-info"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span className="audit-result-level" style={{ color: resultData.color }}>
                        {resultData.emoji} {resultData.level}
                      </span>
                      <p className="audit-result-message">{resultData.message}</p>
                    </motion.div>
                  </div>

                  {/* Actions */}
                  <motion.div
                    className="audit-result-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Link to="/iletisim" className="btn btn-primary">
                      {lang === 'tr' ? 'Ücretsiz Danışmanlık Al' : 'Get Free Consultation'}
                      <HiOutlineArrowRight size={16} />
                    </Link>
                    <button className="btn btn-outline audit-retry-btn" onClick={handleReset}>
                      {lang === 'tr' ? 'Tekrar Dene' : 'Try Again'}
                    </button>
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
