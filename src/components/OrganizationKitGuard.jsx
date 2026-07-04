import { Link } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi'
import { useCustomer } from '../contexts/CustomerContext'
import PageTransition from './PageTransition'
import '../pages/OrganizationKit.css'

function OrganizationKitAccessScreen() {
  return (
    <PageTransition>
      <section className="ok-access-page">
        <div className="ok-access-card">
          <div className="ok-access-icon">
            <HiOutlineLockClosed size={26} />
          </div>
          <span className="ok-eyebrow">Kade Organizasyon Kiti</span>
          <h1>Kade Organizasyon Kiti aktif danışmanlık planlarına özeldir.</h1>
          <p>
            Markanızın medya, ekip ve büyüme operasyonunu stratejik bir sistemle yönetmek için danışmanlık planınızı aktifleştirin.
          </p>
          <Link to="/paketler" className="btn btn-primary ok-access-cta">
            <HiOutlineSparkles size={18} />
            Danışmanlık Planlarını İncele
          </Link>
        </div>
      </section>
    </PageTransition>
  )
}

export default function OrganizationKitGuard({ children }) {
  const { checked, entitlements } = useCustomer()

  if (!checked) {
    return (
      <PageTransition>
        <div className="ok-loading">
          <div className="cp-spinner" />
          <p>Danışmanlık erişimi kontrol ediliyor...</p>
        </div>
      </PageTransition>
    )
  }

  if (!entitlements?.hasOrganizationKitAccess) {
    return <OrganizationKitAccessScreen />
  }

  return children
}
