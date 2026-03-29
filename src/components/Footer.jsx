import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaInstagram, FaYoutube, FaTiktok, FaLinkedinIn } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { HiArrowUp } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './Footer.css'

const socialLinks = [
  { icon: FaInstagram, href: 'https://instagram.com/kademediacom', label: 'Instagram' },
  { icon: FaXTwitter, href: 'https://x.com/kademediacom', label: 'X' },
  { icon: FaYoutube, href: 'https://www.youtube.com/@kademediacom', label: 'YouTube' },
  { icon: FaTiktok, href: 'https://tiktok.com/@kademediacom', label: 'TikTok' },
  { icon: FaLinkedinIn, href: 'https://www.linkedin.com/company/kademediaagency', label: 'LinkedIn' },
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
              <img src="/logo.png" alt="" className="footer-logo-icon" />
              <span>KADE <em>MEDIA</em></span>
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
                <a href="mailto:hello@kademedia.com">hello@kademedia.com</a>
              </li>
              <li>
                <a href="tel:+905067293423">0 506 729 34 23</a>
              </li>
              <li>Biruni Teknopark, Zeytinburnu/İstanbul</li>
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
