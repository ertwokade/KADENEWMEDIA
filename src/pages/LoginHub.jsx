import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HiArrowRight, HiOutlineBriefcase, HiOutlineSparkles } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import './LoginHub.css'

const workspaces = [
  {
    title: 'Danışmanlıklarım',
    description: 'Danışmanlık planınıza, projelerinize ve Kade Media müşteri panelinize erişin.',
    cta: 'Danışmanlık girişine git',
    to: '/giris/danismanlik',
    icon: HiOutlineBriefcase,
    external: false,
  },
  {
    title: 'Content AI',
    description: 'KADE AI içerik araçlarını açın, üretimlerinize ve çalışma alanınıza devam edin.',
    cta: 'Content AI girişine git',
    to: '/kadeai/login',
    icon: HiOutlineSparkles,
    external: true,
  },
]

export default function LoginHub() {
  useSEO({
    title: 'Çalışma Alanı Seçimi | Kade Media',
    description: 'Danışmanlık ve Content AI çalışma alanlarından kullanmak istediğinizi seçin.',
    path: '/giris',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="access-hub" aria-labelledby="access-hub-title">
        <motion.div
          className="access-hub-panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/" className="access-hub-brand" aria-label="Kade Media ana sayfa">
            <img src="/logo.png" alt="Kade Media" width="514" height="180" />
          </Link>

          <div className="access-hub-heading">
            <span className="access-hub-eyebrow">ÇALIŞMA ALANLARI</span>
            <h1 id="access-hub-title">Nereye giriş yapmak istiyorsunuz?</h1>
            <p>Kullandığınız hizmeti seçin. Her çalışma alanı kendi güvenli giriş ekranında açılır.</p>
          </div>

          <div className="access-hub-grid">
            {workspaces.map((workspace, index) => {
              const Icon = workspace.icon
              const content = (
                <>
                  <span className="access-hub-card-top">
                    <span className="access-hub-icon" aria-hidden="true"><Icon size={24} /></span>
                    <span className="access-hub-number">0{index + 1}</span>
                  </span>
                  <span className="access-hub-card-copy">
                    <strong>{workspace.title}</strong>
                    <span>{workspace.description}</span>
                  </span>
                  <span className="access-hub-cta">
                    {workspace.cta}
                    <HiArrowRight size={18} aria-hidden="true" />
                  </span>
                </>
              )

              return workspace.external ? (
                <motion.a
                  key={workspace.title}
                  href={workspace.to}
                  className="access-hub-card"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {content}
                </motion.a>
              ) : (
                <motion.div key={workspace.title} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}>
                  <Link to={workspace.to} className="access-hub-card">
                    {content}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <p className="access-hub-note">Hangi alanı kullanacağınızdan emin değilseniz Kade Media ekibiyle iletişime geçin.</p>
        </motion.div>
      </section>
    </PageTransition>
  )
}
