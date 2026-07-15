import { motion } from 'framer-motion'
import { HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import OrganizationKitNav from '../components/OrganizationKitNav'
import PageTransition from '../components/PageTransition'
import { fractionalDirectorPlan } from '../data/organizationKit'
import './OrganizationKit.css'

export default function OrganizationKitPlan() {
  useSEO({
    title: 'Fractional New Media Director | Kade Organizasyon Kiti',
    description: fractionalDirectorPlan.description,
    path: '/organizasyon-kiti/plan/fractional-new-media-director',
    noindex: true,
  })

  return (
    <PageTransition>
      <div className="ok-page">
        <div className="container ok-layout">
          <OrganizationKitNav />

          <main className="ok-main">
            <p role="status" className="glass-card" style={{ padding: 14, marginBottom: 18 }}>
              Demo kapsam — gerçek hizmetler yalnızca hesabınıza atanmış yazılı paket kaydından belirlenir.
            </p>
            <section className="ok-plan-detail">
              <span className="ok-eyebrow">Aktif Danışmanlık Paketi</span>
              <h1>{fractionalDirectorPlan.title}</h1>
              <p>{fractionalDirectorPlan.description}</p>

              <div className="ok-plan-badges">
                {fractionalDirectorPlan.badges.map((badge) => <span key={badge}>{badge}</span>)}
              </div>
            </section>

            <motion.section
              className="ok-services-panel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="ok-services-head">
                <div className="ok-card-icon"><HiOutlineSparkles size={22} /></div>
                <div>
                  <h2>Aktif hizmetler</h2>
                  <p>Bu kullanıcı için fiyat bilgisi gösterilmez.</p>
                </div>
              </div>

              <div className="ok-services-grid">
                {fractionalDirectorPlan.services.map((service) => (
                  <div className="ok-service" key={service}>
                    <HiOutlineCheckCircle size={18} />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}
