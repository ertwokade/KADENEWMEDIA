import { HiOutlineUserGroup, HiOutlineLockClosed } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'

export default function CustomerPortal() {
  useSEO({
    title: 'Müşteri Paneli | Kade Media',
    description: 'Kade Media müşteri paneli çok yakında aktif oluyor.',
    path: '/musteri-panel',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <FadeIn>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(234,195,33,0.12)', border: '1.5px solid rgba(234,195,33,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <HiOutlineLockClosed size={30} color="#eac321" />
            </div>
            <div className="section-badge" style={{ display: 'inline-flex', marginBottom: 16 }}>
              <HiOutlineUserGroup size={14} /> Müşteri Paneli
            </div>
            <h1 className="section-title" style={{ maxWidth: 560, margin: '0 auto 16px' }}>
              Çok <span>yakında</span> geliyor
            </h1>
            <p className="section-subtitle" style={{ maxWidth: 480, margin: '0 auto 40px' }}>
              Projelerinizi, raporlarınızı ve faturalarınızı tek ekrandan takip edebileceğiniz müşteri paneli üzerinde çalışıyoruz.
            </p>
            <Link to="/iletisim" className="btn btn-primary">
              İletişime Geç
            </Link>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
