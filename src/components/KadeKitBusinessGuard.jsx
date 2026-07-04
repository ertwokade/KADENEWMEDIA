import { Link } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi'
import { useCustomer } from '../contexts/CustomerContext'
import PageTransition from './PageTransition'
import '../pages/OrganizationKit.css'

function BusinessAccessScreen() {
  return (
    <PageTransition>
      <section className="ok-access-page">
        <div className="ok-access-card">
          <div className="ok-access-icon">
            <HiOutlineLockClosed size={26} />
          </div>
          <span className="ok-eyebrow">Kade Kit Business</span>
          <h1>Kade Kit Business erişimi aktif planlara özeldir.</h1>
          <p>
            İçerik, prodüksiyon, yorum analizi, AI üretim araçları ve operasyon ekranlarını kullanmak için Business erişiminizi aktifleştirin.
          </p>
          <Link to="/paketler" className="btn btn-primary ok-access-cta">
            <HiOutlineSparkles size={18} />
            Business Planlarını İncele
          </Link>
        </div>
      </section>
    </PageTransition>
  )
}

export default function KadeKitBusinessGuard({ children }) {
  const { checked, entitlements } = useCustomer()

  if (!checked) {
    return (
      <PageTransition>
        <div className="ok-loading">
          <div className="cp-spinner" />
          <p>Business erişimi kontrol ediliyor...</p>
        </div>
      </PageTransition>
    )
  }

  if (!entitlements?.hasKadeKitBusinessAccess) {
    return <BusinessAccessScreen />
  }

  return children
}
