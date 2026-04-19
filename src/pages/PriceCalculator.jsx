import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChartBar, HiOutlineArrowRight } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn } from '../components/Animations'
import './Tools.css'

export default function PriceCalculator() {
  const [platforms, setPlatforms] = useState(2)
  const [posts, setPosts] = useState(16)
  const [reels, setReels] = useState(4)
  const [ads, setAds] = useState(true)
  const [reporting, setReporting] = useState('monthly')

  useSEO({
    title: 'Fiyat Hesaplama Aracı | Kade Media',
    description: 'Sosyal medya yönetimi, içerik üretimi ve reklam yönetimi için yaklaşık aylık hizmet bedelini hesaplayın.',
    path: '/fiyat-hesaplama',
  })

  const total = useMemo(() => {
    const reportFee = reporting === 'weekly' ? 4500 : reporting === 'biweekly' ? 2500 : 0
    return 5900 + platforms * 1800 + posts * 390 + reels * 1750 + (ads ? 5500 : 0) + reportFee
  }, [platforms, posts, reels, ads, reporting])

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
            <label>Platform sayısı<input type="range" min="1" max="6" value={platforms} onChange={e => setPlatforms(Number(e.target.value))} />{platforms}</label>
            <label>Aylık post adedi<input type="range" min="8" max="80" step="4" value={posts} onChange={e => setPosts(Number(e.target.value))} />{posts}</label>
            <label>Aylık Reels/video<input type="range" min="0" max="24" value={reels} onChange={e => setReels(Number(e.target.value))} />{reels}</label>
            <label>Raporlama<select value={reporting} onChange={e => setReporting(e.target.value)}><option value="monthly">Aylık</option><option value="biweekly">2 haftada bir</option><option value="weekly">Haftalık</option></select></label>
            <label className="tool-check"><input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} /> Reklam yönetimi</label>
          </div>

          <aside className="tool-summary">
            <div className="tool-card glass-card">
              <h2>Tahmini aylık bedel</h2>
              <div className="tool-price">₺{total.toLocaleString('tr-TR')}</div>
              <p className="tool-muted">Bu tutar reklam harcamasını içermez. Reklam bütçesi platformlara ayrıca ödenir.</p>
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
