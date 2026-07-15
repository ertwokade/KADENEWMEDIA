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
import NotFound from './NotFound'

const servicesMap = {
  'sosyal-medya-yonetimi': {
    icon: HiOutlineGlobe,
    titleTr: 'Sosyal Medya Yönetimi',
    titleEn: 'Social Media Management',
    descTr: 'Instagram, Facebook, TikTok ve LinkedIn için içerik planlama, yayın takvimi, topluluk yönetimi, raporlama ve marka iletişimi hizmetleri.',
    descEn: 'We professionally manage your Instagram, Facebook, TikTok, and LinkedIn accounts. We strengthen your brand in the digital world with content planning, posting schedules, and community management.',
    featuresTr: ['İçerik Takvimi Oluşturma', 'Topluluk Yönetimi', 'Kriz Yönetimi', 'Aylık Raporlama', 'Hashtag Stratejisi', 'Rakip Analizi'],
    featuresEn: ['Content Calendar Creation', 'Community Management', 'Crisis Management', 'Monthly Reporting', 'Hashtag Strategy', 'Competitor Analysis'],
    platforms: [FaInstagram, FaFacebookF, FaTiktok, FaLinkedinIn],
    color: '#eac321',
  },
  'icerik-uretimi': {
    icon: HiOutlinePencilAlt,
    titleTr: 'İçerik Üretimi',
    titleEn: 'Content Production',
    descTr: 'Markanıza özel görsel, video ve metin içerikleri; içerik stratejisi, grafik tasarım, metin yazımı, fotoğraf çekimi ve sosyal medya tasarımları.',
    descEn: 'We produce unique, creative, and engaging content for your brand. We prepare your visual, video, and text content with our professional team.',
    featuresTr: ['Grafik Tasarım', 'Copywriting', 'Marka Kimliği', 'İçerik Stratejisi', 'Fotoğraf Çekimi', 'Story Tasarımları'],
    featuresEn: ['Graphic Design', 'Copywriting', 'Brand Identity', 'Content Strategy', 'Photography', 'Story Designs'],
    platforms: [FaInstagram, FaTiktok, FaYoutube],
    color: '#E91E63',
  },
  'reklam-yonetimi': {
    icon: HiOutlineChartBar,
    titleTr: 'Reklam Yönetimi',
    titleEn: 'Ad Management',
    descTr: 'Meta, Google Ads ve TikTok Ads kampanyaları için planlama, hedefleme, A/B testleri, yeniden pazarlama ve performans analizi hizmetleri.',
    descEn: 'We manage your ad campaigns on Meta (Facebook & Instagram), Google Ads, and TikTok Ads platforms. We use your budget most efficiently.',
    featuresTr: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'A/B Test', 'Retargeting', 'Performans Analizi'],
    featuresEn: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'A/B Testing', 'Retargeting', 'Performance Analysis'],
    platforms: [FaFacebookF, FaInstagram, FaTiktok],
    color: '#6C63FF',
  },
  'video-produksiyon': {
    icon: HiOutlineFilm,
    titleTr: 'Video Prodüksiyon',
    titleEn: 'Video Production',
    descTr: 'Reels, TikTok, YouTube ve reklam projeleri için senaryo, çekim, kurgu, motion graphics ve proje kapsamına göre prodüksiyon hizmetleri.',
    descEn: 'We offer professional video production services for Reels, TikTok videos, YouTube content, and commercials.',
    featuresTr: ['Reels & TikTok', 'YouTube İçerikleri', 'Reklam Filmleri', 'Motion Graphics', 'Drone Çekimi', 'Senaryo Yazımı'],
    featuresEn: ['Reels & TikTok', 'YouTube Content', 'Commercials', 'Motion Graphics', 'Drone Footage', 'Scriptwriting'],
    platforms: [FaInstagram, FaTiktok, FaYoutube],
    color: '#FF5722',
  },
  'strateji-danismanlik': {
    icon: HiOutlineChatAlt2,
    titleTr: 'Strateji & Danışmanlık',
    titleEn: 'Strategy & Consulting',
    descTr: 'Marka ve rakip analizi, hedef ve KPI belirleme, dijital pazarlama yol haritası, büyüme planı ve strateji danışmanlığı hizmetleri.',
    descEn: 'We create your digital marketing strategy and map out the path to reach your goals.',
    featuresTr: ['Marka Analizi', 'Rakip Analizi', 'Strateji Planı', 'KPI Belirleme', 'Büyüme Stratejisi', 'Pazar Araştırması'],
    featuresEn: ['Brand Analysis', 'Competitor Analysis', 'Strategy Plan', 'KPI Setting', 'Growth Strategy', 'Market Research'],
    platforms: [FaLinkedinIn, FaInstagram, FaFacebookF],
    color: '#00BCD4',
  },
  'web-sitesi-tasarimi': {
    icon: HiOutlineCode,
    titleTr: 'Web Sitesi Tasarımı',
    titleEn: 'Web Design',
    descTr: 'Markanıza özel mobil uyumlu web sitesi tasarımı, UI/UX, geliştirme, CMS ve e-ticaret entegrasyonu ile performans iyileştirme hizmetleri.',
    descEn: 'We design and develop modern, mobile-friendly websites tailored to your brand. We provide SEO-optimized, fast, and impactful web solutions.',
    featuresTr: ['Responsive Tasarım', 'SEO Optimizasyonu', 'UI/UX Tasarım', 'E-ticaret Çözümleri', 'CMS Entegrasyonu', 'Performans Optimizasyonu'],
    featuresEn: ['Responsive Design', 'SEO Optimization', 'UI/UX Design', 'E-commerce Solutions', 'CMS Integration', 'Performance Optimization'],
    platforms: [FaInstagram, FaLinkedinIn],
    color: '#9C27B0',
  },
}

const slugList = Object.keys(servicesMap)

export default function ServiceDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const staticService = servicesMap[slug]
  const service = useMemo(() => staticService || null, [staticService])

  const title = service ? (lang === 'tr' ? service.titleTr : service.titleEn) : ''
  const desc = service ? (lang === 'tr' ? service.descTr : service.descEn) : ''
  const features = service ? (lang === 'tr' ? service.featuresTr : service.featuresEn) : []

  useSEO({
    title: title ? `${title} | Kade Media` : 'Hizmet | Kade Media',
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
              {lang === 'tr' ? '← Tüm Hizmetler' : '← All Services'}
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

          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
              {service.platforms.map((Platform, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Platform size={18} />
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Navigation between services */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, gap: 16, flexWrap: 'wrap' }}>
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
