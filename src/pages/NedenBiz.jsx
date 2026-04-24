import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightningBolt,
  HiOutlineArrowRight,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
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
    { sayi: '20+', etiket: 'Çalıştığımız Marka', etiketEn: 'Brands Worked With', ikon: '📱' },
    { sayi: '%87', etiket: 'Müşteri Tutma Oranı', etiketEn: 'Client Retention Rate', ikon: '🔄' },
    { sayi: '4.8/5', etiket: 'Ortalama Memnuniyet', etiketEn: 'Avg. Satisfaction', ikon: '⭐' },
    { sayi: '3+ Yıl', etiket: 'Sektör Deneyimi', etiketEn: 'Industry Experience', ikon: '🏆' },
  ],
  karsilastirma: [
    { kriter: 'İçerik Onay Süreci', biz: 'Aylık takvim, 3-5 gün önceden onay', diger: 'Çoğunda net bir onay süreci tanımlı değil' },
    { kriter: 'Aylık Raporlama', biz: 'Detaylı PDF rapor + isteğe bağlı görüşme', diger: 'Raporlama formatı ajansa göre değişir' },
    { kriter: 'Dedicated Uzman', biz: 'Her müşteriye 1 sorumlu yönetici', diger: 'Küçük ajanslar hesap rotasyonu yapabilir' },
    { kriter: 'Platform Uzmanlığı', biz: 'Meta, Google, TikTok reklam yönetiminde aktif deneyim', diger: 'Platform uzmanlığı ajansa göre değişir' },
    { kriter: 'Şeffaf Fiyatlandırma', biz: 'Sabit aylık paket, gizli ücret yok', diger: 'Proje bazlı fiyatlamada belirsizlik olabilir' },
    { kriter: 'Video Prodüksiyon', biz: 'Stüdyo + lokasyon çekim kapasitesi', diger: 'Çoğu ajans video üretimini dış kaynağa verir' },
    { kriter: 'AI Destekli İçerik', biz: 'AI araçları + insan editöryal süreç', diger: 'AI kullanımı çoğunlukla standart değil' },
    { kriter: 'KVKK Uyumlu Süreç', biz: 'Sözleşme + veri işleme taahhütü', diger: 'Küçük ajanslar KVKK süreçlerini belgelelemeyebilir' },
  ],
  avantajlar: [
    { ikon: '🎯', baslik: 'Sektöre Özel Strateji', aciklama: 'Farklı sektörlerdeki deneyimimizle her markanın dinamiklerine özel içerik ve reklam stratejisi.', renk: '#6C63FF' },
    { ikon: '⚡', baslik: 'Hızlı Başlangıç', aciklama: 'Brief, onboarding ve ilk içerik takvimini genellikle 1-2 hafta içinde tamamlıyoruz.', renk: '#eac321' },
    { ikon: '📊', baslik: 'Data-Driven Kararlar', aciklama: 'Tüm kararlar veriye dayalı. Düzenli metrik takibi, aylık strateji revizyonu.', renk: '#2ECC71' },
    { ikon: '🤝', baslik: 'Uzun Vadeli Ortaklık', aciklama: 'Müşterilerimizin büyük çoğunluğu 6 ayı aşkın süredir birlikte çalışıyor — bunu en iyi referans sayıyoruz.', renk: '#E91E63' },
    { ikon: '🔒', baslik: 'Tam Şeffaflık', aciklama: 'Şifre paylaşımı yok. İzin tabanlı erişim, geri alınabilir yetkiler, net raporlama.', renk: '#00BCD4' },
    { ikon: '🚀', baslik: 'Ölçeklenebilir Model', aciklama: 'Küçük markadan büyüyen işletmeye uyumlu paket yapısı. Büyüdükçe birlikte büyürüz.', renk: '#FF9800' },
  ],
}

export default function NedenBiz() {
  const { lang } = useLanguage()
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useSEO({
    title: lang === 'tr' ? 'Neden Kade Media? | Karşılaştırma & Avantajlar' : 'Why Kade Media? | Comparison & Advantages',
    description: lang === 'tr'
      ? 'Kade Media\'yı diğer sosyal medya ajanslarından ayıran farklar. Uzman ekip, şeffaf fiyatlandırma, aylık raporlama ve dedicated uzman.'
      : 'What sets Kade Media apart from other social media agencies. Expert team, transparent pricing, monthly reporting, and a dedicated account manager.',
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
              {lang === 'tr' ? content.heroBadge : 'The Agency That Delivers'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              {lang === 'tr' ? <>Neden <span>Kade Media?</span></> : <>Why <span>Kade Media?</span></>}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {lang === 'tr'
                ? content.heroSubtitle
                : 'Every agency says "we\'re the best." We show it. Here are the concrete differences.'}
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
                  <span className="neden-etiket">{lang === 'tr' ? r.etiket : (r.etiketEn || r.etiket)}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.1}>
            <h2 className="neden-bolum-baslik">
              <span>Kade Media</span> {lang === 'tr' ? 'vs Diğer Ajanslar' : 'vs Other Agencies'}
            </h2>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="karsilastirma-tablo glass-card">
              <div className="tablo-header">
                <div className="tablo-kriter">{lang === 'tr' ? 'Kriter' : 'Criteria'}</div>
                <div className="tablo-biz">✅ Kade Media</div>
                <div className="tablo-diger">❌ {lang === 'tr' ? 'Diğer Ajanslar' : 'Other Agencies'}</div>
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
                  <div className="tablo-kriter">{lang === 'tr' ? satir.kriter : (satir.kriterEn || satir.kriter)}</div>
                  <div className="tablo-biz">
                    <HiOutlineCheckCircle size={18} className="check-ikon" />
                    <span>{lang === 'tr' ? satir.biz : (satir.bizEn || satir.biz)}</span>
                  </div>
                  <div className="tablo-diger">
                    <HiOutlineXCircle size={18} className="x-ikon" />
                    <span>{lang === 'tr' ? satir.diger : (satir.digerEn || satir.diger)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="neden-bolum-baslik" style={{ marginTop: '3rem' }}>
              {lang === 'tr' ? <>Temel <span>Avantajlarımız</span></> : <>Our Key <span>Advantages</span></>}
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
                <h3>{lang === 'tr' ? a.baslik : (a.baslikEn || a.baslik)}</h3>
                <p>{lang === 'tr' ? a.aciklama : (a.aciklamaEn || a.aciklama)}</p>
              </motion.div>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="neden-cta glass-card">
              <h3>{lang === 'tr' ? content.ctaTitle : 'See the difference for yourself'}</h3>
              <p>{lang === 'tr' ? content.ctaSubtitle : 'Start with a free 30-minute strategy call. No commitment, no pressure.'}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">
                  {lang === 'tr' ? 'Görüşme Planla' : 'Schedule a Call'}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/referanslar" className="btn btn-outline">
                  {lang === 'tr' ? 'Referansları Gör' : 'View Testimonials'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
