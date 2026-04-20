import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineUserGroup, HiOutlineDocumentReport, HiOutlineClipboardList,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineCurrencyDollar,
  HiOutlineChartBar, HiOutlineLightningBolt, HiOutlineBell,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './CustomerPortal.css'

const DEMO_DATA = {
  client: 'Demo Marka A.Ş.',
  package: 'Sosyal Medya + Reklam Paketi',
  renewalDate: 'Mayıs 31, 2026',
  accountManager: 'Kade Media Ekibi',
  projects: [
    { title: 'Mayıs içerik takvimi', status: 'Onay bekliyor', progress: 72, color: '#eac321' },
    { title: 'Meta Ads optimizasyonu', status: 'Devam ediyor', progress: 58, color: '#6C63FF' },
    { title: 'Aylık performans raporu', status: 'Hazırlanıyor', progress: 40, color: '#00BCD4' },
    { title: 'Instagram Reels serisi', status: 'Tamamlandı', progress: 100, color: '#2ECC71' },
  ],
  stats: [
    { label: 'Toplam erişim', value: '142K', icon: HiOutlineChartBar, color: '#6C63FF' },
    { label: 'Etkileşim oranı', value: '%4.8', icon: HiOutlineLightningBolt, color: '#eac321' },
    { label: 'Yeni takipçi', value: '+2.340', icon: HiOutlineUserGroup, color: '#2ECC71' },
    { label: 'Reklam ROAS', value: '3.2x', icon: HiOutlineCurrencyDollar, color: '#00BCD4' },
  ],
  invoices: [
    { month: 'Nisan 2026', amount: '₺18.500', status: 'Ödendi' },
    { month: 'Mart 2026', amount: '₺18.500', status: 'Ödendi' },
  ],
  notifications: [
    { text: 'Mayıs içerik takvimi onayınızı bekliyor', time: '2 saat önce', type: 'warning' },
    { text: 'Nisan raporu hazır — indirebilirsiniz', time: '1 gün önce', type: 'success' },
  ],
}

export default function CustomerPortal() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('projeler')

  useSEO({
    title: 'Müşteri Paneli | Kade Media',
    description: 'Mevcut müşteriler için proje durumu, raporlar, görevler ve fatura özeti.',
    path: '/musteri-panel',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="portal-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineUserGroup size={14} /> Müşteri Paneli</div>
            <h1 className="section-title">Projelerinizi <span>tek ekrandan</span> takip edin</h1>
            <p className="section-subtitle">Demo erişim için e-posta ve proje kodunu girin. Canlı kurulumda bu alan müşteri hesabınıza bağlanır.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <AnimatePresence mode="wait">
            {!open ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="portal-login-wrap"
              >
                <div className="portal-login-card glass-card">
                  <div className="portal-login-icon">
                    <HiOutlineUserGroup size={32} />
                  </div>
                  <h2>Portal Girişi</h2>
                  <p>E-posta adresiniz ve size verilen proje kodunu girin.</p>
                  <form onSubmit={e => { e.preventDefault(); setOpen(true) }}>
                    <div className="portal-field">
                      <label>E-posta</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@sirket.com" required />
                    </div>
                    <div className="portal-field">
                      <label>Proje kodu</label>
                      <input value={code} onChange={e => setCode(e.target.value)} placeholder="Örn. DEMO-2026" required />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                      Paneli Aç
                    </button>
                  </form>
                  <p className="portal-hint">Demo için herhangi bir e-posta ve kod girin.</p>
                </div>

                <div className="portal-features">
                  <h3>Panelde neler var?</h3>
                  <div className="portal-feature-list">
                    {[
                      { icon: HiOutlineClipboardList, text: 'Proje aşamaları ve bekleyen onaylar' },
                      { icon: HiOutlineDocumentReport, text: 'Aylık raporlar ve performans özeti' },
                      { icon: HiOutlineCurrencyDollar, text: 'Fatura durumu ve yenileme tarihleri' },
                      { icon: HiOutlineChartBar, text: 'Canlı sosyal medya metrikleri' },
                      { icon: HiOutlineBell, text: 'Bildirimler ve onay bekleyenler' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="portal-feature-item glass-card">
                        <Icon size={20} />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
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
                <div className="portal-header">
                  <div>
                    <h2>{email || DEMO_DATA.client}</h2>
                    <p>{DEMO_DATA.package} · Yenileme: {DEMO_DATA.renewalDate}</p>
                  </div>
                  <div className="portal-notifications">
                    {DEMO_DATA.notifications.map((n, i) => (
                      <div key={i} className={`portal-notif ${n.type}`}>
                        <HiOutlineBell size={14} />
                        <span>{n.text}</span>
                        <small>{n.time}</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="portal-stats">
                  {DEMO_DATA.stats.map(stat => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="portal-stat glass-card">
                        <div className="portal-stat-icon" style={{ background: `${stat.color}18`, color: stat.color }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="portal-stat-value">{stat.value}</div>
                          <div className="portal-stat-label">{stat.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Tabs */}
                <div className="portal-tabs">
                  {['projeler', 'raporlar', 'faturalar'].map(tab => (
                    <button
                      key={tab}
                      className={`portal-tab ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === 'projeler' && (
                  <div className="portal-projects">
                    {DEMO_DATA.projects.map(p => (
                      <div key={p.title} className="portal-project glass-card">
                        <div className="portal-project-info">
                          <strong>{p.title}</strong>
                          <span className="portal-project-status" style={{ color: p.color, background: `${p.color}18` }}>{p.status}</span>
                        </div>
                        <div className="portal-progress-bar">
                          <div className="portal-progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                        </div>
                        <span className="portal-progress-pct" style={{ color: p.color }}>%{p.progress}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'raporlar' && (
                  <div className="portal-reports glass-card">
                    <div className="portal-report-item">
                      <HiOutlineDocumentReport size={20} />
                      <div>
                        <strong>Nisan 2026 Performans Raporu</strong>
                        <p>Hazır · PDF · 1 gün önce eklendi</p>
                      </div>
                      <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>İndir</button>
                    </div>
                    <div className="portal-report-item">
                      <HiOutlineDocumentReport size={20} />
                      <div>
                        <strong>Mart 2026 Performans Raporu</strong>
                        <p>Hazır · PDF · 32 gün önce eklendi</p>
                      </div>
                      <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>İndir</button>
                    </div>
                  </div>
                )}

                {activeTab === 'faturalar' && (
                  <div className="portal-invoices glass-card">
                    {DEMO_DATA.invoices.map(inv => (
                      <div key={inv.month} className="portal-invoice-row">
                        <span>{inv.month}</span>
                        <strong>{inv.amount}</strong>
                        <span className="portal-invoice-status paid">
                          <HiOutlineCheckCircle size={14} /> {inv.status}
                        </span>
                      </div>
                    ))}
                    <div className="portal-invoice-row upcoming">
                      <span>Mayıs 2026</span>
                      <strong>₺18.500</strong>
                      <span className="portal-invoice-status pending">
                        <HiOutlineClock size={14} /> Yaklaşıyor (May 1)
                      </span>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-outline"
                  style={{ marginTop: 24 }}
                  onClick={() => { setOpen(false); setEmail(''); setCode('') }}
                >
                  Çıkış Yap
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  )
}
