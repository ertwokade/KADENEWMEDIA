import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightningBolt,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './NedenBiz.css'

const DEFAULT_CONTENT = {
  heroBadge: 'Fark Yaratan Ajans',
  heroSubtitle: 'Her ajans "en iyiyiz" der. Biz gösteriyoruz. İşte somut farklar.',
  ctaTitle: 'Farkı kendiniz görün',
  ctaSubtitle: '30 dakikalık ücretsiz strateji görüşmesiyle başlayın. Taahhüt yok, baskı yok.',
  rakamlar: [
    { sayi: '150+', etiket: 'Yönetilen Hesap', ikon: '📱' },
    { sayi: '%94', etiket: 'Müşteri Tutma Oranı', ikon: '🔄' },
    { sayi: '4.9/5', etiket: 'Ortalama Memnuniyet', ikon: '⭐' },
    { sayi: '2x', etiket: 'Ortalama Takipçi Büyümesi', ikon: '📈' },
  ],
  karsilastirma: [
    { kriter: 'İçerik Onay Süreci', biz: 'Aylık takvim, 3-5 gün önceden onay', diger: 'Genellikle son dakika' },
    { kriter: 'Aylık Raporlama', biz: 'Detaylı PDF rapor + görüşme', diger: 'Excel veya sözlü bilgilendirme' },
    { kriter: 'Dedicated Uzman', biz: 'Her müşteriye 1 dedicated yönetici', diger: 'Hesap paylaşımlı, anonim ekip' },
    { kriter: 'Platform Uzmanlığı', biz: 'Meta, Google, TikTok reklam yönetiminde aktif deneyim', diger: 'Sadece 1-2 platformda sınırlı deneyim' },
    { kriter: 'Şeffaf Fiyatlandırma', biz: 'Sabit aylık paket, gizli ücret yok', diger: 'Değişken, belirsiz fiyat' },
    { kriter: 'Video Prodüksiyon', biz: 'Stüdyo + lokasyon çekim', diger: 'Genellikle dış kaynak, pahalı' },
    { kriter: 'AI Destekli İçerik', biz: 'AI + insan editöryal süreç', diger: 'Tamamen manuel veya tamamen AI' },
    { kriter: 'KVKK Uyumlu Süreç', biz: 'Sözleşme + veri işleme taahhütü', diger: 'Belirsiz veri politikası' },
  ],
  avantajlar: [
    { ikon: '🎯', baslik: 'Sektöre Özel Strateji', aciklama: '15+ sektörde deneyimle her markanın dinamiklerine özel içerik ve reklam stratejisi.', renk: '#6C63FF' },
    { ikon: '⚡', baslik: '5 Günde Başlangıç', aciklama: 'Onboarding\'den ilk içeriğe kadar 5-7 iş günü. Diğer ajanslar haftalar alır.', renk: '#eac321' },
    { ikon: '📊', baslik: 'Data-Driven Kararlar', aciklama: 'Tüm kararlar veriye dayalı. Haftalık metrik takibi, aylık strateji revizyonu.', renk: '#2ECC71' },
    { ikon: '🤝', baslik: 'Uzun Vadeli Ortaklık', aciklama: '%94 müşteri tutma oranımız, yaptığımız işin kalitesini gösteriyor.', renk: '#E91E63' },
    { ikon: '🔒', baslik: 'Tam Şeffaflık', aciklama: 'Şifre paylaşımı yok. İzin tabanlı erişim, geri alınabilir yetkiler.', renk: '#00BCD4' },
    { ikon: '🚀', baslik: 'Ölçeklenebilir Model', aciklama: 'Startup\'tan kurumsal markaya uyumlu paket yapısı. Büyüdükçe birlikte büyürüz.', renk: '#FF9800' },
  ],
}

export default function NedenBiz() {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useSEO({
    title: 'Neden Kade Media? | Karşılaştırma & Avantajlar',
    description: 'Kade Media\'yı diğer sosyal medya ajanslarından ayıran farklar. Uzman ekip, şeffaf fiyatlandırma, aylık raporlama ve dedicated uzman.',
    keywords: 'neden kade media, sosyal medya ajansı karşılaştırma, en iyi sosyal medya ajansı istanbul, ajans seçimi',
    path: '/neden-biz',
  })

  useEffect(() => {
    let cancelled = false
    getContentApi('nedenBiz')
      .then(res => {
        if (cancelled) return
        const data = res?.data || res
        if (data && typeof data === 'object') {
          setContent(prev => ({
            ...prev,
            ...data,
            rakamlar: Array.isArray(data.rakamlar) && data.rakamlar.length ? data.rakamlar : prev.rakamlar,
            karsilastirma: Array.isArray(data.karsilastirma) && data.karsilastirma.length ? data.karsilastirma : prev.karsilastirma,
            avantajlar: Array.isArray(data.avantajlar) && data.avantajlar.length ? data.avantajlar : prev.avantajlar,
          }))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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
              {content.heroBadge}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Neden <span>Kade Media?</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {content.heroSubtitle}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="neden-rakamlar">
            {content.rakamlar.map((r, i) => (
              <StaggerItem key={`${r.etiket}-${i}`}>
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
              {content.karsilastirma.map((satir, i) => (
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
              Temel <span>Avantajlarımız</span>
            </h2>
          </FadeIn>

          <div className="neden-avantajlar">
            {content.avantajlar.map((a, i) => (
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
              <h3>{content.ctaTitle}</h3>
              <p>{content.ctaSubtitle}</p>
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
