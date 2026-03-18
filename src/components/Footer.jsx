import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaInstagram, FaTwitter, FaLinkedinIn, FaYoutube, FaTiktok } from 'react-icons/fa'
import { HiArrowUp } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './Footer.css'

const socialLinks = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
  { icon: FaYoutube, href: '#', label: 'YouTube' },
  { icon: FaTiktok, href: '#', label: 'TikTok' },
]

export default function Footer() {
  const { t } = useLanguage()

  const footerLinks = {
    sirket: [
      { name: t('nav.about'), path: '/hakkimizda' },
      { name: t('nav.services'), path: '/hizmetler' },
      { name: t('nav.packages'), path: '/paketler' },
      { name: t('nav.partners'), path: '/partnerler' },
      { name: t('nav.careers'), path: '/kariyer' },
      { name: t('nav.blog'), path: '/blog' },
      { name: t('nav.contact'), path: '/iletisim' },
    ],
    hizmetler: [
      { name: t('servicesSection.smm'), path: '/hizmetler' },
      { name: t('servicesSection.content'), path: '/hizmetler' },
      { name: t('servicesSection.ads'), path: '/hizmetler' },
      { name: t('servicesSection.influencer'), path: '/hizmetler' },
    ],
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              kade<span>media</span>
            </Link>
            <p className="footer-desc">{t('footer.desc')}</p>
            <div className="footer-socials">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="social-link"
                  aria-label={social.label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.company')}</h4>
            <ul>
              {footerLinks.sirket.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.servicesTitle')}</h4>
            <ul>
              {footerLinks.hizmetler.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-links-group">
            <h4>{t('footer.contactTitle')}</h4>
            <ul>
              <li>
                <a href="mailto:info@kademedia.com">info@kademedia.com</a>
              </li>
              <li>
                <a href="tel:+905551234567">+90 555 123 45 67</a>
              </li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.rights')}</p>
          <motion.button
            className="scroll-top-btn"
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Yukarı çık"
          >
            <HiArrowUp size={20} />
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
