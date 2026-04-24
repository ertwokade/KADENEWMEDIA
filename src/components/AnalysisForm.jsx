import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheck,
  HiOutlineLightningBolt, HiOutlineShoppingCart, HiOutlineUsers,
  HiOutlineTrendingUp,
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { sendContactApi } from '../api'
import './AnalysisForm.css'

const GOALS = {
  tr: [
    { id: 'awareness', icon: HiOutlineLightningBolt, label: 'Marka Bilinirliği', desc: 'Daha fazla insanın seni tanımasını istiyorum' },
    { id: 'sales', icon: HiOutlineShoppingCart, label: 'Satış Artışı', desc: 'Sosyal medyadan direkt gelir üretmek istiyorum' },
    { id: 'followers', icon: HiOutlineUsers, label: 'Takipçi Kazanımı', desc: 'Topluluk büyütmek istiyorum' },
    { id: 'growth', icon: HiOutlineTrendingUp, label: 'Genel Büyüme', desc: 'Her alanda güçlenmek istiyorum' },
  ],
  en: [
    { id: 'awareness', icon: HiOutlineLightningBolt, label: 'Brand Awareness', desc: 'I want more people to know my brand' },
    { id: 'sales', icon: HiOutlineShoppingCart, label: 'Sales Growth', desc: 'I want to generate revenue from social media' },
    { id: 'followers', icon: HiOutlineUsers, label: 'Follower Growth', desc: 'I want to grow my community' },
    { id: 'growth', icon: HiOutlineTrendingUp, label: 'Overall Growth', desc: 'I want to strengthen in all areas' },
  ],
}

