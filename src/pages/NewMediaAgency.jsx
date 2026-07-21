/*
 * Sayfa mimarisi:
 * Hero → yeni medya ajansı tanımı → hizmet kümeleri → çalışma modeli →
 * doğru müşteri profili → sık sorulan sorular → teklif CTA.
 */
import { Link } from 'react-router-dom'
import {
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineCheckCircle,
  HiOutlineCode,
  HiOutlineFilm,
  HiOutlineGlobe,
  HiOutlineLightningBolt,
  HiOutlinePencilAlt,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema, FAQSchema, ServiceSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import PageBgAnimation from '../components/PageBgAnimation'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import { SERVICE_DESCRIPTION, SERVICES as SERVICES_DATA, PROCESS, FAQS } from '../data/newMediaAgency'
import './NewMediaAgency.css'

const SERVICE_ICONS = [HiOutlineGlobe, HiOutlinePencilAlt, HiOutlineChartBar, HiOutlineFilm, HiOutlineChatAlt2, HiOutlineCode]
const SERVICES = SERVICES_DATA.map((service, i) => ({ ...service, icon: SERVICE_ICONS[i] }))

export default function NewMediaAgency() {
  useSEO({
    title: 'New Media Ajansı İstanbul | Kade New Media',
    description: SERVICE_DESCRIPTION,
    keywords: 'new media ajansı, yeni medya ajansı, medya ajansı, dijital medya ajansı, sosyal medya ajansı istanbul, kade media, kade new media, kademedia, kadenewmedia',
    path: '/new-media-ajansi',
  })

  return (
    <PageTransition>
      <BreadcrumbSchema items={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'New Media Ajansı', path: '/new-media-ajansi' },
      ]} />
      <ServiceSchema name="New Media Ajansı" description={SERVICE_DESCRIPTION} url="/new-media-ajansi" />
      <FAQSchema items={FAQS} />

      <section className="new-media-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-160px', right: '-120px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineLightningBolt size={14} /> New Media Ajansı</div>
            <h1 className="section-title new-media-title">
              Yeni medyada <span>strateji, içerik ve performans</span> tek planda
            </h1>
            <p className="section-subtitle new-media-lead">
              Kade New Media, İstanbul merkezli bir new media ve dijital medya ajansı. Sosyal medya,
              içerik, reklam, video ve web hizmetlerini markanızın hedefleri etrafında bir araya getiriyoruz.
            </p>
            <div className="new-media-actions">
              <Link className="btn btn-primary" to="/teklif-al">Projenizi paylaşın <HiOutlineArrowRight /></Link>
              <Link className="btn btn-secondary" to="/hizmetler">Tüm hizmetler</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section new-media-intro">
        <div className="container new-media-intro-grid">
          <FadeIn direction="left">
            <span className="new-media-kicker">Yeni medya nedir?</span>
            <h2>Medya kanallarını ayrı işler değil, tek müşteri yolculuğu olarak ele alıyoruz.</h2>
          </FadeIn>
          <FadeIn direction="right">
            <p>
              New media dediğimizde sosyal ağlardan arama motorlarına, dijital reklamdan videoya ve
              web deneyimine kadar geniş bir alandan bahsediyoruz. Bu kanalları ayrı ayrı değil,
              markanızın görünürlüğü, talep yaratma ve sürdürülebilir iletişim hedefleri etrafında
              tek bir plan içinde yönetiyoruz.
            </p>
            <p>
              Markamızın adı <strong>Kade New Media</strong>. İnternette Kade, Kademedia veya
              Kadenewmedia şeklinde arandığında da karşınıza çıkan resmi adresimiz
              <strong> kadenewmedia.com</strong>.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="section-header">
              <span className="new-media-kicker">Hizmetler</span>
              <h2 className="section-title">Dijital medyada ihtiyacınız olan temel uzmanlıklar</h2>
              <p className="section-subtitle">Tek bir hizmetle başlayabilir veya ihtiyaçlarınıza göre bütünleşik bir kapsam oluşturabilirsiniz.</p>
            </div>
          </FadeIn>
          <StaggerContainer className="new-media-service-grid" staggerDelay={0.08}>
            {SERVICES.map(service => (
              <StaggerItem key={service.title}>
                <Link className="new-media-card glass-card" to={service.to}>
                  <service.icon size={28} aria-hidden="true" />
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span>Detayları inceleyin <HiOutlineArrowRight aria-hidden="true" /></span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="section new-media-process">
        <div className="container">
          <FadeIn>
            <div className="section-header">
              <span className="new-media-kicker">Çalışma modeli</span>
              <h2 className="section-title">Fikirden ölçüme üç net adım</h2>
            </div>
          </FadeIn>
          <div className="new-media-process-grid">
            {PROCESS.map(([number, title, description]) => (
              <FadeIn key={number}>
                <article className="new-media-process-card glass-card">
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container new-media-fit-grid">
          <FadeIn direction="left">
            <span className="new-media-kicker">Kimler için?</span>
            <h2 className="section-title">Dijital iletişimini düzenli ve ölçülebilir hale getirmek isteyen markalar için.</h2>
          </FadeIn>
          <FadeIn direction="right">
            <ul className="new-media-check-list">
              {[
                'Yeni bir marka veya ürün lansmanı planlayan ekipler',
                'Sosyal medya üretimini düzenli hale getirmek isteyen işletmeler',
                'Reklam bütçesini içerik ve dönüşüm hedefleriyle birlikte yönetmek isteyen markalar',
                'Video, web ve dijital kampanyaları tek plan içinde yürütmek isteyen ekipler',
              ].map(item => <li key={item}><HiOutlineCheckCircle aria-hidden="true" /> {item}</li>)}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="section new-media-faq">
        <div className="container">
          <FadeIn>
            <div className="section-header">
              <span className="new-media-kicker">Sık sorulan sorular</span>
              <h2 className="section-title">New media ajansı hakkında</h2>
            </div>
          </FadeIn>
          <div className="new-media-faq-list">
            {FAQS.map(item => (
              <FadeIn key={item.soru}>
                <article className="glass-card">
                  <h3>{item.soru}</h3>
                  <p>{item.cevap}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section new-media-cta">
        <div className="container">
          <FadeIn>
            <div className="new-media-cta-card glass-card">
              <span className="new-media-kicker">Birlikte planlayalım</span>
              <h2>Markanız için doğru new media kapsamını belirleyin.</h2>
              <p>Hedefinizi ve ihtiyacınızı paylaşın; kapsam, takvim ve maliyetleri yazılı teklifte netleştirelim.</p>
              <Link className="btn btn-primary" to="/teklif-al">Teklif isteyin <HiOutlineArrowRight /></Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
