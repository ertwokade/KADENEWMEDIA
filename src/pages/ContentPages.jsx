import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineCalculator, HiOutlineCheck, HiOutlineMail, HiOutlineMicrophone, HiOutlineNewspaper, HiOutlineSparkles } from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import {
  BASIN_DEFAULTS,
  NEWSLETTER_DEFAULTS,
  NEDEN_BIZ_DEFAULTS,
  PODCAST_DEFAULTS,
  PRICE_CALCULATOR_DEFAULTS,
  REFERRAL_DEFAULTS,
} from '../data/pageDefaults'
import './ContentPages.css'

function safeHref(value, fallback = '/iletisim') {
  if (typeof value !== 'string') return fallback
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : fallback
  } catch {
    return fallback
  }
}

function PageHero({ badge, title, highlight, suffix, description, icon = <HiOutlineSparkles size={15} /> }) {
  return (
    <section className="content-page-hero">
      <div className="container">
        <div className="section-badge">{icon}{badge}</div>
        <h1 className="section-title">
          {title} {highlight && <span>{highlight}</span>}{suffix}
        </h1>
        {description && <p className="section-subtitle">{description}</p>}
      </div>
    </section>
  )
}

export function BasinPage() {
  const { content } = useSiteContent('basin', BASIN_DEFAULTS)
  useSEO({ title: 'Basın Odası | Kade Media', description: 'Kade Media şirket bilgileri, marka materyalleri ve basın iletişimi.', path: '/basin' })
  return (
    <PageTransition>
      <PageHero badge="Basın Odası" title="Kade Media" highlight="basın kiti" description="Kurumsal bilgiler, marka materyalleri ve güncel haberler." icon={<HiOutlineNewspaper size={15} />} />
      <section className="section"><div className="container content-page-grid">
        <article className="content-panel glass-card">
          <p className="content-kicker">Şirket bilgileri</p>
          <dl className="content-definition-list">
            {(content.companyInfo || []).map((row, index) => <div key={`${row.etiket}-${index}`}><dt>{row.etiket}</dt><dd>{row.deger}</dd></div>)}
          </dl>
        </article>
        <article className="content-panel glass-card">
          <p className="content-kicker">Basın iletişimi</p>
          <h2>{content.ctaTitle}</h2>
          <p>{content.ctaSubtitle}</p>
          <a className="btn btn-primary" href={`mailto:${content.contactEmail}`}>{content.contactEmail}<HiOutlineMail size={17} /></a>
          <small>{content.responseTime}</small>
        </article>
      </div></section>
      {(content.logoPackages || []).length > 0 && <section className="section content-muted-section"><div className="container">
        <div className="section-header"><div className="section-badge">Marka materyalleri</div></div>
        <div className="content-card-grid">{content.logoPackages.map((item, index) => <article className="content-card glass-card" key={`${item.isim}-${index}`}><span className="content-emoji">{item.ikon}</span><h3>{item.isim}</h3><p>{item.aciklama}</p><strong>{item.format}</strong>{item.url && <a href={safeHref(item.url)} target="_blank" rel="noreferrer">İndir →</a>}</article>)}</div>
      </div></section>}
      {(content.news || []).length > 0 && <section className="section"><div className="container">
        <div className="section-header"><div className="section-badge">Basında Kade</div></div>
        <div className="content-card-grid">{content.news.map((item, index) => <article className="content-card glass-card" key={`${item.baslik}-${index}`}><span className="content-emoji">{item.ikon}</span><small>{item.tarih} · {item.kaynak}</small><h3>{item.baslik}</h3><p>{item.ozet}</p>{item.link && <a href={safeHref(item.link)} target="_blank" rel="noreferrer">Haberi aç →</a>}</article>)}</div>
      </div></section>}
    </PageTransition>
  )
}

