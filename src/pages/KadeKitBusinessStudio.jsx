import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineAnnotation,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineCode,
  HiOutlineDatabase,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useCustomer } from '../contexts/CustomerContext'
import OrganizationKitNav from '../components/OrganizationKitNav'
import PageTransition from '../components/PageTransition'
import './OrganizationKit.css'

const businessModules = [
  {
    title: 'SentScan Yorum Analizi',
    label: 'Dinleme',
    icon: HiOutlineAnnotation,
    description: 'Yorumları, DM sinyallerini ve müşteri itirazlarını duygu, tema ve aksiyon başlıklarına ayırın.',
    chips: ['Duygu kırılımı', 'İtiraz listesi', 'Yanıt önerileri'],
  },
  {
    title: 'Prodüksiyon CRM',
    label: 'Operasyon',
    icon: HiOutlineClipboardList,
    description: 'Çekim, revizyon, onay ve teslim adımlarını tek üretim hattında takip edin.',
    chips: ['İçerik akışı', 'Onay durumu', 'Teslim takvimi'],
  },
  {
    title: 'Banana Studio',
    label: 'Görsel',
    icon: HiOutlinePhotograph,
    description: 'Kampanya görselleri, kreatif varyasyonlar ve sosyal medya taslakları için üretim alanı.',
    chips: ['Kreatif brief', 'Görsel setleri', 'Varyasyonlar'],
  },
  {
    title: 'Video & Reels Akışı',
    label: 'Kurgu',
    icon: HiOutlineVideoCamera,
    description: 'Reels fikirleri, sahne planları, hook önerileri ve kurgu notlarını düzenleyin.',
    chips: ['Hook bankası', 'Sahne planı', 'Kurgu notu'],
  },
  {
    title: 'Vibe Coding',
    label: 'Web',
    icon: HiOutlineCode,
    description: 'Landing page, form, otomasyon ve küçük araç fikirlerini net teknik brief haline getirin.',
    chips: ['Prompt brief', 'Akış taslağı', 'Test listesi'],
  },
  {
    title: 'AI Radar',
    label: 'Kaynak',
    icon: HiOutlineDatabase,
    description: 'Yeni araçları, kaynakları ve uygulanabilir AI iş akışlarını markanız için filtreleyin.',
    chips: ['Araç takibi', 'Kaynak havuzu', 'Uygulama notu'],
  },
]

const pipelineSteps = [
  'Haftalık yorum ve içerik sinyalleri toplanır.',
  'Üretilecek içerikler CRM hattına alınır.',
  'AI destekli kreatif ve metin taslakları hazırlanır.',
  'Onaylanan işler teslim ve rapor akışına bağlanır.',
]

const metrics = [
  { value: '6', label: 'aktif modül' },
  { value: '24/7', label: 'AI çalışma alanı' },
  { value: '1', label: 'tek üretim paneli' },
]

export default function KadeKitBusinessStudio() {
  const { entitlements } = useCustomer()

  useSEO({
    title: 'Kade Kit Business Studio | Kade New Media',
    description: 'Kade Kit Business üretim merkezi: yorum analizi, prodüksiyon CRM, Banana Studio, Vibe Coding ve AI Radar.',
    path: '/kade-kit-business',
    noindex: true,
  })

  return (
    <PageTransition>
      <div className="ok-page kk-page">
        <div className="container ok-layout kk-layout">
          <OrganizationKitNav />

          <main className="ok-main kk-main">
            <section className="kk-header">
              <div>
                <span className="ok-eyebrow">Kade Kit Business</span>
                <h1>AI Üretim Merkezi</h1>
                <p>Yorum analizi, prodüksiyon CRM, kreatif üretim ve AI kaynak radarını KadeMedia temasında tek çalışma alanında kullanın.</p>
              </div>
              {entitlements?.hasOrganizationKitAccess ? (
                <Link to="/organizasyon-kiti" className="kk-secure-badge">
                  Danışmanlık paneli
                  <HiOutlineArrowRight size={16} />
                </Link>
              ) : (
                <span className="kk-secure-badge">Güvenli erişim aktif</span>
              )}
            </section>

            <section className="kk-metric-row" aria-label="Kade Kit Business özet">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </section>

            <section className="kk-command-panel">
              <div className="kk-command-copy">
                <span className="ok-eyebrow">Bugünkü Akış</span>
                <h2>İçgörüden üretime giden kısa yol</h2>
                <p>Bu panel, eski kit dosyasının içeriğini ana sitenin premium panel diliyle yeniden toplar. Her modül danışmanlık kararlarından üretim görevlerine bağlanır.</p>
              </div>
              <div className="kk-pipeline">
                {pipelineSteps.map((step, index) => (
                  <div key={step} className="kk-pipeline-step">
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="kk-tool-grid" aria-label="Kade Kit Business modülleri">
              {businessModules.map((module, index) => {
                const Icon = module.icon
                return (
                  <motion.article
                    key={module.title}
                    className="kk-tool-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.04 }}
                  >
                    <div className="kk-tool-head">
                      <div className="kk-tool-icon">
                        <Icon size={22} />
                      </div>
                      <span>{module.label}</span>
                    </div>
                    <h2>{module.title}</h2>
                    <p>{module.description}</p>
                    <div className="kk-chip-row">
                      {module.chips.map((chip) => (
                        <span key={chip}>
                          <HiOutlineCheckCircle size={14} />
                          {chip}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                )
              })}
            </section>

            <section className="kk-notes-panel">
              <div>
                <HiOutlineDocumentText size={22} />
                <div>
                  <h2>Panel Notları</h2>
                  <p>Danışmanlık tarafındaki yol haritası ile üretim tarafındaki modüller aynı müşteri oturumunda çalışır.</p>
                </div>
              </div>
              <Link to="/musteri-panel" className="ok-secondary-btn">
                Müşteri paneline dön
              </Link>
            </section>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}
