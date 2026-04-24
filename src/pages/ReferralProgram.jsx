import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineGift,
  HiOutlinePaperAirplane,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useLanguage } from '../i18n/LanguageContext'
import { submitReferralApi, getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './ReferralProgram.css'

const DEFAULT_CONTENT = {
  heroBadge: 'Referans Programı',
  heroTitleBefore: 'Bizi doğru markalarla',
  heroTitleHighlight: 'buluşturun',
  heroTitleAfter: ', birlikte büyüyelim',
  heroSubtitle: 'Dijital pazarlama desteğine ihtiyaç duyan bir işletme tanıyorsanız önerin. Anlaşma başladığında referral ödülünüzü takip edilebilir şekilde panelimize kaydedelim.',
  steps: [
    { ikon: '👥', baslik: 'Tanıdığınızı önerin', aciklama: 'Formdan marka veya işletme bilgisini paylaşın.' },
    { ikon: '📋', baslik: 'Ekibimiz görüşsün', aciklama: 'Uygun ihtiyaç varsa ücretsiz keşif görüşmesi planlayalım.' },
    { ikon: '💰', baslik: 'Ödül kazanın', aciklama: 'Anlaşma başladığında referral ödülünüzü tanımlayalım.' },
  ],
  rewardKicker: 'Ödül modeli',
  rewardTitle: 'İlk ay hizmet bedelinden %10\'a kadar referral ödülü',
  rewardText: 'Ödül oranı proje kapsamına göre netleştirilir ve anlaşma aktif olduktan sonra admin panelinden takip edilir.',
  serviceOptions: [
    'Sosyal Medya Yönetimi',
    'İçerik Üretimi',
    'Reklam Yönetimi',
    'Video Prodüksiyon',
    'Web Sitesi',
    'Strateji Danışmanlığı',
  ],
}

export default function ReferralProgram() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [content, setContent] = useState(DEFAULT_CONTENT)
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
    services: [],
    notes: '',
  })

  const toggleService = (option) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(option)
        ? prev.services.filter(s => s !== option)
        : [...prev.services, option],
    }))
  }

  useSEO({
    title: 'Referans Programı | Kade Media',
    description: 'Kade Media referans programı ile dijital pazarlama desteğine ihtiyacı olan işletmeleri önerin, anlaşma başladığında ödül kazanın.',
    keywords: 'referans programı, ajans referral, kade media referans, dijital pazarlama öneri',
    path: '/referans-programi',
  })

  useEffect(() => {
    let cancelled = false
    getContentApi('referralProgram')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setContent(prev => {
            const merged = {
              ...prev,
              ...data,
              steps: Array.isArray(data.steps) && data.steps.length ? data.steps : prev.steps,
              serviceOptions: Array.isArray(data.serviceOptions) && data.serviceOptions.length ? data.serviceOptions : prev.serviceOptions,
            }
            setForm(f => ({ ...f, services: [] }))
            return merged
          })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const payload = {
        ...form,
        service: form.services.length > 0 ? form.services.join(', ') : 'Belirtilmedi',
      }
      await submitReferralApi(payload)
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
              {content.heroBadge}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              {content.heroTitleBefore} <span>{content.heroTitleHighlight}</span>{content.heroTitleAfter}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {content.heroSubtitle}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section referral-section">
        <div className="container referral-layout">
          <div className="referral-info">
            <StaggerContainer className="referral-steps" staggerDelay={0.12}>
              {content.steps.map((step, i) => (
                <StaggerItem key={`${step.baslik}-${i}`}>
                  <div className="referral-step glass-card">
                    <div className="referral-step-icon">
                      <span style={{ fontSize: '1.4rem' }}>{step.ikon}</span>
                    </div>
                    <div>
                      <h3>{step.baslik}</h3>
                      <p>{step.aciklama}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn delay={0.25}>
              <div className="referral-reward glass-card">
                <span className="referral-reward-kicker">{content.rewardKicker}</span>
                <strong>{content.rewardTitle}</strong>
                <p>{content.rewardText}</p>
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
                <div className="form-group referral-service-group">
                  <label>İlgilenilen hizmet <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(birden fazla seçilebilir)</span></label>
                  <div className="referral-service-chips">
                    {content.serviceOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`referral-chip ${form.services.includes(option) ? 'active' : ''}`}
                        onClick={() => toggleService(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
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
