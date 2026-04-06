import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { trackPageviewApi } from './api'
import PageHeroCanvas from './components/PageHeroCanvas'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import WhatsAppButton from './components/WhatsAppButton'
import CookieBanner from './components/CookieBanner'

// Direct imports — no lazy loading — instant page render
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Packages from './pages/Packages'
import Contact from './pages/Contact'
import Careers from './pages/Careers'
import Partners from './pages/Partners'
import PartnerDetail from './pages/PartnerDetail'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Portfolio from './pages/Portfolio'
import Team from './pages/Team'
import KVKK from './pages/KVKK'
import Gizlilik from './pages/Gizlilik'
import CerezPolitikasi from './pages/CerezPolitikasi'
import NotFound from './pages/NotFound'

// Only Admin stays lazy — it's large and rarely visited
const Admin = lazy(() => import('./pages/Admin'))

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" />
    </div>
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
      <ScrollToTop />
      {!isAdmin && <PageHeroCanvas type={canvasTheme} />}
      {!isAdmin && <Navbar />}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/hakkimizda" element={<About />} />
        <Route path="/hizmetler" element={<Services />} />
        <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
        <Route path="/paketler" element={<Packages />} />
        <Route path="/partnerler" element={<Partners />} />
        <Route path="/partnerler/:id" element={<PartnerDetail />} />
        <Route path="/kariyer" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/ekip" element={<Team />} />
        <Route path="/iletisim" element={<Contact />} />
        <Route path="/kvkk" element={<KVKK />} />
        <Route path="/gizlilik" element={<Gizlilik />} />
        <Route path="/cerez-politikasi" element={<CerezPolitikasi />} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CookieBanner />}
    </>
  )
}

export default App
