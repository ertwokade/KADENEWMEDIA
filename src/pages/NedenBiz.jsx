import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightningBolt,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './NedenBiz.css'

const karsilastirmaVerisi = [
  {
    kriter: 'İçerik Onay Süreci',
    biz: 'Aylık takvim, 3-5 gün önceden onay',
    diger: 'Genellikle son dakika',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'Aylık Raporlama',
    biz: 'Detaylı PDF rapor + görüşme',
    diger: 'Excel veya sözlü bilgilendirme',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'Dedicated Uzman',
    biz: 'Her müşteriye 1 dedicated yönetici',
    diger: 'Hesap paylaşımlı, anonim ekip',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'Sertifikalı Ekip',
    biz: 'Meta, Google, TikTok sertifikalı',
    diger: 'Çoğunlukla sertifikasız',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'Şeffaf Fiyatlandırma',
    biz: 'Sabit aylık paket, gizli ücret yok',
    diger: 'Değişken, belirsiz fiyat',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'Video Prodüksiyon',
    biz: 'Stüdyo + lokasyon çekim',
    diger: 'Genellikle dış kaynak, pahalı',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'AI Destekli İçerik',
    biz: 'AI + insan editöryal süreç',
    diger: 'Tamamen manuel veya tamamen AI',
    bizVar: true,
    digerVar: false,
  },
  {
    kriter: 'KVKK Uyumlu Süreç',
    biz: 'Sözleşme + veri işleme taahhütü',
    diger: 'Belirsiz veri politikası',
    bizVar: true,
    digerVar: false,
  },
]

const avantajlar = [
  {
    ikon: '🎯',
    baslik: 'Sektöre Özel Strateji',
    aciklama: '15+ sektörde deneyimle her markanın dinamiklerine özel içerik ve reklam stratejisi.',
    renk: '#6C63FF',
  },
  {
    ikon: '⚡',
    baslik: '5 Günde Başlangıç',
    aciklama: 'Onboarding\'den ilk içeriğe kadar 5-7 iş günü. Diğer ajanslar haftalar alır.',
    renk: '#eac321',
  },
  {
    ikon: '📊',
    baslik: 'Data-Driven Kararlar',
    aciklama: 'Tüm kararlar veriye dayalı. Haftalık metrik takibi, aylık strateji revizyonu.',
    renk: '#2ECC71',
  },
  {
    ikon: '🤝',
    baslik: 'Uzun Vadeli Ortaklık',
    aciklama: '%94 müşteri tutma oranımız, yaptığımız işin kalitesini gösteriyor.',
    renk: '#E91E63',
  },
  {
    ikon: '🔒',
    baslik: 'Tam Şeffaflık',
    aciklama: 'Şifre paylaşımı yok. İzin tabanlı erişim, geri alınabilir yetkiler.',
    renk: '#00BCD4',
  },
  {
    ikon: '🚀',
    baslik: 'Ölçeklenebilir Model',
    aciklama: 'Startup\'tan kurumsal markaya uyumlu paket yapısı. Büyüdükçe birlikte büyürüz.',
    renk: '#FF9800',
  },
]

const rakamlar = [
  { sayi: '150+', etiket: 'Yönetilen Hesap', ikon: '📱' },
  { sayi: '%94', etiket: 'Müşteri Tutma Oranı', ikon: '🔄' },
  { sayi: '4.9/5', etiket: 'Ortalama Memnuniyet', ikon: '⭐' },
  { sayi: '2x', etiket: 'Ortalama Takipçi Büyümesi', ikon: '📈' },
]

export default function NedenBiz() {
  useSEO({
    title: 'Neden Kade Media? | Karşılaştırma & Avantajlar',
    description: 'Kade Media\'yı diğer sosyal medya ajanslarından ayıran farklar. Sertifikalı ekip, şeffaf fiyatlandırma, aylık raporlama ve dedicated uzman.',
    keywords: 'neden kade media, sosyal medya ajansı karşılaştırma, en iyi sosyal medya ajansı istanbul, ajans seçimi',
    path: '/neden-biz',
  })

  return (
    <PageTransition>
      <section className="neden-hero">
        <PageBgAnimation type="services" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineLightningBolt size={14} />
              Fark Yaratan Ajans
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Neden <span>Kade Media?</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Her ajans "en iyiyiz" der. Biz gösteriyoruz. İşte somut farklar.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="neden-rakamlar">
            {rakamlar.map(r => (
              <StaggerItem key={r.etiket}>
                <div className="neden-rakam glass-card">
                  <span className="neden-ikon">{r.ikon}</span>
                  <span className="neden-sayi">{r.sayi}</span>
                  <span className="neden-etiket">{r.etiket}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.1}>
            <h2 className="neden-bolum-baslik">
              <span>Kade Media</span> vs Diğer Ajanslar
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="karsilastirma-tablo glass-card">
              <div className="tablo-header">
                <div className="tablo-kriter">Kriter</div>
                <div className="tablo-biz">✅ Kade Media</div>
                <div className="tablo-diger">❌ Diğer Ajanslar</div>
              </div>
              {karsilastirmaVerisi.map((satir, i) => (
                <motion.div
                  key={i}
                  className="tablo-satir"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="tablo-kriter">{satir.kriter}</div>
                  <div className="tablo-biz">
                    <HiOutlineCheckCircle size={18} className="check-ikon" />
                    <span>{satir.biz}</span>
                  </div>
                  <div className="tablo-diger">
                    <HiOutlineXCircle size={18} className="x-ikon" />
                    <span>{satir.diger}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="neden-bolum-baslik" style={{ marginTop: '3rem' }}>
              6 Temel <span>Avantajımız</span>
            </h2>
          </FadeIn>

          <div className="neden-avantajlar">
            {avantajlar.map((a, i) => (
              <motion.div
                key={i}
                className="neden-avantaj glass-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="avantaj-ikon" style={{ background: `${a.renk}15`, color: a.renk }}>
                  <span style={{ fontSize: '1.6rem' }}>{a.ikon}</span>
                </div>
                <h3>{a.baslik}</h3>
                <p>{a.aciklama}</p>
              </motion.div>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="neden-cta glass-card">
              <h3>Farkı kendiniz görün</h3>
              <p>30 dakikalık ücretsiz strateji görüşmesiyle başlayın. Taahhüt yok, baskı yok.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">
                  Görüşme Planla
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/referanslar" className="btn btn-outline">
                  Referansları Gör
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
