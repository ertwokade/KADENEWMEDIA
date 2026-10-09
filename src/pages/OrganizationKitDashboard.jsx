import { Link } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineSparkles } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import kitHtml from '../embedded/kadir-organizasyon-kiti/index.html?raw'
import kitCss from '../embedded/kadir-organizasyon-kiti/styles.css?raw'
import kitJs from '../embedded/kadir-organizasyon-kiti/app.js?raw'
import './OrganizationKit.css'
import '../styles/kade-gate.css'
import '../styles/kade-surface.css'

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

const kadeThemeOverride = `
  <style>
    :root {
      --bg: #08090d;
      --bg2: #0d0f14;
      --surface: rgba(255,255,255,0.035);
      --surface-hover: rgba(255,255,255,0.065);
      --border: rgba(255,255,255,0.09);
      --border-hover: rgba(224,168,31,0.28);
      --ink: #fbfaf4;
      --ink2: rgba(251,250,244,0.72);
      --ink3: #747474;
      --teal: #e0a81f;
      --teal-dim: rgba(224,168,31,0.12);
      --teal-glow: rgba(224,168,31,0.26);
      --indigo: #fbfaf4;
      --indigo-dim: rgba(251,250,244,0.1);
      --gold: #e0a81f;
      --gold-dim: rgba(224,168,31,0.12);
      --radius: 10px;
      --radius-lg: 14px;
    }
    html, body { background: transparent !important; }
    body {
      background:
        radial-gradient(circle at 20% 20%, rgba(224,168,31,0.09), transparent 30%),
        radial-gradient(circle at 78% 18%, rgba(224,168,31,0.06), transparent 26%),
        #08090d !important;
    }
    .sidebar,
    .topbar {
      background: rgba(8,9,13,0.86) !important;
      border-color: rgba(224,168,31,0.14) !important;
    }
    .brand-mark {
      background: linear-gradient(135deg, #e0a81f, #fbfaf4) !important;
      color: #08090d !important;
      box-shadow: 0 0 18px rgba(224,168,31,0.24) !important;
    }
    .nav-item.active,
    .filter-chip.active,
    .primary-btn {
      background: #e0a81f !important;
      border-color: #e0a81f !important;
      color: #08090d !important;
    }
    .nav-item:hover,
    .icon-btn:hover,
    .ghost-btn:hover,
    input:focus,
    textarea:focus,
    select:focus {
      border-color: rgba(224,168,31,0.42) !important;
      color: #e0a81f !important;
      box-shadow: 0 0 0 3px rgba(224,168,31,0.1) !important;
    }
    .panel,
    .kpi,
    .kanban-column,
    .production-card {
      border-color: rgba(255,255,255,0.09) !important;
      background: rgba(255,255,255,0.035) !important;
      box-shadow: 0 18px 60px rgba(0,0,0,0.16) !important;
    }
    .panel:hover,
    .kpi:hover,
    .production-card:hover {
      border-color: rgba(224,168,31,0.24) !important;
    }
    .icon-area {
      background: rgba(224,168,31,0.1) !important;
    }
    .icon-area i,
    .nav-item.active i,
    .nav-item.active span,
    .eyebrow,
    .pill.teal,
    .word.positive {
      color: #e0a81f !important;
    }
    .answer-box,
    .transcript-summary {
      border-left-color: #e0a81f !important;
      background: rgba(224,168,31,0.1) !important;
    }
  </style>
`

// app.js orijinalde <head>'de `defer` ile yükleniyordu (DOM hazır olunca
// çalışır). Inline'a çevrilince `defer` kaybolur; head içinde inline bir
// script body DOM'u parse edilmeden çalışır ve app.js'in başlatması
// (DOMContentLoaded) srcDoc iframe'de güvenilmez hale gelir — sağ çalışma
// alanının hiç render olmamasının olası nedeni buydu (Öncelik 8). Çözüm:
// head'deki tag'i kaldır, inline script'i </body> öncesine enjekte et; bu,
// orijinal `defer` semantiğini (tüm DOM parse edildikten sonra çalıştır)
// birebir korur. Ayrıca ?raw ile gelen BOM (U+FEFF) temizlenir.
//
// GERÇEK KÖK NEDEN (canlı doğrulamada bulundu): yalnızca app.js'in BOM'u
// temizleniyordu, styles.css'in BOM'u temizlenmiyordu. `kitCss` doğrudan
// bir <style> etiketine enjekte ediliyor (aşağıda) ve dosya `@import
// url(...)` ile başlıyor; başında BOM olduğunda tarayıcı bu ilk kuralı
// (ve onunla birlikte :root içindeki --sidebar-w gibi CSS custom
// property tanımlarını) reddediyor. Sonuç: `.app-shell{grid-template-
// columns:var(--sidebar-w) 1fr}` kuralı geçersiz değişkene düşüyor,
// grid tek sütuna çöküyor, sağdaki "workspace" paneli sidebar'ın altına
// (görünür alanın dışına) itiliyor — kullanıcı sadece sol menüyü görüyor.
const stripBom = (text) => (text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text)
const kitJsClean = stripBom(kitJs)
const kitCssClean = stripBom(kitCss)
const kitHtmlClean = stripBom(kitHtml)
const inlineAppJs = `<script>${kitJsClean.replace(/<\/script/gi, '<\\/script')}</script>`

const kitDocument = kitHtmlClean
  .replace(/Kade Kit Business/g, 'Kade Organizasyon Kiti')
  .replace(/AI Üretim Merkezi/g, 'Organizasyon Kiti')
  .replace('<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js" defer></script>', lucideFallback)
  .replace('<link rel="stylesheet" href="styles.css"/>', `<style>${kitCssClean}</style>${kadeThemeOverride}`)
  .replace('<script src="app.js" defer></script>', '')
  .replace('</body>', `${inlineAppJs}</body>`)

export default function OrganizationKitDashboard() {
  useSEO({
    title: 'Kade Organizasyon Kiti | Kade New Media',
    description: 'Kade Organizasyon Kiti arayüzü: üretim, notlar, yorum analizi ve operasyon araçları.',
    path: '/organizasyon-kiti',
    noindex: true,
  })

  return (
    <PageTransition>
      <div className="kade-surface ok-page ok-studio-page">
        <div className="container ok-studio-container">
          <section className="ok-studio-header">
            <div>
              <span className="ok-eyebrow">Kade Organizasyon Kiti</span>
              <h1>Organizasyon arayüzü</h1>
              <p>Verdiğiniz kit arayüzü KadeMedia temasıyla yüklendi. Danışmanlık panelinden ayrı, sağdaki kit alanı buraya açılır.</p>
            </div>
            <Link to="/musteri-panel" className="ok-plan-link">
              <HiOutlineArrowLeft size={16} />
              Müşteri paneli
            </Link>
          </section>

          <p role="status" className="glass-card" style={{ padding: 14, marginBottom: 18 }}>
            Demo çalışma alanı — iframe içindeki örnek görev ve analiz kayıtları gerçek müşteri verisi değildir.
          </p>

          <section className="ok-studio-frame-wrap" aria-label="Kade Organizasyon Kiti arayüzü">
            <div className="ok-studio-frame-label">
              <HiOutlineSparkles size={16} />
              <span>KadeMedia teması aktif</span>
            </div>
            <iframe
              title="Kade Organizasyon Kiti"
              srcDoc={kitDocument}
              className="ok-studio-frame"
              loading="lazy"
              sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-same-origin"
            />
          </section>
        </div>
      </div>
    </PageTransition>
  )
}
