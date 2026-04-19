import { motion } from 'framer-motion'
import {
  HiOutlineNewspaper,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Basin.css'

const haberler = [
  {
    id: 1,
    tarih: 'Mart 2025',
    kaynak: 'Dijital Pazarlama Dergisi',
    baslik: 'Türkiye\'nin Yükselen Sosyal Medya Ajansları: Kade Media\'nın Büyüme Hikayesi',
    ozet: 'Biruni Teknopark merkezli ajans, kuruluşundan bu yana 150+ müşteriye ulaştı. Kurucusuyla yapılan röportaj.',
    ikon: '📰',
    renk: '#6C63FF',
  },
  {
    id: 2,
    tarih: 'Şubat 2025',
    kaynak: 'StartupIstanbul',
    baslik: 'Teknopark\'tan Dünyaya: Kade Media\'nın Ajans Modeli',
    ozet: 'İstanbul\'daki teknoloji ekosisteminde öne çıkan ajans modellerini inceleyen köşe yazısı.',
    ikon: '🚀',
    renk: '#eac321',
  },
  {
    id: 3,
    tarih: 'Ocak 2025',
    kaynak: 'Reklamcılar Derneği',
    baslik: '2025 Yılının İzlenecek Sosyal Medya Ajansları',
    ozet: 'Yıllık raporda Türkiye genelinde öne çıkan 10 dijital ajans arasında yer aldık.',
    ikon: '🏅',
    renk: '#2ECC71',
  },
  {
    id: 4,
    tarih: 'Kasım 2024',
    kaynak: 'Forbes Türkiye',
    baslik: 'Küçük İşletmelerin Büyük Ortağı: Sosyal Medya Ajansları Nasıl Seçilir?',
    ozet: 'Dijital dönüşüm rehberinde ajans seçimi kriterleri için görüşümüz alındı.',
    ikon: '📊',
    renk: '#E91E63',
  },
]

const logoPaketleri = [
  { isim: 'Ana Logo (SVG)', format: 'SVG', aciklama: 'Vektörel, her boyuta uyumlu', ikon: '🖼️' },
  { isim: 'Logo Paketi (PNG)', format: 'PNG', aciklama: 'Beyaz arkaplan üzeri, 300dpi', ikon: '📦' },
  { isim: 'Koyu Arkaplan Logo', format: 'PNG', aciklama: 'Koyu ve şeffaf arkaplan versiyonları', ikon: '🌙' },
  { isim: 'Marka Renkleri & Tipografi', format: 'PDF', aciklama: 'Hex kodları, font aileleri, kullanım rehberi', ikon: '🎨' },
]

const sirketBilgileri = [
  { etiket: 'Şirket Adı', deger: 'Kade Media Dijital Pazarlama A.Ş.' },
  { etiket: 'Kuruluş', deger: '2022, İstanbul' },
  { etiket: 'Merkez', deger: 'Biruni Teknopark, İstanbul' },
  { etiket: 'Çalışan Sayısı', deger: '10-25 kişi' },
  { etiket: 'Müşteri Sayısı', deger: '150+' },
  { etiket: 'Hizmet Verilen Sektör', deger: '15+ sektör' },
]

export default function Basin() {
  useSEO({
    title: 'Basın & Medya Kiti | Kade Media',
    description: 'Kade Media hakkında medya içerikleri, logo paketi, şirket bilgileri ve basın haberleri. Gazeteci ve içerik üreticilerine özel basın kiti.',
    keywords: 'kade media basın kiti, sosyal medya ajansı medya, kade media logo indirme',
    path: '/basin',
  })

  return (
    <PageTransition>
      <section className="basin-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineNewspaper size={14} />
              Basın & Medya
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Basın <span>Kiti</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Kade Media hakkında haber yapmak isteyen gazeteciler ve içerik üreticileri için tüm kaynaklar burada.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="basin-grid">
            <div className="basin-sol">
              <FadeIn>
                <div className="basin-kart glass-card">
                  <h2>Şirket Bilgileri</h2>
                  <div className="basin-bilgiler">
                    {sirketBilgileri.map(b => (
                      <div key={b.etiket} className="basin-bilgi-satir">
                        <span className="bilgi-etiket">{b.etiket}</span>
                        <span className="bilgi-deger">{b.deger}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="basin-kart glass-card">
                  <h2>Basın İletişim</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Medya soruları, röportaj talepleri ve içerik iş birlikleri için:
                  </p>
                  <a href="mailto:basin@kademedia.com" className="basin-iletisim-btn btn btn-primary">
                    <HiOutlineMail size={18} />
                    basin@kademedia.com
                  </a>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: '0.8rem' }}>
                    Yanıt süresi: 24 saat içinde
                  </p>
                </div>
              </FadeIn>
            </div>

            <div className="basin-sag">
              <FadeIn delay={0.15}>
                <div className="basin-kart glass-card">
                  <h2>Logo & Marka Materyalleri</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    Kade Media logosunu kullanırken lütfen marka rehberimize uyun. Logo rengi, boyutu veya oranı değiştirilemez.
                  </p>
                  <div className="basin-logo-liste">
                    {logoPaketleri.map((logo) => (
                      <div key={logo.isim} className="basin-logo-item">
                        <span className="logo-ikon">{logo.ikon}</span>
                        <div className="logo-bilgi">
                          <span className="logo-isim">{logo.isim}</span>
                          <span className="logo-aciklama">{logo.aciklama}</span>
                        </div>
                        <span className="logo-format">{logo.format}</span>
                        <button className="btn btn-outline logo-indir-btn" title="İndir">
                          <HiOutlineDownload size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="basin-kart glass-card">
                  <h2>Hakkımızdaki Haberler</h2>
                  <StaggerContainer>
                    {haberler.map((h) => (
                      <StaggerItem key={h.id}>
                        <div className="basin-haber">
                          <div className="haber-ikon" style={{ background: `${h.renk}15`, color: h.renk }}>
                            {h.ikon}
                          </div>
                          <div className="haber-icerik">
                            <div className="haber-meta">
                              <span className="haber-kaynak">{h.kaynak}</span>
                              <span className="haber-tarih">{h.tarih}</span>
                            </div>
                            <h3 className="haber-baslik">{h.baslik}</h3>
                            <p className="haber-ozet">{h.ozet}</p>
                          </div>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </FadeIn>
            </div>
          </div>

          <FadeIn delay={0.4}>
            <div className="basin-cta glass-card">
              <h3>Röportaj veya iş birliği mi istiyorsunuz?</h3>
              <p>Sosyal medya, dijital pazarlama ve ajansçılık konularında görüş almak için bize ulaşın.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="mailto:basin@kademedia.com" className="btn btn-primary">
                  <HiOutlineMail size={16} />
                  E-posta Gönderin
                </a>
                <Link to="/iletisim" className="btn btn-outline">
                  İletişim Formu
                  <HiOutlineExternalLink size={16} />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
