import { useState, useEffect } from 'react'
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
  { name: 'PAKETLER', path: '/paketler' },
  { name: 'PARTNERLER', path: '/partnerler' },
  { name: 'BLOG', path: '/blog' },
  { name: 'HAKKIMIZDA', path: '/hakkimizda', static: true },
  { name: 'İLETİŞİM', path: '/iletisim', static: true },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { toggleTheme } = useTheme()
  const { customer } = useCustomer()

  useEffect(() => { setIsOpen(false) }, [location])

  return (
    <>
      <nav className="knav">
        <a href="/" className="knav-brand">kade media</a>

        <div className="knav-links">
          {NAV_LINKS.map((l) => (
            l.static ? (
              <a key={l.path} href={l.path} className="knav-link">{l.name}</a>
            ) : (
              <Link
                key={l.path}
                to={l.path}
                className={`knav-link ${location.pathname === l.path ? 'active' : ''}`}
              >
                {l.name}
              </Link>
            )
          ))}
          <button type="button" className="knav-link knav-tema" onClick={toggleTheme}>
            TEMA
          </button>
        </div>

        <button
          className="knav-burger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menü"
        >
          {isOpen ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
        </button>

        {isOpen && (
          <div className="knav-mobile">
            {NAV_LINKS.map((l) => (
              l.static ? (
                <a key={l.path} href={l.path} className="knav-mlink">{l.name}</a>
              ) : (
                <Link
                  key={l.path}
                  to={l.path}
                  className={`knav-mlink ${location.pathname === l.path ? 'active' : ''}`}
                >
                  {l.name}
                </Link>
              )
            ))}
            <button type="button" className="knav-mlink" onClick={toggleTheme}>TEMA</button>
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
