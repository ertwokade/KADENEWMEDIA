import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineDocumentText } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './CaseStudies.css'

export default function CaseStudies() {
  useSEO({
    title: 'Vaka Çalışmaları | Kade Media',
    description: 'Müşteri izniyle yayınlanan, doğrulanmış Kade Media vaka çalışmaları.',
    path: '/basari-hikayeleri',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="case-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineDocumentText size={14} />Vaka çalışmaları</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">Doğrulanmış <span>sonuç arşivi</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">Kampanya sonuçları ve müşteri isimleri yalnızca ölçüm kaynağı ve yayın izni doğrulandıktan sonra paylaşılır. Şu anda public vaka çalışması bulunmuyor.</p></FadeIn>
        </div>
      </section>
      <section className="section"><div className="container"><div className="case-cta glass-card"><h2>Projeniz için kapsam oluşturalım</h2><Link to="/teklif-al" className="btn btn-primary">Teklif al<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
