import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineChevronDown } from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import useSiteContent from '../hooks/useSiteContent'
import {
  HOME_FAQ_DEFAULTS,
  HOME_HERO_DEFAULTS,
  HOME_SERVICES_DEFAULTS,
  HOME_STATS_DEFAULTS,
  HOME_TESTIMONIALS_DEFAULTS,
} from '../data/pageDefaults'
import './Home.css'

function splitFeatures(value) {
  if (Array.isArray(value)) return value
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function safeInternalPath(value, fallback) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

export default function Home() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  const [openFaq, setOpenFaq] = useState(null)
  const { content: hero } = useSiteContent('hero', HOME_HERO_DEFAULTS)
  const { content: stats } = useSiteContent('stats', HOME_STATS_DEFAULTS)
  const { content: services } = useSiteContent('services', HOME_SERVICES_DEFAULTS)
  const { content: testimonials } = useSiteContent('testimonials', HOME_TESTIMONIALS_DEFAULTS)
  const { content: faq } = useSiteContent('faq', HOME_FAQ_DEFAULTS)

  useSEO({
    title: isEN
      ? 'Kade Media | New Media & Digital Marketing Agency'
      : 'Kade Media | İstanbul New Media ve Dijital Pazarlama Ajansı',
    description: isEN
      ? 'Strategy, content, advertising and production for measurable digital growth.'
      : 'Strateji, içerik, reklam ve prodüksiyonu ölçülebilir dijital büyüme için tek planda birleştiriyoruz.',
    path: '/',
  })

  const heroText = { ...HOME_HERO_DEFAULTS[lang], ...(hero?.[lang] || {}) }
  const statItems = [
    [stats.clients, isEN ? 'Brands' : 'Marka'],
    [stats.followers, isEN ? 'Audience managed' : 'Yönetilen kitle'],
    [stats.campaigns, isEN ? 'Campaigns' : 'Kampanya'],
    [stats.satisfaction, isEN ? 'Satisfaction' : 'Memnuniyet'],
  ]
  const faqItems = Array.isArray(faq?.[lang]) ? faq[lang] : HOME_FAQ_DEFAULTS[lang]
  const testimonialItems = Array.isArray(testimonials?.items) ? testimonials.items : []
  const serviceItems = Array.isArray(services?.items) && services.items.length
    ? services.items
    : HOME_SERVICES_DEFAULTS.items

  return (
    <PageTransition>
      <section className="hero home-cms-hero">
        <div className="container hero-content">
          <p className="home-eyebrow">{heroText.eyebrow}</p>
          <h1 className="hero-title">
            {heroText.title1}
            <br />
            <span className="hero-highlight">{heroText.title2}</span>
          </h1>
          <p className="hero-subtitle">{heroText.subtitle}</p>
          <div className="hero-actions">
            <Link to={safeInternalPath(heroText.primaryHref, '/teklif-al')} className="btn btn-primary">
              {heroText.primaryLabel}<HiOutlineArrowRight size={18} />
            </Link>
            <Link to={safeInternalPath(heroText.secondaryHref, '/hizmetler')} className="btn btn-outline">
              {heroText.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-section" aria-label={isEN ? 'Agency metrics' : 'Ajans metrikleri'}>
        <div className="container stats-grid">
          {statItems.map(([value, label]) => (
            <article className="stat-card glass-card" key={label}>
              <strong className="stat-number">{value}</strong>
              <span className="stat-label">{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section services-preview">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">{isEN ? 'Services' : 'Hizmetler'}</div>
            <h2 className="section-title">
              {isEN ? 'One team, ' : 'Tek ekip, '}
              <span>{isEN ? 'one growth plan' : 'tek büyüme planı'}</span>
            </h2>
          </div>
          <div className="services-grid">
            {serviceItems.map((service, index) => {
              const slug = service.slug || HOME_SERVICES_DEFAULTS.items[index]?.slug || `hizmet-${index + 1}`
              const features = splitFeatures(isEN ? service.featuresEn : service.featuresTr)
              return (
                <Link className="service-card glass-card home-service-card" to={`/hizmetler/${slug}`} key={slug}>
                  <span className="home-service-index">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{isEN ? (service.titleEn || service.titleTr) : (service.titleTr || service.titleEn)}</h3>
                  <p>{isEN ? (service.descEn || service.descTr) : (service.descTr || service.descEn)}</p>
                  {features.length > 0 && (
                    <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {testimonialItems.length > 0 && (
        <section className="section testimonials-section">
          <div className="container">
            <div className="section-header">
              <div className="section-badge">{isEN ? 'References' : 'Referanslar'}</div>
              <h2 className="section-title">{isEN ? 'Client ' : 'Müşteri '}<span>{isEN ? 'experience' : 'deneyimi'}</span></h2>
            </div>
            <div className="testimonials-grid">
              {testimonialItems.map((item, index) => (
                <blockquote className="testimonial-card glass-card" key={`${item.nameTr || item.nameEn}-${index}`}>
                  <p>“{isEN ? (item.textEn || item.textTr) : (item.textTr || item.textEn)}”</p>
                  <footer>
                    <strong>{isEN ? (item.nameEn || item.nameTr) : (item.nameTr || item.nameEn)}</strong>
                    <span>{isEN ? (item.roleEn || item.roleTr) : (item.roleTr || item.roleEn)}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">FAQ</div>
            <h2 className="section-title">{isEN ? 'Clear ' : 'Net '}<span>{isEN ? 'answers' : 'yanıtlar'}</span></h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <article className={`faq-item glass-card ${openFaq === index ? 'open' : ''}`} key={`${item.q}-${index}`}>
                <button type="button" className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                  <span>{item.q}</span><HiOutlineChevronDown size={18} aria-hidden="true" />
                </button>
                {openFaq === index && <div className="faq-answer"><p>{item.a}</p></div>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card glass-card">
            <div className="cta-content">
              <h2>{isEN ? 'Let’s build the next ' : 'Bir sonraki '}<span>{isEN ? 'growth step' : 'büyüme adımını'}</span>{isEN ? ' together.' : ' birlikte kuralım.'}</h2>
              <p>{isEN ? 'Share your goals and receive a written scope.' : 'Hedefini paylaş, yazılı kapsam ve teklif hazırlayalım.'}</p>
              <Link to="/teklif-al" className="btn btn-primary">{isEN ? 'Request a quote' : 'Teklif al'}<HiOutlineArrowRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
