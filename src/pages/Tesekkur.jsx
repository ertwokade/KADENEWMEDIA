import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineMail,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { CONTACT } from '../utils/constants'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Tesekkur.css'

// Split title at the last word to wrap it in the highlight <span>
function splitTitle(baslik) {
  const parts = (baslik || '').trim().split(/\s+/)
  if (parts.length < 2) return { before: '', highlight: baslik || '' }
  const highlight = parts[parts.length - 1]
  const before = parts.slice(0, -1).join(' ')
  return { before, highlight }
}

export default function Tesekkur() {
  const location = useLocation()
  const submitted = location.state?.submitted === true
  const title = submitted ? 'Talebiniz alındı' : 'Talep durumu doğrulanamadı'

  useSEO({
    title: 'Talep Durumu | Kade Media',
    description: 'Kade Media iletişim talebi durum bilgisi.',
    path: '/tesekkur',
    noindex: true,
  })

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
      })
    }
  }, [])

  const { before, highlight } = splitTitle(title)

  return (
    <PageTransition>
      <section className="tesekkur-section">
        <div className="grid-bg" />
        <div className="glow-effect tesekkur-glow" />
        <div className="container tesekkur-container">
          <motion.div
            className="tesekkur-ikon-wrap"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            <HiOutlineCheckCircle size={72} />
          </motion.div>

          <FadeIn delay={0.2}>
            <h1 className="tesekkur-baslik">
              {before ? <>{before} <span>{highlight}</span></> : <span>{highlight}</span>}
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="tesekkur-alt">
              {submitted
                ? 'İletişim talebiniz sunucu tarafından başarıyla kaydedildi.'
                : 'Bu sayfa doğrudan veya yenilenerek açıldı. Daha önce gönderilmiş bir talebin durumunu bu ekrandan doğrulayamıyoruz.'}
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="tesekkur-bekleme glass-card">
              <HiOutlineMail size={18} />
              <span>{submitted ? 'Ek bilgi paylaşmak için' : 'Talebinizi doğrulamak veya yeniden iletmek için'} <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></span>
            </div>
          </FadeIn>

          <FadeIn delay={0.55}>
            <div className="tesekkur-linkler">
              <Link to="/" className="btn btn-outline">
                Anasayfaya Dön
              </Link>
              <Link to="/iletisim" className="btn btn-primary">
                İletişim sayfasına git
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
