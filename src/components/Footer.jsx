import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaInstagram, FaYoutube, FaTiktok, FaLinkedinIn } from 'react-icons/fa'
import { HiArrowUp, HiOutlineMail, HiOutlineCheck } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { getContentApi, subscribeNewsletterApi } from '../api'
import './Footer.css'

export default function Footer() {
  const { t, lang } = useLanguage()
  const [footerData, setFooterData] = useState(null)
  const [nlEmail, setNlEmail] = useState('')
  const [nlStatus, setNlStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [nlError, setNlError] = useState('')

  useEffect(() => {
    getContentApi('footer').then(res => {
      if (res?.data) setFooterData(res.data)
    }).catch(() => {})
  }, [])

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!nlEmail || !nlEmail.includes('@')) {
      setNlError(lang === 'tr' ? 'Geçerli bir e-posta adresi girin' : 'Please enter a valid email')
      setNlStatus('error')
      return
    }
    setNlStatus('loading')
    setNlError('')
    try {
      await subscribeNewsletterApi(nlEmail)
      setNlStatus('success')
      setNlEmail('')
      setTimeout(() => setNlStatus(null), 5000)
    } catch (err) {
      setNlError(err.message || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'))
      setNlStatus('error')
    }
  }

  const socialLinks = [
    { icon: FaInstagram, href: footerData?.instagram || 'https://instagram.com/kademediacom', label: 'Instagram' },
    { icon: FaYoutube, href: footerData?.youtube || 'https://www.youtube.com/@kademediacom', label: 'YouTube' },
    { icon: FaTiktok, href: footerData?.tiktok || 'https://tiktok.com/@kademediacom', label: 'TikTok' },
    { icon: FaLinkedinIn, href: footerData?.linkedin || 'https://www.linkedin.com/company/kademediaagency', label: 'LinkedIn' },
  ]

  const footerLinks = {
    sirket: [
      { name: t('nav.about'), path: '/hakkimizda' },
      { name: t('nav.services'), path: '/hizmetler' },
      { name: t('nav.packages'), path: '/paketler' },
      { name: t('nav.partners'), path: '/partnerler' },
      { name: t('nav.careers'), path: '/kariyer' },
      { name: t('nav.blog'), path: '/blog' },
      { name: t('nav.contact'), path: '/iletisim' },
    ],
    hizmetler: [
      { name: t('servicesSection.smm'), path: '/hizmetler' },
      { name: t('servicesSection.content'), path: '/hizmetler' },
      { name: t('servicesSection.ads'), path: '/hizmetler' },
    ],
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="container">

        {/* Newsletter Strip */}
        <div className="footer-newsletter">
          <div className="footer-newsletter-text">
            <HiOutlineMail size={24} />
            <div>
              <strong>{lang === 'tr' ? 'Dijital Dünyadan Haberdar Olun' : 'Stay Updated from the Digital World'}</strong>
              <p>{lang === 'tr' ? 'Sosyal medya trendleri ve ipuçlarını e-postanıza gönderelim' : 'Get social media trends and tips delivered to your inbox'}</p>
            </div>
          </div>
          {nlStatus === 'success' ? (
            <div className="footer-newsletter-success">
              <HiOutlineCheck size={18} />
              {lang === 'tr' ? 'Başarıyla abone oldunuz!' : 'Successfully subscribed!'}
            </div>
          ) : (
            <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                className="footer-newsletter-input"
                placeholder={lang === 'tr' ? 'E-posta adresiniz...' : 'Your email address...'}
                value={nlEmail}
                onChange={(e) => { setNlEmail(e.target.value); setNlStatus(null) }}
              />
              <button type="submit" className="btn btn-primary footer-newsletter-btn" disabled={nlStatus === 'loading'}>
                {nlStatus === 'loading'
                  ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                  : (lang === 'tr' ? 'Abone Ol' : 'Subscribe')}
              </button>
              {nlStatus === 'error' && <div className="footer-newsletter-error">{nlError}</div>}
            </form>
          )}
        </div>

        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/logo.png" alt="Kade Media" className="footer-logo-icon" />
            </Link>
            <p className="footer-desc">{t('footer.desc')}</p>
            <div className="footer-socials">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label={social.label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.company')}</h4>
            <ul>
              {footerLinks.sirket.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.servicesTitle')}</h4>
            <ul>
              {footerLinks.hizmetler.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.contactTitle')}</h4>
            <ul>
              <li>
                <a href={`mailto:${footerData?.email || 'hello@kademedia.com'}`}>{footerData?.email || 'hello@kademedia.com'}</a>
              </li>
              <li>
                <a href={`tel:${footerData?.phone || '+905067293423'}`}>{footerData?.phone || '0 506 729 34 23'}</a>
              </li>
              <li>{footerData?.address || 'Biruni Teknopark, Zeytinburnu/İstanbul'}</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.rights')}</p>
          <div className="footer-legal-links">
            <Link to="/kvkk">KVKK</Link>
            <Link to="/gizlilik">{lang === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}</Link>
            <Link to="/cerez-politikasi">{lang === 'en' ? 'Cookie Policy' : 'Çerez Politikası'}</Link>
          </div>
          <motion.button
            className="scroll-top-btn"
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Yukarı çık"
          >
            <HiArrowUp size={20} />
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
