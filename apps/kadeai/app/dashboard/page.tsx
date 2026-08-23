import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity, ArrowRight, BarChart3, CalendarDays,
  Clapperboard, FileText, ImagePlus, Search, Sparkles, Wand2, Zap,
} from 'lucide-react'
import DashboardMobileHeader from '@/components/dashboard/DashboardMobileHeader'
import { TOOL_REGISTRY } from '@/lib/tools/registry'

type ToolLink = { label: string; href: string }
type ToolGroup = {
  title: string
  eyebrow: string
  description: string
  icon: LucideIcon
  tone: string
  items: ToolLink[]
}

const groups: ToolGroup[] = [
  {
    title: 'Operasyon', eyebrow: 'Yönet', icon: Activity, tone: 'cyan',
    description: 'Ekibi, geri bildirimleri ve üretim akışını tek ritimde tut.',
    items: [
      { label: 'Operasyon Merkezi', href: '/dashboard/operations?view=dashboard' },
      { label: 'SentScan', href: '/dashboard/operations?view=comments' },
      { label: 'Prodüksiyon CRM', href: '/dashboard/operations?view=crm' },
      { label: 'Banana Studio', href: '/dashboard/operations?view=banana' },
      { label: 'Vibe Coding', href: '/dashboard/operations?view=vibe' },
      { label: 'AI Radar', href: '/dashboard/operations?view=radar' },
    ],
  },
  {
    title: 'İçerik üretimi', eyebrow: 'Üret', icon: Wand2, tone: 'violet',
    description: 'Fikirden yayına, platforma uygun metinleri hızla hazırla.',
    items: [
      { label: 'Başlık Üretici', href: '/dashboard/title' },
      { label: 'Metin Oluşturucu', href: '/dashboard/text-generator' },
      { label: 'Video Açıklama', href: '/dashboard/description' },
      { label: 'Hook Jeneratörü', href: '/dashboard/hook' },
      { label: 'Hashtag AI', href: '/dashboard/hashtag' },
      { label: 'Carousel İçeriği', href: '/dashboard/carousel' },
    ],
  },
  {
    title: 'Medya stüdyosu', eyebrow: 'Görselleştir', icon: ImagePlus, tone: 'coral',
    description: 'Görsel ve video fikirlerini üretime hazır konseptlere dönüştür.',
    items: [
      { label: 'AI Thumbnail', href: '/dashboard/ai-thumbnail' },
      { label: 'Klip Üretici', href: '/dashboard/clip-generator' },
      { label: 'Dublaj & Çeviri · Yakında', href: '/dashboard/dubbing' },
    ],
  },
  {
    title: 'Analiz', eyebrow: 'Ölç', icon: BarChart3, tone: 'blue',
    description: 'İçeriğin performansını, rekabeti ve izleyici sinyallerini oku.',
    items: [
      { label: 'Viral Skor', href: '/dashboard/viral-score' },
      { label: 'A/B Başlık Testi', href: '/dashboard/ab-test' },
      { label: 'YouTube SEO', href: '/dashboard/youtube-seo' },
      { label: 'İzlenme Analizi', href: '/dashboard/retention-analysis' },
      { label: 'Sosyal Medya Analizi', href: '/dashboard/social-audit' },
      { label: 'Rakip Analizi', href: '/dashboard/competitor' },
    ],
  },
  {
    title: 'Planlama', eyebrow: 'Planla', icon: CalendarDays, tone: 'lime',
    description: 'Fikirleri takvime, takvimi uygulanabilir bir yayın planına çevir.',
    items: [
      { label: 'İçerik Fikirleri', href: '/dashboard/ideas' },
      { label: '30 Günlük Plan', href: '/dashboard/content-plan' },
      { label: 'İçerik Takvimi', href: '/dashboard/calendar' },
      { label: 'Şablon Kütüphanesi', href: '/dashboard/templates' },
      { label: 'Geçmiş', href: '/dashboard/history' },
    ],
  },
]

