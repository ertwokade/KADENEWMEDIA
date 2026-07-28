import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import { useCustomer } from '../contexts/CustomerContext'
import Logo from './system/Logo'
import { BRAND } from '../config/brand'
import './Navbar.css'

// Site geneli navigasyon.
//
// NOT: Bu linkler daha önce `static: true` ile <a href> olarak render
// ediliyordu; ana sayfa ayrı bir statik snapshot olduğu için SPA router'ın
// devralmaması gerekiyordu. Snapshot emekliye ayrıldı ve `/` artık React
// uygulamasının parçası — linkler <Link> ile SPA geçişi yapar, böylece
// sayfa geçiş animasyonu çalışır ve her tıklamada tam yükleme olmaz.
const NAV_LINKS = [
  { name: 'HİZMETLER', path: '/hizmetler' },
  { name: 'PORTFOLYO', path: '/portfolio' },
  { name: 'PAKETLER', path: '/paketler' },
  { name: 'HAKKIMIZDA', path: '/hakkimizda' },
  { name: 'BLOG', path: '/blog' },
  { name: 'İLETİŞİM', path: '/iletisim' },
]

/** Alt rotalarda da üst menü öğesi aktif görünmeli (/hizmetler/:slug gibi). */
function isActive(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const ThemeIcon = isDark ? HiOutlineSun : HiOutlineMoon
  const themeLabel = isDark ? 'Açık temaya geç' : 'Koyu temaya geç'
  const { customer } = useCustomer()

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
        {/* Logo dosyaları yüklendiğinde yalnız config/brandAssets.js değişir;
            buraya dokunulmaz. */}
        <Link to="/" className="knav-brand" aria-label={`${BRAND.name} — ana sayfa`}>
          <Logo variant="primary" width={118} decorative />
        </Link>

        <div className="knav-links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`knav-link ${isActive(location.pathname, l.path) ? 'active' : ''}`}
              aria-current={isActive(location.pathname, l.path) ? 'page' : undefined}
            >
              {l.name}
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
            {NAV_LINKS.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`knav-mlink ${isActive(location.pathname, l.path) ? 'active' : ''}`}
                aria-current={isActive(location.pathname, l.path) ? 'page' : undefined}
              >
                {l.name}
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
        <Link to="/giris" className="knav-giris">GİRİŞ →</Link>
      )}
    </>
  )
}
