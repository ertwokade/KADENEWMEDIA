import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { reportWebVitals } from './utils/webVitals.js'
import './index.css'
import './styles/kade-yeni.css'
import './styles/kade-blocks.css'
import './styles/kade-motion.js'

reportWebVitals()

// Service worker'ı tamamen kaldır — eski cache staleness sorununu kökten bitir.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {})
  if (window.caches?.keys) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>,
)
