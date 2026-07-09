import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiChevronDown, HiMenuAlt3, HiX, HiOutlineUser } from 'react-icons/hi'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
import { useCustomer } from '../contexts/CustomerContext'
import SiteSearch from './SiteSearch'
import './Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const { lang, toggleLang, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { customer } = useCustomer()

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.about'), path: '/hakkimizda' },
    { name: t('nav.services'), path: '/hizmetler' },
    { name: t('nav.packages'), path: '/paketler' },
    { name: t('nav.partners'), path: '/partnerler' },
    { name: t('nav.blog'), path: '/blog' },
    { name: t('nav.contact'), path: '/iletisim' },
  ]

  const resourceLinks = [
    { name: 'KADE KIT 🚀', path: '/kade-kit' },
    { name: 'Demo', path: '/demo' },
    { name: lang === 'tr' ? 'Neden Biz?' : 'Why Us?', path: '/neden-biz' },
    { name: lang === 'tr' ? 'Kariyer' : 'Careers', path: '/kariyer' },
    { name: lang === 'tr' ? 'Referanslar' : 'References', path: '/referanslar' },
    { name: lang === 'tr' ? 'Basın' : 'Press', path: '/basin' },
    { name: lang === 'tr' ? 'SSS' : 'FAQ', path: '/sss' },
    { name: lang === 'tr' ? 'Fiyat Hesaplama' : 'Price Calculator', path: '/fiyat-hesaplama' },
    { name: lang === 'tr' ? 'Podcast & Webinar' : 'Podcast & Webinar', path: '/podcast-webinar' },
    { name: lang === 'tr' ? 'Referans Programı' : 'Referral Program', path: '/referans-programi' },
  ]

  const resourcesActive = resourceLinks.some(link => location.pathname === link.path)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setResourcesOpen(false)
  }, [location])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setResourcesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <motion.span
            className="logo-mark"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M13 1.5 3.5 14h7.1l-2.1 8.5L20.5 8.5H13Z" fill="currentColor" />
            </svg>
          </motion.span>
          <span className="logo-word">kade <span>media</span></span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeNav"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
          <div
            ref={dropdownRef}
            className={`navbar-dropdown ${resourcesActive ? 'active' : ''} ${resourcesOpen ? 'open' : ''}`}
          >
            <button
              type="button"
              className="navbar-link navbar-dropdown-toggle"
              onClick={() => setResourcesOpen(prev => !prev)}
            >
              {lang === 'tr' ? 'Kaynaklar' : 'Resources'}
              <HiChevronDown size={14} />
              {resourcesActive && <motion.div className="active-indicator" layoutId="activeNav" />}
            </button>
            <div className="navbar-dropdown-menu">
              {resourceLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-dropdown-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <SiteSearch compact />

          <motion.button
            className="theme-toggle"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </motion.button>

          <motion.button
            className="lang-toggle"
            onClick={toggleLang}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
          >
            <span className={lang === 'tr' ? 'lang-active' : ''}>TR</span>
            <span className="lang-divider">/</span>
            <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
          </motion.button>

          {customer ? (
            <Link to="/musteri-panel" className="navbar-login-btn">
              <HiOutlineUser size={16} />
              <span>{customer.name?.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/giris" className="navbar-login-btn">
              <HiOutlineUser size={16} />
              <span>Giriş Yap</span>
            </Link>
          )}

          <Link to="/teklif-al" className="navbar-cta btn btn-primary">
            {t('nav.cta')}
          </Link>
        </div>

        <div className="navbar-mobile-right">
          <SiteSearch compact onNavigate={() => setIsOpen(false)} />

          <motion.button
            className="theme-toggle theme-toggle-mobile"
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </motion.button>

          <motion.button
            className="lang-toggle lang-toggle-mobile"
            onClick={toggleLang}
            whileTap={{ scale: 0.95 }}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </motion.button>

          <button
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={link.path}
                  className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            {resourceLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinks.length + i) * 0.05 }}
              >
                <Link
                  to={link.path}
                  className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            {customer ? (
              <Link to="/musteri-panel" className="btn mobile-cta mobile-login-cta">
                <HiOutlineUser size={16} /> {customer.name?.split(' ')[0]} · Panelim
              </Link>
            ) : (
              <Link to="/giris" className="btn mobile-cta mobile-login-cta">
                <HiOutlineUser size={16} /> Giriş Yap
              </Link>
            )}
            <Link to="/teklif-al" className="btn btn-primary mobile-cta">
              {t('nav.cta')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
