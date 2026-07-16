import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineBookOpen } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Blog.css'

export default function Blog() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  useSEO({
    title: isEN ? 'Blog | Kade Media' : 'Blog | Kade Media',
    description: isEN ? 'Verified Kade Media articles and practical notes.' : 'Doğrulanmış Kade Media yazıları ve pratik notları.',
    path: '/blog',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="blog-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineBookOpen size={14} />{isEN ? 'Blog' : 'Blog'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Source-checked ' : 'Kaynağı kontrol edilmiş '}<span>{isEN ? 'articles' : 'yazılar'}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">{isEN ? 'Articles are published after their claims, dates, and sources are reviewed. No verified article is currently public.' : 'Yazılar; iddiaları, tarihleri ve kaynakları kontrol edildikten sonra yayınlanır. Şu anda public olarak doğrulanmış yazı bulunmuyor.'}</p></FadeIn>
        </div>
      </section>
      <section className="section"><div className="container"><div className="blog-newsletter glass-card"><h2>{isEN ? 'Need a practical answer?' : 'Pratik bir yanıt mı arıyorsunuz?'}</h2><p>{isEN ? 'Tell us what you are working on.' : 'Üzerinde çalıştığınız konuyu bize anlatın.'}</p><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
