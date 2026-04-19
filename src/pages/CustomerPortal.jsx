import { useState } from 'react'
import { HiOutlineUserGroup, HiOutlineDocumentReport, HiOutlineClipboardList } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

export default function CustomerPortal() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)

  useSEO({
    title: 'Müşteri Paneli | Kade Media',
    description: 'Mevcut müşteriler için proje durumu, raporlar, görevler ve fatura özeti.',
    path: '/musteri-panel',
    noindex: true,
  })

  const projects = [
    { title: 'Nisan içerik takvimi', status: 'Onay bekliyor', progress: 72 },
    { title: 'Meta Ads optimizasyonu', status: 'Devam ediyor', progress: 58 },
    { title: 'Aylık performans raporu', status: 'Hazırlanıyor', progress: 40 },
  ]

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineUserGroup size={14} /> Müşteri Paneli</div>
            <h1 className="section-title">Projelerinizi <span>tek ekrandan</span> takip edin</h1>
            <p className="section-subtitle">Demo erişim için e-posta ve proje kodu girin. Canlı kurulumda bu alan müşteri hesaplarına bağlanır.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container tool-layout">
          <form className="tool-card glass-card tool-form" onSubmit={e => { e.preventDefault(); setOpen(true) }}>
            <h2>Portal Girişi</h2>
            <label>E-posta<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>Proje kodu<input value={code} onChange={e => setCode(e.target.value)} placeholder="Örn. DEMO-2026" required /></label>
            <button className="btn btn-primary">Paneli Aç</button>
          </form>

          <div className="tool-card glass-card">
            {!open ? (
              <>
                <h2>Panelde neler var?</h2>
                <ul className="tool-list">
                  <li>Proje aşamaları ve bekleyen onaylar</li>
                  <li>Aylık raporlar ve performans özetleri</li>
                  <li>Fatura/ödeme durumu ve yenileme tarihleri</li>
                </ul>
              </>
            ) : (
              <>
                <h2>{email || 'Müşteri'} için özet</h2>
                <div className="tool-timeline">
                  {projects.map((project, index) => (
                    <div className={`tool-step ${project.progress > 60 ? 'done' : ''}`} key={project.title}>
                      <div className="tool-step-dot">{index + 1}</div>
                      <div>
                        <strong>{project.title}</strong>
                        <p>{project.status} · %{project.progress}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="tool-list">
                  <li><HiOutlineDocumentReport /> Son rapor: Mart 2026 performans özeti</li>
                  <li><HiOutlineClipboardList /> Bekleyen onay: 3 içerik</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
