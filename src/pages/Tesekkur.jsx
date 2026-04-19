import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Tesekkur.css'

const sonrakiAdimlar = [
  {
    ikon: '📬',
    baslik: 'Onay E-postası',
    aciklama: 'Formunuz alındı. Birkaç dakika içinde otomatik bir onay e-postası alacaksınız.',
  },
  {
    ikon: '👤',
    baslik: 'Uzman Eşleştirme',
    aciklama: '1 iş günü içinde sektörünüze uygun bir uzmanımız sizinle iletişime geçecek.',
  },
  {
    ikon: '📋',
    baslik: 'Strateji Görüşmesi',
    aciklama: '30 dakikalık ücretsiz keşif görüşmesinde ihtiyaçlarınızı birlikte değerlendireceğiz.',
  },
  {
    ikon: '🚀',
    baslik: 'Özel Teklif',
    aciklama: 'Görüşmenin ardından size özel bir paket ve fiyat teklifi sunulacak.',
  },
]

export default function Tesekkur() {
  const navigate = useNavigate()

  useSEO({
    title: 'Teşekkürler | Kade Media',
    description: 'Formunuz alındı. En kısa sürede size dönüş yapacağız.',
    path: '/tesekkur',
    noindex: true,
  })

  useEffect(() => {
    // Google Ads conversion tracking
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
      })
    }
  }, [])

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
              Mesajınız <span>iletildi!</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="tesekkur-alt">
              İletişim formunuzu aldık. Ekibimiz en kısa sürede sizinle iletişime geçecek.
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="tesekkur-bekleme glass-card">
              <HiOutlineClock size={18} />
              <span>Ortalama yanıt süresi: <strong>2-4 saat</strong> (Hafta içi 09:00–18:00)</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <h2 className="tesekkur-adimlar-baslik">Bundan sonra ne olacak?</h2>
          </FadeIn>

          <StaggerContainer className="tesekkur-adimlar">
            {sonrakiAdimlar.map((adim, i) => (
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
                <strong>Acil görüşme mi istiyorsunuz?</strong>
                <p>Bizi hemen arayın: <a href="tel:+905067293423">0506 729 34 23</a></p>
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
