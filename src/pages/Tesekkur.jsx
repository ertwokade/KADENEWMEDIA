import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tesekkur.css'

const DEFAULT_CONTENT = {
  baslik: 'Mesajınız iletildi!',
  altMetin: 'İletişim formunuzu aldık. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
  yanitSuresi: '2-4 saat',
  yanitSuresiNot: 'Hafta içi 09:00–18:00',
  adimlarBaslik: 'Bundan sonra ne olacak?',
  acilBaslik: 'Acil görüşme mi istiyorsunuz?',
  acilTelefon: '0506 729 34 23',
  acilTelefonTel: '+905067293423',
  adimlar: [
    { ikon: '📬', baslik: 'Onay E-postası', aciklama: 'Formunuz alındı. Birkaç dakika içinde otomatik bir onay e-postası alacaksınız.' },
    { ikon: '👤', baslik: 'Uzman Eşleştirme', aciklama: '1 iş günü içinde sektörünüze uygun bir uzmanımız sizinle iletişime geçecek.' },
    { ikon: '📋', baslik: 'Strateji Görüşmesi', aciklama: '30 dakikalık ücretsiz keşif görüşmesinde ihtiyaçlarınızı birlikte değerlendireceğiz.' },
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
  const [content, setContent] = useState(DEFAULT_CONTENT)

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

  useEffect(() => {
    let cancelled = false
    getContentApi('tesekkur')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setContent(prev => ({
            ...prev,
            ...data,
            adimlar: Array.isArray(data.adimlar) && data.adimlar.length ? data.adimlar : prev.adimlar,
          }))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
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
              <HiOutlinePhone size={20} />
              <div>
                <strong>{content.acilBaslik}</strong>
                <p>Bizi hemen arayın: <a href={`tel:${content.acilTelefonTel}`}>{content.acilTelefon}</a></p>
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
