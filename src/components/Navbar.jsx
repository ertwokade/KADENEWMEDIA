import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import { useCustomer } from '../contexts/CustomerContext'
import './Navbar.css'

// Anasayfa (site.html "hello") nav'ının birebir React versiyonu:
// solda kade media wordmark (wdth 120), sağda 13px mono linkler + TEMA,
// sağ altta sabit GİRİŞ gold hapı. Arama/TR-EN/TEKLİF AL şablonda yok.
// static:true → sayfa artık statik HTML (vercel.json rewrite); SPA router
// yakalamasın diye tam yükleme (<a href>) ile gidilir.
const NAV_LINKS = [
  { name: 'HİZMETLER', path: '/hizmetler', static: true },
  { name: 'PAKETLER', path: '/paketler', static: true },
  { name: 'HAKKIMIZDA', path: '/hakkimizda', static: true },
  { name: 'İLETİŞİM', path: '/iletisim', static: true },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const location = useLocation()
  const { toggleTheme } = useTheme()
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
        <a href="/" className="knav-brand">kade media</a>

        <div className="knav-links">
          {NAV_LINKS.map((l) => (
            l.static ? (
              <a key={l.path} href={l.path} className={`knav-link ${location.pathname === l.path ? 'active' : ''}`} aria-current={location.pathname === l.path ? 'page' : undefined}>{l.name}</a>
            ) : (
              <Link
                key={l.path}
                to={l.path}
                className={`knav-link ${location.pathname === l.path ? 'active' : ''}`}
                aria-current={location.pathname === l.path ? 'page' : undefined}
              >
                {l.name}
              </Link>
            )
          ))}
          <button type="button" className="knav-link knav-tema" onClick={toggleTheme} aria-label="Temayı değiştir">
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
              l.static ? (
                <a key={l.path} href={l.path} className={`knav-mlink ${location.pathname === l.path ? 'active' : ''}`} aria-current={location.pathname === l.path ? 'page' : undefined}>{l.name}</a>
              ) : (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`knav-mlink ${location.pathname === l.path ? 'active' : ''}`}
                  aria-current={location.pathname === l.path ? 'page' : undefined}
                >
                  {l.name}
                </Link>
              )
            ))}
            <button type="button" className="knav-mlink" onClick={toggleTheme} aria-label="Temayı değiştir">TEMA</button>
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
