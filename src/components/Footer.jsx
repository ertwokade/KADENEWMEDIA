import { Link } from 'react-router-dom'
import { BRAND, SOCIAL_LINKS, buildSocialLinks } from '../config/brand'
import { useSiteContent } from '../hooks/useSiteContent'
import './Footer.css'

export default function Footer() {
  // Admin > İçerik Yönetimi > Footer ekranı e-posta, telefon, adres ve sosyal
  // medya adreslerini kaydediyordu; bu bileşen o veriyi hiç okumadığı için
  // yöneticinin girdiği hiçbir bilgi sitede görünmüyordu (SOCIAL_LINKS sabiti
  // boş dizi olduğundan sosyal medya satırı tamamen boştu).
  // Statik BRAND değerleri taban olarak kalır: API erişilemezse footer boşalmaz.
  const { content } = useSiteContent('footer', BRAND)
  const email = content.email || BRAND.email
  const socials = buildSocialLinks(content, SOCIAL_LINKS)

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
        <a href={`mailto:${email}`} className="kfoot-link">{email}</a>
        {socials.length > 0 && (
          <nav className="kfoot-socials" aria-label="Sosyal medya hesaplarımız">
            {socials.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="kfoot-link"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className="kfoot-legal">
        <span>© {new Date().getFullYear()} {BRAND.name.toUpperCase()} · {(content.city || BRAND.city).toUpperCase()}</span>
        <nav className="kfoot-legal-links" aria-label="Yasal bilgiler">
          <Link to="/kvkk">KVKK</Link>
          <Link to="/gizlilik">GİZLİLİK</Link>
          <Link to="/cerez-politikasi">ÇEREZ</Link>
          <Link to="/telif-haklari">TELİF HAKLARI</Link>
          <Link to="/sss">SSS</Link>
        </nav>
      </div>
    </footer>
  )
}
