import { Suspense, useEffect, useRef, useState } from 'react'
import { CustomerProvider } from './contexts/CustomerContext'
import { OrganizationSchema } from './components/StructuredData'
import { Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom'
import { trackPageviewApi, heartbeatApi, getSessionApi, resolveShortLinkApi, recordShortLinkClickApi } from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import CookieBanner from './components/CookieBanner'
import ErrorTracker from './components/ErrorTracker'
import GrainOverlay from './components/GrainOverlay'
import AuroraBackground from './components/AuroraBackground'
import ErrorBoundary from './components/ErrorBoundary'
import { lazyWithRetry } from './utils/lazyWithRetry'
import NotificationPrompt from './components/NotificationPrompt'
import OrganizationKitGuard from './components/OrganizationKitGuard'
import KadeKitBusinessGuard from './components/KadeKitBusinessGuard'
import CustomerRouteGuard from './components/CustomerRouteGuard'

// Core pages — direct import for instant first render
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import NewMediaAgency from './pages/NewMediaAgency'
import ServiceDetail from './pages/ServiceDetail'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import NotFound from './pages/NotFound'

// Secondary pages — lazy loaded to reduce initial bundle
const Packages = lazyWithRetry(() => import('./pages/Packages'))
const Partners = lazyWithRetry(() => import('./pages/Partners'))
const PartnerDetail = lazyWithRetry(() => import('./pages/PartnerDetail'))
const Careers = lazyWithRetry(() => import('./pages/Careers'))
const Portfolio = lazyWithRetry(() => import('./pages/Portfolio'))
const ProjectDetail = lazyWithRetry(() => import('./pages/ProjectDetail'))
const Team = lazyWithRetry(() => import('./pages/Team'))
const KVKK = lazyWithRetry(() => import('./pages/KVKK'))
const Gizlilik = lazyWithRetry(() => import('./pages/Gizlilik'))
const CerezPolitikasi = lazyWithRetry(() => import('./pages/CerezPolitikasi'))
const TelifHaklari = lazyWithRetry(() => import('./pages/TelifHaklari'))
const CaseStudies = lazyWithRetry(() => import('./pages/CaseStudies'))
const Admin = lazyWithRetry(() => import('./pages/Admin'))
// New pages
const SSS = lazyWithRetry(() => import('./pages/SSS'))
const Referanslar = lazyWithRetry(() => import('./pages/Referanslar'))
const Tesekkur = lazyWithRetry(() => import('./pages/Tesekkur'))
const QuoteRequest = lazyWithRetry(() => import('./pages/QuoteRequest'))
const CustomerPortal = lazyWithRetry(() => import('./pages/CustomerPortal'))
const LoginHub = lazyWithRetry(() => import('./pages/LoginHub'))
const Login = lazyWithRetry(() => import('./pages/Login'))
const ProjectTracking = lazyWithRetry(() => import('./pages/ProjectTracking'))
const OrganizationKitDashboard = lazyWithRetry(() => import('./pages/OrganizationKitDashboard'))
const OrganizationKitPlan = lazyWithRetry(() => import('./pages/OrganizationKitPlan'))
const OrganizationKitSection = lazyWithRetry(() => import('./pages/OrganizationKitSection'))
const KadeKitBusinessStudio = lazyWithRetry(() => import('./pages/KadeKitBusinessStudio'))
const LinkProfile = lazyWithRetry(() => import('./pages/LinkProfile'))
const Unauthorized = lazyWithRetry(() => import('./pages/Unauthorized'))
const Forbidden = lazyWithRetry(() => import('./pages/Forbidden'))
const TooManyRequests = lazyWithRetry(() => import('./pages/TooManyRequests'))
const Maintenance = lazyWithRetry(() => import('./pages/Maintenance'))
const BasinPage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.BasinPage })))
const NedenBizPage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.NedenBizPage })))
const ReferralProgramPage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.ReferralProgramPage })))
const PodcastWebinarPage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.PodcastWebinarPage })))
const NewsletterArchivePage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.NewsletterArchivePage })))
const PriceCalculatorPage = lazyWithRetry(() => import('./pages/ContentPages').then((module) => ({ default: module.PriceCalculatorPage })))

