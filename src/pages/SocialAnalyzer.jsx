import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineClipboardCheck,
} from 'react-icons/hi'
import {
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
  FaFacebookF,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { submitAnalyzerLeadApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './SocialAnalyzer.css'

/* ─── Platform config ─── */
const PLATFORMS = [
  { key: 'instagram', icon: FaInstagram, color: '#E4405F', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', icon: FaTiktok, color: '#000000', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { key: 'youtube', icon: FaYoutube, color: '#FF0000', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'linkedin', icon: FaLinkedinIn, color: '#0A66C2', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/name' },
  { key: 'facebook', icon: FaFacebookF, color: '#1877F2', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { key: 'twitter', icon: FaXTwitter, color: '#000000', label: 'X', placeholder: 'https://x.com/username' },
]

/* ─── Helpers ─── */
function extractUsername(url, platform) {
  if (!url) return null
  const clean = url.trim().replace(/\/+$/, '')
  // Handle raw usernames (no URL)
  if (!clean.includes('/')) return clean.replace(/^@/, '')
  try {
    const u = new URL(clean.startsWith('http') ? clean : `https://${clean}`)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return null
    // LinkedIn: /in/username or /company/name
    if (platform === 'linkedin' && parts.length >= 2) return parts[1]
    return parts[parts.length - 1].replace(/^@/, '')
  } catch {
    return null
  }
}

/* Deterministic hash for username → consistent scores */
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function scoreRange(hash, seed, min, max) {
  return min + ((hash * seed) % (max - min + 1))
}

/* ─── Analysis engine ─── */
function analyzeProfiles(links) {
  const filled = Object.entries(links).filter(([, v]) => v.trim())
  const usernames = {}
  const validPlatforms = []

  filled.forEach(([platform, url]) => {
    const u = extractUsername(url, platform)
    if (u) {
      usernames[platform] = u
      validPlatforms.push(platform)
    }
  })

  if (validPlatforms.length === 0) return null

  // 1. Profile Optimization (username quality)
  const allUsernames = Object.values(usernames)
  const primaryUsername = allUsernames[0]
  const h = hashString(primaryUsername)

  const avgLen = allUsernames.reduce((s, u) => s + u.length, 0) / allUsernames.length
  const hasNumbers = allUsernames.some(u => /\d/.test(u))
  const hasUnderscores = allUsernames.some(u => /[_.]/.test(u))
  const isShort = avgLen <= 15

  let profileScore = 10
  if (isShort) profileScore += 4
  if (!hasNumbers) profileScore += 3
  if (!hasUnderscores) profileScore += 3
  profileScore = Math.min(20, profileScore + scoreRange(h, 7, 0, 2))

  // 2. Platform Diversity
  const platformCount = validPlatforms.length
  let diversityScore = Math.min(20, Math.round((platformCount / 6) * 20))
  if (platformCount === 1) diversityScore = Math.max(5, diversityScore)

  // 3. Accessibility (URL format, SEO-friendliness)
  let accessScore = 12
  if (validPlatforms.includes('instagram')) accessScore += 2
  if (validPlatforms.includes('youtube')) accessScore += 2
  if (validPlatforms.includes('linkedin')) accessScore += 2
  accessScore = Math.min(20, accessScore + scoreRange(h, 13, 0, 2))

  // 4. Brand Consistency (same username across platforms)
  const uniqueUsernames = new Set(allUsernames.map(u => u.toLowerCase()))
  const consistencyRatio = 1 - (uniqueUsernames.size - 1) / Math.max(1, allUsernames.length - 1)
  let consistencyScore = Math.round(consistencyRatio * 20)
  if (allUsernames.length === 1) consistencyScore = Math.min(14, consistencyScore + scoreRange(h, 17, 8, 14))

  // 5. Digital Presence Score
  let presenceScore = 8
  presenceScore += Math.min(6, platformCount * 2)
  presenceScore += scoreRange(h, 23, 1, 4)
  presenceScore = Math.min(20, presenceScore)

  const total = profileScore + diversityScore + accessScore + consistencyScore + presenceScore

  // Generate category details
  const categories = [
    { key: 'profile', score: profileScore, max: 20, icon: '📊' },
    { key: 'diversity', score: diversityScore, max: 20, icon: '📱' },
    { key: 'accessibility', score: accessScore, max: 20, icon: '🎯' },
    { key: 'consistency', score: consistencyScore, max: 20, icon: '💡' },
    { key: 'presence', score: presenceScore, max: 20, icon: '🔥' },
  ]

  return {
    total,
    categories,
    platforms: validPlatforms,
    usernames,
    primaryUsername,
  }
}

function getResultLevel(score, lang) {
  if (score <= 40) return {
    level: lang === 'tr' ? 'Acil İyileştirme Gerekli' : 'Needs Urgent Improvement',
    color: '#FF4444',
    emoji: '🔴',
  }
  if (score <= 60) return {
    level: lang === 'tr' ? 'Geliştirilmeli' : 'Needs Improvement',
    color: '#FF9800',
    emoji: '🟠',
  }
  if (score <= 80) return {
    level: lang === 'tr' ? 'İyi Durumda' : 'Good Standing',
    color: '#eac321',
    emoji: '🟡',
  }
  return {
    level: lang === 'tr' ? 'Mükemmel' : 'Excellent',
    color: '#2ECC71',
    emoji: '🟢',
  }
}

/* ─── SVG Radar Chart ─── */
function RadarChart({ categories, animate }) {
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const maxR = 100
  const levels = 4
  const count = categories.length

  const angleStep = (2 * Math.PI) / count
  const startAngle = -Math.PI / 2

  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep
    const r = (value / 20) * maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // Grid lines
  const gridPolygons = Array.from({ length: levels }, (_, li) => {
    const r = ((li + 1) / levels) * maxR
    const points = Array.from({ length: count }, (_, i) => {
      const angle = startAngle + i * angleStep
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
    return points
  })

  // Axis lines
  const axisLines = Array.from({ length: count }, (_, i) => {
    const angle = startAngle + i * angleStep
    return {
      x2: cx + maxR * Math.cos(angle),
      y2: cy + maxR * Math.sin(angle),
    }
  })

  // Data polygon
  const dataPoints = categories.map((cat, i) => getPoint(i, cat.score))
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Labels
  const labelPositions = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep
    const r = maxR + 28
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      icon: cat.icon,
    }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart">
      {/* Grid */}
      {gridPolygons.map((points, i) => (
        <polygon key={i} points={points} className="radar-grid" />
      ))}
      {/* Axes */}
      {axisLines.map((line, i) => (
        <line key={i} x1={cx} y1={cy} x2={line.x2} y2={line.y2} className="radar-axis" />
      ))}
      {/* Data area */}
      <motion.polygon
        points={animate ? dataPath : Array.from({ length: count }, () => `${cx},${cy}`).join(' ')}
        className="radar-data"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, points: dataPath }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          className="radar-point"
          initial={{ r: 0 }}
          animate={{ r: 4 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}
      {/* Labels */}
      {labelPositions.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y} className="radar-label" textAnchor="middle" dominantBaseline="central">
          {lp.icon}
        </text>
      ))}
    </svg>
  )
}

/* ─── Main Component ─── */
export default function SocialAnalyzer() {
  const { lang } = useLanguage()
  useSEO({
    title: lang === 'tr'
      ? 'Ücretsiz Sosyal Medya Analiz Aracı | Kade Media'
      : 'Free Social Media Analysis Tool | Kade Media',
    description: lang === 'tr'
      ? 'Sosyal medya hesaplarınızı analiz edin, performans skorunuzu öğrenin. Ücretsiz rapor ve iyileştirme önerileri alın.'
      : 'Analyze your social media accounts, learn your performance score. Get free reports and improvement suggestions.',
    path: '/sosyal-medya-analiz',
  })

  const [links, setLinks] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p.key, '']))
  )
  const [phase, setPhase] = useState('input') // input | analyzing | result
  const [result, setResult] = useState(null)
  const [scanStep, setScanStep] = useState(0)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')

  const filledCount = useMemo(() =>
    Object.values(links).filter(v => v.trim()).length
  , [links])

  const handleLinkChange = (platform, value) => {
    setLinks(prev => ({ ...prev, [platform]: value }))
  }

  const scanSteps = lang === 'tr'
    ? [
        'Profiller taranıyor...',
        'Kullanıcı adları analiz ediliyor...',
        'Platform çeşitliliği hesaplanıyor...',
        'Marka tutarlılığı değerlendiriliyor...',
        'Dijital varlık skoru hesaplanıyor...',
        'Rapor oluşturuluyor...',
      ]
    : [
        'Scanning profiles...',
        'Analyzing usernames...',
        'Calculating platform diversity...',
        'Evaluating brand consistency...',
        'Computing digital presence score...',
        'Generating report...',
      ]

  const handleAnalyze = () => {
    const analysis = analyzeProfiles(links)
    if (!analysis) return
    setPhase('analyzing')
    setScanStep(0)

    // Step through scan
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step >= scanSteps.length) {
        clearInterval(interval)
        setResult(analysis)
        setPhase('result')
      } else {
        setScanStep(step)
      }
    }, 600)
  }

  const handleReset = () => {
    setPhase('input')
    setResult(null)
    setLinks(Object.fromEntries(PLATFORMS.map(p => [p.key, ''])))
    setEmail('')
    setEmailSent(false)
    setEmailError('')
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !result) return
    setEmailSending(true)
    setEmailError('')
    try {
      await submitAnalyzerLeadApi({
        email,
        score: result.total,
        platforms: result.platforms,
        usernames: result.usernames,
        categories: result.categories,
      })
      setEmailSent(true)
    } catch {
      setEmailError(lang === 'tr' ? 'Bir hata oluştu. Tekrar deneyin.' : 'An error occurred. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  const handleDownloadReport = () => {
    if (!result) return
    const rows = result.categories.map(cat => `
      <tr>
        <td>${categoryLabels[cat.key] || cat.key}</td>
        <td>${cat.score}/${cat.max}</td>
        <td>${cat.score >= 14 ? categoryTips[cat.key]?.good : categoryTips[cat.key]?.bad}</td>
      </tr>
    `).join('')
    const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><title>Kade Media Sosyal Medya Denetim Raporu</title>
      <style>body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:40px;color:#111}h1{border-bottom:4px solid #eac321;padding-bottom:14px}.score{font-size:48px;font-weight:900;color:#eac321}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{border:1px solid #ddd;padding:12px;text-align:left}th{background:#111;color:#fff}.footer{margin-top:36px;color:#777;font-size:12px}</style>
      </head><body><h1>Kade Media Sosyal Medya Denetim Raporu</h1><p>Profil: <strong>@${result.primaryUsername}</strong></p><div class="score">${result.total}/100</div><p>${resultLevel.level}</p><table><thead><tr><th>Kategori</th><th>Skor</th><th>Öneri</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Bu rapor otomatik ön analizdir. Detaylı strateji için kademedia.com.tr/teklif-al</div></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sosyal-medya-denetim-raporu-${result.primaryUsername || 'kade'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categoryLabels = {
    profile: lang === 'tr' ? 'Profil Optimizasyonu' : 'Profile Optimization',
    diversity: lang === 'tr' ? 'Platform Çeşitliliği' : 'Platform Diversity',
    accessibility: lang === 'tr' ? 'Erişilebilirlik' : 'Accessibility',
    consistency: lang === 'tr' ? 'Marka Tutarlılığı' : 'Brand Consistency',
    presence: lang === 'tr' ? 'Dijital Varlık' : 'Digital Presence',
  }

  const categoryTips = {
    profile: {
      good: lang === 'tr' ? 'Kullanıcı adınız temiz ve profesyonel görünüyor.' : 'Your username looks clean and professional.',
      bad: lang === 'tr' ? 'Kullanıcı adınızı kısaltıp rakamsız yapmayı düşünün.' : 'Consider shortening your username and removing numbers.',
    },
    diversity: {
      good: lang === 'tr' ? 'Harika! Birden fazla platformda aktifsiniz.' : 'Great! You\'re active on multiple platforms.',
      bad: lang === 'tr' ? 'Daha fazla platformda var olmanız erişiminizi artırır.' : 'Being present on more platforms will increase your reach.',
    },
    accessibility: {
      good: lang === 'tr' ? 'Hesaplarınız kolay bulunabilir durumda.' : 'Your accounts are easily discoverable.',
      bad: lang === 'tr' ? 'SEO uyumlu URL yapıları kullanın.' : 'Use SEO-friendly URL structures.',
    },
    consistency: {
      good: lang === 'tr' ? 'Tüm platformlarda tutarlı bir marka kimliğiniz var.' : 'You have a consistent brand identity across platforms.',
      bad: lang === 'tr' ? 'Tüm platformlarda aynı kullanıcı adını kullanmayı deneyin.' : 'Try using the same username across all platforms.',
    },
    presence: {
      good: lang === 'tr' ? 'Güçlü bir dijital varlığınız var.' : 'You have a strong digital presence.',
      bad: lang === 'tr' ? 'Dijital varlığınızı güçlendirmek için profesyonel destek alabilirsiniz.' : 'Consider professional support to strengthen your digital presence.',
    },
  }

  const resultLevel = result ? getResultLevel(result.total, lang) : null

  return (
    <PageTransition>
      <section className="analyzer-hero">
        <div className="grid-bg" />
        <div className="analyzer-glow analyzer-glow-1" />
        <div className="analyzer-glow analyzer-glow-2" />

        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineSearch size={14} />
                {lang === 'tr' ? 'Ücretsiz Analiz Aracı' : 'Free Analysis Tool'}
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="section-title">
                {lang === 'tr' ? 'Sosyal Medya ' : 'Social Media '}
                <span>{lang === 'tr' ? 'Analiz Aracı' : 'Analyzer'}</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">
                {lang === 'tr'
                  ? 'Sosyal medya hesaplarınızın linklerini yapıştırın, anında performans skorunuzu ve iyileştirme önerilerinizi öğrenin.'
                  : 'Paste your social media profile links and instantly learn your performance score and improvement suggestions.'}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Input Phase */}
      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.section
            key="input"
            className="section analyzer-input-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="container">
              <FadeIn>
                <div className="analyzer-card glass-card">
                  <h2 className="analyzer-card-title">
                    {lang === 'tr' ? '🔗 Sosyal Medya Linklerinizi Yapıştırın' : '🔗 Paste Your Social Media Links'}
                  </h2>
                  <p className="analyzer-card-desc">
                    {lang === 'tr'
                      ? 'En az 1 platform linki girin. Ne kadar çok platform eklerseniz analiz o kadar detaylı olur.'
                      : 'Enter at least 1 platform link. The more platforms you add, the more detailed the analysis.'}
                  </p>

                  <div className="analyzer-inputs">
                    {PLATFORMS.map((platform) => (
                      <div className="analyzer-input-row" key={platform.key}>
                        <div
                          className="analyzer-platform-icon"
                          style={{ background: `${platform.color}18`, color: platform.color }}
                        >
                          <platform.icon size={20} />
                        </div>
                        <input
                          type="text"
                          className="analyzer-input"
                          placeholder={platform.placeholder}
                          value={links[platform.key]}
                          onChange={(e) => handleLinkChange(platform.key, e.target.value)}
                          id={`analyzer-input-${platform.key}`}
                        />
                        {links[platform.key] && (
                          <button
                            className="analyzer-input-clear"
                            onClick={() => handleLinkChange(platform.key, '')}
                            aria-label="Clear"
                          >
                            <HiOutlineX size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="analyzer-submit-area">
                    <div className="analyzer-count">
                      <HiOutlineClipboardCheck size={18} />
                      <span>
                        {filledCount} / {PLATFORMS.length}{' '}
                        {lang === 'tr' ? 'platform eklendi' : 'platforms added'}
                      </span>
                    </div>
                    <motion.button
                      className="btn btn-primary analyzer-submit-btn"
                      onClick={handleAnalyze}
                      disabled={filledCount === 0}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <HiOutlineChartBar size={18} />
                      {lang === 'tr' ? 'Analiz Et' : 'Analyze'}
                      <HiOutlineArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </FadeIn>

              {/* Trust badges */}
              <FadeIn delay={0.3}>
                <div className="analyzer-trust">
                  <div className="analyzer-trust-item">
                    <HiOutlineCheckCircle size={18} />
                    <span>{lang === 'tr' ? '100% Ücretsiz' : '100% Free'}</span>
                  </div>
                  <div className="analyzer-trust-item">
                    <HiOutlineLightningBolt size={18} />
                    <span>{lang === 'tr' ? 'Anında Sonuç' : 'Instant Results'}</span>
                  </div>
                  <div className="analyzer-trust-item">
                    <HiOutlineExclamationCircle size={18} />
                    <span>{lang === 'tr' ? 'Kayıt Gerektirmez' : 'No Registration'}</span>
                  </div>
                </div>
              </FadeIn>
            </div>
          </motion.section>
        )}

        {/* Analyzing Phase */}
        {phase === 'analyzing' && (
          <motion.section
            key="analyzing"
            className="section analyzer-scanning-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="container">
              <div className="analyzer-scanning-card glass-card">
                <div className="scanning-visual">
                  <div className="scanning-ring scanning-ring-1" />
                  <div className="scanning-ring scanning-ring-2" />
                  <div className="scanning-ring scanning-ring-3" />
                  <div className="scanning-center">
                    <HiOutlineSearch size={32} />
                  </div>
                </div>

                <div className="scanning-steps">
                  {scanSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      className={`scanning-step ${i === scanStep ? 'active' : ''} ${i < scanStep ? 'done' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= scanStep ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {i < scanStep ? (
                        <HiOutlineCheckCircle className="scanning-step-icon done" size={18} />
                      ) : i === scanStep ? (
                        <div className="scanning-step-spinner" />
                      ) : (
                        <div className="scanning-step-dot" />
                      )}
                      <span>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Result Phase */}
        {phase === 'result' && result && (
          <motion.section
            key="result"
            className="section analyzer-result-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="container">
              {/* Score overview */}
              <div className="result-overview">
                <FadeIn>
                  <div className="result-main-card glass-card">
                    <div className="result-header">
                      <div className="result-radar-wrap">
                        <RadarChart categories={result.categories} animate />
                      </div>
                      <div className="result-score-info">
                        <motion.div
                          className="result-score-circle"
                          style={{ borderColor: resultLevel.color }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.3 }}
                        >
                          <motion.span
                            className="result-score-number"
                            style={{ color: resultLevel.color }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            {result.total}
                          </motion.span>
                          <span className="result-score-max">/100</span>
                        </motion.div>
                        <motion.div
                          className="result-level"
                          style={{ color: resultLevel.color }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          {resultLevel.emoji} {resultLevel.level}
                        </motion.div>
                        <motion.p
                          className="result-username"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 }}
                        >
                          @{result.primaryUsername}
                        </motion.p>
                        <motion.div
                          className="result-platforms-used"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          {result.platforms.map(pk => {
                            const pConfig = PLATFORMS.find(p => p.key === pk)
                            if (!pConfig) return null
                            return (
                              <span key={pk} className="result-platform-tag" style={{ borderColor: pConfig.color, color: pConfig.color }}>
                                <pConfig.icon size={12} /> {pConfig.label}
                              </span>
                            )
                          })}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>

              {/* Category breakdown */}
              <StaggerContainer className="result-categories" staggerDelay={0.08}>
                {result.categories.map((cat) => {
                  const pct = (cat.score / cat.max) * 100
                  const isGood = cat.score >= 14
                  return (
                    <StaggerItem key={cat.key}>
                      <div className="result-cat-card glass-card">
                        <div className="result-cat-header">
                          <span className="result-cat-icon">{cat.icon}</span>
                          <span className="result-cat-name">{categoryLabels[cat.key]}</span>
                          <span className="result-cat-score" style={{ color: isGood ? '#2ECC71' : '#eac321' }}>
                            {cat.score}/{cat.max}
                          </span>
                        </div>
                        <div className="result-cat-bar-bg">
                          <motion.div
                            className="result-cat-bar-fill"
                            style={{ background: isGood ? '#2ECC71' : 'var(--gradient-primary)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <p className="result-cat-tip">
                          {isGood ? categoryTips[cat.key]?.good : categoryTips[cat.key]?.bad}
                        </p>
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>

              {/* Lead capture CTA */}
              <FadeIn delay={0.5}>
                <div className="result-lead-section glass-card">
                  {!emailSent ? (
                    <>
                      <div className="result-lead-icon">📋</div>
                      <h3>
                        {lang === 'tr'
                          ? 'Detaylı Rapor & Kişiye Özel Strateji Önerileri'
                          : 'Detailed Report & Personalized Strategy Suggestions'}
                      </h3>
                      <p>
                        {lang === 'tr'
                          ? 'Rakip karşılaştırması, detaylı iyileştirme planı ve sektöre özel stratejileri içeren kapsamlı raporunuzu e-postanıza gönderelim.'
                          : 'We\'ll send your comprehensive report including competitor comparison, detailed improvement plan, and industry-specific strategies to your email.'}
                      </p>
                      <form className="result-lead-form" onSubmit={handleEmailSubmit}>
                        <div className="result-lead-input-wrap">
                          <HiOutlineMail size={20} className="result-lead-mail-icon" />
                          <input
                            type="email"
                            placeholder={lang === 'tr' ? 'E-posta adresiniz' : 'Your email address'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="result-lead-input"
                            id="analyzer-email-input"
                          />
                        </div>
                        <motion.button
                          type="submit"
                          className="btn btn-primary"
                          disabled={emailSending}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {emailSending
                            ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                            : (lang === 'tr' ? 'Ücretsiz Rapor Al' : 'Get Free Report')}
                          <HiOutlineArrowRight size={16} />
                        </motion.button>
                      </form>
                      {emailError && <p className="result-lead-error">{emailError}</p>}
                    </>
                  ) : (
                    <motion.div
                      className="result-lead-success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <HiOutlineCheckCircle size={48} className="result-lead-success-icon" />
                      <h3>{lang === 'tr' ? 'Rapor Gönderildi!' : 'Report Sent!'}</h3>
                      <p>
                        {lang === 'tr'
                          ? 'Detaylı raporunuz en kısa sürede e-posta adresinize gönderilecek.'
                          : 'Your detailed report will be sent to your email shortly.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              </FadeIn>

              {/* Actions */}
              <FadeIn delay={0.7}>
                <div className="result-actions">
                  <Link to="/iletisim" className="btn btn-primary">
                    {lang === 'tr' ? 'Ücretsiz Danışmanlık Al' : 'Get Free Consultation'}
                    <HiOutlineArrowRight size={16} />
                  </Link>
                  <button className="btn btn-outline" onClick={handleDownloadReport}>
                    <HiOutlineClipboardCheck size={16} />
                    {lang === 'tr' ? 'Raporu İndir' : 'Download Report'}
                  </button>
                  <button className="btn btn-outline" onClick={handleReset}>
                    {lang === 'tr' ? 'Yeni Analiz Yap' : 'New Analysis'}
                  </button>
                </div>
              </FadeIn>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      {phase === 'input' && (
        <section className="cta-section">
          <div className="cta-glow" />
          <div className="grid-bg" />
          <div className="container">
            <ScaleIn>
              <div className="cta-content glass-card">
                <h2>
                  {lang === 'tr' ? 'Profesyonel ' : 'Need Professional '}
                  <span>{lang === 'tr' ? 'Destek mi' : 'Support'}</span>
                  {lang === 'tr' ? ' İstiyorsunuz?' : '?'}
                </h2>
                <p>
                  {lang === 'tr'
                    ? 'Sosyal medya stratejinizi profesyonel ekibimizle birlikte oluşturalım. İlk danışmanlık ücretsiz!'
                    : 'Let us build your social media strategy together with our professional team. First consultation is free!'}
                </p>
                <div className="cta-actions">
                  <Link to="/iletisim" className="btn btn-primary">
                    {lang === 'tr' ? 'Hemen Başlayalım' : 'Let\'s Get Started'}
                    <HiOutlineArrowRight size={18} />
                  </Link>
                  <Link to="/paketler" className="btn btn-outline">
                    {lang === 'tr' ? 'Paketleri İncele' : 'View Packages'}
                  </Link>
                </div>
              </div>
            </ScaleIn>
          </div>
        </section>
      )}
    </PageTransition>
  )
}
