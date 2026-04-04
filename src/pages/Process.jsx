import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowRight, HiOutlineSearch, HiOutlineLightBulb,
  HiOutlinePencilAlt, HiOutlinePlay, HiOutlineChartBar, HiOutlineCheck
} from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Process.css'

const steps = [
  {
    number: '01',
    icon: HiOutlineSearch,
    color: '#6C63FF',
    titleTr: 'Keşif & Analiz',
    titleEn: 'Discovery & Analysis',
    descTr: 'Markanızı, hedef kitlenizi ve rakiplerinizi derinlemesine analiz ediyoruz. Sosyal medya hesaplarınızı denetliyor, büyüme fırsatlarını belirliyoruz.',
    descEn: 'We deeply analyze your brand, target audience, and competitors. We audit your social media accounts and identify growth opportunities.',
    itemsTr: ['Mevcut hesap denetimi', 'Rakip analizi', 'Hedef kitle araştırması', 'Büyüme fırsatları raporu'],
    itemsEn: ['Current account audit', 'Competitor analysis', 'Target audience research', 'Growth opportunities report'],
  },
  {
    number: '02',
    icon: HiOutlineLightBulb,
    color: '#eac321',
    titleTr: 'Strateji Geliştirme',
    titleEn: 'Strategy Development',
    descTr: 'Markanıza özel, ölçülebilir hedefler içeren kapsamlı bir sosyal medya stratejisi hazırlıyoruz. Hangi platformda, ne zaman, nasıl paylaşacağınızı belirliyoruz.',
    descEn: 'We prepare a comprehensive social media strategy with measurable goals tailored to your brand, defining what to post, when, and how on each platform.',
    itemsTr: ['Platform seçimi & optimizasyonu', 'İçerik stratejisi', 'Yayın takvimi', 'KPI belirleme'],
    itemsEn: ['Platform selection & optimization', 'Content strategy', 'Publishing calendar', 'KPI definition'],
  },
  {
    number: '03',
    icon: HiOutlinePencilAlt,
    color: '#E91E63',
    titleTr: 'İçerik Üretimi',
    titleEn: 'Content Production',
    descTr: 'Tasarım ekibimiz ve içerik uzmanlarımız, markanızın sesini ve görsel kimliğini yansıtan özgün içerikler üretiyor. Görseller, videolar, reels ve metinler.',
    descEn: 'Our design team and content specialists produce unique content that reflects your brand voice and visual identity — graphics, videos, reels, and copy.',
    itemsTr: ['Görsel tasarım', 'Video & Reels üretimi', 'Copywriting', 'Hikaye & Story formatları'],
    itemsEn: ['Graphic design', 'Video & Reels production', 'Copywriting', 'Story formats'],
  },
  {
    number: '04',
    icon: HiOutlinePlay,
    color: '#2ECC71',
    titleTr: 'Yayın & Yönetim',
    titleEn: 'Publishing & Management',
    descTr: 'İçerikleri en uygun saatlerde yayınlıyor, yorumlara ve mesajlara hızla yanıt veriyoruz. Topluluk yönetimi ile markanızın itibarını koruyoruz.',
    descEn: 'We publish content at optimal times, respond quickly to comments and messages, and protect your brand reputation through community management.',
    itemsTr: ['Zamanlanmış yayınlar', 'Yorum & DM yönetimi', 'Topluluk büyütme', 'Kriz yönetimi'],
    itemsEn: ['Scheduled publishing', 'Comment & DM management', 'Community growth', 'Crisis management'],
  },
  {
    number: '05',
    icon: HiOutlineChartBar,
    color: '#00BCD4',
    titleTr: 'Analiz & Raporlama',
    titleEn: 'Analysis & Reporting',
    descTr: 'Aylık detaylı raporlarla kampanya performansını şeffaf biçimde sunuyoruz. Veriye dayalı kararlarla stratejimizi sürekli optimize ediyoruz.',
    descEn: 'We present campaign performance transparently with monthly detailed reports, continuously optimizing our strategy with data-driven decisions.',
    itemsTr: ['Aylık performans raporu', 'Erişim & etkileşim analizi', 'ROI hesaplama', 'Strateji optimizasyonu'],
    itemsEn: ['Monthly performance report', 'Reach & engagement analysis', 'ROI calculation', 'Strategy optimization'],
  },
]

export default function Process() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'

  useSEO({
    title: 'Nasıl Çalışıyoruz | Kade Media Çalışma Süreci',
    description: 'Kade Media sosyal medya ajansı olarak müşterilerimizle nasıl çalıştığımızı adım adım anlattık. Keşiften raporlamaya 5 adımlı sürecimiz.',
    keywords: 'sosyal medya ajansı nasıl çalışır, sosyal medya yönetim süreci, dijital ajans çalışma süreci',
    path: '/nasil-calisiyoruz',
  })

  return (
    <PageTransition>
      {/* Hero */}
      <section className="process-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineSearch size={14} />
              {isEN ? 'Our Process' : 'Çalışma Sürecimiz'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {isEN ? 'How We ' : 'Nasıl '}
              <span>{isEN ? 'Work' : 'Çalışıyoruz'}</span>
              {isEN ? '' : '?'}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {isEN
                ? 'From the first meeting to monthly reports — a transparent, 5-step process that delivers real results.'
                : 'İlk görüşmeden aylık raporlamaya kadar şeffaf, 5 adımlı ve gerçek sonuçlar üreten bir süreç.'}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Steps */}
      <section className="section">
        <div className="container">
          <div className="process-steps">
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.1} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className={`process-step glass-card ${i % 2 === 1 ? 'process-step-reverse' : ''}`}>
                  <div className="process-step-visual">
                    <div className="process-step-number" style={{ color: step.color }}>{step.number}</div>
                    <div className="process-step-icon" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30`, color: step.color }}>
                      <step.icon size={32} />
                    </div>
                    {i < steps.length - 1 && <div className="process-connector" />}
                  </div>
                  <div className="process-step-content">
                    <h3 style={{ color: step.color }}>{isEN ? step.titleEn : step.titleTr}</h3>
                    <p>{isEN ? step.descEn : step.descTr}</p>
                    <ul className="process-checklist">
                      {(isEN ? step.itemsEn : step.itemsTr).map((item) => (
                        <li key={item}>
                          <HiOutlineCheck size={16} style={{ color: step.color, flexShrink: 0 }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* CTA */}
          <FadeIn delay={0.3}>
            <div className="process-cta glass-card">
              <h2>{isEN ? 'Ready to start?' : 'Başlamaya hazır mısınız?'}</h2>
              <p>
                {isEN
                  ? 'Contact us today for a free discovery call — no commitment required.'
                  : 'Bugün ücretsiz keşif görüşmesi için bize ulaşın — hiçbir taahhüt gerekmez.'}
              </p>
              <div className="process-cta-actions">
                <Link to="/iletisim" className="btn btn-primary">
                  {isEN ? 'Get Free Quote' : 'Ücretsiz Teklif Al'}
                  <HiOutlineArrowRight size={18} />
                </Link>
                <Link to="/paketler" className="btn btn-outline">
                  {isEN ? 'View Packages' : 'Paketleri İncele'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
