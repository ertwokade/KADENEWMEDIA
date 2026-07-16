import { HiOutlineBriefcase, HiOutlineMail } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { BRAND } from '../config/brand'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Careers.css'

export default function Careers() {
  const { lang } = useLanguage()
  const isEN = lang !== 'tr'

  useSEO({
    title: lang === 'tr' ? 'Kade Media Kariyer | Genel Başvuru Bilgileri' : 'Careers | Kade Media',
    description: lang === 'tr'
      ? 'Kade Media’daki kariyer olanakları ve genel başvuru süreci hakkında bilgi alın; uzmanlık alanınızı ve çalışmalarınızı bizimle paylaşın.'
      : 'Kade Media careers and general application information.',
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
                ? 'Şu anda doğrulanmış açık pozisyon bulunmuyor. Ama nasıl bir ekip olduğumuzu, hangi alanlarda çalıştığımızı ve başvuru sürecini aşağıda görebilirsin — genel başvuruya her zaman açığız.'
                : 'There are currently no verified open positions. Below is who we are, the fields we work in, and how to apply — general applications are always welcome.'}
            </p>
            <a className="btn btn-primary" href={`mailto:${BRAND.email}?subject=Kade%20Media%20Genel%20Başvuru`}>
              <HiOutlineMail size={17} /> {lang === 'tr' ? 'Genel başvuru gönder' : 'Send an application'}
            </a>
          </FadeIn>
        </div>
      </section>

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
