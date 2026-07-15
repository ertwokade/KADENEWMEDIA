import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineArrowRight, HiOutlineClipboardCheck } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import OrganizationKitNav from '../components/OrganizationKitNav'
import PageTransition from '../components/PageTransition'
import { organizationKitSections } from '../data/organizationKit'
import './OrganizationKit.css'
import NotFound from './NotFound'

export default function OrganizationKitSection() {
  const { section } = useParams()
  const content = organizationKitSections[section]

  useSEO({
    title: content ? `${content.title} | Kade Organizasyon Kiti` : 'Kade Organizasyon Kiti',
    description: content?.description || 'Kade Organizasyon Kiti danışmanlık alanı.',
    path: `/organizasyon-kiti/${section || ''}`,
    noindex: true,
  })

  if (!content) return <NotFound />

  return (
    <PageTransition>
      <div className="ok-page">
        <div className="container ok-layout">
          <OrganizationKitNav />

          <main className="ok-main">
            <p role="status" className="glass-card" style={{ padding: 14, marginBottom: 18 }}>
              Demo veri — bu ekrandaki tarih, skor ve görevler gerçek müşteri kaydı değildir.
            </p>
            <section className="ok-section-hero">
              <span className="ok-eyebrow">{content.eyebrow}</span>
              <h1>{content.title}</h1>
              <p>{content.description}</p>
            </section>

            <motion.section
              className="ok-section-grid"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="ok-section-stats">
                {content.stats.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="ok-section-card">
                <div className="ok-card-head">
                  <div className="ok-card-icon"><HiOutlineClipboardCheck size={21} /></div>
                  <div>
                    <h2>Odak listesi</h2>
                    <p>Bu alan danışmanlık ritmindeki karar ve takip başlıklarını gösterir.</p>
                  </div>
                </div>
                <div className="ok-action-list">
                  {content.items.map((item) => (
                    <div key={item}>
                      <HiOutlineArrowRight size={17} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}
