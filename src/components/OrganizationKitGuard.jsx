import { useCustomer } from '../contexts/CustomerContext'
import ProtectedAccessScreen, { ProtectedAccessLoading } from './ProtectedAccessScreen'

export default function OrganizationKitGuard({ children }) {
  const { checked, customer, entitlements } = useCustomer()

  if (!checked) {
    return <ProtectedAccessLoading label="Danışmanlık erişimi kontrol ediliyor..." />
  }

  if (!entitlements?.hasOrganizationKitAccess) {
    return <ProtectedAccessScreen customer={customer} eyebrow="Kade Organizasyon Kiti"
      title="Kade Organizasyon Kiti aktif danışmanlık planlarına özeldir."
      description="Markanızın medya, ekip ve büyüme operasyonunu stratejik bir sistemle yönetmek için danışmanlık planınızı aktifleştirin."
      packageLabel="Danışmanlık Planlarını İncele" />
  }

  return children
}
