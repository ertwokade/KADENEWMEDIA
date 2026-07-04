import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCalendar, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClipboardList,
  HiOutlineLightBulb, HiOutlineSparkles, HiOutlineUsers,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useCustomer } from '../contexts/CustomerContext'
import OrganizationKitNav from '../components/OrganizationKitNav'
import PageTransition from '../components/PageTransition'
import { getConsultingPlanLabel } from '../config/entitlements'
import {
  aiPrompts, managementMeetings, operationScores, organizationKitSummary,
  roadmapFocus, strategicDecisions, teamHealth,
} from '../data/organizationKit'
import './OrganizationKit.css'

function ScoreBar({ label, score }) {
  return (
    <div className="ok-score-row">
      <div>
        <span>{label}</span>
        <strong>{score}</strong>
      </div>
      <div className="ok-score-track">
        <span style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function DashboardCard({ icon: Icon, title, meta, children, action }) {
  return (
    <motion.article
      className="ok-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="ok-card-head">
        <div className="ok-card-icon">{Icon && <Icon size={21} />}</div>
        <div>
          <h2>{title}</h2>
          {meta && <p>{meta}</p>}
        </div>
      </div>
      {children}
      {action}
    </motion.article>
  )
}

export default function OrganizationKitDashboard() {
  const { entitlements } = useCustomer()
  const planLabel = getConsultingPlanLabel(entitlements?.consultingPlan)

  useSEO({
    title: 'Kade Organizasyon Kiti | Kade Media',
    description: 'Medya, içerik ve büyüme operasyonunuzu stratejik yönetim ritmiyle takip edin.',
    path: '/organizasyon-kiti',
    noindex: true,
  })

  return (
    <PageTransition>
      <div className="ok-page">
        <div className="container ok-layout">
          <OrganizationKitNav />

          <div className="ok-main">
            <section className="ok-hero">
              <span className="ok-eyebrow">Kade Organizasyon Kiti</span>
              <h1>Kade Organizasyon Kiti</h1>
              <p>
                Medya, içerik ve büyüme operasyonunuzu daha net kararlar, doğru süreçler ve düzenli yönetim ritmiyle yönetin.
              </p>
            </section>

            <section className="ok-plan-panel">
              <div>
                <span className="ok-plan-label">Aktif Plan</span>
                <h2>{planLabel}</h2>
                <p>Danışmanlık Modeli: {organizationKitSummary.consultingModel || 'Aylık stratejik yönetim ortaklığı'}</p>
              </div>
              <div className="ok-plan-grid">
                <div><span>Durum</span><strong>Aktif</strong></div>
                <div><span>Sonraki Yönetim Toplantısı</span><strong>{organizationKitSummary.nextMeeting}</strong></div>
                <div><span>Danışman</span><strong>{organizationKitSummary.consultant}</strong></div>
              </div>
              <Link to="/organizasyon-kiti/plan/fractional-new-media-director" className="ok-plan-link">
                Plan detayını gör
              </Link>
            </section>

            <section className="kk-entry-band">
              <div>
                <span className="ok-eyebrow">Kade Kit Business</span>
                <h2>AI Üretim Merkezi bağlı</h2>
                <p>SentScan, prodüksiyon CRM, Banana Studio, Vibe Coding ve AI Radar araçlarını ayrı üretim alanında açın.</p>
              </div>
              <Link to="/kade-kit-business" className="ok-plan-link">Üretim merkezine git</Link>
            </section>

            <section className="ok-dashboard-grid">
              <DashboardCard
                icon={HiOutlineClipboardList}
                title="90 Günlük Medya Yol Haritası"
                meta={`${organizationKitSummary.period} dönemi`}
              >
                <div className="ok-progress">
                  <div>
                    <span>Tamamlanma</span>
                    <strong>{organizationKitSummary.roadmapCompletion}%</strong>
                  </div>
                  <div className="ok-progress-track">
                    <span style={{ width: `${organizationKitSummary.roadmapCompletion}%` }} />
                  </div>
                </div>
                <ul className="ok-list">
                  {roadmapFocus.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </DashboardCard>

              <DashboardCard
                icon={HiOutlineLightBulb}
                title="Stratejik Kararlar"
                meta="Bekleyen kararlar ve onaylar"
                action={<button type="button" className="ok-secondary-btn">Karar Oluştur</button>}
              >
                <div className="ok-decision-list">
                  {strategicDecisions.map((decision) => (
                    <div className="ok-decision" key={decision.title}>
                      <strong>{decision.title}</strong>
                      <span>{decision.status} · {decision.owner}</span>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard icon={HiOutlineUsers} title="Ekip ve Süreç Sağlığı" meta="Operasyon görünürlüğü">
                <div className="ok-metric-strip">
                  <div><strong>{teamHealth.activeMembers}</strong><span>Aktif ekip üyesi</span></div>
                  <div><strong>{teamHealth.openTasks}</strong><span>Açık görev</span></div>
                  <div><strong>{teamHealth.delayedApprovals}</strong><span>Geciken onay</span></div>
                </div>
                <ul className="ok-list compact">
                  {teamHealth.bottlenecks.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </DashboardCard>

              <DashboardCard icon={HiOutlineCalendar} title="Yönetim Toplantıları" meta="Gündem, karar ve aksiyon sahipleri">
                <div className="ok-meeting-list">
                  {managementMeetings.map((meeting) => (
                    <div className="ok-meeting" key={meeting.title}>
                      <span>{meeting.date}</span>
                      <strong>{meeting.title}</strong>
                      <p>{meeting.agenda.join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard icon={HiOutlineChartBar} title="Medya Operasyon Skoru" meta="Toplam skor ve alt başlıklar">
                <div className="ok-total-score">
                  <strong>{organizationKitSummary.mediaOperationScore}</strong>
                  <span>Toplam medya operasyon skoru</span>
                </div>
                <div className="ok-score-list">
                  {operationScores.map((score) => <ScoreBar key={score.label} {...score} />)}
                </div>
              </DashboardCard>

              <DashboardCard icon={HiOutlineSparkles} title="Kade AI Yönetim Asistanı" meta="Hızlı yönetim soruları">
                <div className="ok-prompt-grid">
                  {aiPrompts.map((prompt) => (
                    <button type="button" key={prompt}>
                      <HiOutlineCheckCircle size={15} />
                      {prompt}
                    </button>
                  ))}
                </div>
              </DashboardCard>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
