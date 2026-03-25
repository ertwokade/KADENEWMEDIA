import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Packages from './pages/Packages'
import Contact from './pages/Contact'
import Careers from './pages/Careers'
import Partners from './pages/Partners'
import PartnerDetail from './pages/PartnerDetail'
import Blog from './pages/Blog'
import Admin from './pages/Admin'
import ScrollToTop from './components/ScrollToTop'
import WhatsAppButton from './components/WhatsAppButton'
import ChatBot from './components/ChatBot'
import ChatToggleButton from './components/ChatToggleButton'
import CookieBanner from './components/CookieBanner'

function App() {
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/hizmetler" element={<Services />} />
          <Route path="/paketler" element={<Packages />} />
          <Route path="/partnerler" element={<Partners />} />
          <Route path="/partnerler/:id" element={<PartnerDetail />} />
          <Route path="/kariyer" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AnimatePresence>
      <Footer />
      <WhatsAppButton />
      <ChatToggleButton isOpen={chatOpen} onClick={() => setChatOpen(!chatOpen)} />
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <CookieBanner />
    </>
  )
}

export default App
