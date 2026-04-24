import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineStar,
  HiOutlineThumbUp,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi'
import { FaInstagram, FaLinkedinIn, FaGoogle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Referanslar.css'

const yorumlar = [
  {
    id: 1,
    isim: 'Elif Karahan',
    unvan: 'Kurucu & CEO',
    sirket: 'Bloom Studio',
    sektor: 'Güzellik & Estetik',
    sektorEn: 'Beauty & Aesthetics',
    platform: 'google',
    puan: 5,
    yorum: 'Kade Media ile çalışmaya başladıktan sonra Instagram takipçi kitlemiz ciddi biçimde büyüdü. İçerik kalitesi marka kimliğimizi gerçekten yansıtıyor. En beğendiğim şey onay sürecinin çok pürüzsüz ilerlemesi.',
    tarih: 'Ocak 2025',
    avatarRenk: '#E91E63',
  },
  {
    id: 2,
    isim: 'Mert Doğan',
    unvan: 'İşletme Sahibi',
    sirket: 'Orijin Burger',
    sektor: 'Restoran & Yiyecek',
    sektorEn: 'Restaurant & Food',
    platform: 'instagram',
    puan: 5,
    yorum: 'Açılışımızı Kade Media ile yaptık. Kampanya sürecinde her adım profesyonelce yönetildi, reklam bütçemizi çok verimli kullandılar. İlk ayda satış hedeflerimizin üzerine çıktık.',
    tarih: 'Şubat 2025',
    avatarRenk: '#FF9800',
  },
  {
    id: 3,
    isim: 'Dr. Selin Aydın',
    unvan: 'Klinik Direktörü',
    sirket: 'Novita Klinik',
    sektor: 'Sağlık & Estetik',
    sektorEn: 'Health & Aesthetics',
    platform: 'google',
    puan: 5,
    yorum: 'Klinik hesabımızın yönetimini Kade\'ye devrettikten sonra organik randevu taleplerinde ciddi artış yaşadık. Medikal sektörün hassasiyetini anlayan, etik sınırlara dikkat eden bir ekiple çalışmak büyük rahatlama.',
    tarih: 'Aralık 2024',
    avatarRenk: '#00BCD4',
  },
  {
    id: 4,
    isim: 'Alp Yıldırım',
    unvan: 'Pazarlama Müdürü',
    sirket: 'Vertex Teknoloji',
    sektor: 'Teknoloji & SaaS',
    sektorEn: 'Technology & SaaS',
    platform: 'linkedin',
    puan: 5,
    yorum: 'B2B LinkedIn stratejisi konusunda gerçekten uzmanlar. Içerik takvimi, engagement stratejisi ve paid kampanyalar için ayrı ayrı önerileri çok değerliydi. ROI açısından en verimli pazarlama yatırımımız oldu.',
    tarih: 'Ocak 2025',
    avatarRenk: '#6C63FF',
  },
  {
    id: 5,
    isim: 'Neslihan Çelik',
    unvan: 'Kurucu',
    sirket: 'NesCraft Atölye',
    sektor: 'El Sanatları & E-ticaret',
    sektorEn: 'Crafts & E-commerce',
    platform: 'instagram',
    puan: 5,
    yorum: 'Küçük bir el sanatları markasıyken Kade ile büyüdük. Reels içerikleri çok tuttu, birden fazla videomuz organik olarak geniş kitlelere ulaştı. Ücretli reklama geçmeden önce organik kanalı güçlendirmeleri çok değerliydi.',
    tarih: 'Kasım 2024',
    avatarRenk: '#2ECC71',
  },
  {
    id: 6,
    isim: 'Kerem Polat',
    unvan: 'Genel Müdür',
    sirket: 'Polat Gayrimenkul',
    sektor: 'Gayrimenkul',
    sektorEn: 'Real Estate',
    platform: 'google',
    puan: 5,
    yorum: 'Gayrimenkul sektöründe sosyal medya yönetimi yapabilen bir ajans bulmak zordu. Kade ekibi hem içerik hem reklam konusunda sektörü anlıyor. Son 6 ayda 12 lead aldık, 4\'ü müşteriye dönüştü.',
    tarih: 'Mart 2025',
    avatarRenk: '#607D8B',
  },
  {
    id: 7,
    isim: 'Zeynep Arslan',
    unvan: 'Marka Müdürü',
    sirket: 'Auris Moda',
    sektor: 'Moda & Tekstil',
    sektorEn: 'Fashion & Apparel',
    platform: 'instagram',
    puan: 5,
    yorum: 'Influencer koordinasyonunu da üstlenmeleri çok işimize yaradı. Hem micro hem macro influencer çalışmalarında anlaşmaları yönetip sonuçları raporladılar. Şeffaf ve güvenilir bir ekip.',
    tarih: 'Şubat 2025',
    avatarRenk: '#9C27B0',
  },
  {
    id: 8,
    isim: 'Onur Kaya',
    unvan: 'CEO',
    sirket: 'FitLife Akademi',
    sektor: 'Fitness & Eğitim',
    sektorEn: 'Fitness & Education',
    platform: 'google',
    puan: 5,
    yorum: 'Online eğitim platformumuzu büyütmek için Kade ile çalıştık. YouTube ve Instagram stratejileri sayesinde abone kitlemiz birkaç ay içinde kayda değer biçimde büyüdü. Video prodüksiyonlarının kalitesi de beklentimizin üzerindeydi.',
    tarih: 'Ocak 2025',
    avatarRenk: '#eac321',
  },
]

const istatistikler = [
  { rakam: '20+', etiket: 'Çalıştığımız Marka', etiketEn: 'Brands Worked With', ikon: '🤝' },
  { rakam: '4.8/5', etiket: 'Ortalama Puan', etiketEn: 'Average Rating', ikon: '⭐' },
  { rakam: '%87', etiket: 'Müşteri Tutma Oranı', etiketEn: 'Client Retention Rate', ikon: '🔄' },
  { rakam: '3+ Yıl', etiket: 'Sektör Deneyimi', etiketEn: 'Industry Experience', ikon: '🏆' },
]

const platformIkon = { google: FaGoogle, instagram: FaInstagram, linkedin: FaLinkedinIn }
const platformRenk = { google: '#EA4335', instagram: '#E91E63', linkedin: '#0077B5' }

function YildizPuan({ puan }) {
  return (
    <div className="yildiz-puan">
      {Array.from({ length: 5 }).map((_, i) => (
        <HiOutlineStar key={i} size={16} style={{ color: i < puan ? '#eac321' : '#333', fill: i < puan ? '#eac321' : 'none' }} />
      ))}
    </div>
  )
}

export default function Referanslar() {
  const { lang } = useLanguage()
  const [aktifSayfa, setAktifSayfa] = useState(0)
  const [aktifSektor, setAktifSektor] = useState('hepsi')
  const yorumBasina = 6

  useSEO({
    title: lang === 'tr' ? 'Müşteri Referansları & Yorumları | Kade Media' : 'Client Testimonials & Reviews | Kade Media',
    description: lang === 'tr'
      ? 'Kade Media müşterilerinin gerçek deneyimleri. Sosyal medya ajansı hakkında ne düşünüyorlar?'
      : 'Real experiences from Kade Media clients. What do they say about our social media agency?',
    keywords: 'kade media müşteri yorumları, sosyal medya ajansı referanslar, dijital pazarlama müşteri yorumları',
    path: '/referanslar',
  })

  const sektorKey = lang === 'tr' ? 'sektor' : 'sektorEn'
  const sektorler = ['hepsi', ...new Set(yorumlar.map(y => y[sektorKey]))]

  const filtreliYorumlar = aktifSektor === 'hepsi'
    ? yorumlar
    : yorumlar.filter(y => y[sektorKey] === aktifSektor)

  const sayfaSayisi = Math.ceil(filtreliYorumlar.length / yorumBasina)
  const gosterilen = filtreliYorumlar.slice(aktifSayfa * yorumBasina, (aktifSayfa + 1) * yorumBasina)

  return (
    <PageTransition>
      <section className="referanslar-hero">
        <PageBgAnimation type="about" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineThumbUp size={14} />
              {lang === 'tr' ? 'Müşteri Referansları' : 'Client Testimonials'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              {lang === 'tr' ? <>Müşterilerimiz <span>ne diyor?</span></> : <>What Our <span>Clients Say?</span></>}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {lang === 'tr'
                ? 'Müşterilerimizin gerçek deneyimleri. Hepsi doğrulanmış, hiçbiri yazılmış değil.'
                : "Real experiences from our clients. All verified, none scripted."}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="referanslar-istatistikler">
            {istatistikler.map((ist) => (
              <StaggerItem key={ist.etiket}>
                <div className="referanslar-istatistik glass-card">
                  <span className="ist-ikon">{ist.ikon}</span>
                  <span className="ist-rakam">{ist.rakam}</span>
                  <span className="ist-etiket">{lang === 'tr' ? ist.etiket : ist.etiketEn}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.2}>
            <div className="referanslar-filtreler">
              {sektorler.map(s => (
                <button
                  key={s}
                  className={`referanslar-filtre-btn ${aktifSektor === s ? 'active' : ''}`}
                  onClick={() => { setAktifSektor(s); setAktifSayfa(0) }}
                >
                  {s === 'hepsi' ? (lang === 'tr' ? 'Tüm Sektörler' : 'All Industries') : s}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="referanslar-grid">
            {gosterilen.map((yorum, i) => {
              const Platform = platformIkon[yorum.platform] || FaGoogle
              return (
                <motion.div
                  key={yorum.id}
                  className="referans-kart glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="referans-kart-ust">
                    <YildizPuan puan={yorum.puan} />
                    <Platform size={16} style={{ color: platformRenk[yorum.platform] }} />
                  </div>
                  <p className="referans-yorum">"{yorum.yorum}"</p>
                  <div className="referans-kisi">
                    <div
                      className="referans-avatar"
                      style={{ background: `${yorum.avatarRenk}20`, color: yorum.avatarRenk }}
                    >
                      {yorum.isim.charAt(0)}
                    </div>
                    <div>
                      <div className="referans-isim">{yorum.isim}</div>
                      <div className="referans-unvan">{yorum.unvan}, {yorum.sirket}</div>
                      <div className="referans-sektor">{lang === 'tr' ? yorum.sektor : yorum.sektorEn} · {yorum.tarih}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {sayfaSayisi > 1 && (
            <FadeIn delay={0.3}>
              <div className="referanslar-sayfalama">
                <button
                  className="sayfalama-btn"
                  onClick={() => setAktifSayfa(p => Math.max(0, p - 1))}
                  disabled={aktifSayfa === 0}
                >
                  <HiOutlineChevronLeft size={18} />
                </button>
                {Array.from({ length: sayfaSayisi }).map((_, i) => (
                  <button
                    key={i}
                    className={`sayfalama-btn ${aktifSayfa === i ? 'active' : ''}`}
                    onClick={() => setAktifSayfa(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="sayfalama-btn"
                  onClick={() => setAktifSayfa(p => Math.min(sayfaSayisi - 1, p + 1))}
                  disabled={aktifSayfa === sayfaSayisi - 1}
                >
                  <HiOutlineChevronRight size={18} />
                </button>
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.4}>
            <div className="referanslar-cta glass-card">
              <h3>{lang === 'tr' ? 'Siz de bu listeye katılmak ister misiniz?' : 'Want to join this list?'}</h3>
              <p>{lang === 'tr'
                ? 'Büyüme hedeflerinizi konuşmak için 30 dakikalık ücretsiz strateji görüşmesi planlayalım.'
                : "Let's schedule a free 30-minute strategy call to talk about your growth goals."}</p>
              <Link to="/iletisim" className="btn btn-primary">{lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Get Free Consultation'}</Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
