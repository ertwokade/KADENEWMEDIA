import Link from 'next/link'
import {
  ArrowRight, BarChart3, Clapperboard, FileText, ImagePlus, Sparkles, Zap,
} from 'lucide-react'
import DashboardMobileHeader from '@/components/dashboard/DashboardMobileHeader'
import WorkspaceStatus from '@/components/dashboard/WorkspaceStatus'
import { withBasePath } from '@/lib/appConfig'

/**
 * Çalışma alanı özeti.
 *
 * Sayfa daha önce bir tanıtım açılış sayfasıydı: slogan, dev "AI" objesi ve
 * altında bütün araçları kategori kategori listeleyen bir kütüphane. O
 * kütüphane sol menünün birebir kopyasıydı; aynı bağlantılar sayfada üç kez
 * geçiyordu. Gezinme sol menüde kalır, bu sayfa yalnızca çalışma alanının
 * güncel durumunu ve en sık kullanılan başlangıç noktalarını gösterir.
 */

const quickTools = [
  { label: 'Haftalık paket üret', description: 'Bir kaynaktan 7 yayın formatı', href: '/dashboard/content-studio', icon: FileText },
  { label: 'Başlık üret', description: 'Kanalına uygun güçlü açılışlar', href: '/dashboard/title', icon: Sparkles },
  { label: 'Metin oluştur', description: 'Brief’ten yayına hazır içerik', href: '/dashboard/text-generator', icon: FileText },
  { label: 'Hook geliştir', description: 'İlk saniyede dikkati yakala', href: '/dashboard/hook', icon: Zap },
  { label: 'Görsel tasarla', description: 'Thumbnail ve konsept fikirleri', href: '/dashboard/ai-thumbnail', icon: ImagePlus },
  { label: 'Performansı oku', description: 'İzleyici davranışını çözümle', href: '/dashboard/retention-analysis', icon: BarChart3 },
  { label: 'Operasyonu aç', description: 'Günlük üretim merkezine geç', href: '/dashboard/operations?view=dashboard', icon: Clapperboard },
]

export default function DashboardPage() {
  return (
    <div className="kade-home flex-1 overflow-y-auto">
      <div className="kade-home-wrap mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <DashboardMobileHeader />

        <section className="kade-workspace-head">
          <div className="kade-section-heading">
            <div>
              <span>Çalışma alanı</span>
              <h2>Genel Bakış</h2>
            </div>
          </div>
          <WorkspaceStatus />
        </section>

        <section className="kade-home-section pb-10">
          <div className="kade-section-heading">
            <div><span>Hızlı başlangıç</span><h2>Şimdi ne yapmak istersin?</h2></div>
          </div>
          <div className="kade-quick-grid">
            {quickTools.map(({ label, description, href, icon: Icon }, index) => (
              <Link key={href} href={withBasePath(href)} className="kade-quick-card">
                <span className="kade-quick-index">0{index + 1}</span>
                <span className="kade-quick-icon"><Icon className="h-5 w-5" /></span>
                <strong>{label}</strong>
                <small>{description}</small>
                <ArrowRight className="kade-quick-arrow h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
