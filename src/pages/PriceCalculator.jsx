import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChartBar, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

const PRICE_CALCULATOR_DEFAULTS = {
  base: 3000,
  perPlatform: 1800,
  perPost: 300,
  perReel: 1500,
  adsFlat: 4500,
  reportBiweekly: 1500,
  reportWeekly: 3000,
  disclaimer:
    'Bu tutar reklam harcamasını içermez. Reklam bütçesi platformlara ayrıca ödenir. Paketlerde aynı hizmetler indirimli sunulur.',
}

function toNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function PriceCalculator() {
  const [platforms, setPlatforms] = useState(2)
  const [posts, setPosts] = useState(16)
  const [reels, setReels] = useState(4)
  const [ads, setAds] = useState(true)
  const [reporting, setReporting] = useState('monthly')
  const [config, setConfig] = useState(PRICE_CALCULATOR_DEFAULTS)

  useSEO({
    title: 'Fiyat Hesaplama Aracı | Kade Media',
    description: 'Sosyal medya yönetimi, içerik üretimi ve reklam yönetimi için yaklaşık aylık hizmet bedelini hesaplayın.',
    path: '/fiyat-hesaplama',
  })

  useEffect(() => {
    let cancelled = false
    getContentApi('priceCalculator')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setConfig({
            base: toNumber(data.base, PRICE_CALCULATOR_DEFAULTS.base),
            perPlatform: toNumber(data.perPlatform, PRICE_CALCULATOR_DEFAULTS.perPlatform),
            perPost: toNumber(data.perPost, PRICE_CALCULATOR_DEFAULTS.perPost),
            perReel: toNumber(data.perReel, PRICE_CALCULATOR_DEFAULTS.perReel),
            adsFlat: toNumber(data.adsFlat, PRICE_CALCULATOR_DEFAULTS.adsFlat),
            reportBiweekly: toNumber(data.reportBiweekly, PRICE_CALCULATOR_DEFAULTS.reportBiweekly),
            reportWeekly: toNumber(data.reportWeekly, PRICE_CALCULATOR_DEFAULTS.reportWeekly),
            disclaimer: typeof data.disclaimer === 'string' && data.disclaimer.trim()
              ? data.disclaimer
              : PRICE_CALCULATOR_DEFAULTS.disclaimer,
          })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const total = useMemo(() => {
    const reportFee =
      reporting === 'weekly' ? config.reportWeekly :
      reporting === 'biweekly' ? config.reportBiweekly : 0
    return (
      config.base +
      platforms * config.perPlatform +
      posts * config.perPost +
      reels * config.perReel +
      (ads ? config.adsFlat : 0) +
      reportFee
    )
  }, [platforms, posts, reels, ads, reporting, config])

  return (
    <PageTransition>
      <section className="tool-hero">
        <PageBgAnimation type="packages" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineChartBar size={14} /> Fiyat Hesaplama</div>
            <h1 className="section-title">Aylık hizmet bedelini <span>yaklaşık hesaplayın</span></h1>
            <p className="section-subtitle">ROI hesaplayıcıdan farklı olarak bu araç, üretim ve yönetim kapsamına göre tahmini ajans hizmet bedeli verir.</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container tool-layout">
          <div className="tool-card glass-card tool-form">
            <label>
              <span>Platform sayısı: <strong>{platforms}</strong></span>
              <input type="range" min="1" max="6" value={platforms} onChange={e => setPlatforms(Number(e.target.value))} />
            </label>
            <label>
              <span>Aylık post adedi: <strong>{posts}</strong></span>
              <input type="range" min="8" max="80" step="4" value={posts} onChange={e => setPosts(Number(e.target.value))} />
            </label>
            <label>
              <span>Aylık Reels/video: <strong>{reels}</strong></span>
              <input type="range" min="0" max="24" value={reels} onChange={e => setReels(Number(e.target.value))} />
            </label>
            <label>
              <span>Raporlama</span>
              <select value={reporting} onChange={e => setReporting(e.target.value)}>
                <option value="monthly">Aylık</option>
                <option value="biweekly">2 haftada bir</option>
                <option value="weekly">Haftalık</option>
              </select>
            </label>
            <label className="tool-check">
              <input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} />
              <span>Reklam yönetimi dahil</span>
            </label>
          </div>

          <aside className="tool-summary">
            <div className="tool-card glass-card">
              <h2>Tahmini aylık bedel</h2>
              <div className="tool-price">₺{total.toLocaleString('tr-TR')}</div>
              <p className="tool-muted">{config.disclaimer}</p>
              <Link to="/teklif-al" className="btn btn-primary">
                Detaylı teklif al
                <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </PageTransition>
  )
}
