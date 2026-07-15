import { Link } from 'react-router-dom'
import { HiOutlineLockClosed } from 'react-icons/hi'
import { useCustomer } from '../contexts/CustomerContext'
import PageTransition from './PageTransition'

export default function CustomerRouteGuard({ children }) {
  const { checked, customer } = useCustomer()

  if (!checked) return <div style={{ minHeight: '70vh' }} />
  if (customer) return children

  return (
    <PageTransition>
      <section className="section" style={{ minHeight: '75vh', display: 'grid', placeItems: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 560, padding: 40, textAlign: 'center' }}>
          <HiOutlineLockClosed size={32} aria-hidden="true" />
          <h1 style={{ marginTop: 20 }}>Müşteri girişi gerekli</h1>
          <p style={{ margin: '12px 0 28px' }}>
            Proje ve teslimat bilgileri yalnızca oturum açmış müşterilere gösterilir.
          </p>
          <Link to="/giris" className="btn btn-primary">Giriş yap</Link>
        </div>
      </section>
    </PageTransition>
  )
}
