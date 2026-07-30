import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import { useCustomer } from '../contexts/CustomerContext'
import './Navbar.css'

// Solda marka (şimşek sembolü + wordmark), sağda linkler + TEMA,
// sağ altta sabit GİRİŞ hapı.
//
// Bu linkler eskiden `static: true` ile işaretliydi ve `<a href>` üzerinden
// TAM SAYFA YÜKLEMESİ yapıyordu. Gerekçe olarak "sayfa artık statik HTML,
// SPA router yakalamasın" yazıyordu — bu, `/` adresinin vendored bir
// snapshot'la servis edildiği döneme aitti. Snapshot kaldırıldı ve altı
// rotanın hepsi React router'da tanımlı (App.jsx), dolayısıyla her tıklamada
// uygulamayı baştan indirmek için bir sebep kalmadı. Artık SPA gezinmesi.
const NAV_LINKS = [
  { name: 'HİZMETLER', path: '/hizmetler' },
  { name: 'PAKETLER', path: '/paketler' },
  { name: 'PORTFOLYO', path: '/portfolio' },
  { name: 'HAKKIMIZDA', path: '/hakkimizda' },
  { name: 'BLOG', path: '/blog' },
  { name: 'İLETİŞİM', path: '/iletisim' },
]

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
        <Link to="/" className="knav-brand">
          {/* Sembol dekoratif; markanın adını yanındaki metin veriyor, bu
              yüzden ekran okuyucuya iki kez okunmaz. */}
          <img src="/favicon.png" alt="" aria-hidden="true" width="26" height="26" className="knav-brand__mark" />
          <span className="knav-brand__text">kade media</span>
        </Link>

        <div className="knav-links">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`knav-link ${location.pathname === l.path ? 'active' : ''}`}
              aria-current={location.pathname === l.path ? 'page' : undefined}
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
                className={`knav-mlink ${location.pathname === l.path ? 'active' : ''}`}
                aria-current={location.pathname === l.path ? 'page' : undefined}
              >
                {l.name}
              </Link>
            ))}
            <button type="button" className="knav-mlink" onClick={toggleTheme} aria-label={themeLabel}><ThemeIcon size={15} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 7 }} />TEMA</button>
            {/* Sabit GİRİŞ hapı ≤1024px'te gizlenir (içeriği örtüyordu); erişim
                menü içinden sürdürülür. Bkz. .knav-giris--float. */}
            {customer ? (
              <Link to="/musteri-panel" className="knav-mlink knav-mlink--giris">
                {(customer.name?.split(' ')[0] || 'PANEL').toUpperCase()} →
              </Link>
            ) : (
              <Link to="/giris" className="knav-mlink knav-mlink--giris">GİRİŞ →</Link>
            )}
          </div>
        )}
      </nav>

      {customer ? (
        <Link to="/musteri-panel" className="knav-giris knav-giris--float">
          {(customer.name?.split(' ')[0] || 'PANEL').toUpperCase()} →
        </Link>
      ) : (
        <Link to="/giris" className="knav-giris knav-giris--float">GİRİŞ →</Link>
      )}
    </>
  )
}
