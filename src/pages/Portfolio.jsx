import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlinePhotograph } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Portfolio.css'

export default function Portfolio() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'

  useSEO({
    title: isEN ? 'Portfolio | Kade Media' : 'Portfolyo | Kade Media',
    description: isEN
      ? 'Kade Media portfolio information. Approved project details will be published with client permission.'
      : 'Kade Media portfolyo bilgileri. Onaylı proje detayları müşteri izniyle yayınlanır.',
    path: '/portfolio',
  })

  const caps = [
    { n: '01', lab: isEN ? 'Service' : 'Hizmet', t: isEN ? 'Content' : 'İçerik Üretimi', c: isEN ? 'Reels · Photo · Copy' : 'Reels · Foto · Metin' },
    { n: '02', lab: isEN ? 'Service' : 'Hizmet', t: isEN ? 'Social Media' : 'Sosyal Medya', c: isEN ? 'Strategy · Calendar' : 'Strateji · Takvim' },
    { n: '03', lab: isEN ? 'Service' : 'Hizmet', t: isEN ? 'Advertising' : 'Reklam', c: 'Meta · Google · TikTok' },
    { n: '04', lab: isEN ? 'Service' : 'Hizmet', t: isEN ? 'Production' : 'Prodüksiyon', c: isEN ? 'Shoot · Edit' : 'Çekim · Kurgu' },
  ]

  const steps = [
    { n: '001', t: isEN ? 'Discovery & Brief' : 'Keşif & Brief', d: isEN ? 'Goal, audience and tone are set; success metrics are agreed.' : 'Hedef, kitle ve ton netleşir; başarı nasıl ölçülecek belirlenir.', tag: isEN ? 'Start' : 'Başlangıç' },
    { n: '002', t: isEN ? 'Strategy' : 'Strateji', d: isEN ? 'Channel plan, content pillars and KPIs are written down.' : 'Kanal planı, içerik ekseni ve KPI’lar yazılı hâle gelir.', tag: isEN ? 'Plan' : 'Plan' },
    { n: '003', t: isEN ? 'Production' : 'Üretim', d: isEN ? 'Content, ads and production — on-brand and at scale.' : 'İçerik, reklam ve prodüksiyon; marka diline sadık, ölçekli üretim.', tag: isEN ? 'Make' : 'Yapım' },
    { n: '004', t: isEN ? 'Launch & Optimization' : 'Yayın & Optimizasyon', d: isEN ? 'Tested and improved with data; budget spent efficiently.' : 'Test edilir, veriye göre iyileştirilir; bütçe verimli kullanılır.', tag: isEN ? 'Live' : 'Canlı' },
    { n: '005', t: isEN ? 'Reporting' : 'Raporlama', d: isEN ? 'Reach, engagement and conversion — transparent and comparable.' : 'Erişim, etkileşim ve dönüşüm şeffaf, karşılaştırılabilir raporlanır.', tag: isEN ? 'Result' : 'Sonuç' },
  ]

  return (
    <PageTransition>
      <section className="portfolio-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlinePhotograph size={14} />{isEN ? 'Portfolio' : 'Portfolyo'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Approved ' : 'Onaylı '}<span>{isEN ? 'project archive' : 'proje arşivi'}</span></h1></FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {isEN
                ? 'Project names, visuals, and results are published only after client permission and verification. Below is what we produce, how we work, and what a case study contains.'
                : 'Proje adları, görselleri ve sonuçları yalnızca müşteri izni ve doğrulama sonrasında yayınlanır. Aşağıda ne ürettiğimizi, nasıl çalıştığımızı ve bir vakanın neleri içerdiğini görebilirsin.'}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section pf-block">
        <div className="container">
          <div className="pf-head">
            <div className="section-badge">{isEN ? 'What we produce' : 'Ne üretiyoruz'}</div>
            <span className="pf-idx">001—004</span>
          </div>
          <div className="pf-tiles">
            {caps.map((k) => (
              <FadeIn key={k.n}>
                <div className="pf-tile">
                  <div className="pf-sq">
                    <span className="pf-lab">{k.lab}</span>
                    <span className="pf-no">{k.n}</span>
                  </div>
                  <div className="pf-row"><span className="pf-t">{k.t}</span><span className="pf-c">{k.c}</span></div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section pf-block">
        <div className="container">
          <div className="pf-head">
            <div className="section-badge">{isEN ? 'How we work' : 'Nasıl çalışırız'}</div>
            <span className="pf-idx">{isEN ? 'process · 5 steps' : 'süreç · 5 adım'}</span>
          </div>
          <div className="pf-proc">
            {steps.map((s) => (
              <div className="pf-proc-row" key={s.n}>
                <span className="pf-proc-n">{s.n}</span>
                <div className="pf-proc-main">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
                <span className="pf-proc-tag">{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="portfolio-cta glass-card">
            <h2>{isEN ? 'Discuss your project' : 'Projenizi konuşalım'}</h2>
            <p>{isEN ? 'Tell us the scope and receive a written proposal.' : 'Kapsamı paylaşın, yazılı teklif hazırlayalım.'}</p>
            <Link to="/teklif-al" className="btn btn-primary">{isEN ? 'Request a quote' : 'Teklif al'}<HiOutlineArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
