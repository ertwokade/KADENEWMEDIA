import { Link } from 'react-router-dom'
import { HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi'
import PageTransition from './PageTransition'
import '../pages/OrganizationKit.css'
import '../styles/kade-gate.css'
import '../styles/kade-surface.css'

export function ProtectedAccessLoading({ label = 'Erişim kontrol ediliyor...' }) {
  return (
    <PageTransition>
      <div className="kade-surface ok-loading" role="status" aria-live="polite">
        <div className="cp-spinner" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </PageTransition>
  )
}

export default function ProtectedAccessScreen({ eyebrow, title, description, customer, packageLabel = 'Paketleri İncele' }) {
  const loginRequired = !customer
  return (
    <PageTransition>
      <section className="kade-surface ok-access-page">
        <div className="ok-access-card">
          <div className="ok-access-icon"><HiOutlineLockClosed size={26} aria-hidden="true" /></div>
          <span className="ok-eyebrow">{eyebrow}</span>
          <h1>{loginRequired ? 'Bu alan için müşteri girişi gerekli.' : title}</h1>
          <p>{loginRequired ? 'Proje, teslimat ve çalışma alanı bilgileri yalnızca yetkili müşteri hesabına gösterilir.' : description}</p>
          {loginRequired ? (
            <Link to="/giris/danismanlik" className="btn btn-primary ok-access-cta">Giriş Yap</Link>
          ) : (
            <a href="/paketler" className="btn btn-primary ok-access-cta">
              <HiOutlineSparkles size={18} aria-hidden="true" />{packageLabel}
            </a>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
