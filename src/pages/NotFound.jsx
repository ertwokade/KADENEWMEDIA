import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineSearch } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import ErrorStatePage from '../components/ErrorStatePage'

/**
 * GERÇEK 404
 *
 * Bu sayfa eskiden ErrorStatePage'in birebir kopyasıydı: aynı düzen, kendi
 * `notfound-*` CSS ailesi (125 satır) ve kendi SEO çağrısı. İki dosya birlikte
 * güncellenmediği için 404 ile 401/403/429/bakım sayfaları ayrışıyordu.
 * Artık ortak iskeleti kullanır; yalnız 404'e özgü arama kutusu ve popüler
 * sayfa bağlantıları `children` olarak eklenir.
 *
 * Popüler sayfa etiketlerindeki emojiler (📋 💰 ❓ ✉️) kaldırıldı — marka dili
 * editoryal; dekoratif emoji generic SaaS görünümü veriyordu.
 */
const POPULER_SAYFALAR = [
  { yol: '/hizmetler', tr: 'Hizmetler', en: 'Services' },
  { yol: '/paketler', tr: 'Paketler', en: 'Packages' },
  { yol: '/sss', tr: 'SSS', en: 'FAQ' },
  { yol: '/iletisim', tr: 'İletişim', en: 'Contact' },
]

/** Serbest metni en yakın rotaya eşler; eşleşme yoksa iletişime yönlendirir. */
const ARAMA_KURALLARI = [
  [['blog'], '/blog'],
  [['hizmet', 'servis'], '/hizmetler'],
  [['paket', 'fiyat'], '/paketler'],
  [['iletisim', 'iletişim', 'contact'], '/iletisim'],
  [['partner', 'referans'], '/partnerler'],
  [['ekip', 'team'], '/ekip'],
  [['kariyer', 'iş'], '/kariyer'],
  [['sss', 'soru'], '/sss'],
]

export default function NotFound() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [arama, setArama] = useState('')
  const tr = lang === 'tr'

  const handleArama = (e) => {
    e.preventDefault()
    const sorgu = arama.trim().toLowerCase()
    if (!sorgu) return
    const eslesme = ARAMA_KURALLARI.find(([anahtarlar]) => anahtarlar.some((k) => sorgu.includes(k)))
    navigate(eslesme ? eslesme[1] : '/iletisim')
  }

  return (
    <ErrorStatePage
      code="404"
      codeDisplay={<>4<span>0</span>4</>}
      title={tr ? 'Sayfa Bulunamadı' : 'Page Not Found'}
      message={tr
        ? 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.'
        : 'The page you are looking for does not exist or may have been moved.'}
      retryLabel={tr ? 'Anasayfa' : 'Home'}
      retryTo="/"
      secondaryLabel={tr ? 'İletişim' : 'Contact'}
      secondaryTo="/iletisim"
    >
      <motion.form
        className="error-state-search"
        onSubmit={handleArama}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <input
          type="text"
          placeholder={tr ? 'Ne arıyordunuz? (blog, hizmetler, paketler...)' : 'What were you looking for?'}
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="error-state-search-input"
          aria-label={tr ? 'Site içinde ara' : 'Search the site'}
        />
        <button type="submit" className="error-state-search-btn" aria-label={tr ? 'Ara' : 'Search'}>
          <HiOutlineSearch size={18} aria-hidden="true" />
        </button>
      </motion.form>

      <motion.div
        className="error-state-popular"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="error-state-popular-title">
          {tr ? 'Popüler Sayfalar' : 'Popular Pages'}
        </p>
        <div className="error-state-popular-grid">
          {POPULER_SAYFALAR.map((s) => (
            <Link key={s.yol} to={s.yol} className="error-state-popular-link">
              {tr ? s.tr : s.en}
            </Link>
          ))}
        </div>
      </motion.div>
    </ErrorStatePage>
  )
}