const SECTORS = {
  tr: ['E-Ticaret', 'Restoran & Kafe', 'Moda & Güzellik', 'Teknoloji', 'Sağlık & Fitness', 'Eğitim', 'Hizmet Sektörü', 'Diğer'],
  en: ['E-Commerce', 'Restaurant & Café', 'Fashion & Beauty', 'Technology', 'Health & Fitness', 'Education', 'Service Industry', 'Other'],
}

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function AnalysisForm({ onClose }) {
  const { lang } = useLanguage()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState({
    goal: '',
    sector: '',
    socialLink: '',
    name: '',
    email: '',
    phone: '',
  })

  const goals = GOALS[lang] || GOALS.tr
  const sectors = SECTORS[lang] || SECTORS.tr
  const isTr = lang === 'tr'

  const go = (nextStep) => {
    setDir(nextStep > step ? 1 : -1)
    setStep(nextStep)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90 }
        return p + Math.random() * 15
      })
    }, 200)

    try {
      await sendContactApi({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.sector,
        services: [data.goal],
        message: `Hedef: ${data.goal}\nSektör: ${data.sector}\nSosyal Medya: ${data.socialLink || '-'}`,
        source: 'analysis-form',
      })
    } catch { /* proceed anyway */ }

    clearInterval(interval)
    setProgress(100)
    setTimeout(() => { setLoading(false); setDone(true) }, 600)
  }

  const canNext = [
    () => !!data.goal,
    () => !!data.sector,
    () => data.name.trim().length > 1 && data.email.includes('@') && data.phone.trim().length > 7,
  ]

  if (done) {
    return (
      <div className="af-done">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="af-done-icon"
        >
          <HiOutlineCheck size={36} />
        </motion.div>
        <h3>{isTr ? 'Analizin Hazırlanıyor!' : 'Your Analysis is Being Prepared!'}</h3>
        <p>{isTr ? 'Kadir en kısa sürede seninle iletişime geçecek. WhatsApp numarandan veya e-posta adresinden ulaşacak.' : 'Kadir will contact you shortly via WhatsApp or email.'}</p>
        {onClose && (
          <button className="btn btn-outline" onClick={onClose} style={{ marginTop: 16 }}>
            {isTr ? 'Kapat' : 'Close'}
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="af-loading">
        <div className="af-loading-anim">
          <div className="af-loading-dot" style={{ animationDelay: '0s' }} />
          <div className="af-loading-dot" style={{ animationDelay: '0.15s' }} />
          <div className="af-loading-dot" style={{ animationDelay: '0.3s' }} />
        </div>
        <p>{isTr ? 'Analizin Hazırlanıyor...' : 'Preparing Your Analysis...'}</p>
        <div className="af-progress-bar">
          <motion.div
            className="af-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="af-progress-pct">{Math.round(progress)}%</span>
      </div>
    )
  }

  return (
    <div className="af-wrapper">
      {/* Step indicators */}
      <div className="af-steps">
        {[0, 1, 2].map(i => (
          <div key={i} className={`af-step-dot ${step >= i ? 'active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        {step === 0 && (
          <motion.div
            key="step0"
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="af-step"
          >
            <h3 className="af-step-title">
              {isTr ? 'Hedefin Ne?' : "What's Your Goal?"}
            </h3>
            <p className="af-step-sub">
              {isTr ? 'En çok odaklanmak istediğin alanı seç' : 'Select the area you want to focus on most'}
            </p>
            <div className="af-goal-grid">
              {goals.map(g => (
                <button
                  key={g.id}
                  className={`af-goal-btn ${data.goal === g.id ? 'selected' : ''}`}
                  onClick={() => setData(d => ({ ...d, goal: g.id }))}
                >
                  <g.icon size={22} />
                  <strong>{g.label}</strong>
                  <span>{g.desc}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary af-next"
              disabled={!canNext[0]()}
              onClick={() => go(1)}
            >
              {isTr ? 'Devam' : 'Continue'} <HiOutlineArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="af-step"
          >
            <h3 className="af-step-title">
              {isTr ? 'İşletmeni Tanıyalım' : 'Tell Us About Your Business'}
            </h3>
            <p className="af-step-sub">
              {isTr ? 'Sektörünü seç ve aktif sosyal medya linkini ekle' : 'Select your industry and add your active social media link'}
            </p>
            <div className="af-sector-grid">
              {sectors.map(s => (
                <button
                  key={s}
                  className={`af-sector-btn ${data.sector === s ? 'selected' : ''}`}
                  onClick={() => setData(d => ({ ...d, sector: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="af-field">
              <label>{isTr ? 'Sosyal Medya Linkin (isteğe bağlı)' : 'Your Social Media Link (optional)'}</label>
              <input
                type="url"
                placeholder="instagram.com/hesabın"
                value={data.socialLink}
                onChange={e => setData(d => ({ ...d, socialLink: e.target.value }))}
              />
            </div>
            <div className="af-nav">
              <button className="btn btn-outline af-back" onClick={() => go(0)}>
                <HiOutlineArrowLeft size={16} /> {isTr ? 'Geri' : 'Back'}
              </button>
              <button
                className="btn btn-primary af-next"
                disabled={!canNext[1]()}
                onClick={() => go(2)}
              >
                {isTr ? 'Devam' : 'Continue'} <HiOutlineArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="af-step"
          >
            <h3 className="af-step-title">
              {isTr ? 'Analizini Kime Gönderelim?' : 'Where Should We Send Your Analysis?'}
            </h3>
            <p className="af-step-sub">
              {isTr ? 'Kadir sana doğrudan ulaşacak' : 'Kadir will reach out to you directly'}
            </p>
            <div className="af-fields">
              <div className="af-field">
                <label>{isTr ? 'Ad Soyad *' : 'Full Name *'}</label>
                <input
                  type="text"
                  placeholder={isTr ? 'Adın ve soyadın' : 'Your full name'}
                  value={data.name}
                  onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="af-field">
                <label>{isTr ? 'E-posta *' : 'Email *'}</label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={data.email}
                  onChange={e => setData(d => ({ ...d, email: e.target.value }))}
                />
              </div>
              <div className="af-field">
                <label>{isTr ? 'WhatsApp Numarası *' : 'WhatsApp Number *'}</label>
                <input
                  type="tel"
                  placeholder="+90 5XX XXX XX XX"
                  value={data.phone}
                  onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="af-nav">
              <button className="btn btn-outline af-back" onClick={() => go(1)}>
                <HiOutlineArrowLeft size={16} /> {isTr ? 'Geri' : 'Back'}
              </button>
              <button
                className="btn btn-primary af-next"
                disabled={!canNext[2]()}
                onClick={handleSubmit}
              >
                {isTr ? 'Analizimi İste' : 'Request My Analysis'} <HiOutlineArrowRight size={16} />
              </button>
            </div>
            <p className="af-privacy">
              {isTr ? 'Bilgileriniz gizli tutulur. Spam göndermiyoruz.' : 'Your info is kept private. No spam.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