export function NedenBizPage() {
  const { content } = useSiteContent('nedenBiz', NEDEN_BIZ_DEFAULTS)
  useSEO({ title: 'Neden Kade Media?', description: 'Kade Media çalışma modeli, süreçleri ve ölçülebilir farkları.', path: '/neden-biz' })
  return (
    <PageTransition>
      <PageHero badge={content.heroBadge} title="Neden" highlight="Kade Media?" description={content.heroSubtitle} />
      <section className="section"><div className="container content-card-grid content-stat-grid">
        {(content.rakamlar || []).map((item, index) => <article className="content-card glass-card" key={`${item.etiket}-${index}`}><span className="content-emoji">{item.ikon}</span><strong className="content-big-number">{item.sayi}</strong><p>{item.etiket}</p></article>)}
      </div></section>
      <section className="section content-muted-section"><div className="container">
        <div className="section-header"><div className="section-badge">Karşılaştırma</div><h2 className="section-title">Süreçte <span>görünür fark</span></h2></div>
        <div className="comparison-table" role="table">
          <div className="comparison-row comparison-head" role="row"><span>Kriter</span><span>Kade Media</span><span>Genel yaklaşım</span></div>
          {(content.karsilastirma || []).map((row, index) => <div className="comparison-row" role="row" key={`${row.kriter}-${index}`}><strong>{row.kriter}</strong><span><HiOutlineCheck size={16} />{row.biz}</span><span>{row.diger}</span></div>)}
        </div>
      </div></section>
      <section className="section"><div className="container">
        <div className="content-card-grid">{(content.avantajlar || []).map((item, index) => <article className="content-card glass-card" key={`${item.baslik}-${index}`} style={{ borderTopColor: item.renk }}><span className="content-emoji">{item.ikon}</span><h3>{item.baslik}</h3><p>{item.aciklama}</p></article>)}</div>
        <div className="content-cta glass-card"><h2>{content.ctaTitle}</h2><p>{content.ctaSubtitle}</p><Link to="/teklif-al" className="btn btn-primary">Teklif al<HiOutlineArrowRight size={17} /></Link></div>
      </div></section>
    </PageTransition>
  )
}

export function ReferralProgramPage() {
  const { content } = useSiteContent('referralProgram', REFERRAL_DEFAULTS)
  useSEO({ title: 'Referans Programı | Kade Media', description: 'Kade Media referans programı ve işleyişi.', path: '/referans-programi', noindex: true })
  return (
    <PageTransition>
      <PageHero badge={content.heroBadge} title={content.heroTitleBefore} highlight={content.heroTitleHighlight} suffix={content.heroTitleAfter} description={content.heroSubtitle} />
      <section className="section"><div className="container">
        <div className="content-card-grid">{(content.steps || []).map((step, index) => <article className="content-card glass-card" key={`${step.baslik}-${index}`}><span className="content-step-number">{String(index + 1).padStart(2, '0')}</span><span className="content-emoji">{step.ikon}</span><h3>{step.baslik}</h3><p>{step.aciklama}</p></article>)}</div>
        <div className="content-cta glass-card"><p className="content-kicker">{content.rewardKicker}</p><h2>{content.rewardTitle}</h2><p>{content.rewardText}</p><Link to="/iletisim" className="btn btn-primary">Tanıştırma yap<HiOutlineArrowRight size={17} /></Link></div>
      </div></section>
    </PageTransition>
  )
}

export function PodcastWebinarPage() {
  const { content } = useSiteContent('podcastWebinar', PODCAST_DEFAULTS)
  useSEO({ title: 'Podcast & Webinar | Kade Media', description: content.heroSubtitle, path: '/podcast-webinar' })
  return (
    <PageTransition>
      <PageHero badge={content.heroBadge} title={content.heroTitleBefore} highlight={content.heroTitleHighlight} suffix={content.heroTitleAfter} description={content.heroSubtitle} icon={<HiOutlineMicrophone size={15} />} />
      <section className="section"><div className="container">
        {(content.items || []).length ? <div className="content-card-grid">{content.items.map((item, index) => <article className="content-card glass-card" key={`${item.title || item.baslik}-${index}`}><span className="content-emoji">{item.icon || item.ikon || '🎙️'}</span><small>{item.type || item.tur}</small><h3>{item.title || item.baslik}</h3><p>{item.description || item.aciklama}</p>{item.link && <a href={safeHref(item.link)} target="_blank" rel="noreferrer">Yayını aç →</a>}</article>)}</div> : <div className="content-empty glass-card"><HiOutlineMicrophone size={34} /><h2>Yeni yayınlar hazırlanıyor</h2><p>Takvim açıklandığında bu sayfadan ulaşabileceksiniz.</p></div>}
        <div className="content-cta glass-card"><h2>Bir sonraki yayına katılın</h2><Link to={safeHref(content.ctaLink)} className="btn btn-primary">{content.ctaLabel}<HiOutlineArrowRight size={17} /></Link></div>
      </div></section>
    </PageTransition>
  )
}

