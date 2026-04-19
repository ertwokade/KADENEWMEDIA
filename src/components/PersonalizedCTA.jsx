import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineX } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './PersonalizedCTA.css'

const STORAGE_KEY = 'kade_scroll_cta_closed'

export default function PersonalizedCTA() {
  const { lang } = useLanguage()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [depth, setDepth] = useState(0)

  useEffect(() => {
    setVisible(false)
    setDepth(0)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const next = max > 0 ? Math.round((window.scrollY / max) * 100) : 0
      setDepth(prev => Math.max(prev, next))
      if (next > 58 && localStorage.getItem(STORAGE_KEY) !== location.pathname) {
        setVisible(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, location.pathname)
    setVisible(false)
  }

  if (!visible || location.pathname === '/admin' || location.pathname === '/tesekkur') return null

  const isPricing = location.pathname.includes('paket') || location.pathname.includes('fiyat')
  const ctaPath = isPricing ? '/teklif-al' : '/fiyat-hesaplama'

  return (
    <div className="personalized-cta">
      <button className="personalized-cta-close" onClick={close} aria-label="Kapat">
        <HiOutlineX size={16} />
      </button>
      <span className="personalized-cta-depth">%{depth} okundu</span>
      <strong>{lang === 'tr' ? 'Size özel fiyatı hesaplayalım mı?' : 'Want a tailored estimate?'}</strong>
      <p>{lang === 'tr' ? 'Hizmet kapsamını seçin, yaklaşık aylık bütçeyi anında görün.' : 'Pick your scope and see an instant monthly estimate.'}</p>
      <Link to={ctaPath} className="btn btn-primary" onClick={close}>
        {lang === 'tr' ? 'Hesapla' : 'Calculate'}
        <HiOutlineArrowRight size={16} />
      </Link>
    </div>
  )
}
