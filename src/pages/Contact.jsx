import { useState } from 'react'
import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { FaInstagram, FaYoutube, FaTiktok, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { sendContactApi } from '../api'
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
const MAPS_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6!2d28.9080!3d41.0048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa5307e731e3f%3A0x4a3e2d8c9b7f1234!2sBiruni+%C3%9Cniversitesi+Teknopark!5e0!3m2!1str!2str!4v1'

const EMAILJS_SERVICE_ID = 'service_kademedia'
const EMAILJS_TEMPLATE_ID = 'template_u92l7zb'
const EMAILJS_PUBLIC_KEY = '_TMInxsynNbt7MhxX'

export default function Contact() {
  const { t, lang } = useLanguage()
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
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const buildWhatsAppLink = (data) => {
    const text = lang === 'en'
      ? encodeURIComponent(`New Quote Request 📩\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || '-'}\nCompany: ${data.company || '-'}\nService: ${data.service || '-'}\n\nMessage:\n${data.message}`)
      : encodeURIComponent(`Yeni Teklif Talebi 📩\n\nAd: ${data.name}\nE-posta: ${data.email}\nTelefon: ${data.phone || '-'}\nŞirket: ${data.company || '-'}\nHizmet: ${data.service || '-'}\n\nMesaj:\n${data.message}`)
    return `https://wa.me/905067293423?text=${text}`
  }

  const sendViaEmailJS = async (data) => {
    return emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        from_name: data.name,
        from_email: data.email,
        phone: data.phone || '-',
        company: data.company || '-',
        service: data.service || '-',
        message: data.message,
        to_email: 'thekademedia@gmail.com',
      },
      EMAILJS_PUBLIC_KEY
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setWhatsappLink(null)

    const waLink = buildWhatsAppLink(formData)
    let sent = false

    // Try backend API first (saves to MongoDB + SMTP)
    try {
      await sendContactApi(formData)
      sent = true
    } catch (apiError) {
      console.log('Backend API failed, trying EmailJS...', apiError)
    }

    // Fallback: EmailJS
    if (!sent) {
      try {
        await sendViaEmailJS(formData)
        sent = true
      } catch (emailjsError) {
        console.log('EmailJS failed, opening WhatsApp...', emailjsError)
      }
    }

    // Last fallback: WhatsApp
    if (!sent) {
      window.open(waLink, '_blank')
    }

    setSubmitted(true)
    setWhatsappLink(waLink)
    setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' })
    setTimeout(() => {
      setSubmitted(false)
      setWhatsappLink(null)
    }, 10000)
    setSending(false)
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
      {/* Hero */}
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

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
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

            {/* Contact Form */}
            <FadeIn direction="right" className="contact-form-wrapper">
              <form className="contact-form glass-card" onSubmit={handleSubmit}>
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
                  <label htmlFor="service">{t('contact.service')}</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                  >
                    <option value="">{t('contact.selectService')}</option>
                    <option value="sosyal-medya">{t('servicesSection.smm')}</option>
                    <option value="icerik">{t('servicesSection.content')}</option>
                    <option value="reklam">{t('servicesSection.ads')}</option>
                    <option value="influencer">{t('servicesSection.influencer')}</option>
                    <option value="video">{t('contact.videoProduction')}</option>
                    <option value="danismanlik">{t('contact.consultingOption')}</option>
                  </select>
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

                <motion.button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitted || sending}
                >
                  {submitted ? (
                    t('contact.submitted')
                  ) : sending ? (
                    <span className="sending-loader">{t('contact.sending')}</span>
                  ) : (
                    <>
                      {t('contact.submit')}
                      <HiOutlinePaperAirplane size={18} />
                    </>
                  )}
                </motion.button>

                {whatsappLink && (
                  <motion.a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline whatsapp-notify-btn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center', gap: '8px' }}
                  >
                    <FaWhatsapp size={18} />
                    {t('contact.whatsappAlso')}
                  </motion.a>
                )}
              </form>
            </FadeIn>
          </div>

          {/* Map Section */}
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
