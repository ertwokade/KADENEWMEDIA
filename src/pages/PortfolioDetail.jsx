import { Link, useParams } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import NotFound from './NotFound'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import useSiteContent from '../hooks/useSiteContent'
import { PORTFOLIO_DEFAULTS } from '../data/pageDefaults'
import './Portfolio.css'

export default function PortfolioDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  const { content, loading } = useSiteContent('portfolio', PORTFOLIO_DEFAULTS)
  const projects = Array.isArray(content?.items) && content.items.length ? content.items : PORTFOLIO_DEFAULTS.items
  const project = projects.find((item, index) => String(item.slug || item.id || `proje-${index + 1}`) === slug)

  useSEO({
    title: project ? `${isEN ? (project.titleEn || project.titleTr) : (project.titleTr || project.titleEn)} | Kade Media` : 'Portfolyo | Kade Media',
    description: project?.descriptionTr || project?.descTr || 'Kade Media proje detayı.',
    path: `/portfolio/${slug || ''}`,
    noindex: !project,
  })

  if (loading) return <div className="portfolio-detail-loading" aria-busy="true">Yükleniyor...</div>
  if (!project) return <NotFound />

  const title = isEN ? (project.titleEn || project.titleTr) : (project.titleTr || project.titleEn)
  const description = isEN
    ? (project.descriptionEn || project.descEn || project.descriptionTr || project.descTr)
    : (project.descriptionTr || project.descTr || project.descriptionEn || project.descEn)

  return (
    <PageTransition>
      <section className="portfolio-detail-hero">
        <div className="container">
          <Link to="/portfolio" className="portfolio-back"><HiOutlineArrowLeft size={16} />{isEN ? 'Portfolio' : 'Portfolyo'}</Link>
          <div className="portfolio-detail-mark" style={{ background: `${project.color || '#eac321'}22` }}>{project.emoji || '📸'}</div>
          <p className="content-kicker">{project.category} · {project.partner}</p>
          <h1 className="section-title">{title}</h1>
          {description && <p className="section-subtitle">{description}</p>}
        </div>
      </section>
      <section className="section">
        <div className="container portfolio-detail-grid">
          <article className="glass-card portfolio-detail-copy">
            <h2>{isEN ? 'Project scope' : 'Proje kapsamı'}</h2>
            <p>{description || (isEN ? 'Approved project details are being prepared.' : 'Onaylı proje detayları hazırlanıyor.')}</p>
            {Array.isArray(project.services) && <ul>{project.services.map((service) => <li key={service}>{service}</li>)}</ul>}
          </article>
          <aside className="glass-card portfolio-detail-metric">
            <span>{project.metricKey || (isEN ? 'Result' : 'Sonuç')}</span>
            <strong style={{ color: project.color || '#eac321' }}>{project.metricVal || '—'}</strong>
          </aside>
        </div>
        <div className="container"><div className="portfolio-cta glass-card"><h2>{isEN ? 'Discuss a similar project' : 'Benzer bir projeyi konuşalım'}</h2><Link to="/teklif-al" className="btn btn-primary">{isEN ? 'Request a quote' : 'Teklif al'}<HiOutlineArrowRight size={16} /></Link></div></div>
      </section>
    </PageTransition>
  )
}
