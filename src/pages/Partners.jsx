import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineOfficeBuilding } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Partners.css'

export default function Partners() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  useSEO({
    title: isEN ? 'Business Partners | Kade Media' : 'İş Ortakları | Kade Media',
    description: isEN ? 'Verified Kade Media business partner information.' : 'Doğrulanmış Kade Media iş ortaklığı bilgileri.',
    path: '/partnerler',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="partners-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineOfficeBuilding size={14} />{isEN ? 'Business partners' : 'İş ortakları'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Verified ' : 'Doğrulanmış '}<span>{isEN ? 'partnerships' : 'iş ortaklıkları'}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">{isEN ? 'Partner identities and logos are published only with permission. No verified partner list is currently public.' : 'Partner kimlikleri ve logoları yalnızca izinle yayınlanır. Şu anda public olarak doğrulanmış partner listesi bulunmuyor.'}</p></FadeIn>
        </div>
      </section>
      <section className="section"><div className="container"><div className="portfolio-cta glass-card"><h2>{isEN ? 'Partnership inquiries' : 'İş ortaklığı görüşmeleri'}</h2><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
