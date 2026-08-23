import { Link } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi'
import { useCustomer } from '../contexts/CustomerContext'
import PageTransition from './PageTransition'
import '../pages/OrganizationKit.css'
import '../styles/kade-gate.css'
import '../styles/kade-surface.css'

/* Klon rotalarına DIŞ bağlantı: `<Link>` değil `<a href>`.

   Üretimde bu adresler statik klondan servis ediliyor (bkz. scripts/
   merge-clone.mjs). `<Link>` kullanıldığında React Router sayfayı istemci
   tarafında kendi kopyasıyla çiziyordu; sonuç, aynı URL'nin nereden
   gelindiğine göre iki farklı tasarımda açılmasıydı — Google'dan gelen klonu,
   panelden tıklayan React sürümünü görüyordu. Tam sayfa yüklemesi doğru
   katmanı getirir. */

function OrganizationKitAccessScreen() {
  return (
    <PageTransition>
      <section className="kade-surface ok-access-page">
        <div className="ok-access-card">
          <div className="ok-access-icon">
            <HiOutlineLockClosed size={26} />
          </div>
          <span className="ok-eyebrow">Kade Organizasyon Kiti</span>
          <h1>Kade Organizasyon Kiti aktif danışmanlık planlarına özeldir.</h1>
          <p>
            Markanızın medya, ekip ve büyüme operasyonunu stratejik bir sistemle yönetmek için danışmanlık planınızı aktifleştirin.
          </p>
          <a href="/paketler" className="btn btn-primary ok-access-cta">
            <HiOutlineSparkles size={18} />
            Danışmanlık Planlarını İncele
          </a>
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
