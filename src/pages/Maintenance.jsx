import ErrorStatePage from '../components/ErrorStatePage'
import { useLanguage } from '../i18n/LanguageContext'

// Bakım sayfası — şu an hiçbir route bunu otomatik göstermiyor (bir bakım
// modu anahtarı/middleware'i yok); bu, ihtiyaç halinde kullanılabilecek hazır
// bir bileşen olarak eklendi. Gerçek bir bakım-modu tetikleyicisi Faz 8'de
// (ops/deployment ile birlikte) değerlendirilebilir.
export default function Maintenance() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  return (
    <ErrorStatePage
      code="🛠"
      title={isEN ? 'Under Maintenance' : 'Bakımdayız'}
      message={isEN
        ? "We're making some improvements. Please check back shortly."
        : 'Kısa süreliğine bakım çalışması yapıyoruz. Lütfen birazdan tekrar deneyin.'}
      retryLabel={isEN ? 'Reload' : 'Yenile'}
      retryTo="/"
    />
  )
}
