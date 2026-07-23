import ErrorStatePage from '../components/ErrorStatePage'
import { useLanguage } from '../i18n/LanguageContext'

// HTTP 403 — oturum var ama yetki yok.
export default function Forbidden() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  return (
    <ErrorStatePage
      code="403"
      title={isEN ? 'Access Denied' : 'Erişim Reddedildi'}
      message={isEN
        ? 'You do not have permission to view this page.'
        : 'Bu sayfayı görüntülemek için yetkiniz bulunmuyor.'}
      retryLabel={isEN ? 'Home' : 'Anasayfa'}
      retryTo="/"
      secondaryLabel={isEN ? 'Contact' : 'İletişim'}
      secondaryTo="/iletisim"
    />
  )
}
