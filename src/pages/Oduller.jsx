import { motion } from 'framer-motion'
import { HiOutlineStar, HiOutlineBadgeCheck, HiOutlineArrowRight } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Oduller.css'

const oduller = [
  {
    id: 1,
    yil: '2025',
    baslik: 'En İyi Sosyal Medya Ajansı',
    veren: 'Dijital Pazarlama Ödülleri TR',
    kategori: 'Ödül',
    ikon: '🏆',
    renk: '#eac321',
    aciklama: 'Müşteri memnuniyeti, büyüme metrikleri ve yaratıcı içerik kategorisinde birincilik.',
  },
  {
    id: 2,
    yil: '2024',
    baslik: 'Yılın Büyüme Ajansı',
    veren: 'Reklamcılar Derneği',
    kategori: 'Ödül',
    ikon: '🥇',
    renk: '#6C63FF',
    aciklama: 'Yıl içinde en hızlı büyüyen ve en çok referans alan ajans kategorisinde birincilik.',
  },
  {
    id: 3,
    yil: '2024',
    baslik: 'Meta Business Partner',
    veren: 'Meta (Facebook & Instagram)',
    kategori: 'Sertifika',
    ikon: '📘',
    renk: '#1877F2',
    aciklama: 'Meta Business Partner sertifikası; reklam yönetimi, hedefleme ve dönüşüm optimizasyonu uzmanlığı.',
  },
  {
    id: 4,
    yil: '2024',
    baslik: 'Google Partner',
    veren: 'Google',
    kategori: 'Sertifika',
    ikon: '🔵',
    renk: '#4285F4',
    aciklama: 'Google Ads sertifikalı ajans statüsü. Arama, görüntülü reklam ve YouTube kampanyaları.',
  },
  {
    id: 5,
    yil: '2025',
    baslik: 'TikTok Marketing Partner',
    veren: 'TikTok for Business',
    kategori: 'Sertifika',
    ikon: '🎵',
    renk: '#010101',
    aciklama: 'TikTok for Business sertifikalı pazarlama ortağı. İçerik stratejisi ve TikTok Ads uzmanlığı.',
  },
  {
    id: 6,
    yil: '2023',
    baslik: 'En İnovatif İçerik Ajansı',
    veren: 'StartupIstanbul Summit',
    kategori: 'Ödül',
    ikon: '💡',
    renk: '#2ECC71',
    aciklama: 'Yapay zeka destekli içerik üretim süreçleri ve otomasyonu için verilen inovasyon ödülü.',
  },
  {
    id: 7,
    yil: '2023',
    baslik: 'Canva Certified Expert',
    veren: 'Canva',
    kategori: 'Sertifika',
    ikon: '🎨',
    renk: '#00C4CC',
    aciklama: 'Canva sertifikalı tasarım uzmanlığı. Marka kimliği ve sosyal medya görselleri.',
  },
  {
    id: 8,
    yil: '2023',
    baslik: 'HubSpot Content Marketing',
    veren: 'HubSpot Academy',
    kategori: 'Sertifika',
    ikon: '📊',
    renk: '#FF7A59',
    aciklama: 'İçerik pazarlama stratejisi, SEO uyumlu içerik üretimi ve inbound marketing sertifikası.',
  },
]

const rakamlar = [
  { rakam: '8+', etiket: 'Ödül & Sertifika' },
  { rakam: '4', etiket: 'Uluslararası Sertifika' },
  { rakam: '3+', etiket: 'Yıllık Faaliyet' },
  { rakam: '150+', etiket: 'Başarılı Proje' },
]

export default function Oduller() {
  useSEO({
    title: 'Ödüller & Sertifikalar | Kade Media',
    description: 'Kade Media\'nın kazandığı ödüller ve sahip olduğu sertifikalar. Meta Business Partner, Google Partner, TikTok Marketing Partner.',
    keywords: 'kade media ödüller, meta business partner, google partner ajans, tiktok marketing partner türkiye',
    path: '/oduller',
  })

  const oduller_liste = oduller.filter(o => o.kategori === 'Ödül')
  const sertifikalar = oduller.filter(o => o.kategori === 'Sertifika')

  return (
    <PageTransition>
      <section className="oduller-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineStar size={14} />
              Ödüller & Sertifikalar
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Tanınan ve <span>sertifikalı</span> uzmanlık
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Meta, Google ve TikTok onaylı, sektör ödüllü bir ajansla çalışmanın güvencesi.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="oduller-rakamlar">
            {rakamlar.map(r => (
              <StaggerItem key={r.etiket}>
                <div className="oduller-rakam glass-card">
                  <span className="oduller-rakam-sayi">{r.rakam}</span>
                  <span className="oduller-rakam-etiket">{r.etiket}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.2}>
            <div className="oduller-bolum-baslik">
              <h2>🏆 Aldığımız Ödüller</h2>
            </div>
          </FadeIn>

          <div className="oduller-grid">
            {oduller_liste.map((o, i) => (
              <motion.div
                key={o.id}
                className="odul-kart glass-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="odul-ikon-wrap" style={{ background: `${o.renk}18`, color: o.renk }}>
                  <span style={{ fontSize: '2rem' }}>{o.ikon}</span>
                </div>
                <div className="odul-yil">{o.yil}</div>
                <h3 className="odul-baslik">{o.baslik}</h3>
                <div className="odul-veren">{o.veren}</div>
                <p className="odul-aciklama">{o.aciklama}</p>
              </motion.div>
            ))}
          </div>

          <FadeIn delay={0.1}>
            <div className="oduller-bolum-baslik" style={{ marginTop: '3rem' }}>
              <h2>📜 Sertifikalarımız</h2>
            </div>
          </FadeIn>

          <div className="oduller-grid">
            {sertifikalar.map((o, i) => (
              <motion.div
                key={o.id}
                className="odul-kart glass-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="odul-ikon-wrap" style={{ background: `${o.renk}18`, color: o.renk }}>
                  <HiOutlineBadgeCheck size={32} />
                </div>
                <div className="odul-yil">{o.yil}</div>
                <h3 className="odul-baslik">{o.baslik}</h3>
                <div className="odul-veren">{o.veren}</div>
                <p className="odul-aciklama">{o.aciklama}</p>
              </motion.div>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="oduller-cta glass-card">
              <h3>Kanıtlanmış uzmanlıkla büyümeye hazır mısınız?</h3>
              <p>Meta, Google ve TikTok sertifikalı ekibimizle tanışın.</p>
              <Link to="/iletisim" className="btn btn-primary">
                Ücretsiz Görüşme Al
                <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
