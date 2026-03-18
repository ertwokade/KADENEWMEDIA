import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineStar,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Packages.css'

const packages = [
  {
    name: 'Başlangıç',
    price: '7.500',
    period: '/ay',
    desc: 'Sosyal medyada ilk adımlarını atan markalar için ideal paket.',
    popular: false,
    features: [
      '2 Platform Yönetimi',
      'Ayda 20 İçerik',
      'Temel Grafik Tasarım',
      'Aylık Rapor',
      'Topluluk Yönetimi',
      'İçerik Takvimi',
    ],
    notIncluded: [
      'Reklam Yönetimi',
      'Video İçerik',
      'Influencer Marketing',
    ],
  },
  {
    name: 'Profesyonel',
    price: '15.000',
    period: '/ay',
    desc: 'Büyümek isteyen markalar için kapsamlı sosyal medya çözümü.',
    popular: true,
    features: [
      '4 Platform Yönetimi',
      'Ayda 40 İçerik',
      'Profesyonel Grafik Tasarım',
      'Haftalık Rapor',
      'Topluluk Yönetimi',
      'İçerik Takvimi',
      'Temel Reklam Yönetimi',
      '4 Reels/TikTok Video',
      'Rakip Analizi',
    ],
    notIncluded: [
      'Influencer Marketing',
    ],
  },
  {
    name: 'Kurumsal',
    price: '30.000',
    period: '/ay',
    desc: 'Dijital varlığını maksimize etmek isteyen büyük markalar için.',
    popular: false,
    features: [
      'Tüm Platform Yönetimi',
      'Sınırsız İçerik',
      'Premium Grafik Tasarım',
      'Anlık Raporlama',
      'Topluluk Yönetimi',
      'İçerik Takvimi',
      'Gelişmiş Reklam Yönetimi',
      '12+ Reels/TikTok Video',
      'Rakip Analizi',
      'Influencer Marketing',
      'Kriz Yönetimi',
      'Özel Strateji Danışmanı',
    ],
    notIncluded: [],
  },
]

const faqs = [
  {
    q: 'Minimum sözleşme süresi nedir?',
    a: 'Minimum 3 aylık sözleşme yapıyoruz. Dijital pazarlamada sonuçlar zaman alır, bu süre stratejimizin etkisini görmeniz için idealdir.',
  },
  {
    q: 'Reklam bütçesi paket fiyatına dahil mi?',
    a: 'Hayır, reklam bütçesi paket fiyatlarına dahil değildir. Reklam yönetim hizmeti dahildir ancak reklam harcaması ayrıca faturalandırılır.',
  },
  {
    q: 'Hangi platformları yönetiyorsunuz?',
    a: 'Instagram, Facebook, Twitter/X, TikTok, YouTube, LinkedIn ve Pinterest platformlarında hizmet veriyoruz.',
  },
  {
    q: 'Özel paket hazırlayabilir misiniz?',
    a: 'Evet, markanızın ihtiyaçlarına göre özel paketler hazırlayabiliriz. İletişim sayfamızdan bize ulaşabilirsiniz.',
  },
]

export default function Packages() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="packages-hero">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineSparkles size={14} />
              Paketler
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              Size Uygun <span>Paketi</span> Seçin
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Her bütçeye ve ihtiyaca uygun paketlerimizle dijital dünyada fark yaratın.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section">
        <div className="container">
          <StaggerContainer className="packages-grid" staggerDelay={0.15}>
            {packages.map((pkg) => (
              <StaggerItem key={pkg.name}>
                <motion.div
                  className={`package-card glass-card ${pkg.popular ? 'popular' : ''}`}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  {pkg.popular && (
                    <div className="popular-badge">
                      <HiOutlineStar size={14} />
                      En Popüler
                    </div>
                  )}
                  <div className="package-header">
                    <h3>{pkg.name}</h3>
                    <p className="package-desc">{pkg.desc}</p>
                    <div className="package-price">
                      <span className="currency">₺</span>
                      <span className="amount">{pkg.price}</span>
                      <span className="period">{pkg.period}</span>
                    </div>
                  </div>

                  <div className="package-features">
                    {pkg.features.map((feature) => (
                      <div key={feature} className="feature-item included">
                        <HiOutlineCheck size={16} />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {pkg.notIncluded.map((feature) => (
                      <div key={feature} className="feature-item not-included">
                        <span className="dash">—</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/iletisim"
                    className={`btn ${pkg.popular ? 'btn-primary' : 'btn-outline'} package-btn`}
                  >
                    Hemen Başla
                    <HiOutlineArrowRight size={16} />
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header">
            <FadeIn>
              <h2 className="section-title">
                Sıkça Sorulan <span>Sorular</span>
              </h2>
            </FadeIn>
          </div>

          <StaggerContainer className="faq-grid" staggerDelay={0.1}>
            {faqs.map((faq) => (
              <StaggerItem key={faq.q}>
                <div className="faq-card glass-card">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