export function NewsletterArchivePage() {
  const { content } = useSiteContent('newsletterArchive', NEWSLETTER_DEFAULTS)
  useSEO({ title: 'Bülten Arşivi | Kade Media', description: 'Kade Media bültenleri ve dijital pazarlama notları.', path: '/bulten-arsivi' })
  return (
    <PageTransition>
      <PageHero badge="Bülten Arşivi" title="Kısa, uygulanabilir" highlight="medya notları" description="Yeni medya, içerik ve reklam üzerine yayınlanan bültenleri tek yerde inceleyin." icon={<HiOutlineMail size={15} />} />
      <section className="section"><div className="container">
        {(content.items || []).length ? <div className="content-card-grid">{content.items.map((item, index) => <article className="content-card glass-card" key={`${item.title}-${index}`}><small>{item.date}</small><h3>{item.title}</h3><p>{item.desc || item.description}</p>{item.link && <a href={safeHref(item.link)} target="_blank" rel="noreferrer">Bülteni aç →</a>}</article>)}</div> : <div className="content-empty glass-card"><HiOutlineMail size={34} /><h2>Arşiv hazırlanıyor</h2><p>İlk bülten yayınlandığında burada görünecek.</p></div>}
      </div></section>
    </PageTransition>
  )
}

export function PriceCalculatorPage() {
  const { content } = useSiteContent('priceCalculator', PRICE_CALCULATOR_DEFAULTS)
  const [platforms, setPlatforms] = useState(2)
  const [posts, setPosts] = useState(12)
  const [reels, setReels] = useState(4)
  const [ads, setAds] = useState(false)
  const [reporting, setReporting] = useState('monthly')
  useSEO({ title: 'Fiyat Hesaplama | Kade Media', description: 'Hizmet kapsamınıza göre yaklaşık aylık bütçe hesaplayın.', path: '/fiyat-hesaplama', noindex: true })

  const estimate = useMemo(() => {
    const reportCost = reporting === 'weekly' ? Number(content.reportWeekly) : reporting === 'biweekly' ? Number(content.reportBiweekly) : 0
    return Number(content.base) + Number(content.perPlatform) * platforms + Number(content.perPost) * posts + Number(content.perReel) * reels + (ads ? Number(content.adsFlat) : 0) + reportCost
  }, [ads, content, platforms, posts, reels, reporting])

  return (
    <PageTransition>
      <PageHero badge="Fiyat Hesaplayıcı" title="Kapsamı seçin," highlight="yaklaşık bütçeyi görün" description="Bu araç planlama içindir; kesin kapsam ve fiyat yazılı teklif ile belirlenir." icon={HiOutlineCalculator} />
      <section className="section"><div className="container calculator-layout">
        <div className="calculator-form glass-card">
          <label>Platform sayısı <strong>{platforms}</strong><input type="range" min="1" max="8" value={platforms} onChange={(event) => setPlatforms(Number(event.target.value))} /></label>
          <label>Aylık gönderi <strong>{posts}</strong><input type="range" min="0" max="80" step="2" value={posts} onChange={(event) => setPosts(Number(event.target.value))} /></label>
          <label>Aylık Reels / video <strong>{reels}</strong><input type="range" min="0" max="24" value={reels} onChange={(event) => setReels(Number(event.target.value))} /></label>
          <label className="calculator-check"><input type="checkbox" checked={ads} onChange={(event) => setAds(event.target.checked)} /> Reklam yönetimi</label>
          <label>Raporlama<select value={reporting} onChange={(event) => setReporting(event.target.value)}><option value="monthly">Aylık</option><option value="biweekly">İki haftada bir</option><option value="weekly">Haftalık</option></select></label>
        </div>
        <aside className="calculator-result glass-card">
          <p className="content-kicker">Yaklaşık aylık hizmet bedeli</p>
          <strong>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(estimate)}</strong>
          <p>{content.disclaimer}</p>
          <Link to="/teklif-al" className="btn btn-primary">Yazılı teklif al<HiOutlineArrowRight size={17} /></Link>
        </aside>
      </div></section>
    </PageTransition>
  )
}
