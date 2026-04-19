import { useState } from 'react'
import { HiOutlineClipboardCheck } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

const steps = [
  { title: 'Brief alındı', desc: 'Marka bilgileri ve hedefler kaydedildi.', done: true },
  { title: 'Strateji hazırlanıyor', desc: 'Platform, içerik ve reklam planı çıkarılıyor.', done: true },
  { title: 'İçerik üretimi', desc: 'Tasarım, metin ve video üretimi devam ediyor.', done: true },
  { title: 'Müşteri onayı', desc: 'İlk içerik seti onaya gönderilecek.', done: false },
  { title: 'Yayın ve optimizasyon', desc: 'Onay sonrası yayın takvimi aktifleşir.', done: false },
]

export default function ProjectTracking() {
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useSEO({
    title: 'Proje Takip | Kade Media',
    description: 'Kade Media proje kodunuzla çalışma aşamalarınızı takip edin.',
    path: '/proje-takip',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineClipboardCheck size={14} /> Proje Takip</div>
            <h1 className="section-title">Projeniz hangi <span>aşamada?</span></h1>
            <p className="section-subtitle">Proje kodunuzu girerek zaman çizelgesi ve bekleyen aksiyonları görüntüleyin.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container tool-layout">
          <form className="tool-card glass-card tool-form" onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
            <h2>Proje kodu</h2>
            <label>Kod<input value={code} onChange={e => setCode(e.target.value)} placeholder="KM-2026-001" required /></label>
            <button className="btn btn-primary">Durumu Göster</button>
          </form>

          <div className="tool-card glass-card">
            <h2>{submitted ? `${code} zaman çizelgesi` : 'Örnek zaman çizelgesi'}</h2>
            <div className="tool-timeline">
              {steps.map((step, index) => (
                <div key={step.title} className={`tool-step ${step.done ? 'done' : ''}`}>
                  <div className="tool-step-dot">{step.done ? '✓' : index + 1}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
