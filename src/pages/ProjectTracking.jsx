import { HiOutlineClipboardCheck, HiOutlineClock } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'

export default function ProjectTracking() {
  useSEO({
    title: 'Proje Takip | Kade Media',
    description: 'Kade Media proje takip sistemi çok yakında aktif oluyor.',
    path: '/proje-takip',
    noindex: true,
  })

  return (
    <PageTransition>
      <section className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <FadeIn>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(108,99,255,0.12)', border: '1.5px solid rgba(108,99,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <HiOutlineClock size={30} color="#6C63FF" />
            </div>
            <div className="section-badge" style={{ display: 'inline-flex', marginBottom: 16 }}>
              <HiOutlineClipboardCheck size={14} /> Proje Takip
            </div>
            <h1 className="section-title" style={{ maxWidth: 560, margin: '0 auto 16px' }}>
              Çok <span>yakında</span> geliyor
            </h1>
            <p className="section-subtitle" style={{ maxWidth: 480, margin: '0 auto 40px' }}>
              Proje kodunuzla anlık aşama takibi, görev durumları ve teslim belgelerine erişim için çalışıyoruz.
            </p>
            <Link to="/iletisim" className="btn btn-primary">
              İletişime Geç
            </Link>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
