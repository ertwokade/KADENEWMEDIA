import { useSEO } from '../hooks/useSEO'
import OrganizationKitNav from '../components/OrganizationKitNav'
import PageTransition from '../components/PageTransition'
import kitHtml from '../embedded/kadir-organizasyon-kiti/index.html?raw'
import kitCss from '../embedded/kadir-organizasyon-kiti/styles.css?raw'
import kitJs from '../embedded/kadir-organizasyon-kiti/app.js?raw'
import './OrganizationKit.css'

const lucideFallback = `<script>
  window.lucide = window.lucide || {
    createIcons() {
      document.querySelectorAll('[data-lucide]').forEach((icon) => {
        if (icon.dataset.iconReady) return;
        icon.dataset.iconReady = '1';
        icon.innerHTML = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>';
      });
    }
  };
</script>`

const kitDocument = kitHtml
  .replace('<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js" defer></script>', lucideFallback)
  .replace('<link rel="stylesheet" href="styles.css"/>', `<style>${kitCss}</style>`)
  .replace('<script src="app.js" defer></script>', `<script>${kitJs.replace(/<\/script/gi, '<\\/script')}</script>`)

export default function KadeKitBusinessStudio() {
  useSEO({
    title: 'Kade Kit Business Studio | Kade Media',
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
                <p>Yorum analizi, prodüksiyon CRM, Banana Studio, Vibe Coding rehberi ve AI kaynak radarını tek çalışma alanında kullanın.</p>
              </div>
              <span className="kk-secure-badge">Güvenli erişim aktif</span>
            </section>

            <section className="kk-frame-wrap" aria-label="Kade Kit Business Studio">
              <iframe
                title="Kade Kit Business Studio"
                srcDoc={kitDocument}
                className="kk-frame"
                loading="lazy"
                sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-same-origin"
              />
            </section>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}
