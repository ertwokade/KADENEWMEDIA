import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineGlobe,
  HiOutlinePencilAlt,
  HiOutlineChartBar,
  HiOutlineSpeakerphone,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlineCode,
} from 'react-icons/hi'
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaLinkedinIn } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { ServiceSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Services.css'
import { SERVICE_DETAILS, SERVICE_SLUGS } from '../data/serviceDetails'
import NotFound from './NotFound'

// Sunum alanları (ikon, renk, platform rozetleri). Metin içeriği tek kaynakta:
// src/data/serviceDetails.js — statik ön-render script'i de aynı dosyayı okur,
// böylece sayfadaki metinle Google'ın gördüğü HTML birbirinden ayrışmaz.
const servicePresentation = {
  'sosyal-medya-yonetimi': { icon: HiOutlineGlobe, platforms: [FaInstagram, FaFacebookF, FaTiktok, FaLinkedinIn], color: '#eac321' },
  'icerik-uretimi': { icon: HiOutlinePencilAlt, platforms: [FaInstagram, FaTiktok, FaYoutube], color: '#E91E63' },
  'reklam-yonetimi': { icon: HiOutlineChartBar, platforms: [FaFacebookF, FaInstagram, FaTiktok], color: '#6C63FF' },
  'video-produksiyon': { icon: HiOutlineFilm, platforms: [FaInstagram, FaTiktok, FaYoutube], color: '#FF5722' },
  'strateji-danismanlik': { icon: HiOutlineChatAlt2, platforms: [FaLinkedinIn, FaInstagram, FaFacebookF], color: '#00BCD4' },
  'web-sitesi-tasarimi': { icon: HiOutlineCode, platforms: [FaInstagram, FaLinkedinIn], color: '#9C27B0' },
}

const servicesMap = Object.fromEntries(
  SERVICE_SLUGS.map((slug) => [slug, { ...SERVICE_DETAILS[slug], ...servicePresentation[slug] }]),
)

const slugList = Object.keys(servicesMap)

const PROCESS = [
  { n: '01', tTr: 'Keşif & Brief', tEn: 'Discovery & Brief', dTr: 'Hedef, kitle ve ton netleşir.', dEn: 'Goals, audience and tone are set.' },
  { n: '02', tTr: 'Strateji & Plan', tEn: 'Strategy & Plan', dTr: 'Kapsam, takvim ve KPI yazılı hale gelir.', dEn: 'Scope, schedule and KPIs are written down.' },
  { n: '03', tTr: 'Üretim & Uygulama', tEn: 'Production & Delivery', dTr: 'İş, marka diline sadık ve ölçekli üretilir.', dEn: 'Work is produced on-brand and at scale.' },
  { n: '04', tTr: 'Raporlama', tEn: 'Reporting', dTr: 'Sonuç şeffaf ve karşılaştırılabilir raporlanır.', dEn: 'Results are reported transparently and comparably.' },
]

export default function ServiceDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const staticService = servicesMap[slug]
  const service = useMemo(() => staticService || null, [staticService])

  const title = service ? (lang === 'tr' ? service.titleTr : service.titleEn) : ''
  const desc = service ? (lang === 'tr' ? service.descTr : service.descEn) : ''
  const features = service ? (lang === 'tr' ? service.featuresTr : service.featuresEn) : []
  const problem = service ? (lang === 'tr' ? service.problemTr : service.problemEn) : ''
  const deliverables = service ? (lang === 'tr' ? service.deliverablesTr : service.deliverablesEn) : []

  useSEO({
    title: title ? `${title} | Kade New Media` : 'Hizmet | Kade New Media',
    description: desc,
    path: `/hizmetler/${slug}`,
    image: 'https://kadenewmedia.com/og-image.png',
  })

  useEffect(() => {
    if (!service) return
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://kadenewmedia.com' },
        { '@type': 'ListItem', position: 2, name: 'Hizmetler', item: 'https://kadenewmedia.com/hizmetler' },
        { '@type': 'ListItem', position: 3, name: title, item: `https://kadenewmedia.com/hizmetler/${slug}` },
      ],
    }
    let el = document.getElementById('jsonld-breadcrumb')
    if (el) { el.textContent = JSON.stringify(breadcrumb) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-breadcrumb'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(breadcrumb)
      document.head.appendChild(s)
    }
    return () => { document.getElementById('jsonld-breadcrumb')?.remove() }
  }, [service, slug, title])

  if (!staticService) return <NotFound />

  const currentIdx = slugList.indexOf(slug)
  const prevSlug = currentIdx > 0 ? slugList[currentIdx - 1] : null
  const nextSlug = currentIdx < slugList.length - 1 ? slugList[currentIdx + 1] : null

  return (
    <PageTransition>
      <ServiceSchema name={title} description={desc} url={`/hizmetler/${slug}`} />
      <section className="services-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-150px' }} />
        <div className="container">
          <FadeIn>
            <Link to="/hizmetler" className="partner-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 16 }}>
              <HiOutlineArrowLeft size={16} />
              {lang === 'tr' ? 'Tüm Hizmetler' : 'All Services'}
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${service.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <service.icon size={28} style={{ color: service.color }} />
              </div>
            </div>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}>
              {title}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle" style={{ maxWidth: 640 }}>{desc}</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {problem && (
            <FadeIn>
              <div className="glass-card" style={{ padding: '28px 32px', maxWidth: 780, margin: '0 auto 44px' }}>
                <h2 style={{ color: 'var(--white)', fontSize: '1.2rem', marginBottom: 10 }}>
                  {lang === 'tr' ? 'Hangi soruna çözüm sunuyoruz?' : 'What problem does it solve?'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{problem}</p>
              </div>
            </FadeIn>
          )}
          <FadeIn>
            <h2 style={{ color: 'var(--white)', fontSize: '1.4rem', textAlign: 'center', marginBottom: 32 }}>
              {lang === 'tr' ? 'Neler Yapıyoruz?' : 'What We Do'}
            </h2>
          </FadeIn>
          <StaggerContainer className="services-detail-grid" staggerDelay={0.08} style={{ maxWidth: 800, margin: '0 auto' }}>
            {features.map((feat) => (
              <StaggerItem key={feat}>
                <motion.div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }} whileHover={{ scale: 1.02 }}>
                  <HiOutlineBadgeCheck size={20} style={{ color: service.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--white)', fontSize: '0.95rem' }}>{feat}</span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Çalışma süreci */}
          <FadeIn>
            <h2 style={{ color: 'var(--white)', fontSize: '1.4rem', textAlign: 'center', margin: '56px 0 28px' }}>
              {lang === 'tr' ? 'Çalışma Süreci' : 'How We Work'}
            </h2>
          </FadeIn>
          <StaggerContainer className="process-grid" staggerDelay={0.1} style={{ maxWidth: 940, margin: '0 auto' }}>
            {PROCESS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="process-card glass-card">
                  <div className="process-step">{s.n}</div>
                  <h3>{lang === 'tr' ? s.tTr : s.tEn}</h3>
                  <p>{lang === 'tr' ? s.dTr : s.dEn}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Teslimatlar */}
          <FadeIn>
            <div style={{ maxWidth: 780, margin: '52px auto 0' }}>
              <h2 style={{ color: 'var(--white)', fontSize: '1.4rem', textAlign: 'center', marginBottom: 20 }}>
                {lang === 'tr' ? 'Ne Teslim Ediyoruz?' : 'What You Get'}
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {deliverables.map((d) => (
                  <div key={d} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <HiOutlineBadgeCheck size={18} style={{ color: service.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--white)', fontSize: '0.95rem' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Gerçekçi beklenti */}
          <FadeIn>
            <p style={{ maxWidth: 640, margin: '26px auto 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {lang === 'tr'
                ? 'Sonuçlar sektör, bütçe ve rekabete göre değişir; garanti vermeyiz, süreci ve metrikleri şeffaf paylaşırız.'
                : 'Results vary by sector, budget and competition; we make no guarantees and share the process and metrics transparently.'}
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
              {service.platforms.map((Platform, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Platform size={18} />
                </div>
              ))}
            </div>
          </FadeIn>

          {/* İlgili hizmetler */}
          <FadeIn>
            <h2 style={{ color: 'var(--white)', fontSize: '1.2rem', textAlign: 'center', margin: '52px 0 20px' }}>
              {lang === 'tr' ? 'İlgili Hizmetler' : 'Related Services'}
            </h2>
          </FadeIn>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 16, flexWrap: 'wrap' }}>
            {prevSlug ? (
              <Link to={`/hizmetler/${prevSlug}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineArrowLeft size={16} />
                {lang === 'tr' ? servicesMap[prevSlug].titleTr : servicesMap[prevSlug].titleEn}
              </Link>
            ) : <div />}
            {nextSlug && (
              <Link to={`/hizmetler/${nextSlug}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {lang === 'tr' ? servicesMap[nextSlug].titleTr : servicesMap[nextSlug].titleEn}
                <HiOutlineArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* CTA */}
          <FadeIn delay={0.3}>
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px', marginTop: 40 }}>
              <h3 style={{ color: 'var(--white)', fontSize: '1.3rem', marginBottom: 12 }}>
                {lang === 'tr' ? 'Bu Hizmeti Almak İster misiniz?' : 'Interested in This Service?'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {lang === 'tr'
                  ? 'İhtiyacınızı paylaşın; kapsamı ve çalışma koşullarını yazılı teklifte netleştirelim.'
                  : "Share your needs; we'll clarify scope and terms in a written proposal."}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">
                  {lang === 'tr' ? 'Teklif İste' : 'Request a Proposal'}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/paketler" className="btn btn-outline">
                  {lang === 'tr' ? 'Paketleri İncele' : 'View Packages'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
