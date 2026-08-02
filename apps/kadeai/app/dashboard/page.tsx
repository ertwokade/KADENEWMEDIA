import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  FileText,
  ImagePlus,
  LayoutDashboard,
  Search,
  Settings2,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react'
import DashboardMobileHeader from '@/components/dashboard/DashboardMobileHeader'
import { TOOL_REGISTRY } from '@/lib/tools/registry'

type ToolLink = {
  label: string
  href: string
}

type ToolGroup = {
  title: string
  description: string
  icon: LucideIcon
  accent: string
  iconSurface: string
  items: ToolLink[]
}

const coreGroups: ToolGroup[] = [
  {
    title: 'Operasyon',
    description: 'İş akışını, yorumları ve prodüksiyonu tek yerden yönet.',
    icon: Activity,
    accent: 'text-cyan-400',
    iconSurface: 'bg-cyan-500/10',
    items: [
      { label: 'Operasyon Merkezi', href: '/dashboard/operations?view=dashboard' },
      { label: 'SentScan', href: '/dashboard/operations?view=comments' },
      { label: 'Prodüksiyon CRM', href: '/dashboard/operations?view=crm' },
      { label: 'Banana Studio', href: '/dashboard/operations?view=banana' },
      { label: 'Vibe Coding', href: '/dashboard/operations?view=vibe' },
      { label: 'AI Radar', href: '/dashboard/operations?view=radar' },
      { label: 'Notlar', href: '/dashboard/operations?view=pages' },
    ],
  },
  {
    title: 'İçerik Üretimi',
    description: 'Fikirden yayına kadar metin üretim akışını hızlandır.',
    icon: Wand2,
    accent: 'text-amber-400',
    iconSurface: 'bg-amber-500/10',
    items: [
      { label: 'Başlık Üretici', href: '/dashboard/title' },
      { label: 'Metin Oluşturucu', href: '/dashboard/text-generator' },
      { label: 'Video Açıklama', href: '/dashboard/description' },
      { label: 'Hook Jeneratörü', href: '/dashboard/hook' },
      { label: 'Hashtag AI', href: '/dashboard/hashtag' },
      { label: 'Thread Yazarı', href: '/dashboard/thread' },
      { label: 'Carousel İçeriği', href: '/dashboard/carousel' },
      { label: 'Kolaborasyon Maili', href: '/dashboard/collab-mail' },
      { label: 'Toplu İçerik', href: '/dashboard/bulk' },
    ],
  },
  {
    title: 'Medya',
    description: 'Görsel ve video içeriklerini yapay zekâyla destekle.',
    icon: ImagePlus,
    accent: 'text-pink-400',
    iconSurface: 'bg-pink-500/10',
    items: [
      { label: 'AI Thumbnail', href: '/dashboard/ai-thumbnail' },
      { label: 'Klip Üretici', href: '/dashboard/clip-generator' },
      { label: 'Dublaj & Çeviri · Yakında', href: '/dashboard/dubbing' },
    ],
  },
  {
    title: 'Analiz',
    description: 'İçeriğin performansını ölç, karşılaştır ve iyileştir.',
    icon: BarChart3,
    accent: 'text-blue-400',
    iconSurface: 'bg-blue-500/10',
    items: [
      { label: 'Viral Skor', href: '/dashboard/viral-score' },
      { label: 'A/B Başlık Testi', href: '/dashboard/ab-test' },
      { label: 'Clickbait Dedektör', href: '/dashboard/clickbait-detector' },
      { label: 'YouTube SEO', href: '/dashboard/youtube-seo' },
      { label: 'İzlenme Analizi', href: '/dashboard/retention-analysis' },
      { label: 'Sosyal Medya Analizi', href: '/dashboard/social-audit' },
      { label: 'Trend Bulucu', href: '/dashboard/trends' },
      { label: 'Rakip Analizi', href: '/dashboard/competitor' },
      { label: 'Yorum Analizi', href: '/dashboard/comment-analysis' },
      { label: 'Performans Tahmini', href: '/dashboard/performance' },
      { label: 'Analitik', href: '/dashboard/analytics' },
      { label: 'FAQ Üretici', href: '/dashboard/faq' },
      { label: 'Alıntı Çıkarıcı', href: '/dashboard/quote-extractor' },
    ],
  },
  {
    title: 'Planlama',
    description: 'İçerik fikirlerini takvime ve uygulanabilir plana dönüştür.',
    icon: CalendarDays,
    accent: 'text-emerald-400',
    iconSurface: 'bg-emerald-500/10',
    items: [
      { label: 'İçerik Fikirleri', href: '/dashboard/ideas' },
      { label: '30 Günlük Plan', href: '/dashboard/content-plan' },
      { label: 'Bağlantı Bio', href: '/dashboard/bio-link' },
      { label: 'İçerik Takvimi', href: '/dashboard/calendar' },
      { label: 'Şablon Kütüphanesi', href: '/dashboard/templates' },
      { label: 'Geçmiş', href: '/dashboard/history' },
    ],
  },
]

