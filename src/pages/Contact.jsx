import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlinePaperAirplane,
  HiOutlineCheck,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import { sendContactApi } from '../api'
import { analytics } from '../utils/analytics'
import { CONTACT } from '../utils/constants'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Contact.css'

export default function Contact() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { content: contact } = useSiteContent('footer', CONTACT)
  useSEO({
    title: 'Kade New Media İletişim | Bize Ulaşın',
    description: 'Sosyal medya, dijital pazarlama, içerik üretimi ya da web projeniz için bize yazın; ihtiyacınızı birlikte konuşalım.',
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
      setError('Geçerli bir e-posta adresi girin.')
      return
    }
    // Minimum message length
    if (formData.message.trim().length < 20) {
      setError('Mesajınız en az 20 karakter olmalı.')
      return
    }
    if (!kvkkAccepted) {
      setError('Devam etmek için KVKK onay kutusunu işaretlemeniz gerekiyor.')
      return
    }
    setSending(true)
    setError('')
    try {
      // Honeypot sunucuya da gönderilir: yukarıdaki istemci kontrolü yalnızca
      // formu dolduran botları eler, doğrudan API'ye POST atanları elemez.
      await sendContactApi({ ...formData, service: formData.services.join(', '), consent: kvkkAccepted, website: honeypot })
      analytics.formSubmit(formData.services.join(', '))
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', company: '', services: [], message: '' })
      setKvkkAccepted(false)
      setTimeout(() => navigate('/tesekkur', { state: { submitted: true } }), 600)
    } catch (err) {
      const errorMsg = err.message || ''
      if (errorMsg.includes('API servisine ulaşılamıyor') || errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        // API unreachable — open mailto fallback
        const subject = encodeURIComponent(`Teklif Talebi — ${formData.name}`)
        const body = encodeURIComponent(
          `Ad: ${formData.name}\nE-posta: ${formData.email}\nTelefon: ${formData.phone || '-'}\nŞirket: ${formData.company || '-'}\nHizmet: ${formData.services.join(', ') || '-'}\n\nMesaj:\n${formData.message}`
        )
        window.open(`mailto:${contact.email || CONTACT.email}?subject=${subject}&body=${body}`, '_self')
        setError(t('contact.fallbackMsg') || 'Formu şu an gönderemedik, e-posta uygulamanız açılıyor; oradan da ulaşabilirsiniz.')
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
      value: contact.email || CONTACT.email,
      link: `mailto:${contact.email || CONTACT.email}`,
    },
    {
      icon: HiOutlinePhone,
      title: t('contact.phone') || 'Telefon',
      value: contact.phone || CONTACT.phone,
      link: `tel:${String(contact.phone || CONTACT.phone).replace(/[^\d+]/g, '')}`,
    },
    {
      icon: HiOutlineLocationMarker,
      title: t('contact.address'),
      value: contact.address || CONTACT.address,
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

            </FadeIn>

            <FadeIn direction="right" className="contact-form-wrapper">
              {/* method="post" — gönderim JS ile (handleSubmit + fetch) yapılır ama
                  form varsayılanı GET olduğu için hydration başarısız olur ya da JS
                  kapalıysa ad, e-posta, telefon ve mesaj adres çubuğuna query string
                  olarak yazılıyordu; oradan tarayıcı geçmişine, Referer başlığına ve
                  sunucu erişim loglarına sızıyordu. POST'ta gövdede kalır. */}
              <form className="contact-form glass-card" method="post" onSubmit={handleSubmit}>
                {/* Honeypot — hidden from users, filled only by bots */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    aria-label="Web sitesi"
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
                        htmlFor={`service-${opt.value}`}
                        className={`service-checkbox-item ${formData.services.includes(opt.value) ? 'checked' : ''}`}
                      >
                        <input
                          id={`service-${opt.value}`}
                          name="services"
                          value={opt.value}
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
                  <label htmlFor="kvkk-consent" className={`service-checkbox-item ${kvkkAccepted ? 'checked' : ''}`}>
                    <input
                      id="kvkk-consent"
                      name="consent"
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
                      Mesajınız elimize ulaştı, teşekkürler.
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

          {/* Harita/adres bölümü kaldırıldı: doğrulanmış açık adres/harita verisi
              yok (bkz. CONTENT_REQUIRED.md). Doğrulanınca yeniden eklenir. */}
        </div>
      </section>
    </PageTransition>
  )
}
