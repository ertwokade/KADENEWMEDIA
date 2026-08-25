import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineDocumentText } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import { useSiteContent } from '../hooks/useSiteContent'
import { KADE_CASE_STUDIES } from '../data/caseStudies'
import './CaseStudies.css'

export default function CaseStudies() {
  const { content } = useSiteContent('caseStudies', KADE_CASE_STUDIES)
  const stats = Array.isArray(content?.summaryStats) ? content.summaryStats : []
  const cases = Array.isArray(content?.cases) ? content.cases : []
  useSEO({
    title: 'Vaka Çalışmaları | Kade New Media',
    description: 'Kade New Media ve KadeAI ürünlerinde uyguladığımız, kapsamı ve ölçümü açık dijital dönüşüm vaka çalışmaları.',
    path: '/basari-hikayeleri',
  })

  return (
    <PageTransition>
      <section className="case-hero">
        <PageBgAnimation type="partners" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineDocumentText size={14} />Vaka çalışmaları</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">Doğrulanmış <span>sonuç arşivi</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">Önce kendi ürünlerimizde uyguladığımız sistemleri; kapsamı, yöntemi ve ölçümü açık biçimde paylaşıyoruz. Müşteri sonuçlarını yalnızca izin ve kaynak doğrulamasından sonra ekliyoruz.</p></FadeIn>
        </div>
      </section>
      {stats.length > 0 && <section className="section"><div className="container case-stats-grid">{stats.map((stat, index) => <article className="glass-card case-stat" key={`${stat.labelTr}-${index}`}><span>{stat.ikon}</span><strong>{stat.value}</strong><p>{stat.labelTr}</p></article>)}</div></section>}
      {cases.length > 0 && <section className="section"><div className="container case-list">{cases.map((item, index) => <article className="glass-card case-study" key={item.id || index} style={{ borderTopColor: item.color }}><header><span className="case-logo">{item.logo}</span><div><small>{item.industryTr} · {item.durationTr}</small><h2>{item.client}</h2></div></header><p><strong>Zorluk:</strong> {item.challengeTr}</p><p><strong>Çözüm:</strong> {item.solutionTr}</p>{Array.isArray(item.metrics) && <div className="case-metrics">{item.metrics.map((metric, metricIndex) => <div key={`${metric.labelTr}-${metricIndex}`}><span>{metric.ikon} {metric.labelTr}</span><strong>{metric.after}</strong><small>{metric.change}</small></div>)}</div>}{item.testimonialTextTr && <blockquote>“{item.testimonialTextTr}”<footer>{item.testimonialName} · {item.testimonialRole}</footer></blockquote>}</article>)}</div></section>}
      {cases.length === 0 && <section className="section"><div className="container"><div className="case-cta glass-card"><h2>Yayına hazır vaka çalışması yok</h2><p>Onaylı sonuçlar admin panelinden eklendiğinde burada görünecek.</p></div></div></section>}
      <section className="section"><div className="container"><div className="case-cta glass-card"><h2>Projeniz için kapsam oluşturalım</h2><Link to="/teklif-al" className="btn btn-primary">Teklif al<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