// Dekoratif 3B zemin Three.js/R3F çeker. Ana sayfa ve diğer `hideDecor`
// rotalarında hiç render edilmiyor; statik import olduğu için yine de
// bundle'a giriyor ve THREE.Clock deprecation uyarısı basıyordu.
// Lazy import ile yalnız gerçekten gösterildiği rotalarda yüklenir.
const PageHeroCanvas = lazyWithRetry(() => import('./components/PageHeroCanvas'))

function PageLoader() {
  // Lazy chunk inerken tamamen boş ekran yerine hafif, markalı bir spinner
  // göster — geçiş sırasında "donmuş" hissini azaltır (Öncelik 3).
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-live="polite" aria-busy="true">
      <span className="kade-page-spinner" role="status" aria-label="Yükleniyor" />
    </div>
  )
}

function LazyRoute({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

function ProtectedAdminRoute() {
  const [session, setSession] = useState({ checked: false, authenticated: false, user: null })

  useEffect(() => {
    let cancelled = false
    getSessionApi()
      .then((data) => {
        if (!cancelled) {
          setSession({ checked: true, authenticated: Boolean(data?.authenticated), user: data?.user || null })
        }
      })
      .catch(() => {
        if (!cancelled) setSession({ checked: true, authenticated: false, user: null })
      })
    return () => { cancelled = true }
  }, [])

  if (!session.checked) return <PageLoader />
  return (
    <LazyRoute>
      <Admin initialAuth={session.authenticated} initialUser={session.user} />
    </LazyRoute>
  )
}

function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return <PageLoader />
}

function ShortLinkRedirect() {
  const { slug } = useParams()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    resolveShortLinkApi(slug)
      .then((data) => {
        if (cancelled || !data?.target) return
        recordShortLinkClickApi(slug).catch(() => {})
        window.location.replace(data.target)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
    return () => { cancelled = true }
  }, [slug])

  if (notFound) return <NotFound />
  return <PageLoader />
}

const ROUTE_THEMES = {
  '/': 'home',
  '/hakkimizda': 'about',
  '/hizmetler': 'services',
  '/new-media-ajansi': 'services',
  '/paketler': 'packages',
  '/partnerler': 'partners',
  '/kariyer': 'careers',
  '/blog': 'blog',
  '/portfolio': 'portfolio',
  '/basin': 'about',
  '/neden-biz': 'about',
  '/referans-programi': 'contact',
  '/podcast-webinar': 'blog',
  '/bulten-arsivi': 'blog',
  '/fiyat-hesaplama': 'packages',
  '/ekip': 'team',
  '/iletisim': 'contact',
  '/sss': 'contact',
  '/referanslar': 'about',
  '/tesekkur': 'contact',
  '/teklif-al': 'contact',
  '/giris': 'about',
  '/musteri-panel': 'about',
  '/organizasyon-kiti': 'about',
  '/kade-kit-business': 'services',
  '/proje-takip': 'services',
}

function getCanvasTheme(pathname) {
  if (ROUTE_THEMES[pathname]) return ROUTE_THEMES[pathname]
  if (pathname.startsWith('/hizmetler/')) return 'services'
  if (pathname.startsWith('/partnerler/')) return 'partners'
  if (pathname.startsWith('/portfolio/')) return 'portfolio'
  if (pathname.startsWith('/blog/')) return 'blog'
  if (pathname.startsWith('/giris')) return 'about'
  if (pathname.startsWith('/organizasyon-kiti')) return 'about'
  if (pathname.startsWith('/kade-kit-business')) return 'services'
  return 'home'
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const isHome = location.pathname === '/'
  const isLoginArea = location.pathname.startsWith('/giris')
  const isLinkProfile = location.pathname.startsWith('/@') || location.pathname === '/kadirdemir'
  // İKİ AYRI KARAR — tek bayrak yetmez:
  //   hideChrome : Navbar + Footer. Yalnız kendi tam ekran arayüzü olan
  //                alanlarda gizlenir. Ana sayfa BURADA DEĞİL; navigasyonu olmalı.
  //   hideDecor  : Aurora, grain ve 3B hero canvas. Bunlar `position: fixed`
  //                tam ekran katmanlar; ana sayfanın kendi CSS zemini ve büyük
  //                tipografisi var, üst üste binince giriş okunamaz hâle geliyor.
  const hideChrome = isAdmin || isLoginArea || isLinkProfile
  const hideDecor = hideChrome || isHome
  // `kade-app-ui`, CSS'i krem zemine göre yazılmış ürün arayüzlerini açık
  // palete SABİTLER; o sayfalarda tema düğmesi çalışmaz. Bu bir geçiş
  // önlemidir: bir yüzey `styles/kade-gate.css` rollerine taşındığında kendi
  // zeminini boyadığı için sabitlemeye ihtiyacı kalmaz ve listeden çıkar.
  // Taşınanlar listeden çıktı: /musteri-panel, /proje-takip, /organizasyon-kiti,
  // /kade-kit-business ve /@profil artık kendi zeminini rol tokenlarından
  // boyuyor ve tema düğmesini izliyor.
  //
  // /admin BİLEREK kalıyor: kendi karanlık mod düğmesi var (`kade_admin_dark`)
  // ve site temasından bağımsız çalışması isteniyor; açık palete sabitlenmesi
  // o düğmenin tek yetkili olmasını sağlıyor.
  const isAppUI = isAdmin
  const canvasTheme = getCanvasTheme(location.pathname)
  const prevPath = useRef(null)

  // Dekoratif altın imleç sadece pazarlama sayfalarında kalsın — admin ve
  // araç/panel sayfalarında (Kade AI panelleri dahil) normal imleç kullanılır.
  useEffect(() => {
    document.body.classList.toggle('kade-app-ui', isAppUI)
    return () => document.body.classList.remove('kade-app-ui')
  }, [isAppUI])

  useEffect(() => {
    // Don't track admin visits, avoid duplicate on first render
    if (isAdmin) return
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    trackPageviewApi(location.pathname, document.referrer)

    // Send page view to Google Analytics 4
    const gaId = import.meta.env.VITE_GA_ID || 'G-R893K1VE79'
    if (gaId && typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: location.pathname,
        page_title: document.title,
      })
    }
  }, [location.pathname, isAdmin])

  // Active visitor heartbeat — keeps our real-time counter accurate.
  useEffect(() => {
    if (isAdmin) return
    let sid
    try {
      sid = sessionStorage.getItem('kade_visitor_sid')
      if (!sid) {
        sid = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
        sessionStorage.setItem('kade_visitor_sid', sid)
      }
    } catch { sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }

    const ping = () => { if (document.visibilityState !== 'hidden') heartbeatApi(sid, location.pathname) }
    ping()
    const interval = setInterval(ping, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [location.pathname, isAdmin])

  return (
    <CustomerProvider>
      <ErrorTracker />
      <OrganizationSchema />
      <a href="#main-content" className="skip-to-content">İçeriğe geç</a>
      <ScrollToTop />
      {!hideDecor && <AuroraBackground />}
      {!hideDecor && <GrainOverlay />}
      {!hideDecor && (
        <Suspense fallback={null}>
          <PageHeroCanvas type={canvasTheme} />
        </Suspense>
      )}
      {!hideChrome && <Navbar />}
      <main id="main-content">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/hizmetler" element={<Services />} />
          <Route path="/new-media-ajansi" element={<NewMediaAgency />} />
          <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/paketler" element={<LazyRoute><Packages /></LazyRoute>} />
          <Route path="/partnerler" element={<LazyRoute><Partners /></LazyRoute>} />
          <Route path="/partnerler/:id" element={<LazyRoute><PartnerDetail /></LazyRoute>} />
          <Route path="/kariyer" element={<LazyRoute><Careers /></LazyRoute>} />
          <Route path="/portfolio" element={<LazyRoute><Portfolio /></LazyRoute>} />
          <Route path="/portfolio/:slug" element={<LazyRoute><ProjectDetail /></LazyRoute>} />
          <Route path="/ekip" element={<LazyRoute><Team /></LazyRoute>} />
          <Route path="/basari-hikayeleri" element={<LazyRoute><CaseStudies /></LazyRoute>} />
          <Route path="/kvkk" element={<LazyRoute><KVKK /></LazyRoute>} />
          <Route path="/gizlilik" element={<LazyRoute><Gizlilik /></LazyRoute>} />
          <Route path="/cerez-politikasi" element={<LazyRoute><CerezPolitikasi /></LazyRoute>} />
          <Route path="/telif-haklari" element={<LazyRoute><TelifHaklari /></LazyRoute>} />
          <Route path="/401" element={<LazyRoute><Unauthorized /></LazyRoute>} />
          <Route path="/403" element={<LazyRoute><Forbidden /></LazyRoute>} />
          <Route path="/429" element={<LazyRoute><TooManyRequests /></LazyRoute>} />
          <Route path="/bakim" element={<LazyRoute><Maintenance /></LazyRoute>} />
          <Route path="/admin" element={<ProtectedAdminRoute />} />
          <Route path="/sss" element={<LazyRoute><SSS /></LazyRoute>} />
          <Route path="/referanslar" element={<LazyRoute><Referanslar /></LazyRoute>} />
          <Route path="/tesekkur" element={<LazyRoute><Tesekkur /></LazyRoute>} />
          <Route path="/teklif-al" element={<LazyRoute><QuoteRequest /></LazyRoute>} />
          <Route path="/giris" element={<LazyRoute><LoginHub /></LazyRoute>} />
          <Route path="/giris/danismanlik" element={<LazyRoute><Login /></LazyRoute>} />
          <Route path="/musteri-panel" element={<LazyRoute><CustomerPortal /></LazyRoute>} />
          <Route path="/organizasyon-kiti" element={<LazyRoute><OrganizationKitGuard><OrganizationKitDashboard /></OrganizationKitGuard></LazyRoute>} />
          <Route path="/organizasyon-kiti/plan/fractional-new-media-director" element={<LazyRoute><OrganizationKitGuard><OrganizationKitPlan /></OrganizationKitGuard></LazyRoute>} />
          {['medya-yol-haritasi', 'yonetim-toplantilari', 'ekip-surecler', 'stratejik-kararlar', 'notlar'].map(section => (
            <Route
              key={section}
              path={`/organizasyon-kiti/${section}`}
              element={<LazyRoute><OrganizationKitGuard><OrganizationKitSection /></OrganizationKitGuard></LazyRoute>}
            />
          ))}
          <Route path="/kade-kit-business" element={<LazyRoute><KadeKitBusinessGuard><KadeKitBusinessStudio /></KadeKitBusinessGuard></LazyRoute>} />
          <Route path="/fiyat-hesaplama" element={<LazyRoute><PriceCalculatorPage /></LazyRoute>} />
          <Route path="/basin" element={<LazyRoute><BasinPage /></LazyRoute>} />
          <Route path="/neden-biz" element={<LazyRoute><NedenBizPage /></LazyRoute>} />
          <Route path="/referans-programi" element={<LazyRoute><ReferralProgramPage /></LazyRoute>} />
          <Route path="/podcast-webinar" element={<LazyRoute><PodcastWebinarPage /></LazyRoute>} />
          <Route path="/bulten-arsivi" element={<LazyRoute><NewsletterArchivePage /></LazyRoute>} />
          <Route path="/kadirdemir" element={<Navigate to="/@kadirdemir" replace />} />
          <Route path="/:handle" element={<LazyRoute><LinkProfile /></LazyRoute>} />
          <Route path="/s/:slug" element={<ShortLinkRedirect />} />
          <Route path="/proje-takip" element={<LazyRoute><CustomerRouteGuard><ProjectTracking /></CustomerRouteGuard></LazyRoute>} />
          <Route path="/links" element={<ExternalRedirect to="https://kadirardademir.com/links" />} />
          <Route path="/kadelinks" element={<ExternalRedirect to="https://kadirardademir.com/links" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
      {!isAdmin && <CookieBanner />}
      {!isAdmin && <NotificationPrompt />}
    </CustomerProvider>
  )
}

export default App
