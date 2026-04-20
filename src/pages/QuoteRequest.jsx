import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineCalculator, HiOutlinePaperAirplane, HiOutlineCheck, HiOutlineArrowRight, HiOutlineArrowLeft,
  HiOutlineSparkles, HiOutlineUserGroup, HiOutlineCurrencyDollar, HiOutlineClock,
  HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlineGlobeAlt, HiOutlineChartBar,
  HiOutlineLightBulb, HiOutlineDeviceMobile, HiOutlineMail, HiOutlinePhone,
  HiOutlineOfficeBuilding, HiOutlineUser, HiOutlineCheckCircle,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { submitQuoteApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './QuoteRequest.css'

const SERVICES = [
  { id: 'social', icon: HiOutlineDeviceMobile, labelTr: 'Sosyal Medya Yönetimi', labelEn: 'Social Media Management', priceTr: '₺3.200/ay', descTr: 'Strateji + içerik + yayın', descEn: 'Strategy + content + publishing' },
  { id: 'content', icon: HiOutlinePhotograph, labelTr: 'İçerik Üretimi', labelEn: 'Content Production', priceTr: '₺3.200/ay', descTr: 'Görsel, copy, tasarım', descEn: 'Visual, copy, design' },
  { id: 'ads', icon: HiOutlineChartBar, labelTr: 'Reklam Yönetimi', labelEn: 'Ads Management', priceTr: '₺3.200/ay', descTr: 'Meta, Google, TikTok Ads', descEn: 'Meta, Google, TikTok Ads' },
  { id: 'video', icon: HiOutlineVideoCamera, labelTr: 'Video Prodüksiyon', labelEn: 'Video Production', priceTr: '₺3.200/ay', descTr: 'Reels, kısa film, kurgu', descEn: 'Reels, short films, edit' },
  { id: 'web', icon: HiOutlineGlobeAlt, labelTr: 'Web Sitesi', labelEn: 'Website', priceTr: '₺3.200/ay', descTr: 'Tasarım + geliştirme', descEn: 'Design + development' },
  { id: 'consult', icon: HiOutlineLightBulb, labelTr: 'Danışmanlık', labelEn: 'Consulting', priceTr: '₺3.200/ay', descTr: 'Strateji + workshop', descEn: 'Strategy + workshop' },
]

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'youtube', label: 'YouTube', emoji: '📺' },
  { id: 'facebook', label: 'Facebook', emoji: '👍' },
  { id: 'google', label: 'Google Ads', emoji: '🔍' },
]

const TIMELINES = [
  { id: 'normal', labelTr: 'Normal (2-3 hafta)', labelEn: 'Normal (2-3 weeks)', mult: 1, descTr: 'Standart başlangıç süresi', descEn: 'Standard onboarding time' },
  { id: 'acil', labelTr: 'Acil (1 hafta)', labelEn: 'Rush (1 week)', mult: 1.18, descTr: 'Hızlı başlangıç (+%18)', descEn: 'Fast start (+18%)' },
]

function estimate(form) {
  const base = 6500
  const serviceTotal = form.services.length * 3200
  const platformTotal = form.platforms.length * 1600
  const contentTotal = Number(form.contentCount || 0) * 420
  const videoTotal = Number(form.videoCount || 0) * 1800
  const adTotal = form.adManagement ? 5500 : 0
  const rush = form.timeline === 'acil' ? 1.18 : 1
  return Math.round((base + serviceTotal + platformTotal + contentTotal + videoTotal + adTotal) * rush)
}

const STEPS = [
  { id: 1, titleTr: 'Hizmet Seçimi', titleEn: 'Services', icon: HiOutlineSparkles },
  { id: 2, titleTr: 'Kapsam & Detay', titleEn: 'Scope & Details', icon: HiOutlineCalculator },
  { id: 3, titleTr: 'İletişim', titleEn: 'Contact', icon: HiOutlineUserGroup },
]

