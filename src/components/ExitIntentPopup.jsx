import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineArrowRight, HiOutlineLightningBolt, HiOutlineCheckCircle } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './ExitIntentPopup.css'

const SESSION_KEY = 'kade_exit_popup_seen'
const DELAY_MS = 40000 // 40 seconds fallback for mobile

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false)
  const { lang } = useLanguage()

  const show = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }, [])

  useEffect(() => {
    // Don't show on contact or admin pages
    if (window.location.pathname === '/iletisim' || window.location.pathname === '/admin') return

    // Desktop: exit intent on mouse leaving viewport top
    const onMouseLeave = (e) => {
      if (e.clientY < 5) show()
    }
    document.addEventListener('mouseleave', onMouseLeave)

    // Mobile/fallback: show after DELAY_MS
    const timer = setTimeout(show, DELAY_MS)

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      clearTimeout(timer)
    }
  }, [show])

  const close = () => setVisible(false)

  const benefits = lang === 'tr'
    ? [
        'Rakip analizi ve sektör karşılaştırması',
        'Büyüme fırsatları ve aksiyon planı',
        'Reklam bütçesi optimizasyon önerileri',
      ]
    : [
        'Competitor analysis & industry benchmarks',
        'Growth opportunities & action plan',
        'Ad budget optimization suggestions',
      ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="exit-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="exit-popup"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <button className="exit-close" onClick={close} aria-label="Kapat">
              <HiOutlineX size={20} />
            </button>

            <div className="exit-icon">
              <HiOutlineLightningBolt size={32} />
            </div>

            <div className="exit-badge">
              {lang === 'tr' ? '✨ Tamamen Ücretsiz' : '✨ Completely Free'}
            </div>

            <h2 className="exit-title">
              {lang === 'tr'
                ? 'Markanızın Dijital Potansiyelini Keşfedin'
                : 'Discover Your Brand\'s Digital Potential'}
            </h2>
            <p className="exit-desc">
              {lang === 'tr'
                ? '10+ markaya güç veren uzman ekibimiz, sosyal medya hesaplarınızı analiz edip size özel bir büyüme yol haritası oluştursun.'
                : 'Our expert team, powering 10+ brands, will analyze your social media accounts and create a custom growth roadmap for you.'}
            </p>

            <ul className="exit-benefits">
              {benefits.map((b, i) => (
                <li key={i}>
                  <HiOutlineCheckCircle size={16} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="exit-actions">
              <Link to="/iletisim" className="btn btn-primary exit-cta" onClick={close}>
                {lang === 'tr' ? 'Ücretsiz Analiz Talep Et' : 'Request Free Analysis'}
                <HiOutlineArrowRight size={18} />
              </Link>
              <button className="exit-dismiss" onClick={close}>
                {lang === 'tr' ? 'Şimdi değil, teşekkürler' : 'Not now, thanks'}
              </button>
            </div>

            <p className="exit-note">
              {lang === 'tr' ? '24 saat içinde geri dönüş garantisi • Taahhüt yok' : '24-hour response guarantee • No commitment'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

