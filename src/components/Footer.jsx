import { Link } from 'react-router-dom'
import { BRAND, SOCIAL_LINKS } from '../config/brand'
import useSiteContent from '../hooks/useSiteContent'
import './Footer.css'

const FOOTER_DEFAULTS = {
  email: BRAND.email,
  phone: BRAND.phone,
  address: BRAND.address,
  instagram: SOCIAL_LINKS.find((item) => item.label === 'Instagram')?.href || '',
  youtube: SOCIAL_LINKS.find((item) => item.label === 'YouTube')?.href || '',
  tiktok: SOCIAL_LINKS.find((item) => item.label === 'TikTok')?.href || '',
  linkedin: SOCIAL_LINKS.find((item) => item.label === 'LinkedIn')?.href || '',
  twitter: SOCIAL_LINKS.find((item) => item.label === 'X')?.href || '',
  displayLines: ['BİRLİKTE', 'HARİKA', 'İŞLER', 'BAŞARALIM'],
}

export default function Footer() {
  const { content } = useSiteContent('footer', FOOTER_DEFAULTS)
  const displayLines = Array.isArray(content.displayLines) && content.displayLines.length === 4
    ? content.displayLines
    : ['BİRLİKTE', 'HARİKA', 'İŞLER', 'BAŞARALIM']
  const socialLinks = [
    ['Instagram', content.instagram],
    ['X', content.twitter],
    ['YouTube', content.youtube],
    ['TikTok', content.tiktok],
    ['LinkedIn', content.linkedin],
  ].filter(([, href]) => typeof href === 'string' && /^https:\/\//.test(href))

  return (
    <footer className="kfoot">
      <div className="kfoot-display">
        <div className="kfoot-row">
          <span className="kfoot-w kfoot-w1">{displayLines[0]}</span>
          <span className="kfoot-w kfoot-w2">{displayLines[1]}</span>
        </div>
        <div className="kfoot-row"><span className="kfoot-w kfoot-w3">{displayLines[2]}</span></div>
        <div className="kfoot-row"><span className="kfoot-w kfoot-w4">{displayLines[3]}</span></div>
      </div>

      <div className="kfoot-bar">
        <a href={`mailto:${content.email || BRAND.email}`} className="kfoot-link">{content.email || BRAND.email}</a>
        <div className="kfoot-socials">
          {socialLinks.map(([label, href]) => (
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
