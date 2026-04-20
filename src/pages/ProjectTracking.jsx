import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineClipboardCheck, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineChip,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './ProjectTracking.css'

const DEMO_DATA = {
  code: 'KM-2026-001',
  project: 'Sosyal Medya Yönetimi — Mayıs 2026',
  client: 'Demo Marka A.Ş.',
  manager: 'Kade Media Ekibi',
  startDate: 'Nis 1, 2026',
  endDate: 'May 31, 2026',
  progress: 65,
  phases: [
    { title: 'Brief & Strateji', desc: 'Marka bilgileri, hedef kitle ve platform stratejisi belirlendi.', status: 'done', date: 'Nis 1' },
    { title: 'İçerik Planlaması', desc: 'Mayıs ayı içerik takvimi hazırlandı ve onaya sunuldu.', status: 'done', date: 'Nis 8' },
    { title: 'Tasarım & Üretim', desc: 'Görsel tasarımlar ve video içerikler üretiliyor.', status: 'active', date: 'Nis 15' },
    { title: 'Müşteri Onayı', desc: 'İçerik seti onay için müşteriye iletilecek.', status: 'pending', date: 'Nis 25' },
    { title: 'Yayın & Optimizasyon', desc: 'Onaylanan içerikler yayın takvimine göre paylaşılacak.', status: 'pending', date: 'May 1' },
  ],
  tasks: [
    { title: '5 Instagram Reels konsepti', status: 'Tamamlandı', color: '#2ECC71' },
    { title: 'Mayıs içerik takvimi', status: 'Onay bekliyor', color: '#eac321' },
    { title: 'Meta Ads görselleri (×4)', status: 'Üretimde', color: '#6C63FF' },
    { title: 'Aylık rapor şablonu', status: 'Bekliyor', color: '#00BCD4' },
  ],
  deliverables: [
    { name: 'Nisan 2026 Performans Raporu', type: 'PDF', date: 'Nis 18', ready: true },
    { name: 'Mayıs İçerik Takvimi v1', type: 'PDF', date: 'Nis 20', ready: true },
    { name: 'Mayıs Görseller Paketi', type: 'ZIP', date: 'Nis 28', ready: false },
  ],
}

export default function ProjectTracking() {
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)

  useSEO({
    title: 'Proje Takip | Kade Media',
    description: 'Kade Media proje kodunuzla çalışma aşamalarınızı takip edin.',
    path: '/proje-takip',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="pt-hero">
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
        <div className="container">
          <AnimatePresence mode="wait">
            {!open ? (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="pt-entry-wrap"
              >
                <div className="pt-entry-card glass-card">
                  <div className="pt-entry-icon"><HiOutlineChip size={30} /></div>
                  <h2>Proje Sorgula</h2>
                  <p>Size iletilen proje kodunu girerek ilerleme durumunu görüntüleyin.</p>
                  <form onSubmit={e => { e.preventDefault(); setOpen(true) }}>
                    <div className="pt-field">
                      <label>Proje Kodu</label>
                      <input
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="Örn. KM-2026-001"
                        required
                      />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                      Durumu Göster
                    </button>
                  </form>
                  <p className="pt-hint">Demo için herhangi bir kod girin.</p>
                </div>

                <div className="pt-preview glass-card">
                  <h3>Takip panelinde neler var?</h3>
                  <ul className="pt-preview-list">
                    {[
                      'Proje aşamaları ve canlı ilerleme',
                      'Mevcut görev listesi ve durumları',
                      'Teslim edilebilir dosyalar (PDF, ZIP)',
                      'Tahmini tamamlanma tarihleri',
                    ].map(item => (
                      <li key={item}>
                        <HiOutlineCheckCircle size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="pt-header glass-card">
                  <div className="pt-header-meta">
                    <span className="pt-code">{code || DEMO_DATA.code}</span>
                    <h2>{DEMO_DATA.project}</h2>
                    <p>{DEMO_DATA.client} · Yönetici: {DEMO_DATA.manager}</p>
                    <p className="pt-dates">{DEMO_DATA.startDate} → {DEMO_DATA.endDate}</p>
                  </div>
                  <div className="pt-overall">
                    <div className="pt-ring-label">Genel İlerleme</div>
                    <div className="pt-progress-bar wide">
                      <div className="pt-progress-fill" style={{ width: `${DEMO_DATA.progress}%` }} />
                    </div>
                    <div className="pt-progress-pct">%{DEMO_DATA.progress}</div>
                  </div>
                </div>

                <div className="pt-grid">
                  {/* Timeline */}
                  <div className="pt-timeline-col">
                    <h3 className="pt-section-label">Proje Aşamaları</h3>
                    <div className="pt-timeline">
                      {DEMO_DATA.phases.map((phase, i) => (
                        <div key={phase.title} className={`pt-phase ${phase.status}`}>
                          <div className="pt-phase-dot">
                            {phase.status === 'done' ? <HiOutlineCheckCircle size={16} /> : i + 1}
                          </div>
                          <div className="pt-phase-body">
                            <div className="pt-phase-title">
                              <strong>{phase.title}</strong>
                              <span className="pt-phase-date">{phase.date}</span>
                            </div>
                            <p>{phase.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks + Deliverables */}
                  <div className="pt-right-col">
                    <h3 className="pt-section-label">Görevler</h3>
                    <div className="pt-tasks">
                      {DEMO_DATA.tasks.map(task => (
                        <div key={task.title} className="pt-task glass-card">
                          <span className="pt-task-dot" style={{ background: task.color }} />
                          <span className="pt-task-title">{task.title}</span>
                          <span className="pt-task-status" style={{ color: task.color, background: `${task.color}18` }}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h3 className="pt-section-label" style={{ marginTop: 28 }}>Dosyalar</h3>
                    <div className="pt-deliverables glass-card">
                      {DEMO_DATA.deliverables.map(d => (
                        <div key={d.name} className="pt-deliverable-row">
                          <HiOutlineDocumentText size={18} />
                          <div className="pt-deliverable-info">
                            <strong>{d.name}</strong>
                            <span>{d.type} · {d.date}</span>
                          </div>
                          {d.ready
                            ? <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                                <HiOutlineDownload size={14} /> İndir
                              </button>
                            : <span className="pt-soon"><HiOutlineClock size={13} /> Yakında</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  style={{ marginTop: 28 }}
                  onClick={() => { setOpen(false); setCode('') }}
                >
                  Geri Dön
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  )
}
