import { HiOutlineClipboardCheck } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import '../styles/kade-gate.css'
import '../styles/kade-surface.css'
import './ProjectTracking.css'

/**
 * /proje-takip — müşteri paneline yönlendiren kapı sayfası.
 *
 * Önceki sürüm satır içi stillerle yazılmıştı ve ikon dairesi `#6C63FF`
 * (mor) kullanıyordu; markanın hiçbir yerinde olmayan bir renkti. Sayfa artık
 * giriş ekranlarıyla aynı dili konuşuyor: ortak tokenlar, keskin köşe,
 * noktalı eyebrow, hairline ızgara. Yanındaki `ProjectTracking.css` hiçbir
 * yerden import edilmiyordu (282 satır ölü kod) ve silindi.
 */
export default function ProjectTracking() {
  useSEO({
    title: 'Proje Takip | Kade New Media',
    description: 'Kade New Media müşteri proje ve teslimat özeti.',
    path: '/proje-takip',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="kade-surface pt-page">
        <div className="gate-grid" aria-hidden="true" />
        <div className="surface-shell pt-shell">
          <FadeIn>
            <span className="pt-mark" aria-hidden="true">
              <HiOutlineClipboardCheck size={22} />
            </span>
            <p className="gate-eyebrow">Proje takip</p>
            <h1>Proje bilgilerinize güvenli erişim</h1>
            <p className="gate-lead">
              Aktif hizmetleriniz, proje kapsamınız ve teslimat kayıtlarınız müşteri panelinde yer alır.
            </p>
            <Link to="/musteri-panel" className="gate-btn pt-cta">
              Müşteri panelini aç
              <em aria-hidden="true">↗</em>
            </Link>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
