import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useCustomer } from '../contexts/CustomerContext'
import useSiteContent from '../hooks/useSiteContent'
import { NAVIGATION_DEFAULTS } from '../data/pageDefaults'
import './Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { lang } = useLanguage()
  const isDark = theme === 'dark'
  const ThemeIcon = isDark ? HiOutlineSun : HiOutlineMoon
  const themeLabel = isDark ? 'Açık temaya geç' : 'Koyu temaya geç'
  const { customer } = useCustomer()
  const { content: navigation } = useSiteContent('navigation', NAVIGATION_DEFAULTS)
  const navLinks = Array.isArray(navigation?.links) && navigation.links.length ? navigation.links : NAVIGATION_DEFAULTS.links
  const safeLinks = navLinks.filter((link) => typeof link.path === 'string' && link.path.startsWith('/') && !link.path.startsWith('//'))

  useEffect(() => { setIsOpen(false) }, [location])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(mobileMenuRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])
    focusable()[0]?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        menuButtonRef.current?.focus()
        requestAnimationFrame(() => menuButtonRef.current?.focus())
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const onResize = () => {
      if (window.innerWidth > 1024) setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [isOpen])

  return (
    <>
      <nav className="knav">
        <a href="/" className="knav-brand">kade media</a>

        <div className="knav-links">
          {safeLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`knav-link ${location.pathname === link.path ? 'active' : ''}`}
              aria-current={location.pathname === link.path ? 'page' : undefined}
            >
              {lang === 'en' ? (link.labelEn || link.labelTr) : (link.labelTr || link.labelEn)}
            </Link>
          ))}
          <button type="button" className="knav-link knav-tema" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
            <ThemeIcon size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 5 }} />
            TEMA
          </button>
        </div>

        <button
          ref={menuButtonRef}
          className="knav-burger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          {isOpen ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
        </button>

        {isOpen && (
          <div id="mobile-navigation" ref={mobileMenuRef} className="knav-mobile" role="navigation" aria-label="Mobil navigasyon">
            {safeLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`knav-mlink ${location.pathname === link.path ? 'active' : ''}`}
                aria-current={location.pathname === link.path ? 'page' : undefined}
              >
                {lang === 'en' ? (link.labelEn || link.labelTr) : (link.labelTr || link.labelEn)}
              </Link>
            ))}
            <button type="button" className="knav-mlink" onClick={toggleTheme} aria-label={themeLabel}><ThemeIcon size={15} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 7 }} />TEMA</button>
          </div>
        )}
      </nav>

      {customer ? (
        <Link to="/musteri-panel" className="knav-giris">
          {(customer.name?.split(' ')[0] || 'PANEL').toUpperCase()} →
        </Link>
      ) : (
        <Link to="/giris" className="knav-giris">
          {lang === 'en' ? (navigation.loginLabelEn || NAVIGATION_DEFAULTS.loginLabelEn) : (navigation.loginLabelTr || NAVIGATION_DEFAULTS.loginLabelTr)}
        </Link>
      )}
    </>
  )
}