const quickTools = [
  { label: 'Başlık üret', description: 'Kanalına uygun güçlü açılışlar', href: '/dashboard/title', icon: Sparkles, tone: 'violet' },
  { label: 'Metin oluştur', description: 'Brief’ten yayına hazır içerik', href: '/dashboard/text-generator', icon: FileText, tone: 'blue' },
  { label: 'Hook geliştir', description: 'İlk saniyede dikkati yakala', href: '/dashboard/hook', icon: Zap, tone: 'coral' },
  { label: 'Görsel tasarla', description: 'Thumbnail ve konsept fikirleri', href: '/dashboard/ai-thumbnail', icon: ImagePlus, tone: 'lime' },
  { label: 'Performansı oku', description: 'İzleyici davranışını çözümle', href: '/dashboard/retention-analysis', icon: BarChart3, tone: 'cyan' },
  { label: 'Operasyonu aç', description: 'Günlük üretim merkezine geç', href: '/dashboard/operations?view=dashboard', icon: Clapperboard, tone: 'violet' },
]

export default function DashboardPage() {
  const libraryCategories = new Set(['operations', 'production', 'media', 'analysis', 'planning'])
  const totalTools = TOOL_REGISTRY.filter((tool) => tool.enabled && libraryCategories.has(tool.category)).length

  return (
    <div className="kade-home flex-1 overflow-y-auto">
      <div className="kade-home-wrap mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <DashboardMobileHeader />

        <section className="kade-home-hero">
          <div className="kade-home-hero-copy">
            <div className="kade-home-pill"><span /> KADE NEW MEDIA / AI SYSTEM</div>
            <h1>FİKRİ<br />ÜRET.<br /><em>ETKİYE DÖNÜŞTÜR.</em></h1>
            <p>İçerik üretimi, performans analizi ve ajans operasyonu; aynı sistemde, aynı ritimde.</p>
            <div className="kade-home-actions">
              <Link href="/dashboard/title" className="kade-home-primary"><Sparkles className="h-4 w-4" /> İÇERİK BAŞLAT</Link>
              <Link href="/dashboard/operations?view=dashboard" className="kade-home-secondary">OPERASYONU AÇ <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="kade-home-art" aria-hidden="true">
            <div className="kade-home-orbit kade-home-orbit-a" />
            <div className="kade-home-orbit kade-home-orbit-b" />
            <div className="kade-home-orbit kade-home-orbit-c" />
            <span className="kade-home-art-word">AI</span>
            <span className="kade-home-pointer">↗</span>
          </div>
          <span className="kade-cross kade-cross-one" aria-hidden="true">+</span>
          <span className="kade-cross kade-cross-two" aria-hidden="true">+</span>
        </section>

        <section className="kade-home-section">
          <div className="kade-section-heading">
            <div><span>Hızlı başlangıç</span><h2>Şimdi ne yapmak istersin?</h2></div>
            <Link href="#tool-library">Tüm araçları gör <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="kade-quick-grid">
            {quickTools.map(({ label, description, href, icon: Icon, tone }, index) => (
              <Link key={href} href={href} className={`kade-quick-card kade-tone-${tone}`}>
                <span className="kade-quick-index">0{index + 1}</span>
                <span className="kade-quick-icon"><Icon className="h-5 w-5" /></span>
                <strong>{label}</strong>
                <small>{description}</small>
                <ArrowRight className="kade-quick-arrow h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>

        <section id="tool-library" className="kade-home-section pb-10">
          <div className="kade-section-heading">
            <div><span>Araç kütüphanesi</span><h2>İş akışına göre keşfet</h2></div>
            <div className="kade-library-count"><Search className="h-3.5 w-3.5" /> {groups.length} alan · {totalTools} araç</div>
          </div>
          <div className="kade-library-grid">
            {groups.map(({ title, eyebrow, description, icon: Icon, tone, items }) => (
              <article key={title} className={`kade-library-card kade-tone-${tone}`}>
                <div className="kade-library-card-head">
                  <span className="kade-library-icon"><Icon className="h-5 w-5" /></span>
                  <span className="kade-library-eyebrow">{eyebrow}</span>
                  <span className="kade-library-number">{String(items.length).padStart(2, '0')}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="kade-library-links">
                  {items.map((item) => (
                    <Link key={item.href} href={item.href}><span>{item.label}</span><ArrowRight className="h-3.5 w-3.5" /></Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
