import { Link } from 'react-router-dom'
import { BRAND, SOCIAL_LINKS } from '../config/brand'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="kfoot">
      <div className="kfoot-display">
        <div className="kfoot-row">
          <span className="kfoot-w kfoot-w1">BİRLİKTE</span>
          <span className="kfoot-w kfoot-w2">HARİKA</span>
        </div>
        <div className="kfoot-row"><span className="kfoot-w kfoot-w3">İŞLER</span></div>
        <div className="kfoot-row"><span className="kfoot-w kfoot-w4">BAŞARALIM</span></div>
      </div>

      <div className="kfoot-bar">
        <a href={`mailto:${BRAND.email}`} className="kfoot-link">{BRAND.email}</a>
        <div className="kfoot-socials">
          {SOCIAL_LINKS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="kfoot-link">
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="kfoot-legal">
        <span>© {new Date().getFullYear()} {BRAND.name.toUpperCase()} · {BRAND.city.toUpperCase()}</span>
        <div className="kfoot-legal-links">
          <Link to="/kvkk">KVKK</Link>
          <Link to="/gizlilik">GİZLİLİK</Link>
          <Link to="/cerez-politikasi">ÇEREZ</Link>
          <Link to="/telif-haklari">TELİF HAKLARI</Link>
          <Link to="/sss">SSS</Link>
        </div>
      </div>
    </footer>
  )
}
