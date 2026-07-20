import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaInstagram, FaYoutube, FaLinkedinIn, FaXTwitter, FaTiktok } from 'react-icons/fa6'
import { FiShare2, FiArrowUpRight, FiArrowLeft } from 'react-icons/fi'
import { HiBadgeCheck } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import './KadirDemir.css'

const LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/kadirardademir', icon: FaInstagram },
  { label: 'YouTube', href: 'https://www.youtube.com/@kadirdemirs', icon: FaYoutube },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kadirdemirr', icon: FaLinkedinIn },
  { label: 'X', href: 'https://x.com/kadirardademir', icon: FaXTwitter },
  { label: 'TikTok', href: 'https://www.tiktok.com/@kadirardademir', icon: FaTiktok },
]

export default function KadirDemir() {
  const [copied, setCopied] = useState(false)

  useSEO({
    title: 'Kadir Demir | Kade Media',
    description: 'Kadir Demir — Kurucu & CEO, Kade Media. Sosyal medyalarım ve bağlantılarım.',
    path: '/kadirdemir',
    image: '/kadir.jpg',
  })

  const handleShare = async () => {
    const shareData = {
      title: 'Kadir Demir',
      text: 'Kadir Demir — Kurucu & CEO, Kade Media',
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  return (
    <PageTransition>
      <div className="kd-page">
        <main className="kd-main">
          <div className="kd-shell">
            <section className="kd-card">
              <div className="kd-cover">
                <img className="kd-cover-img" src="/kadir.jpg" alt="Kadir Demir" loading="eager" />
                <div className="kd-cover-gradient" aria-hidden="true" />

                <div className="kd-cover-topbar">
                  <Link to="/" className="kd-icon-btn" aria-label="Kade Media'ya dön">
                    <FiArrowLeft size={18} />
                  </Link>
                  <button type="button" className="kd-icon-btn" onClick={handleShare} aria-label="Paylaş">
                    <FiShare2 size={18} />
                  </button>
                </div>

                <div className="kd-cover-bottom">
                  <div className="kd-cover-inner">
                    <div className="kd-name-row">
                      <h1 className="kd-name">@kadirdemir</h1>
                      <HiBadgeCheck className="kd-badge" aria-hidden="true" />
                    </div>
                    <p className="kd-tagline">Kurucu &amp; CEO, Kade Media</p>
                  </div>
                </div>
              </div>

              <div className="kd-links-wrap">
                {copied && <div className="kd-toast">Bağlantı kopyalandı</div>}
                <div className="kd-links">
                  {LINKS.map((link) => {
                    const Icon = link.icon
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="kd-link"
                      >
                        <span className="kd-link-icon">
                          <Icon size={22} />
                        </span>
                        <span className="kd-link-label">{link.label}</span>
                        <FiArrowUpRight className="kd-link-arrow" size={18} aria-hidden="true" />
                      </a>
                    )
                  })}
                </div>

                <footer className="kd-footer">
                  <Link to="/" className="kd-footer-link">Kade Media</Link>
                </footer>
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
