import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineExternalLink,
  HiOutlineCheck,
} from 'react-icons/hi'
import { FaInstagram, FaYoutube, FaTiktok, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { sendContactApi } from '../api'
import { analytics } from '../utils/analytics'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Contact.css'

const socials = [
  { icon: FaInstagram, href: 'https://instagram.com/kademediacom', label: 'Instagram' },
  { icon: FaXTwitter, href: 'https://x.com/kademediacom', label: 'X' },
  { icon: FaYoutube, href: 'https://www.youtube.com/@kademediacom', label: 'YouTube' },
  { icon: FaTiktok, href: 'https://tiktok.com/@kademediacom', label: 'TikTok' },
  { icon: FaLinkedinIn, href: 'https://www.linkedin.com/company/kademediaagency', label: 'LinkedIn' },
  { icon: FaWhatsapp, href: 'https://wa.me/905067293423', label: 'WhatsApp' },
]

const MAPS_LINK = 'https://maps.app.goo.gl/Zy5j7cpcwP5y99Wx7'
const MAPS_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6!2d28.906!3d41.004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa5307e731e3f%3A0x6b0e61f4c5c9a6e8!2sBiruni+Teknopark!5e0!3m2!1str!2str!4v1700000000000'

export default function Contact() {
  const { t } = useLanguage()
  useSEO({
    title: 'İletişim | Teklif Alın',
    description: 'Kade Media ile iletişime geçin. Sosyal medya yönetimi, dijital pazarlama veya içerik üretimi için ücretsiz teklif alın. İstanbul - Biruni Teknopark.',
    keywords: 'sosyal medya ajansı iletişim, dijital pazarlama teklif, sosyal medya yönetim teklifi, kade media iletişim',
    path: '/iletisim',
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    services: [],
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [kvkkAccepted, setKvkkAccepted] = useState(false)
  // Honeypot: should remain empty — bots fill it
  const [honeypot, setHoneypot] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleServiceToggle = (value) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(value)
        ? prev.services.filter(s => s !== value)
        : [...prev.services, value]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Honeypot check
    if (honeypot) return
    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Geçerli bir e-posta adresi giriniz.')
      return
    }
    // Minimum message length
    if (formData.message.trim().length < 20) {
      setError('Mesajınız en az 20 karakter olmalıdır.')
      return
    }
    if (!kvkkAccepted) {
      setError('Devam etmek için KVKK onayını işaretlemeniz gerekmektedir.')
      return
    }
    setSending(true)
    setError('')
    try {
      await sendContactApi({ ...formData, service: formData.services.join(', ') })
      analytics.formSubmit(formData.services.join(', '))
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', company: '', services: [], message: '' })
      setKvkkAccepted(false)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      const errorMsg = err.message || ''
      if (errorMsg === 'API unavailable' || errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        // API unreachable — open mailto fallback
        const subject = encodeURIComponent(`Teklif Talebi — ${formData.name}`)
        const body = encodeURIComponent(
          `Ad: ${formData.name}\nE-posta: ${formData.email}\nTelefon: ${formData.phone || '-'}\nŞirket: ${formData.company || '-'}\nHizmet: ${formData.services.join(', ') || '-'}\n\nMesaj:\n${formData.message}`
        )
        window.open(`mailto:hello@kademedia.com?subject=${subject}&body=${body}`, '_self')
        setError(t('contact.fallbackMsg') || 'Sunucu şu an erişilemez. E-posta uygulamanız açılacak.')
      } else {
        setError(errorMsg || t('contact.errorMsg') || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.')
      }
      setTimeout(() => setError(''), 8000)
    } finally {
      setSending(false)
    }
  }

  const contactInfo = [
    {
      icon: HiOutlineMail,
      title: t('contact.email'),
      value: 'hello@kademedia.com',
      link: 'mailto:hello@kademedia.com',
    },
    {
      icon: HiOutlinePhone,
      title: t('contact.phone'),
      value: '0 506 729 34 23',
      link: 'tel:+905067293423',
    },
    {
      icon: HiOutlineLocationMarker,
      title: t('contact.address'),
      value: 'Biruni Teknopark, İstanbul',
      link: MAPS_LINK,
    },
    {
      icon: HiOutlineClock,
      title: t('contact.hours'),
      value: t('contact.hoursValue'),
      link: null,
    },
  ]

  return (
    <PageTransition>
      <section className="contact-hero">
        <PageBgAnimation type="contact" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineMail size={14} />
              {t('contact.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('contact.title')} <span>{t('contact.titleHighlight')}</span> {t('contact.titleEnd')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {t('contact.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <FadeIn direction="left" className="contact-info">
              <h2>{t('contact.infoTitle')}</h2>
              <p className="contact-info-desc">
                {t('contact.infoDesc')}
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
                          <a
                            href={info.link}
                            className="contact-card-value"
                            target={info.link.startsWith('http') ? '_blank' : undefined}
                            rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
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
                <span className="contact-social-label">{t('contact.socialMedia')}</span>
                <div className="contact-social-links">
                  {socials.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
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

            <FadeIn direction="right" className="contact-form-wrapper">
              <form className="contact-form glass-card" onSubmit={handleSubmit}>
                {/* Honeypot — hidden from users, filled only by bots */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <h3>{t('contact.formTitle')}</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">{t('contact.name')} *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t('contact.name')}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">{t('contact.emailField')} *</label>
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
                    <label htmlFor="phone">{t('contact.phoneField')}</label>
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
                    <label htmlFor="company">{t('contact.company')}</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder={t('contact.company')}
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('contact.service')}</label>
                  <div className="service-checkbox-group">
                    {[
                      { value: 'sosyal-medya', label: t('servicesSection.smm') },
                      { value: 'icerik', label: t('servicesSection.content') },
                      { value: 'reklam', label: t('servicesSection.ads') },
                      { value: 'video', label: t('contact.videoProduction') },
                      { value: 'danismanlik', label: t('contact.consultingOption') },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        className={`service-checkbox-item ${formData.services.includes(opt.value) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(opt.value)}
                          onChange={() => handleServiceToggle(opt.value)}
                        />
                        <span className="checkbox-mark" />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message">{t('contact.message')} *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    placeholder={t('contact.messagePlaceholder')}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group kvkk-consent">
                  <label className={`service-checkbox-item ${kvkkAccepted ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={kvkkAccepted}
                      onChange={(e) => setKvkkAccepted(e.target.checked)}
                      required
                    />
                    <span className="checkbox-mark" />
                    <span>
                      <a href="/kvkk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>KVKK Aydınlatma Metni</a>'ni ve{' '}
                      <a href="/gizlilik" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Gizlilik Politikası</a>'nı okudum, kişisel verilerimin işlenmesine onay veriyorum.
                    </span>
                  </label>
                </div>

                <div className="submit-row">
                  <motion.button
                    type="submit"
                    className="btn btn-primary submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={sending || submitted}
                  >
                    {sending ? (
                      <span className="sending-loader">{t('contact.sending')}</span>
                    ) : submitted ? (
                      <>
                        <HiOutlineCheck size={18} />
                        {t('contact.submitted') || 'Gönderildi'}
                      </>
                    ) : (
                      <>
                        <HiOutlinePaperAirplane size={18} style={{ transform: 'rotate(90deg)' }} />
                        {t('contact.submit')}
                      </>
                    )}
                  </motion.button>

                  {submitted && (
                    <motion.span
                      className="submit-success-note"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {t('contact.successNote') || 'Ekibimiz en kısa sürede size dönecek.'}
                    </motion.span>
                  )}
                </div>

                {error && (
                  <motion.p
                    className="form-error-msg"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </form>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <div className="contact-map-section">
              <div className="contact-map-header">
                <h3>
                  <HiOutlineLocationMarker size={22} />
                  {t('contact.locationTitle')}
                </h3>
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline map-directions-btn"
                  onClick={() => analytics.mapDirections()}
                >
                  {t('contact.getDirections')}
                  <HiOutlineExternalLink size={16} />
                </a>
              </div>
              <div className="contact-map glass-card">
                <iframe
                  src={MAPS_EMBED_URL}
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '16px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Biruni Teknopark - Kade Media"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