const quickTools = [
  { label: 'Başlık Üretici', description: 'Tıklanabilir başlıklar üret', href: '/dashboard/title', icon: Sparkles, color: 'text-amber-400', surface: 'bg-amber-500/10' },
  { label: 'Metin Oluşturucu', description: 'Her formata uygun metin yaz', href: '/dashboard/text-generator', icon: FileText, color: 'text-yellow-400', surface: 'bg-yellow-500/10' },
  { label: 'Hook Jeneratörü', description: 'İlk saniyede dikkat çek', href: '/dashboard/hook', icon: Zap, color: 'text-red-400', surface: 'bg-red-500/10' },
  { label: 'AI Thumbnail', description: 'Güçlü görsel fikirleri oluştur', href: '/dashboard/ai-thumbnail', icon: ImagePlus, color: 'text-pink-400', surface: 'bg-pink-500/10' },
  { label: 'İzlenme Analizi', description: 'İzleyici kaybını analiz et', href: '/dashboard/retention-analysis', icon: BarChart3, color: 'text-blue-400', surface: 'bg-blue-500/10' },
  { label: 'Operasyon Merkezi', description: 'Günlük iş akışını yönet', href: '/dashboard/operations?view=dashboard', icon: Clapperboard, color: 'text-cyan-400', surface: 'bg-cyan-500/10' },
]

export default function DashboardPage() {
  const groups = coreGroups
  const libraryCategories = new Set(['operations', 'production', 'media', 'analysis', 'planning'])
  const totalTools = TOOL_REGISTRY.filter((tool) => tool.enabled && libraryCategories.has(tool.category)).length

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-[1520px] space-y-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <DashboardMobileHeader />
        <section className="kade-dashboard-hero relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-7 shadow-2xl shadow-black/20 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#f2c322]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-[28%] h-28 w-28 rounded-full bg-[#f2c322]/10 blur-2xl" />

          <div className="relative grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#d9d7ce]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#f2c322]" />
                Kişisel çalışma alanı
              </div>
              <h1 className="max-w-2xl text-3xl font-black tracking-[-0.04em] text-[#fffdf5] sm:text-4xl lg:text-5xl">
                Bugün ne üretmek istersin?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aaa79c] sm:text-base">
                İçerik üret, performansı analiz et ve operasyonunu tek çalışma alanından yönet.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard/title" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f2c322] px-5 text-sm font-bold text-[#11110f] transition hover:-translate-y-0.5 hover:bg-[#ffda3f]">
                  <Sparkles className="h-4 w-4" />
                  Başlık üret
                </Link>
                <Link href="/dashboard/text-generator" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-sm font-bold text-[#fffdf5] transition hover:-translate-y-0.5 hover:bg-white/10">
                  <FileText className="h-4 w-4" />
                  Metin oluştur
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { label: 'Aktif araç', value: totalTools },
                { label: 'Kategori', value: groups.length },
                { label: 'Model', value: 'Otomatik' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur sm:p-4">
                  <div className="text-xl font-black text-[#fffdf5] sm:text-2xl">{item.value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8e8b82] sm:text-[11px]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7400]">Hızlı başlangıç</p>
              <h2 className="mt-1.5 text-xl font-black tracking-[-0.02em] text-zinc-100 sm:text-2xl">Sık kullanılan araçlar</h2>
            </div>
            <Search className="hidden h-5 w-5 text-[#9a978d] sm:block" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {quickTools.map(({ label, description, href, icon: Icon, color, surface }) => (
              <Link key={href} href={href} className="group flex min-h-40 flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/80">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${surface}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="mt-auto pt-5">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold text-zinc-100">
                    <span>{label}</span>
                    <ArrowRight className="h-4 w-4 text-[#aaa79c] transition group-hover:translate-x-1 group-hover:text-[#11110f]" />
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7400]">Araç kütüphanesi</p>
              <h2 className="mt-1.5 text-xl font-black tracking-[-0.02em] text-zinc-100 sm:text-2xl">İhtiyacına göre ilerle</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-400">
              <LayoutDashboard className="h-3.5 w-3.5" />
              {groups.length} kategori · {totalTools} araç
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {groups.map(({ title, description, icon: Icon, accent, iconSurface, items }) => (
              <article key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconSurface}`}>
                      <Icon className={`h-5 w-5 ${accent}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-100">{title}</h3>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{description}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-bold text-zinc-500">{items.length}</span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <Link key={item.href} href={item.href} className="group flex min-h-11 items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-[#f2c322]/40 hover:text-zinc-100">
                      <span>{item.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#aaa79c] transition group-hover:translate-x-0.5 group-hover:text-[#11110f]" />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#f2c322]/20 bg-[#f2c322]/10 px-4 py-3 text-sm text-amber-200">
            <Settings2 className="h-4 w-4 shrink-0" />
            <p>Aradığın aracı bulamıyorsan sol menüdeki arama alanını kullanabilirsin.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
