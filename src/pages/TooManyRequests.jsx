import ErrorStatePage from '../components/ErrorStatePage'
import { useLanguage } from '../i18n/LanguageContext'

// HTTP 429 — rate limit aşıldı. API katmanı zaten JSON {error:"Çok fazla..."}
// döndürüyor (bkz. server/api/_lib/rateLimit.js); bu sayfa tam sayfa
// navigasyonla 429'a düşen durumlar için görsel karşılık sağlar.
export default function TooManyRequests() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  return (
    <ErrorStatePage
      code="429"
      title={isEN ? 'Too Many Requests' : 'Çok Fazla İstek Gönderildi'}
      message={isEN
        ? 'You have made too many requests in a short time. Please wait a moment and try again.'
        : 'Kısa sürede çok fazla istek gönderdiniz. Lütfen birkaç dakika bekleyip tekrar deneyin.'}
      retryLabel={isEN ? 'Home' : 'Anasayfa'}
      retryTo="/"
      secondaryLabel={isEN ? 'Contact' : 'İletişim'}
      secondaryTo="/iletisim"
    />
  )
}
