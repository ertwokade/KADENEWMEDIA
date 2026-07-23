import ErrorStatePage from '../components/ErrorStatePage'
import { useLanguage } from '../i18n/LanguageContext'

// HTTP 401 — oturum yok/geçersiz.
export default function Unauthorized() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  return (
    <ErrorStatePage
      code="401"
      title={isEN ? 'Sign In Required' : 'Giriş Yapmanız Gerekiyor'}
      message={isEN
        ? 'This page requires you to be signed in, or your session has expired.'
        : 'Bu sayfayı görüntülemek için giriş yapmanız gerekiyor ya da oturumunuzun süresi dolmuş.'}
      retryLabel={isEN ? 'Sign In' : 'Giriş Yap'}
      retryTo="/giris"
      secondaryLabel={isEN ? 'Contact' : 'İletişim'}
      secondaryTo="/iletisim"
    />
  )
}
