import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineArrowRight, HiOutlineLightningBolt } from 'react-icons/hi'
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
              {lang === 'tr' ? 'Ücretsiz' : 'Free'}
            </div>

            <h2 className="exit-title">
              {lang === 'tr'
                ? 'Sosyal Medyanızı Ücretsiz Analiz Edelim'
                : 'Free Social Media Analysis'}
            </h2>
            <p className="exit-desc">
              {lang === 'tr'
                ? 'Hesaplarınızı profesyonel ekibimiz incelesin, büyüme fırsatlarınızı belirleyelim. Hiçbir ücret ödemeden.'
                : 'Let our professional team review your accounts and identify growth opportunities — at no cost.'}
            </p>

            <div className="exit-actions">
              <Link to="/iletisim" className="btn btn-primary exit-cta" onClick={close}>
                {lang === 'tr' ? 'Ücretsiz Teklif Al' : 'Get Free Quote'}
                <HiOutlineArrowRight size={18} />
              </Link>
              <button className="exit-dismiss" onClick={close}>
                {lang === 'tr' ? 'Hayır, teşekkürler' : 'No thanks'}
              </button>
            </div>

            <p className="exit-note">
              {lang === 'tr' ? '24 saat içinde geri dönüş garantisi' : '24-hour response guarantee'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
