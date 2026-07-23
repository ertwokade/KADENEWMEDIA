import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from './PageTransition'
import './ErrorStatePage.css'

// Paylaşılan 401/403/429/bakım durum sayfası iskeleti — src/pages/NotFound.jsx
// ile aynı görsel dilde ama kendi (generic isimli) CSS sınıflarını kullanır.
export default function ErrorStatePage({ code, title, message, retryLabel, retryTo = '/', secondaryLabel, secondaryTo = '/iletisim' }) {
  const location = useLocation()

  useSEO({
    title: `${title} | Kade New Media`,
    description: message,
    path: location.pathname,
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="error-state-section">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container error-state-container">
          <motion.div
            className="error-state-code"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {code}
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            {title}
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            {message}
          </motion.p>
          <motion.div className="error-state-actions" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link to={retryTo} className="btn btn-primary">
              <HiOutlineHome size={18} />
              {retryLabel}
            </Link>
            {secondaryLabel && (
              <Link to={secondaryTo} className="btn btn-outline">
                {secondaryLabel}
                <HiOutlineArrowRight size={16} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
