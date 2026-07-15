import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineThumbUp } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Referanslar.css'

export default function Referanslar() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  useSEO({
    title: isEN ? 'Client References | Kade Media' : 'Müşteri Referansları | Kade Media',
    description: isEN ? 'Verified Kade Media client references.' : 'Doğrulanmış Kade Media müşteri referansları.',
    path: '/referanslar',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="referanslar-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineThumbUp size={14} />{isEN ? 'Client references' : 'Müşteri referansları'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Permission-based ' : 'İzinli ve '}<span>{isEN ? 'testimonials' : 'doğrulanmış yorumlar'}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">{isEN ? 'Names, companies, ratings, and statements are published only with explicit permission. No verified testimonial is currently public.' : 'İsim, şirket, puan ve beyanlar yalnızca açık izinle yayınlanır. Şu anda public olarak doğrulanmış müşteri yorumu bulunmuyor.'}</p></FadeIn>
        </div>
      </section>
      <section className="section"><div className="container"><div className="referanslar-cta glass-card"><h2>{isEN ? 'Discuss your needs directly' : 'İhtiyacınızı doğrudan konuşalım'}</h2><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
