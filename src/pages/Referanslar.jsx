import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineThumbUp } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import useSiteContent from '../hooks/useSiteContent'
import { HOME_TESTIMONIALS_DEFAULTS } from '../data/pageDefaults'
import './Referanslar.css'

export default function Referanslar() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  const { content } = useSiteContent('testimonials', HOME_TESTIMONIALS_DEFAULTS)
  const testimonials = Array.isArray(content?.items) ? content.items : []
  useSEO({
    title: isEN ? 'Client References | Kade New Media' : 'Müşteri Referansları | Kade New Media',
    description: isEN ? 'Verified Kade New Media client references.' : 'Doğrulanmış Kade New Media müşteri referansları.',
    path: '/referanslar',
    noindex: true,
  })

  const metrics = [
    { n: '01', lab: isEN ? 'Metric' : 'Metrik', t: isEN ? 'Reach' : 'Erişim', c: isEN ? 'Audience growth' : 'Kitle büyümesi' },
    { n: '02', lab: isEN ? 'Metric' : 'Metrik', t: isEN ? 'Engagement' : 'Etkileşim', c: isEN ? 'Quality of interaction' : 'Etkileşim kalitesi' },
    { n: '03', lab: isEN ? 'Metric' : 'Metrik', t: isEN ? 'Conversion' : 'Dönüşüm', c: isEN ? 'Action & sales' : 'Aksiyon & satış' },
    { n: '04', lab: isEN ? 'Metric' : 'Metrik', t: isEN ? 'Efficiency' : 'Verim', c: isEN ? 'Cost per result' : 'Sonuç maliyeti' },
  ]

  const steps = [
    { n: '001', t: isEN ? 'Consent' : 'İzin', d: isEN ? 'We publish a reference only with the client’s explicit permission.' : 'Bir referansı yalnızca müşterinin açık izniyle yayınlarız.', tag: isEN ? 'Permission' : 'İzin' },
    { n: '002', t: isEN ? 'Verify' : 'Doğrula', d: isEN ? 'Name, company, rating and statement are verified before publishing.' : 'İsim, şirket, puan ve beyan yayından önce doğrulanır.', tag: isEN ? 'Check' : 'Kontrol' },
    { n: '003', t: isEN ? 'Publish' : 'Yayınla', d: isEN ? 'Only then is it shown here — no invented testimonials.' : 'Ancak o zaman burada gösterilir — uydurma yorum yok.', tag: isEN ? 'Live' : 'Canlı' },
  ]

  return (
    <PageTransition>
      <section className="referanslar-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineThumbUp size={14} />{isEN ? 'Client references' : 'Müşteri referansları'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Permission-based ' : 'İzinli ve '}<span>{isEN ? 'testimonials' : 'doğrulanmış yorumlar'}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">{isEN ? 'Names, companies, ratings, and statements are published only with explicit permission. Below is how we measure success and how a reference gets published.' : 'İsim, şirket, puan ve beyanları yalnızca açık izinle yayınlıyoruz. Aşağıda başarıyı nasıl ölçtüğümüzü ve bir referansın nasıl yayınlandığını görebilirsin.'}</p></FadeIn>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section">
          <div className="container reference-grid">
            {testimonials.map((item, index) => (
              <blockquote className="reference-card glass-card" key={`${item.nameTr || item.nameEn}-${index}`}>
                <p>“{isEN ? (item.textEn || item.textTr) : (item.textTr || item.textEn)}”</p>
                <footer>
                  <strong>{isEN ? (item.nameEn || item.nameTr) : (item.nameTr || item.nameEn)}</strong>
                  <span>{isEN ? (item.roleEn || item.roleTr) : (item.roleTr || item.roleEn)}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="section pf-block">
        <div className="container">
          <div className="pf-head">
            <div className="section-badge">{isEN ? 'How we measure' : 'Nasıl ölçüyoruz'}</div>
            <span className="pf-idx">{isEN ? 'metrics · 001—004' : 'metrikler · 001—004'}</span>
          </div>
          <div className="pf-tiles">
            {metrics.map((k) => (
              <FadeIn key={k.n}>
                <div className="pf-tile">
                  <div className="pf-sq"><span className="pf-lab">{k.lab}</span><span className="pf-no">{k.n}</span></div>
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
            <div className="section-badge">{isEN ? 'Why permission-based' : 'Neden izinle'}</div>
            <span className="pf-idx">{isEN ? '3 steps' : '3 adım'}</span>
          </div>
          <div className="pf-proc">
            {steps.map((s) => (
              <div className="pf-proc-row" key={s.n}>
                <span className="pf-proc-n">{s.n}</span>
                <div className="pf-proc-main"><h3>{s.t}</h3><p>{s.d}</p></div>
                <span className="pf-proc-tag">{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section"><div className="container"><div className="referanslar-cta glass-card"><h2>{isEN ? 'Discuss your needs directly' : 'İhtiyacınızı doğrudan konuşalım'}</h2><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
