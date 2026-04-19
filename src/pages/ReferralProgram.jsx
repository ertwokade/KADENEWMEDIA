import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineGift,
  HiOutlineUserAdd,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar,
  HiOutlinePaperAirplane,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useLanguage } from '../i18n/LanguageContext'
import { submitReferralApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './ReferralProgram.css'

const steps = [
  { icon: HiOutlineUserAdd, title: 'Tanıdığınızı önerin', desc: 'Formdan marka veya işletme bilgisini paylaşın.' },
  { icon: HiOutlineClipboardCheck, title: 'Ekibimiz görüşsün', desc: 'Uygun ihtiyaç varsa ücretsiz keşif görüşmesi planlayalım.' },
  { icon: HiOutlineCurrencyDollar, title: 'Ödül kazanın', desc: 'Anlaşma başladığında referral ödülünüzü tanımlayalım.' },
]

const serviceOptions = [
  'Sosyal Medya Yönetimi',
  'İçerik Üretimi',
  'Reklam Yönetimi',
  'Video Prodüksiyon',
  'Web Sitesi',
  'Strateji Danışmanlığı',
]

export default function ReferralProgram() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    referrerName: '',
    referrerEmail: '',
    referrerPhone: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    leadCompany: '',
    service: serviceOptions[0],
    notes: '',
  })

  useSEO({
    title: 'Referans Programı | Kade Media',
    description: 'Kade Media referans programı ile dijital pazarlama desteğine ihtiyacı olan işletmeleri önerin, anlaşma başladığında ödül kazanın.',
    keywords: 'referans programı, ajans referral, kade media referans, dijital pazarlama öneri',
    path: '/referans-programi',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      await submitReferralApi(form)
      navigate('/tesekkur?source=referral')
    } catch (err) {
      setError(err.message || 'Başvuru alınamadı. Lütfen tekrar deneyin.')
    } finally {
      setSending(false)
    }
  }

  return (
    <PageTransition>
      <section className="referral-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="container referral-hero-inner">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineGift size={14} />
              Referans Programı
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Bizi doğru markalarla <span>buluşturun</span>, birlikte büyüyelim
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Dijital pazarlama desteğine ihtiyaç duyan bir işletme tanıyorsanız önerin. Anlaşma başladığında referral ödülünüzü takip edilebilir şekilde panelimize kaydedelim.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section referral-section">
        <div className="container referral-layout">
          <div className="referral-info">
            <StaggerContainer className="referral-steps" staggerDelay={0.12}>
              {steps.map(step => (
                <StaggerItem key={step.title}>
                  <div className="referral-step glass-card">
                    <div className="referral-step-icon">
                      <step.icon size={24} />
                    </div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn delay={0.25}>
              <div className="referral-reward glass-card">
                <span className="referral-reward-kicker">Ödül modeli</span>
                <strong>İlk ay hizmet bedelinden %10'a kadar referral ödülü</strong>
                <p>Ödül oranı proje kapsamına göre netleştirilir ve anlaşma aktif olduktan sonra admin panelinden takip edilir.</p>
              </div>
            </FadeIn>
          </div>

          <FadeIn direction="right" className="referral-form-wrap">
            <form className="referral-form glass-card" onSubmit={handleSubmit}>
              <h2>{lang === 'tr' ? 'Referral Bilgileri' : 'Referral Details'}</h2>
              <div className="referral-form-grid">
                <div className="form-group">
                  <label>Adınız *</label>
                  <input name="referrerName" value={form.referrerName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>E-posta *</label>
                  <input name="referrerEmail" type="email" value={form.referrerEmail} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input name="referrerPhone" value={form.referrerPhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Önerilen kişi/marka *</label>
                  <input name="leadName" value={form.leadName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Önerilen e-posta</label>
                  <input name="leadEmail" type="email" value={form.leadEmail} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Önerilen telefon</label>
                  <input name="leadPhone" value={form.leadPhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Şirket</label>
                  <input name="leadCompany" value={form.leadCompany} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>İlgilenilen hizmet</label>
                  <select name="service" value={form.service} onChange={handleChange}>
                    {serviceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Not</label>
                <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} />
              </div>
              {error && <p className="referral-error">{error}</p>}
              <motion.button
                type="submit"
                className="btn btn-primary referral-submit"
                disabled={sending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HiOutlinePaperAirplane size={18} />
                {sending ? 'Gönderiliyor...' : 'Referral Gönder'}
              </motion.button>
            </form>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
