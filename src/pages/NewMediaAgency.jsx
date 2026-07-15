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
import './NewMediaAgency.css'

const SERVICE_DESCRIPTION = 'İstanbul merkezli Kade Media ile new media stratejisi, sosyal medya yönetimi, içerik üretimi, dijital reklam, video prodüksiyon ve web tasarımı.'

const SERVICES = [
  {
    icon: HiOutlineGlobe,
    title: 'Sosyal Medya Yönetimi',
    description: 'Instagram, TikTok, LinkedIn, Facebook ve YouTube için strateji, içerik takvimi, yayın ve topluluk yönetimi.',
    to: '/hizmetler/sosyal-medya-yonetimi',
  },
  {
    icon: HiOutlinePencilAlt,
    title: 'İçerik Üretimi',
    description: 'Marka diline uygun görsel, metin, kısa video, fotoğraf ve kampanya içeriklerinin planlanması ve üretimi.',
    to: '/hizmetler/icerik-uretimi',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Dijital Reklam',
    description: 'Meta, Google ve TikTok reklamlarında hedefleme, kreatif test, bütçe takibi ve performans analizi.',
    to: '/hizmetler/reklam-yonetimi',
  },
  {
    icon: HiOutlineFilm,
    title: 'Video Prodüksiyon',
    description: 'Reels, TikTok, YouTube ve reklam projeleri için senaryo, çekim, kurgu ve motion graphics.',
    to: '/hizmetler/video-produksiyon',
  },
  {
    icon: HiOutlineChatAlt2,
    title: 'New Media Stratejisi',
    description: 'Marka, hedef kitle ve kanal verilerinden hareketle içerik, reklam ve büyüme yol haritası.',
    to: '/hizmetler/strateji-danismanlik',
  },
  {
    icon: HiOutlineCode,
    title: 'Web Tasarımı',
    description: 'Mobil uyumlu, hızlı ve teklif toplamaya odaklı web sitesi tasarımı ve geliştirme hizmetleri.',
    to: '/hizmetler/web-sitesi-tasarimi',
  },
]

const PROCESS = [
  ['01', 'Keşif ve analiz', 'Markanızı, hedef kitlenizi, mevcut kanallarınızı ve ticari hedefinizi birlikte netleştiririz.'],
  ['02', 'Strateji ve üretim', 'Doğru kanal, içerik formatı, reklam yaklaşımı ve üretim takvimini tek plan içinde kurarız.'],
  ['03', 'Yayın ve ölçüm', 'İçerikleri yayınlar, kampanyaları izler ve doğrulanabilir verilerle sonraki adımları planlarız.'],
]

const FAQS = [
  {
    soru: 'New media ajansı ne yapar?',
    cevap: 'New media ajansı; sosyal medya, dijital reklam, içerik, video, web ve veri analizini tek iletişim stratejisinde birleştirir. Amaç yalnızca paylaşım yapmak değil, markanın dijital kanallardaki bütün deneyimini planlamaktır.',
  },
  {
    soru: 'Kade Media ile Kade New Media aynı marka mı?',
    cevap: 'Evet. Resmî marka adı Kade Media’dır. Kade, Kademedia, Kade New Media ve Kadenewmedia ifadeleri markanın çevrimiçi aramalarda kullanılan alternatif yazımlarıdır. Resmî web adresi kadenewmedia.com’dur.',
  },
  {
    soru: 'Hangi hizmetle başlamalıyım?',
    cevap: 'Başlangıç noktası hedefinize ve mevcut durumunuza göre belirlenir. Görünürlük için içerik ve sosyal medya, talep toplamak için reklam ve dönüşüm odaklı web, marka iletişimi için ise bütünleşik new media planı değerlendirilebilir.',
  },
  {
    soru: 'Teklif süreci nasıl ilerliyor?',
    cevap: 'İhtiyaç, kanal, içerik hacmi, prodüksiyon gereksinimi ve reklam kapsamı yazılı olarak netleştirilir. Ücret, takvim, KDV, medya bütçesi ve varsa üçüncü taraf maliyetleri teklif aşamasında belirtilir.',
  },
]

export default function NewMediaAgency() {
  useSEO({
    title: 'New Media Ajansı İstanbul | Kade Media',
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
              Kade Media, İstanbul merkezli new media ve dijital medya ajansı olarak sosyal medya,
              içerik, reklam, video ve web hizmetlerini markanızın hedefleri etrafında birleştirir.
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
              New media; sosyal ağları, arama motorlarını, dijital reklamı, içerik formatlarını,
              videoyu ve web deneyimini birlikte kapsar. Kade Media bu alanları marka görünürlüğü,
              talep toplama ve sürdürülebilir iletişim hedefleri için ortak bir plan içinde yönetir.
            </p>
            <p>
              Resmî marka adımız <strong>Kade Media</strong>’dır. Kade, Kademedia, Kade New Media
              ve Kadenewmedia aramalarında markamıza ait resmî adres <strong>kadenewmedia.com</strong>’dur.
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
