import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlinePaperAirplane,
} from 'react-icons/hi'
import { FaInstagram, FaTwitter, FaLinkedinIn, FaWhatsapp } from 'react-icons/fa'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Contact.css'

const contactInfo = [
  {
    icon: HiOutlineMail,
    title: 'E-posta',
    value: 'info@kademedia.com',
    link: 'mailto:info@kademedia.com',
  },
  {
    icon: HiOutlinePhone,
    title: 'Telefon',
    value: '+90 555 123 45 67',
    link: 'tel:+905551234567',
  },
  {
    icon: HiOutlineLocationMarker,
    title: 'Adres',
    value: 'İstanbul, Türkiye',
    link: null,
  },
  {
    icon: HiOutlineClock,
    title: 'Çalışma Saatleri',
    value: 'Pazartesi - Cuma, 09:00 - 18:00',
    link: null,
  },
]

const socials = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
  { icon: FaWhatsapp, href: '#', label: 'WhatsApp' },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <PageTransition>
      {/* Hero */}
      <section className="contact-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineMail size={14} />
              İletişim
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              Bizimle <span>İletişime</span> Geçin
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Projeniz hakkında konuşmak ister misiniz? Formu doldurun, size en kısa sürede
              dönüş yapalım.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <FadeIn direction="left" className="contact-info">
              <h2>İletişim Bilgileri</h2>
              <p className="contact-info-desc">
                Sorularınız, teklif talepleriniz veya iş birliği önerileriniz için bize
                ulaşabilirsiniz.
              </p>

              <StaggerContainer className="contact-cards" staggerDelay={0.1}>
                {contactInfo.map((info) => (
                  <StaggerItem key={info.title}>
                    <div className="contact-card glass-card">
                      <div className="contact-card-icon">
                        <info.icon size={22} />
                      </div>
                      <div>
                        <span className="contact-card-title">{info.title}</span>
                        {info.link ? (
                          <a href={info.link} className="contact-card-value">
                            {info.value}
                          </a>
                        ) : (
                          <span className="contact-card-value">{info.value}</span>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="contact-socials">
                <span className="contact-social-label">Sosyal Medya</span>
                <div className="contact-social-links">
                  {socials.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      className="contact-social-link"
                      aria-label={social.label}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <social.icon size={18} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Contact Form */}
            <FadeIn direction="right" className="contact-form-wrapper">
              <form className="contact-form glass-card" onSubmit={handleSubmit}>
                <h3>Teklif Alın</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Ad Soyad *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">E-posta *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Telefon</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+90 5XX XXX XX XX"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Şirket</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Şirket Adınız"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="service">İlgilendiğiniz Hizmet</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                  >
                    <option value="">Seçiniz</option>
                    <option value="sosyal-medya">Sosyal Medya Yönetimi</option>
                    <option value="icerik">İçerik Üretimi</option>
                    <option value="reklam">Reklam Yönetimi</option>
                    <option value="influencer">Influencer Marketing</option>
                    <option value="video">Video Prodüksiyon</option>
                    <option value="danismanlik">Strateji & Danışmanlık</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Mesajınız *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    placeholder="Projeniz hakkında bilgi verin..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitted}
                >
                  {submitted ? (
                    'Gönderildi! ✓'
                  ) : (
                    <>
                      Gönder
                      <HiOutlinePaperAirplane size={18} />
                    </>
                  )}
                </motion.button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
