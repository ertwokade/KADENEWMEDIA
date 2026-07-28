import { HiOutlineBriefcase, HiOutlineMail } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import { BRAND } from '../config/brand'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Careers.css'

export default function Careers() {
  const { lang } = useLanguage()
  const isEN = lang !== 'tr'
  const { content: careers } = useSiteContent('careers', { tr: [], en: [] })
  const { content: contact } = useSiteContent('footer', BRAND)
  const jobs = (isEN ? careers.en : careers.tr).filter((job) => job?.title)
  const applicationEmail = contact.email || BRAND.email

  useSEO({
    title: lang === 'tr' ? 'Kade New Media Kariyer | Genel Başvuru Bilgileri' : 'Careers | Kade New Media',
    description: lang === 'tr'
      ? 'Kade New Media’da kariyer olanakları ve genel başvuru süreci hakkında bilgi bulabilirsin; uzmanlık alanını ve çalışmalarını bizimle paylaş.'
      : 'Kade New Media careers and general application information.',
    path: '/kariyer',
  })

  const values = [
    { n: '01', lab: isEN ? 'Value' : 'İlke', t: isEN ? 'Transparency' : 'Şeffaflık', c: isEN ? 'Written · Measurable' : 'Yazılı · Ölçülebilir' },
    { n: '02', lab: isEN ? 'Value' : 'İlke', t: isEN ? 'Ownership' : 'Sahiplenme', c: isEN ? 'End to end' : 'Uçtan uca' },
    { n: '03', lab: isEN ? 'Value' : 'İlke', t: isEN ? 'Learning' : 'Öğrenme', c: isEN ? 'Always improving' : 'Sürekli gelişim' },
    { n: '04', lab: isEN ? 'Value' : 'İlke', t: isEN ? 'Close team' : 'Yakın ekip', c: isEN ? 'Small · Fast' : 'Küçük · Hızlı' },
  ]

  const areas = [
    { n: 'A', lab: isEN ? 'Field' : 'Alan', t: isEN ? 'Content' : 'İçerik', c: isEN ? 'Reels · Copy' : 'Reels · Metin' },
    { n: 'B', lab: isEN ? 'Field' : 'Alan', t: isEN ? 'Social' : 'Sosyal', c: isEN ? 'Community' : 'Topluluk' },
    { n: 'C', lab: isEN ? 'Field' : 'Alan', t: isEN ? 'Performance' : 'Performans', c: 'Meta · Google' },
    { n: 'D', lab: isEN ? 'Field' : 'Alan', t: isEN ? 'Production' : 'Prodüksiyon', c: isEN ? 'Shoot · Edit' : 'Çekim · Kurgu' },
  ]

  const steps = [
    { n: '001', t: isEN ? 'Apply' : 'Başvur', d: isEN ? 'Send your portfolio and area of expertise by email.' : 'Portfolyo ve uzmanlık alanını e-posta ile gönder.', tag: isEN ? 'E-mail' : 'E-posta' },
    { n: '002', t: isEN ? 'Review' : 'İnceleme', d: isEN ? 'We review your work against current and upcoming needs.' : 'Çalışmaların mevcut ve yakın ihtiyaçlara göre incelenir.', tag: isEN ? 'Fit' : 'Uygunluk' },
    { n: '003', t: isEN ? 'Conversation' : 'Görüşme', d: isEN ? 'A short call about how you work and what you enjoy.' : 'Nasıl çalıştığın ve neyi sevdiğin üzerine kısa bir görüşme.', tag: isEN ? 'Call' : 'Sohbet' },
    { n: '004', t: isEN ? 'Trial & Start' : 'Deneme & Başlangıç', d: isEN ? 'A small paid task, then a clear scope to start.' : 'Küçük bir ücretli görev, ardından net kapsamla başlangıç.', tag: isEN ? 'Start' : 'Başla' },
  ]

  return (
    <PageTransition>
      <section className="careers-hero">
        <PageBgAnimation type="careers" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineBriefcase size={14} /> {lang === 'tr' ? 'Kariyer' : 'Careers'}</div>
            <h1 className="section-title">
              {lang === 'tr' ? <>Açık pozisyonları <span>şeffafça</span> yayınlıyoruz</> : <>We publish open roles <span>transparently</span></>}
            </h1>
            <p className="section-subtitle">
              {lang === 'tr'
                ? (jobs.length
                    ? `${jobs.length} açık pozisyon için detayları aşağıda inceleyebilir, uygun rol için başvurunu e-posta ile gönderebilirsin.`
                    : 'Şu anda doğrulanmış açık pozisyon bulunmuyor. Ama nasıl bir ekip olduğumuzu, hangi alanlarda çalıştığımızı ve başvuru sürecini aşağıda görebilirsin — genel başvuruya her zaman açığız.')
                : (jobs.length
                    ? `Review ${jobs.length} open role${jobs.length > 1 ? 's' : ''} below and apply by email.`
                    : 'There are currently no verified open positions. Below is who we are, the fields we work in, and how to apply — general applications are always welcome.')}
            </p>
            <a className="btn btn-primary" href={`mailto:${applicationEmail}?subject=Kade%20Media%20Genel%20Başvuru`}>
              <HiOutlineMail size={17} /> {lang === 'tr' ? 'Genel başvuru gönder' : 'Send an application'}
            </a>
          </FadeIn>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="section careers-openings" aria-labelledby="careers-openings-title">
          <div className="container">
            <div className="pf-head">
              <h2 id="careers-openings-title" className="section-badge">
                {isEN ? 'Open roles' : 'Açık pozisyonlar'}
              </h2>
              <span className="pf-idx">{jobs.length}</span>
            </div>
            <div className="careers-job-grid">
              {jobs.map((job, index) => (
                <article className="careers-job-card glass-card" key={`${job.title}-${index}`}>
                  <div className="careers-job-meta">
                    {[job.department, job.location, job.type].filter(Boolean).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <h3>{job.title}</h3>
                  {job.description && <p>{job.description}</p>}
                  {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                    <ul>
                      {job.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                    </ul>
                  )}
                  <a
                    className="btn btn-outline"
                    href={`mailto:${applicationEmail}?subject=${encodeURIComponent(`Kade Media Başvuru — ${job.title}`)}`}
                  >
                    <HiOutlineMail size={16} /> {isEN ? 'Apply' : 'Başvur'}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section pf-block">
        <div className="container">
          <div className="pf-head">
            <div className="section-badge">{isEN ? 'Why Kade' : 'Neden Kade'}</div>
            <span className="pf-idx">{isEN ? 'culture · 4 values' : 'kültür · 4 ilke'}</span>
          </div>
          <div className="pf-tiles">
            {values.map((k) => (
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
            <div className="section-badge">{isEN ? 'Fields we hire in' : 'Hangi alanlarda'}</div>
            <span className="pf-idx">A—D</span>
          </div>
          <div className="pf-tiles">
            {areas.map((k) => (
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
            <div className="section-badge">{isEN ? 'Application process' : 'Başvuru süreci'}</div>
            <span className="pf-idx">{isEN ? '4 steps' : '4 adım'}</span>
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
    </PageTransition>
  )
}
