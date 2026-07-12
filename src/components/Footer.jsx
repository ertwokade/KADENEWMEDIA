import { Link } from 'react-router-dom'
import './Footer.css'

// Anasayfa (site.html) footer'ının birebir React versiyonu:
// asimetrik dev display "BİRLİKTE HARİKA İŞLER BAŞARALIM",
// altta e-posta + sosyal linkler, en altta ince yasal satır.
const SOCIALS = [
  ['Instagram', 'https://instagram.com/kadenewmedia'],
  ['X', 'https://x.com/kadenewmedia'],
  ['YouTube', 'https://www.youtube.com/@kadenewmedia'],
  ['TikTok', 'https://tiktok.com/@kadenewmedia'],
  ['LinkedIn', 'https://www.linkedin.com/company/kadenewmedia'],
]

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
        <a href="mailto:thekademedia@gmail.com" className="kfoot-link">thekademedia@gmail.com</a>
        <div className="kfoot-socials">
          {SOCIALS.map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="kfoot-link">
              {name}
            </a>
          ))}
        </div>
      </div>

      <div className="kfoot-legal">
        <span>© {new Date().getFullYear()} KADE MEDIA · İSTANBUL</span>
        <div className="kfoot-legal-links">
          <Link to="/kvkk">KVKK</Link>
          <Link to="/gizlilik">GİZLİLİK</Link>
          <Link to="/cerez-politikasi">ÇEREZ</Link>
          <Link to="/sss">SSS</Link>
        </div>
      </div>
    </footer>
  )
}
