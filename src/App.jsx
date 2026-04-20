import { lazy, Suspense, useEffect, useRef } from 'react'
import { OrganizationSchema } from './components/StructuredData'
import { Routes, Route, useLocation } from 'react-router-dom'
import { trackPageviewApi } from './api'
import PageHeroCanvas from './components/PageHeroCanvas'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import WhatsAppButton from './components/WhatsAppButton'
import CookieBanner from './components/CookieBanner'
import ErrorTracker from './components/ErrorTracker'

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
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'))
const PodcastWebinar = lazy(() => import('./pages/PodcastWebinar'))
const NewsletterArchive = lazy(() => import('./pages/NewsletterArchive'))

function PageLoader() {
  return <div style={{ minHeight: '60vh' }} />
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
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-R893K1VE79', {
        page_path: location.pathname,
        page_title: document.title,
      })
    }
  }, [location.pathname, isAdmin])

  return (
    <>
      <ErrorTracker />
      <OrganizationSchema />
      <a href="#main-content" className="skip-to-content">İçeriğe geç</a>
      <ScrollToTop />
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
        <Route path="/paketler" element={<Suspense fallback={<PageLoader />}><Packages /></Suspense>} />
        <Route path="/partnerler" element={<Suspense fallback={<PageLoader />}><Partners /></Suspense>} />
        <Route path="/partnerler/:id" element={<Suspense fallback={<PageLoader />}><PartnerDetail /></Suspense>} />
        <Route path="/kariyer" element={<Suspense fallback={<PageLoader />}><Careers /></Suspense>} />
        <Route path="/portfolio" element={<Suspense fallback={<PageLoader />}><Portfolio /></Suspense>} />
        <Route path="/ekip" element={<Suspense fallback={<PageLoader />}><Team /></Suspense>} />
        <Route path="/basari-hikayeleri" element={<Suspense fallback={<PageLoader />}><CaseStudies /></Suspense>} />
        <Route path="/roi-hesaplayici" element={<Suspense fallback={<PageLoader />}><ROICalculator /></Suspense>} />
        <Route path="/kvkk" element={<Suspense fallback={<PageLoader />}><KVKK /></Suspense>} />
        <Route path="/gizlilik" element={<Suspense fallback={<PageLoader />}><Gizlilik /></Suspense>} />
        <Route path="/cerez-politikasi" element={<Suspense fallback={<PageLoader />}><CerezPolitikasi /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
        <Route path="/sss" element={<Suspense fallback={<PageLoader />}><SSS /></Suspense>} />
        <Route path="/referanslar" element={<Suspense fallback={<PageLoader />}><Referanslar /></Suspense>} />
        <Route path="/tesekkur" element={<Suspense fallback={<PageLoader />}><Tesekkur /></Suspense>} />
        <Route path="/basin" element={<Suspense fallback={<PageLoader />}><Basin /></Suspense>} />
        <Route path="/neden-biz" element={<Suspense fallback={<PageLoader />}><NedenBiz /></Suspense>} />
        <Route path="/referans-programi" element={<Suspense fallback={<PageLoader />}><ReferralProgram /></Suspense>} />
        <Route path="/teklif-al" element={<Suspense fallback={<PageLoader />}><QuoteRequest /></Suspense>} />
        <Route path="/fiyat-hesaplama" element={<Suspense fallback={<PageLoader />}><PriceCalculator /></Suspense>} />
        <Route path="/musteri-panel" element={<Suspense fallback={<PageLoader />}><CustomerPortal /></Suspense>} />
        <Route path="/proje-takip" element={<Suspense fallback={<PageLoader />}><ProjectTracking /></Suspense>} />
        <Route path="/podcast-webinar" element={<Suspense fallback={<PageLoader />}><PodcastWebinar /></Suspense>} />
        <Route path="/bulten-arsivi" element={<Suspense fallback={<PageLoader />}><NewsletterArchive /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CookieBanner />}
    </>
  )
}

export default App
