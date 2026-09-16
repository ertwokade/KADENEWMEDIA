import { useCustomer } from '../contexts/CustomerContext'
import ProtectedAccessScreen, { ProtectedAccessLoading } from './ProtectedAccessScreen'

export default function KadeKitBusinessGuard({ children }) {
  const { checked, customer, entitlements } = useCustomer()

  if (!checked) {
    return <ProtectedAccessLoading label="Business erişimi kontrol ediliyor..." />
  }

  if (!entitlements?.hasKadeKitBusinessAccess) {
    return <ProtectedAccessScreen customer={customer} eyebrow="Kade Kit Business" eyebrowLang="en"
      title="Kade Kit Business erişimi aktif planlara özeldir."
      description="İçerik, prodüksiyon, yorum analizi, AI üretim araçları ve operasyon ekranlarını kullanmak için Business erişiminizi aktifleştirin."
      packageLabel="Business Planlarını İncele" />
  }

  return children
}
