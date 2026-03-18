import { motion } from 'framer-motion'
import {
  HiOutlineGlobe,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineCamera,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlinePencilAlt,
  HiOutlineSpeakerphone,
} from 'react-icons/hi'
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaTwitter, FaLinkedinIn } from 'react-icons/fa'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Services.css'

const services = [
  {
    icon: HiOutlineGlobe,
    title: 'Sosyal Medya Yönetimi',
    desc: 'Instagram, Facebook, Twitter, TikTok ve LinkedIn hesaplarınızı profesyonel bir şekilde yönetiyoruz. İçerik planlaması, paylaşım takvimi ve topluluk yönetimi ile markanızı dijital dünyada güçlendiriyoruz.',
    features: ['İçerik Takvimi Oluşturma', 'Topluluk Yönetimi', 'Kriz Yönetimi', 'Aylık Raporlama'],
    platforms: [FaInstagram, FaFacebookF, FaTwitter, FaTiktok],
  },
  {
    icon: HiOutlinePencilAlt,
    title: 'İçerik Üretimi',
    desc: 'Markanıza özel, yaratıcı ve etkileyici içerikler üretiyoruz. Görsel, video ve metin içeriklerinizi profesyonel ekibimizle hazırlıyoruz.',
    features: ['Grafik Tasarım', 'Copywriting', 'Marka Kimliği', 'İçerik Stratejisi'],
    platforms: [FaInstagram, FaTiktok, FaYoutube],
  },
  {
    icon: HiOutlineChartBar,
    title: 'Reklam Yönetimi',
    desc: 'Meta (Facebook & Instagram), Google Ads ve TikTok Ads platformlarında reklam kampanyalarınızı yönetiyoruz. Bütçenizi en verimli şekilde kullanıyoruz.',
    features: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'A/B Test'],
    platforms: [FaFacebookF, FaInstagram, FaTiktok],
  },
  {
    icon: HiOutlineSpeakerphone,
    title: 'Influencer Marketing',
    desc: 'Markanıza uygun influencer\'ları seçiyor, kampanya süreçlerini yönetiyoruz. Mikro ve makro influencer\'larla iş birliği yapıyoruz.',
    features: ['Influencer Seçimi', 'Kampanya Yönetimi', 'ROI Analizi', 'İçerik Onay Süreci'],
    platforms: [FaInstagram, FaYoutube, FaTiktok],
  },
  {
    icon: HiOutlineFilm,
    title: 'Video Prodüksiyon',
    desc: 'Reels, TikTok videoları, YouTube içerikleri ve reklam filmleri için profesyonel video prodüksiyon hizmeti sunuyoruz.',
    features: ['Reels & TikTok', 'YouTube İçerikleri', 'Reklam Filmleri', 'Motion Graphics'],
    platforms: [FaInstagram, FaTiktok, FaYoutube],
  },
  {
    icon: HiOutlineChatAlt2,
    title: 'Strateji & Danışmanlık',
    desc: 'Dijital pazarlama stratejinizi oluşturuyor, hedeflerinize ulaşmanız için yol haritası çiziyoruz.',
    features: ['Marka Analizi', 'Rakip Analizi', 'Strateji Planı', 'KPI Belirleme'],
    platforms: [FaLinkedinIn, FaInstagram, FaFacebookF],
  },
]

const process = [
  {
    step: '01',
    title: 'Analiz',
    desc: 'Markanızı, hedef kitlenizi ve rakiplerinizi analiz ediyoruz.',
  },
  {
    step: '02',
    title: 'Strateji',
    desc: 'Size özel dijital pazarlama stratejisi oluşturuyoruz.',
  },
  {
    step: '03',
    title: 'Uygulama',
    desc: 'Stratejiyi hayata geçiriyor, içerik ve kampanyaları başlatıyoruz.',
  },
  {
    step: '04',
    title: 'Optimizasyon',
    desc: 'Verileri analiz ediyor, sürekli iyileştirme yapıyoruz.',
  },
]

export default function Services() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="services-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineLightningBolt size={14} />
              Hizmetlerimiz
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              Dijital Başarınız İçin <span>Her Şey</span> Burada
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Sosyal medya yönetiminden reklam kampanyalarına, içerik üretiminden influencer
              marketinge kadar tüm dijital ihtiyaçlarınızı karşılıyoruz.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <StaggerContainer className="services-detail-grid" staggerDelay={0.1}>
            {services.map((service) => (
              <StaggerItem key={service.title}>
                <motion.div
                  className="service-detail-card glass-card"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="service-detail-header">
                    <div className="service-detail-icon">
                      <service.icon size={28} />
                    </div>
                    <h3>{service.title}</h3>
                  </div>
                  <p className="service-detail-desc">{service.desc}</p>
                  <div className="service-features">
                    {service.features.map((feature) => (
                      <span key={feature} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="service-platforms">
                    {service.platforms.map((Platform, i) => (
                      <span key={i} className="platform-tag">
                        <Platform size={14} />
                      </span>
                    ))}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Process */}
      <section className="section process-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <div className="section-badge">
                <HiOutlineCamera size={14} />
                Süreç
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="section-title">
                Nasıl <span>Çalışıyoruz</span>?
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="section-subtitle">
                4 adımlık sürecimizle markanızı dijital dünyada büyütüyoruz.
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="process-grid" staggerDelay={0.15}>
            {process.map((item, index) => (
              <StaggerItem key={item.step}>
                <div className="process-card glass-card">
                  <div className="process-step">{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  {index < process.length - 1 && (
                    <div className="process-connector" />
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
