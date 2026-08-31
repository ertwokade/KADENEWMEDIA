import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiOutlineBriefcase, HiOutlineSparkles } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useGatePointer } from '../hooks/useGatePointer'
import PageTransition from '../components/PageTransition'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/kade-gate.css'
import './LoginHub.css'

/* Klon rotalarına DIŞ bağlantı: `<Link>` değil `<a href>`.

   Üretimde bu adresler statik klondan servis ediliyor (bkz. scripts/
   merge-clone.mjs). `<Link>` kullanıldığında React Router sayfayı istemci
   tarafında kendi kopyasıyla çiziyordu; sonuç, aynı URL'nin nereden
   gelindiğine göre iki farklı tasarımda açılmasıydı — Google'dan gelen klonu,
   panelden tıklayan React sürümünü görüyordu. Tam sayfa yüklemesi doğru
   katmanı getirir. */

const workspaces = [
  {
    title: 'Danışmanlıklarım',
    description: 'Danışmanlık planınıza, projelerinize ve Kade New Media müşteri panelinize erişin.',
    features: ['Proje ve teslimat takibi', 'Raporlar ve danışmanlık notları', 'Organizasyon Kiti erişimi'],
    cta: 'Danışmanlık girişine git',
    to: '/giris/danismanlik',
    icon: HiOutlineBriefcase,
    external: false,
  },
  {
    title: 'Content AI',
    description: 'KadexAI içerik araçlarını açın, üretimlerinize ve çalışma alanınıza devam edin.',
    features: ['İçerik, başlık ve senaryo üretimi', 'Trend radarı ve rakip analizi', 'İçerik takvimi ve arşiv'],
    cta: 'Content AI girişine git',
    to: '/kadexai/login',
    icon: HiOutlineSparkles,
    external: true,
  },
]

export default function LoginHub() {
  const gateRef = useGatePointer()
  const navigate = useNavigate()

  useSEO({
    title: 'Çalışma Alanı Seçimi | Kade New Media',
    description: 'Danışmanlık ve Content AI çalışma alanlarından kullanmak istediğinizi seçin.',
    path: '/giris',
    noindex: true,
  })

  /**
   * İki seçenekli bir ekranda 1 / 2 tuşları fareye uzanmadan karar verdirir.
   * Bir form alanına yazarken tetiklenmemesi için hedef kontrol edilir; bu
   * sayfada alan yok ama bileşen ileride form kazanırsa da doğru davranır.
   */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      // Odakta hiçbir şey yokken hedef `document` olabilir; Element olmayan bir
      // hedefte `closest` yoktur ve kontrol sessizce patlar.
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable]')) return

      const workspace = workspaces[Number(event.key) - 1]
      if (!workspace) return

      event.preventDefault()
      if (workspace.external) window.location.assign(workspace.to)
      else navigate(workspace.to)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <PageTransition>
      <div className="kade-gate gate-hub" ref={gateRef}>
        <div className="gate-grid" aria-hidden="true" />

        <header className="gate-hud">
          <Link to="/" className="gate-hud-brand" aria-label="Kade New Media ana sayfa">
            <span>Kade</span><span>New Media</span>
          </Link>
          <nav className="gate-hud-nav" aria-label="Site">
            <a className="gate-hud-optional" href="/hizmetler">Hizmetler</a>
            <a href="/iletisim">İletişim</a>
            <ThemeToggle />
          </nav>
        </header>

        <main className="gate-shell">
          <header className="gate-head">
            <p className="gate-eyebrow">Güvenli alan</p>
            <h1>Nereye giriş yapmak istiyorsunuz?</h1>
            <p className="gate-lead">
              İki ayrı çalışma alanı var: danışmanlık süreçlerinizin yürüdüğü müşteri paneli ve
              içerik üretiminin yapıldığı Content AI. Hesaplar ayrıdır.
            </p>
            <div className="gate-rule" />
          </header>

          <div className="gate-cards">
            {workspaces.map((workspace, index) => {
              const Icon = workspace.icon
              const content = (
                <>
                  <span className="gate-card-top">
                    <span className="gate-card-index">0{index + 1}</span>
                    <span className="gate-card-icon" aria-hidden="true"><Icon size={20} /></span>
                  </span>

                  <strong className="gate-card-title">{workspace.title}</strong>
                  <span className="gate-card-desc">{workspace.description}</span>

                  <ul className="gate-card-features">
                    {workspace.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>

                  <span className="gate-card-link">
                    {workspace.cta}
                    <em aria-hidden="true">↗</em>
                    <kbd className="gate-kbd" aria-hidden="true">{index + 1}</kbd>
                  </span>
                </>
              )

              return workspace.external ? (
                <a key={workspace.title} href={workspace.to} className="gate-card">{content}</a>
              ) : (
                <Link key={workspace.title} to={workspace.to} className="gate-card">{content}</Link>
              )
            })}
          </div>

          <p className="gate-hint">
            <kbd className="gate-kbd">1</kbd> veya <kbd className="gate-kbd">2</kbd> tuşuyla da seçebilirsiniz.
          </p>

          <footer className="gate-footer">
            <dl className="gate-footer-grid">
              <div>
                <dt>Hesabınız yok mu?</dt>
                <dd><a href="/teklif-al">Teklif alın</a> — süreç başladığında erişiminiz açılır.</dd>
              </div>
              <div>
                <dt>Erişim sorunu</dt>
                <dd><a href="mailto:thekademedia@gmail.com">thekademedia@gmail.com</a></dd>
              </div>
              <div>
                <dt>Güvenlik</dt>
                <dd>Oturumlar şifreli taşınır · <a href="/gizlilik">Gizlilik</a></dd>
              </div>
            </dl>
          </footer>
        </main>
      </div>
    </PageTransition>
  )
}
