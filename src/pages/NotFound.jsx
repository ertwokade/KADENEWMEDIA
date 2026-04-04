import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineArrowRight } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import './NotFound.css'

export default function NotFound() {
  const { lang } = useLanguage()

  useSEO({
    title: lang === 'tr' ? 'Sayfa Bulunamadı | Kade Media' : 'Page Not Found | Kade Media',
    description: lang === 'tr' ? 'Aradığınız sayfa bulunamadı.' : 'The page you are looking for was not found.',
    path: '/404',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="notfound-section">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container notfound-container">
          <motion.div
            className="notfound-code"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            4<span>0</span>4
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {lang === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found'}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {lang === 'tr'
              ? 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.'
              : 'The page you are looking for does not exist or may have been moved.'}
          </motion.p>
          <motion.div
            className="notfound-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/" className="btn btn-primary">
              <HiOutlineHome size={18} />
              {lang === 'tr' ? 'Anasayfa' : 'Home'}
            </Link>
            <Link to="/iletisim" className="btn btn-outline">
              {lang === 'tr' ? 'İletişim' : 'Contact'}
              <HiOutlineArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
