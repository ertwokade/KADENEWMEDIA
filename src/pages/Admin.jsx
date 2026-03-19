import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineSave, HiOutlineLogin, HiOutlineLogout } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './Admin.css'

// Default values from translations
const defaultTexts = {
  tr: {
    title1: 'Dijital Dünyada',
    title2: 'Markanızı Büyütün',
    subtitle: 'Kade Media olarak sosyal medya stratejileri, kreatif içerik üretimi ve dijital pazarlama çözümleriyle markanızı zirveye taşıyoruz.',
  },
  en: {
    title1: 'Grow Your Brand',
    title2: 'In The Digital World',
    subtitle: 'At Kade Media, we take your brand to the top with social media strategies, creative content production, and digital marketing solutions.',
  }
}

export default function Admin() {
  const { lang, t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  
  // Form state
  const [texts, setTexts] = useState({
    tr: { title1: '', title2: '', subtitle: '' },
    en: { title1: '', title2: '', subtitle: '' }
  })
  
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('tr')

  // Load existing data on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('kade_admin_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }

    const savedTextsStr = localStorage.getItem('kade_hero_texts')
    if (savedTextsStr) {
      try {
        const savedTexts = JSON.parse(savedTextsStr)
        setTexts(savedTexts)
      } catch (e) {
        console.error('Error parsing saved texts', e)
        setTexts(defaultTexts)
      }
    } else {
      setTexts(defaultTexts)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple static password for frontend-only admin
    if (password === 'kademedia2026') {
      setIsAuthenticated(true)
      setLoginError(false)
      sessionStorage.setItem('kade_admin_auth', 'true')
    } else {
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    sessionStorage.removeItem('kade_admin_auth')
  }

  const handleChange = (e, language, field) => {
    setTexts(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: e.target.value
      }
    }))
  }

  const handleSave = () => {
    localStorage.setItem('kade_hero_texts', JSON.stringify(texts))
    
    // Dispatch custom event to notify other tabs/components
    window.dispatchEvent(new CustomEvent('kade_texts_updated', {
      detail: texts
    }))
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (window.confirm('Tüm değişiklikleri silip orijinal metinlere dönmek istediğinize emin misiniz?')) {
      localStorage.removeItem('kade_hero_texts')
      setTexts(defaultTexts)
      
      window.dispatchEvent(new CustomEvent('kade_texts_updated', {
        detail: defaultTexts
      }))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="admin-login-container">
          <div className="grid-bg" />
          <FadeIn>
            <div className="admin-login-card glass-card">
              <div className="admin-logo">
                kade<span>admin</span>
              </div>
              <h2>Yönetici Girişi</h2>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="password">Şifre</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className={loginError ? 'error' : ''}
                  />
                  {loginError && <span className="error-text">Hatalı şifre! (İpucu: kademedia2026)</span>}
                </div>
                <button type="submit" className="btn btn-primary login-btn">
                  Giriş Yap <HiOutlineLogin size={18} />
                </button>
              </form>
            </div>
          </FadeIn>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="admin-dashboard-container">
        <div className="grid-bg" />
        <div className="container" style={{ padding: '120px 24px 60px' }}>
          
          <div className="admin-header">
            <div>
              <div className="section-badge">Admin Paneli</div>
              <h1 className="section-title">İçerik <span>Yönetimi</span></h1>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">
              <HiOutlineLogout size={18} /> Çıkış
            </button>
          </div>

          <FadeIn delay={0.1}>
            <div className="admin-panel glass-card">
              <div className="admin-tabs">
                <button 
                  className={`admin-tab ${activeTab === 'tr' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tr')}
                >
                  🇹🇷 Türkçe
                </button>
                <button 
                  className={`admin-tab ${activeTab === 'en' ? 'active' : ''}`}
                  onClick={() => setActiveTab('en')}
                >
                  🇬🇧 English
                </button>
              </div>

              <div className="admin-content">
                <div className="admin-section">
                  <h3>Hero Section Metinleri ({activeTab.toUpperCase()})</h3>
                  <p className="admin-desc">Anasayfanın en üstünde yer alan ana başlık ve açıklama metinleri.</p>
                  
                  <div className="form-group">
                    <label>Ana Başlık (1. Satır - Normal)</label>
                    <input 
                      type="text" 
                      value={texts[activeTab].title1} 
                      onChange={(e) => handleChange(e, activeTab, 'title1')}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ana Başlık (2. Satır - Renkli/Vurgulu)</label>
                    <input 
                      type="text" 
                      value={texts[activeTab].title2} 
                      onChange={(e) => handleChange(e, activeTab, 'title2')}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Alt Açıklama (Subtitle)</label>
                    <textarea 
                      rows="4" 
                      value={texts[activeTab].subtitle} 
                      onChange={(e) => handleChange(e, activeTab, 'subtitle')}
                    />
                  </div>
                </div>

                <div className="admin-actions">
                  <button onClick={handleReset} className="btn btn-outline reset-btn">
                    Varsayılana Dön
                  </button>
                  <button onClick={handleSave} className="btn btn-primary save-btn">
                    {saved ? 'Kaydedildi! ✓' : 'Değişiklikleri Kaydet'}
                    {!saved && <HiOutlineSave size={18} />}
                  </button>
                </div>
              </div>

            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
