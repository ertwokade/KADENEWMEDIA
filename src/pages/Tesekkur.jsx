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
import useSiteContent from '../hooks/useSiteContent'
import './Tesekkur.css'

const THANK_YOU_DEFAULTS = {
  baslik: 'Talebiniz alındı',
  altMetin: 'Mesajınızı aldık ve güvenli biçimde kaydettik.',
  yanitSuresi: '2-4 saat',
  yanitSuresiNot: 'Hafta içi 09:00–18:00',
  adimlarBaslik: 'Bundan sonra ne olacak?',
  adimlar: [],
}

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
  const { content } = useSiteContent('tesekkur', THANK_YOU_DEFAULTS)
  const title = submitted ? content.baslik : 'Talep durumu doğrulanamadı'

  useSEO({
    title: 'Talep Durumu | Kade New Media',
    description: 'Kade New Media iletişim talebi durum bilgisi.',
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
                ? content.altMetin
                : 'Bu sayfayı doğrudan açmış ya da yenilemiş görünüyorsunuz. Bu ekrandan daha önce gönderdiğiniz bir talebin durumunu göremiyoruz.'}
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="tesekkur-bekleme glass-card">
              <HiOutlineMail size={18} />
              <span>{submitted ? `Beklenen yanıt: ${content.yanitSuresi} · ${content.yanitSuresiNot}` : 'Talebinizi doğrulamak veya yeniden iletmek için'} {submitted && <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>}</span>
            </div>
          </FadeIn>

          {submitted && Array.isArray(content.adimlar) && content.adimlar.length > 0 && (
            <FadeIn delay={0.45}>
              <div className="tesekkur-adimlar">
                <h2>{content.adimlarBaslik}</h2>
                {content.adimlar.map((step, index) => <article className="glass-card" key={`${step.baslik}-${index}`}><span>{step.ikon}</span><div><h3>{step.baslik}</h3><p>{step.aciklama}</p></div></article>)}
              </div>
            </FadeIn>
          )}

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
