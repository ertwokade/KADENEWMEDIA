import { useCustomer } from '../contexts/CustomerContext'
import ProtectedAccessScreen, { ProtectedAccessLoading } from './ProtectedAccessScreen'

export default function CustomerRouteGuard({ children }) {
  const { checked, customer } = useCustomer()

  if (!checked) return <ProtectedAccessLoading />
  if (customer) return children

  return <ProtectedAccessScreen customer={null} eyebrow="Güvenli müşteri alanı"
    title="Müşteri girişi gerekli"
    description="Proje ve teslimat bilgileri yalnızca oturum açmış müşterilere gösterilir." />
}
