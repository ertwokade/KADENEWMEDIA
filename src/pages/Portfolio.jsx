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
    noindex: true,
  })

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
                ? 'Project names, visuals, and results are published only after client permission and verification. No unverified case study is currently public.'
                : 'Proje adları, görselleri ve sonuçları yalnızca müşteri izni ve doğrulama sonrasında yayınlanır. Şu anda public olarak doğrulanmış vaka çalışması bulunmuyor.'}
            </p>
          </FadeIn>
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
