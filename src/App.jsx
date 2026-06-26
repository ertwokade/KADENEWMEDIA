import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CustomerProvider } from './contexts/CustomerContext'
import { OrganizationSchema } from './components/StructuredData'
import { Routes, Route, useLocation } from 'react-router-dom'
import { trackPageviewApi, heartbeatApi, getSessionApi } from './api'
import PageHeroCanvas from './components/PageHeroCanvas'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import WhatsAppButton from './components/WhatsAppButton'
import CookieBanner from './components/CookieBanner'
import ErrorTracker from './components/ErrorTracker'
import GrainOverlay from './components/GrainOverlay'
import AuroraBackground from './components/AuroraBackground'
import ErrorBoundary from './components/ErrorBoundary'
import ExitIntentPopup from './components/ExitIntentPopup'
import NotificationPrompt from './components/NotificationPrompt'

// Core pages — direct import for instant first render
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import NotFound from './pages/NotFound'

// Secondary pages — lazy loaded to reduce initial bundle
const Packages = lazy(() => import('./pages/Packages'))
const Partners = lazy(() => import('./pages/Partners'))
const PartnerDetail = lazy(() => import('./pages/PartnerDetail'))
const Careers = lazy(() => import('./pages/Careers'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Team = lazy(() => import('./pages/Team'))
const KVKK = lazy(() => import('./pages/KVKK'))
const Gizlilik = lazy(() => import('./pages/Gizlilik'))
const CerezPolitikasi = lazy(() => import('./pages/CerezPolitikasi'))
const CaseStudies = lazy(() => import('./pages/CaseStudies'))
const ROICalculator = lazy(() => import('./pages/ROICalculator'))
const Admin = lazy(() => import('./pages/Admin'))
// New pages
const SSS = lazy(() => import('./pages/SSS'))
const Referanslar = lazy(() => import('./pages/Referanslar'))
const Tesekkur = lazy(() => import('./pages/Tesekkur'))
const Basin = lazy(() => import('./pages/Basin'))
const NedenBiz = lazy(() => import('./pages/NedenBiz'))
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'))
const QuoteRequest = lazy(() => import('./pages/QuoteRequest'))
const PriceCalculator = lazy(() => import('./pages/PriceCalculator'))
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'))
const Login = lazy(() => import('./pages/Login'))
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'))
const PodcastWebinar = lazy(() => import('./pages/PodcastWebinar'))
const NewsletterArchive = lazy(() => import('./pages/NewsletterArchive'))

function PageLoader() {
  return <div style={{ minHeight: '60vh' }} />
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

const ROUTE_THEMES = {
  '/': 'home',
  '/hakkimizda': 'about',
  '/hizmetler': 'services',
  '/paketler': 'packages',
  '/partnerler': 'partners',
  '/kariyer': 'careers',
  '/blog': 'blog',
  '/portfolio': 'portfolio',
  '/ekip': 'team',
  '/iletisim': 'contact',
  '/sss': 'contact',
  '/referanslar': 'about',
  '/basin': 'blog',
  '/neden-biz': 'services',
  '/tesekkur': 'contact',
  '/referans-programi': 'partners',
  '/teklif-al': 'contact',
  '/fiyat-hesaplama': 'packages',
  '/giris': 'about',
  '/musteri-panel': 'about',
  '/proje-takip': 'services',
  '/podcast-webinar': 'blog',
  '/bulten-arsivi': 'blog',
}

function getCanvasTheme(pathname) {
  if (ROUTE_THEMES[pathname]) return ROUTE_THEMES[pathname]
  if (pathname.startsWith('/hizmetler/')) return 'services'
  if (pathname.startsWith('/partnerler/')) return 'partners'
  if (pathname.startsWith('/blog/')) return 'blog'
  return 'home'
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const canvasTheme = getCanvasTheme(location.pathname)
  const prevPath = useRef(null)

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
      {!isAdmin && <AuroraBackground />}
      {!isAdmin && <GrainOverlay />}
      {!isAdmin && <PageHeroCanvas type={canvasTheme} />}
      {!isAdmin && <Navbar />}
      <main id="main-content">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/hakkimizda" element={<About />} />
        <Route path="/hizmetler" element={<Services />} />
        <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/iletisim" element={<Contact />} />
        <Route path="/paketler" element={<LazyRoute><Packages /></LazyRoute>} />
        <Route path="/partnerler" element={<LazyRoute><Partners /></LazyRoute>} />
        <Route path="/partnerler/:id" element={<LazyRoute><PartnerDetail /></LazyRoute>} />
        <Route path="/kariyer" element={<LazyRoute><Careers /></LazyRoute>} />
        <Route path="/portfolio" element={<LazyRoute><Portfolio /></LazyRoute>} />
        <Route path="/ekip" element={<LazyRoute><Team /></LazyRoute>} />
        <Route path="/basari-hikayeleri" element={<LazyRoute><CaseStudies /></LazyRoute>} />
        <Route path="/roi-hesaplayici" element={<LazyRoute><ROICalculator /></LazyRoute>} />
        <Route path="/kvkk" element={<LazyRoute><KVKK /></LazyRoute>} />
        <Route path="/gizlilik" element={<LazyRoute><Gizlilik /></LazyRoute>} />
        <Route path="/cerez-politikasi" element={<LazyRoute><CerezPolitikasi /></LazyRoute>} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
        <Route path="/sss" element={<LazyRoute><SSS /></LazyRoute>} />
        <Route path="/referanslar" element={<LazyRoute><Referanslar /></LazyRoute>} />
        <Route path="/tesekkur" element={<LazyRoute><Tesekkur /></LazyRoute>} />
        <Route path="/basin" element={<LazyRoute><Basin /></LazyRoute>} />
        <Route path="/neden-biz" element={<LazyRoute><NedenBiz /></LazyRoute>} />
        <Route path="/referans-programi" element={<LazyRoute><ReferralProgram /></LazyRoute>} />
        <Route path="/teklif-al" element={<LazyRoute><QuoteRequest /></LazyRoute>} />
        <Route path="/fiyat-hesaplama" element={<LazyRoute><PriceCalculator /></LazyRoute>} />
        <Route path="/giris" element={<LazyRoute><Login /></LazyRoute>} />
        <Route path="/musteri-panel" element={<LazyRoute><CustomerPortal /></LazyRoute>} />
        <Route path="/proje-takip" element={<LazyRoute><ProjectTracking /></LazyRoute>} />
        <Route path="/podcast-webinar" element={<LazyRoute><PodcastWebinar /></LazyRoute>} />
        <Route path="/bulten-arsivi" element={<LazyRoute><NewsletterArchive /></LazyRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CookieBanner />}
      {!isAdmin && <ExitIntentPopup />}
      {!isAdmin && <NotificationPrompt />}
    </CustomerProvider>
  )
}

export default App
