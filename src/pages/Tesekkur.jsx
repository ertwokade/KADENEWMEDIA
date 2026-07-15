import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMail,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { CONTACT } from '../utils/constants'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tesekkur.css'

const DEFAULT_CONTENT = {
  baslik: 'Mesajınız iletildi!',
  altMetin: 'İletişim formunuzu aldık. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
  yanitSuresi: '1 iş günü',
  yanitSuresiNot: 'Talebin kapsamına göre değişebilir',
  adimlarBaslik: 'Bundan sonra ne olacak?',
  acilBaslik: 'Ek bilgi paylaşmak ister misiniz?',
  acilEmail: CONTACT.email,
  adimlar: [
    { ikon: '📬', baslik: 'Talep Kaydı', aciklama: 'Formunuz sunucu tarafından alındı ve değerlendirme sırasına eklendi.' },
    { ikon: '👤', baslik: 'İhtiyaç İncelemesi', aciklama: 'Paylaştığınız kapsam ekip tarafından incelenecek.' },
    { ikon: '📋', baslik: 'Kapsam Görüşmesi', aciklama: 'Gerekli görülürse ihtiyaçlarınızı değerlendirmek için bir görüşme planlanacak.' },
    { ikon: '🚀', baslik: 'Özel Teklif', aciklama: 'Görüşmenin ardından size özel bir paket ve fiyat teklifi sunulacak.' },
  ],
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
  const content = DEFAULT_CONTENT

  useSEO({
    title: 'Teşekkürler | Kade Media',
    description: 'Formunuz alındı. En kısa sürede size dönüş yapacağız.',
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

  const { before, highlight } = splitTitle(content.baslik)

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
              {content.altMetin}
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="tesekkur-bekleme glass-card">
              <HiOutlineClock size={18} />
              <span>Ortalama yanıt süresi: <strong>{content.yanitSuresi}</strong> ({content.yanitSuresiNot})</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <h2 className="tesekkur-adimlar-baslik">{content.adimlarBaslik}</h2>
          </FadeIn>

          <StaggerContainer className="tesekkur-adimlar">
            {content.adimlar.map((adim, i) => (
              <StaggerItem key={i}>
                <div className="tesekkur-adim glass-card">
                  <div className="adim-numara">{i + 1}</div>
                  <span className="adim-ikon">{adim.ikon}</span>
                  <h3>{adim.baslik}</h3>
                  <p>{adim.aciklama}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.5}>
            <div className="tesekkur-acil glass-card">
              <HiOutlineMail size={20} />
              <div>
                <strong>{content.acilBaslik}</strong>
                <p><a href={`mailto:${content.acilEmail || CONTACT.email}`}>{content.acilEmail || CONTACT.email}</a></p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.55}>
            <div className="tesekkur-linkler">
              <Link to="/" className="btn btn-outline">
                Anasayfaya Dön
              </Link>
              <Link to="/blog" className="btn btn-primary">
                Blog'u Keşfet
                <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