export default function QuoteRequest() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    services: ['social'],
    platforms: ['instagram'],
    monthlyBudget: 25000,
    contentCount: 20,
    videoCount: 4,
    adManagement: true,
    timeline: 'normal',
    notes: '',
    consent: false,
  })

  useSEO({
    title: lang === 'tr' ? 'Teklif Al | Hizmete Özel Başvuru' : 'Get Quote | Custom Service Request',
    description: lang === 'tr'
      ? 'Kade Media hizmetleri için kapsam seçin, tahmini bütçeyi görün ve teklif talebi gönderin.'
      : 'Choose scope for Kade Media services, see estimated budget and submit a quote request.',
    path: '/teklif-al',
  })

  const estimatedPrice = useMemo(() => estimate(form), [form])

  const toggle = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(item => item !== value) : [...prev[key], value],
    }))
  }

  const canNext = () => {
    if (step === 1) return form.services.length > 0 && form.platforms.length > 0
    if (step === 2) return Number(form.monthlyBudget) > 0
    if (step === 3) return form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.consent
    return true
  }

  const next = () => {
    setError('')
    if (!canNext()) {
      setError(lang === 'tr' ? 'Lütfen zorunlu alanları doldurun.' : 'Please fill required fields.')
      return
    }
    setStep(s => Math.min(3, s + 1))
  }
  const prev = () => { setError(''); setStep(s => Math.max(1, s - 1)) }

  const submit = async (event) => {
    event.preventDefault()
    if (!canNext()) {
      setError(lang === 'tr' ? 'Lütfen zorunlu alanları doldurun ve KVKK onayı verin.' : 'Please fill required fields and consent.')
      return
    }
    setSending(true)
    setError('')
    try {
      const serviceLabels = form.services.map(id => {
        const s = SERVICES.find(x => x.id === id)
        return s ? (lang === 'tr' ? s.labelTr : s.labelEn) : id
      })
      const platformLabels = form.platforms.map(id => {
        const p = PLATFORMS.find(x => x.id === id)
        return p ? p.label : id
      })
      await submitQuoteApi({
        ...form,
        services: serviceLabels,
        platforms: platformLabels,
        estimatedPrice,
        source: 'service-quote',
      })
      navigate('/tesekkur?source=quote')
    } catch (err) {
      setError(err.message || (lang === 'tr' ? 'Teklif talebi gönderilemedi. Lütfen tekrar deneyin.' : 'Could not submit. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  const T = (tr, en) => lang === 'tr' ? tr : en

  return (
    <PageTransition>
      <section className="quote-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineCalculator size={14} /> {T('Online Teklif Sihirbazı', 'Online Quote Wizard')}</div>
            <h1 className="section-title quote-hero-title">
              {T('Hizmet kapsamını seçin, ', 'Choose your scope, ')}
              <span>{T('anında tahmini fiyat', 'see estimated price')}</span>
              {T(' alın', ' instantly')}
            </h1>
            <p className="section-subtitle">
              {T(
                '3 adımda kapsamınızı belirleyin. Tahmini bütçeyi anında görün, ekibimizden 24 saat içinde detaylı teklif alın.',
                'Define your scope in 3 steps. See an estimated budget instantly and get a detailed quote within 24 hours.'
              )}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section quote-section">
        <div className="container quote-layout">
          {/* Steps Indicator */}
          <div className="quote-steps">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isDone = step > s.id
              return (
                <div key={s.id} className={`quote-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="quote-step-circle">
                    {isDone ? <HiOutlineCheck size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="quote-step-label">
                    <span className="quote-step-num">{T('Adım', 'Step')} {s.id}</span>
                    <span className="quote-step-title">{lang === 'tr' ? s.titleTr : s.titleEn}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className="quote-step-bar" />}
                </div>
              )
            })}
          </div>

          <div className="quote-grid">
            <form className="quote-form glass-card" onSubmit={submit}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="quote-step-heading">{T('Hangi hizmetleri istiyorsunuz?', 'Which services do you need?')}</h2>
                    <p className="quote-step-sub">{T('Birden fazla seçebilirsiniz', 'You can select multiple')}</p>

                    <div className="quote-card-grid">
                      {SERVICES.map(s => {
                        const Icon = s.icon
                        const active = form.services.includes(s.id)
                        return (
                          <button
                            type="button"
                            key={s.id}
                            className={`quote-pick-card ${active ? 'active' : ''}`}
                            onClick={() => toggle('services', s.id)}
                          >
                            <div className="quote-pick-icon"><Icon size={22} /></div>
                            <div className="quote-pick-info">
                              <h4>{lang === 'tr' ? s.labelTr : s.labelEn}</h4>
                              <p>{lang === 'tr' ? s.descTr : s.descEn}</p>
                            </div>
                            {active && <div className="quote-pick-check"><HiOutlineCheck size={14} /></div>}
                          </button>
                        )
                      })}
                    </div>

                    <h3 className="quote-step-heading sub">{T('Hangi platformlarda olmak istiyorsunuz?', 'Which platforms?')}</h3>
                    <div className="quote-chips">
                      {PLATFORMS.map(p => {
                        const active = form.platforms.includes(p.id)
                        return (
                          <button
                            type="button"
                            key={p.id}
                            className={`quote-chip ${active ? 'active' : ''}`}
                            onClick={() => toggle('platforms', p.id)}
                          >
                            <span className="quote-chip-emoji">{p.emoji}</span>
                            {p.label}
                            {active && <HiOutlineCheck size={14} />}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="quote-step-heading">{T('Aylık kapsam ve bütçe', 'Monthly scope & budget')}</h2>
                    <p className="quote-step-sub">{T('Hesaplama anlık güncellenir', 'Calculation updates live')}</p>

                    <div className="quote-fields">
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlinePhotograph size={16} /> {T('Aylık içerik adedi', 'Monthly content count')}</span>
                        <input type="number" min="0" value={form.contentCount} onChange={e => setForm({ ...form, contentCount: e.target.value })} />
                        <span className="quote-field-hint">{T('Görsel, story, post', 'Visuals, stories, posts')}</span>
                      </label>
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlineVideoCamera size={16} /> {T('Aylık video / Reels', 'Monthly video / Reels')}</span>
                        <input type="number" min="0" value={form.videoCount} onChange={e => setForm({ ...form, videoCount: e.target.value })} />
                        <span className="quote-field-hint">{T('Reels, shorts, kısa video', 'Reels, shorts, short videos')}</span>
                      </label>
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlineCurrencyDollar size={16} /> {T('Aylık bütçe (₺)', 'Monthly budget (₺)')}</span>
                        <input type="number" min="0" value={form.monthlyBudget} onChange={e => setForm({ ...form, monthlyBudget: e.target.value })} />
                        <span className="quote-field-hint">{T('Hizmet + reklam dahil', 'Service + ad spend')}</span>
                      </label>
                    </div>

                    <h3 className="quote-step-heading sub">{T('Teslim hızı', 'Timeline')}</h3>
                    <div className="quote-radio-grid">
                      {TIMELINES.map(t => {
                        const active = form.timeline === t.id
                        return (
                          <button
                            type="button"
                            key={t.id}
                            className={`quote-radio-card ${active ? 'active' : ''}`}
                            onClick={() => setForm({ ...form, timeline: t.id })}
                          >
                            <HiOutlineClock size={20} />
                            <div>
                              <h4>{lang === 'tr' ? t.labelTr : t.labelEn}</h4>
                              <p>{lang === 'tr' ? t.descTr : t.descEn}</p>
                            </div>
                            {active && <HiOutlineCheckCircle size={20} className="quote-radio-on" />}
                          </button>
                        )
                      })}
                    </div>

                    <label className="quote-toggle">
                      <input type="checkbox" checked={form.adManagement} onChange={e => setForm({ ...form, adManagement: e.target.checked })} />
                      <span className="quote-toggle-thumb" />
                      <div>
                        <strong>{T('Reklam yönetimi dahil', 'Include ad management')}</strong>
                        <small>{T('+₺5.500/ay aylık reklam stratejisi ve optimizasyon', '+₺5,500/mo monthly ad strategy & optimization')}</small>
                      </div>
                    </label>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="quote-step-heading">{T('Sizinle iletişime geçelim', "Let's get in touch")}</h2>
                    <p className="quote-step-sub">{T('24 saat içinde detaylı teklif gönderiyoruz', 'Detailed quote within 24h')}</p>

                    <div className="quote-fields two">
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlineUser size={16} /> {T('Ad Soyad *', 'Full name *')}</span>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                      </label>
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlineMail size={16} /> {T('E-posta *', 'Email *')}</span>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                      </label>
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlinePhone size={16} /> {T('Telefon', 'Phone')}</span>
                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+90 555 555 55 55" />
                      </label>
                      <label className="quote-field">
                        <span className="quote-field-label"><HiOutlineOfficeBuilding size={16} /> {T('Şirket', 'Company')}</span>
                        <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                      </label>
                    </div>

                    <label className="quote-field">
                      <span className="quote-field-label">{T('Eklemek istedikleriniz', 'Anything to add')}</span>
                      <textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={T('Hedefler, mevcut durum, beklentiler...', 'Goals, current state, expectations...')} />
                    </label>

                    <label className="quote-consent">
                      <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} required />
                      <span>
                        {T(
                          'Verilerimin teklif süreci için işlenmesini ve bana iletişim kurulmasını ',
                          'I consent to processing my data for the quote process and being contacted '
                        )}
                        <a href="/kvkk" target="_blank" rel="noopener noreferrer">KVKK</a>
                        {T(' kapsamında onaylıyorum. (Zorunlu)', ' policy. (Required)')}
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="quote-error">{error}</p>}

              <div className="quote-actions">
                {step > 1 && (
                  <button type="button" className="btn btn-outline" onClick={prev} disabled={sending}>
                    <HiOutlineArrowLeft size={16} /> {T('Geri', 'Back')}
                  </button>
                )}
                {step < 3 && (
                  <button type="button" className="btn btn-primary quote-next-btn" onClick={next}>
                    {T('Devam', 'Continue')} <HiOutlineArrowRight size={16} />
                  </button>
                )}
                {step === 3 && (
                  <button type="submit" className="btn btn-primary quote-next-btn" disabled={sending}>
                    <HiOutlinePaperAirplane size={18} />
                    {sending
                      ? T('Gönderiliyor...', 'Sending...')
                      : T('Teklif Talebi Gönder', 'Submit Quote Request')}
                  </button>
                )}
              </div>
            </form>

            <aside className="quote-summary">
              <div className="quote-summary-card glass-card">
                <div className="quote-summary-head">
                  <HiOutlineSparkles size={18} />
                  <span>{T('Tahmini aylık bütçe', 'Estimated monthly budget')}</span>
                </div>
                <motion.div
                  key={estimatedPrice}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="quote-summary-price"
                >
                  ₺{estimatedPrice.toLocaleString('tr-TR')}
                </motion.div>
                <p className="quote-summary-note">
                  {T(
                    'Net teklif; brief, hedef ve üretim kapsamı görüşmesinden sonra hazırlanır.',
                    'Final quote is prepared after a brief & scope meeting.'
                  )}
                </p>

                <div className="quote-summary-list">
                  <div className="quote-summary-row">
                    <span>{T('Hizmet', 'Services')}</span>
                    <strong>{form.services.length}</strong>
                  </div>
                  <div className="quote-summary-row">
                    <span>{T('Platform', 'Platforms')}</span>
                    <strong>{form.platforms.length}</strong>
                  </div>
                  <div className="quote-summary-row">
                    <span>{T('İçerik / ay', 'Content / mo')}</span>
                    <strong>{form.contentCount || 0}</strong>
                  </div>
                  <div className="quote-summary-row">
                    <span>{T('Video / ay', 'Video / mo')}</span>
                    <strong>{form.videoCount || 0}</strong>
                  </div>
                  <div className="quote-summary-row">
                    <span>{T('Reklam yönetimi', 'Ad management')}</span>
                    <strong>{form.adManagement ? T('Var', 'Yes') : T('Yok', 'No')}</strong>
                  </div>
                  <div className="quote-summary-row">
                    <span>{T('Teslim', 'Timeline')}</span>
                    <strong>{form.timeline === 'acil' ? T('Acil', 'Rush') : T('Normal', 'Normal')}</strong>
                  </div>
                </div>

                <div className="quote-summary-perks">
                  <div className="quote-perk"><HiOutlineCheck size={14} /> {T('Ücretsiz strateji görüşmesi', 'Free strategy call')}</div>
                  <div className="quote-perk"><HiOutlineCheck size={14} /> {T('24 saat içinde geri dönüş', 'Reply within 24h')}</div>
                  <div className="quote-perk"><HiOutlineCheck size={14} /> {T('Sözleşmesiz başlangıç', 'No-commitment start')}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
