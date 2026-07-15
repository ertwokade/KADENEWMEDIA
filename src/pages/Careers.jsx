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

  useSEO({
    title: lang === 'tr' ? 'Kade Media Kariyer | Genel Başvuru Bilgileri' : 'Careers | Kade Media',
    description: lang === 'tr'
      ? 'Kade Media’daki kariyer olanakları ve genel başvuru süreci hakkında bilgi alın; uzmanlık alanınızı ve çalışmalarınızı bizimle paylaşın.'
      : 'Kade Media careers and general application information.',
    path: '/kariyer',
  })

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
                ? 'Şu anda doğrulanmış açık pozisyon bulunmuyor. Genel başvurunuzu portfolyo ve uzmanlık alanınızla birlikte e-posta üzerinden iletebilirsiniz.'
                : 'There are currently no verified open positions. You may send a general application by email with your portfolio and area of expertise.'}
            </p>
            <a className="btn btn-primary" href={`mailto:${BRAND.email}?subject=Kade%20Media%20Genel%20Başvuru`}>
              <HiOutlineMail size={17} /> {lang === 'tr' ? 'Genel başvuru gönder' : 'Send an application'}
            </a>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
