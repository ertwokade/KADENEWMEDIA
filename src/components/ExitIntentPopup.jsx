import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineDownload, HiOutlineCheckCircle, HiOutlineMail } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { subscribeNewsletterApi } from '../api'
import './ExitIntentPopup.css'

const SESSION_KEY = 'kade_exit_popup_seen'
const DELAY_MS = 40000

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const { lang } = useLanguage()

  const show = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }, [])

  useEffect(() => {
    if (window.location.pathname === '/iletisim' || window.location.pathname === '/admin') return
    const onMouseLeave = (e) => { if (e.clientY < 5) show() }
    document.addEventListener('mouseleave', onMouseLeave)
    const timer = setTimeout(show, DELAY_MS)
    return () => { document.removeEventListener('mouseleave', onMouseLeave); clearTimeout(timer) }
  }, [show])

  const close = () => setVisible(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMsg(lang === 'tr' ? 'Geçerli bir e-posta girin' : 'Enter a valid email')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      await subscribeNewsletterApi(email)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'))
      setStatus('error')
    }
  }

  const benefits = lang === 'tr'
    ? [
        'Platform bazlı içerik stratejileri',
        'En iyi paylaşım saatleri ve taktikleri',
        'Etkileşim artırma formülleri',
        'Aylık içerik takvimi şablonu',
      ]
    : [
        'Platform-specific content strategies',
        'Best posting times and tactics',
        'Engagement boosting formulas',
        'Monthly content calendar template',
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

            {status === 'success' ? (
              <div className="exit-success">
                <div className="exit-success-icon">
                  <HiOutlineCheckCircle size={48} />
                </div>
                <h2>{lang === 'tr' ? 'Rehberiniz Hazır!' : 'Your Guide is Ready!'}</h2>
                <p>
                  {lang === 'tr'
                    ? 'Aşağıdaki butona tıklayarak 2026 Sosyal Medya Büyüme Rehberini indirebilirsiniz.'
                    : 'Click the button below to download the 2026 Social Media Growth Guide.'}
                </p>
                <a
                  href="/rehber-2026.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                >
                  <HiOutlineDownload size={18} />
                  {lang === 'tr' ? 'Rehberi İndir' : 'Download Guide'}
                </a>
                <button className="exit-dismiss" onClick={close} style={{ marginTop: 12 }}>
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <div className="exit-icon">
                  <HiOutlineDownload size={32} />
                </div>

                <div className="exit-badge">
                  {lang === 'tr' ? '📘 Ücretsiz PDF Rehber' : '📘 Free PDF Guide'}
                </div>

                <h2 className="exit-title">
                  {lang === 'tr'
                    ? '2026 Sosyal Medya Büyüme Rehberi'
                    : '2026 Social Media Growth Guide'}
                </h2>
                <p className="exit-desc">
                  {lang === 'tr'
                    ? '10+ markayı büyüten stratejilerimizi bir araya getirdik. Instagram, TikTok ve LinkedIn için kanıtlanmış büyüme taktikleri.'
                    : 'We compiled the strategies that grew 10+ brands. Proven growth tactics for Instagram, TikTok, and LinkedIn.'}
                </p>

                <ul className="exit-benefits">
                  {benefits.map((b, i) => (
                    <li key={i}>
                      <HiOutlineCheckCircle size={16} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <form className="exit-email-form" onSubmit={handleSubmit}>
                  <div className="exit-input-row">
                    <div className="exit-input-wrapper">
                      <HiOutlineMail size={18} />
                      <input
                        type="email"
                        placeholder={lang === 'tr' ? 'E-posta adresiniz' : 'Your email address'}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setStatus(null) }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary exit-cta" disabled={status === 'loading'}>
                      {status === 'loading'
                        ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                        : (lang === 'tr' ? 'Ücretsiz İndir' : 'Download Free')}
                      <HiOutlineDownload size={16} />
                    </button>
                  </div>
                  {status === 'error' && <p className="exit-error">{errorMsg}</p>}
                </form>

                <button className="exit-dismiss" onClick={close}>
                  {lang === 'tr' ? 'Şimdi değil, teşekkürler' : 'Not now, thanks'}
                </button>

                <p className="exit-note">
                  {lang === 'tr' ? 'Spam göndermiyoruz • İstediğiniz zaman abonelikten çıkın' : 'No spam • Unsubscribe anytime'}
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
