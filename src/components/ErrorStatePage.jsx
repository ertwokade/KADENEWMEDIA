import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from './PageTransition'
import '../styles/kade-gate.css'
import '../styles/kade-surface.css'
import './ErrorStatePage.css'

/**
 * Paylaşılan hata/durum sayfası iskeleti — 401, 403, 429, bakım VE 404.
 *
 * Eskiden `src/pages/NotFound.jsx` bu iskeletin neredeyse birebir kopyasıydı:
 * aynı düzen, `notfound-*` adıyla ikinci bir CSS ailesi (125 satır) ve ayrı
 * bir bileşen. İki dosya birlikte güncellenmediği için hata sayfaları zamanla
 * birbirinden ayrışıyordu. Artık tek iskelet var.
 *
 * @param {ReactNode} children  İskeletin altına eklenen sayfaya özel içerik
 *                              (ör. 404'teki arama kutusu ve popüler sayfalar).
 * @param {ReactNode} codeDisplay  `code` yerine özel biçimlendirilmiş kod.
 */
export default function ErrorStatePage({ code, codeDisplay, title, message, retryLabel, retryTo = '/', secondaryLabel, secondaryTo = '/iletisim', children }) {
  const location = useLocation()

  useSEO({
    title: `${title} | Kade New Media`,
    description: message,
    path: location.pathname,
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="kade-surface error-state-section">
        <div className="gate-grid" aria-hidden="true" />
        <div className="surface-shell error-state-container">
          <motion.div
            className={`error-state-code${codeDisplay ? ' error-state-code--muted' : ''}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {codeDisplay ?? code}
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            {title}
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            {message}
          </motion.p>
          <motion.div className="error-state-actions" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link to={retryTo} className="gate-btn">
              <HiOutlineHome size={18} />
              {retryLabel}
            </Link>
            {secondaryLabel && (
              <Link to={secondaryTo} className="gate-btn gate-btn--ghost">
                {secondaryLabel}
                <HiOutlineArrowRight size={16} />
              </Link>
            )}
          </motion.div>
          {children}
        </div>
      </section>
    </PageTransition>
  )
}
