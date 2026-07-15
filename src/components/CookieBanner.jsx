import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import './CookieBanner.css'

const GA_ID = import.meta.env.VITE_GA_ID || 'G-R893K1VE79'

function loadAnalytics() {
  if (!GA_ID || document.querySelector('script[data-kade-analytics]')) return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
  window.gtag('consent', 'default', { analytics_storage: 'granted' })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { page_path: window.location.pathname })
  const script = document.createElement('script')
  script.async = true
  script.dataset.kadeAnalytics = 'true'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
}

export default function CookieBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (consent === 'accepted') {
      loadAnalytics()
    } else if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const enableAnalytics = () => {
    loadAnalytics()
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  const disableAnalytics = () => {
    // Disable GA4 tracking
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      })
    }
    // Remove GA cookies
    document.cookie.split(';').forEach(c => {
      const name = c.trim().split('=')[0]
      if (name.startsWith('_ga') || name.startsWith('_gid')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
    document.querySelector('script[data-kade-analytics]')?.remove()
  }

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    enableAnalytics()
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    disableAnalytics()
    setVisible(false)
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="cookie-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="cookie-content">
              <span className="cookie-icon">🍪</span>
              <p>{t('cookie.message')}</p>
            </div>
            <div className="cookie-actions">
              <Link className="cookie-btn cookie-details" to="/cerez-politikasi">
                {t('cookie.details')}
              </Link>
              <button className="cookie-btn cookie-decline" onClick={handleDecline}>
                {t('cookie.decline')}
              </button>
              <button className="cookie-btn cookie-accept" onClick={handleAccept}>
                {t('cookie.accept')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
