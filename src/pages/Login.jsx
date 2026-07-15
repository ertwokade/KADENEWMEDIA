import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiEye, HiEyeOff } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useCustomer } from '../contexts/CustomerContext'
import { customerLoginApi, customerRegisterApi } from '../api'
import PageTransition from '../components/PageTransition'
import './Login.css'

export default function Login() {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [consent, setConsent] = useState(false)
  const { customer, setCustomer, checked } = useCustomer()
  const navigate = useNavigate()

  useSEO({
    title: 'Giriş Yap | Kade Media',
    description: 'Kade Media müşteri hesabınıza giriş yapın veya yeni hesap oluşturun.',
    path: '/giris',
    noindex: true,
  })

  useEffect(() => {
    if (checked && customer) navigate('/musteri-panel', { replace: true })
  }, [checked, customer, navigate])

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data
      if (tab === 'login') {
        data = await customerLoginApi(form.email, form.password)
      } else {
        if (!form.name.trim()) { setError('Ad Soyad gerekli'); setLoading(false); return }
        if (!consent) { setError('Hesap oluşturmak için aydınlatma metnini onaylayın.'); setLoading(false); return }
        data = await customerRegisterApi(form.name, form.email, form.password, form.phone, consent)
      }
      setCustomer(data.customer)
      navigate('/musteri-panel', { replace: true })
    } catch (err) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setForm({ name: '', email: '', phone: '', password: '' })
    setShowPassword(false)
    setConsent(false)
  }

  if (!checked) return null

  return (
    <PageTransition>
      <div className="login-page">
        <div className="login-bg-glow" />

        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="visually-hidden">Kade Media müşteri girişi</h1>
          <Link to="/" className="login-logo">
            <img src="/logo.png" alt="Kade Media" />
          </Link>

          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              className={`login-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
            >
              Üye Ol
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              onSubmit={handleSubmit}
              className="login-form"
              initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 16 : -16 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'register' && (
                <div className="login-field">
                  <HiOutlineUser className="login-field-icon" size={17} />
                  <label className="visually-hidden" htmlFor="customer-name">Ad Soyad</label>
                  <input
                    id="customer-name"
                    type="text"
                    name="name"
                    placeholder="Ad Soyad"
                    value={form.name}
                    onChange={handleChange}
                    className="login-input"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="login-field">
                <HiOutlineMail className="login-field-icon" size={17} />
                <label className="visually-hidden" htmlFor="customer-email">E-posta adresi</label>
                <input
                  id="customer-email"
                  type="email"
                  name="email"
                  placeholder="E-posta adresi"
                  value={form.email}
                  onChange={handleChange}
                  className="login-input"
                  autoComplete={tab === 'login' ? 'email' : 'email'}
                  required
                />
              </div>

              {tab === 'register' && (
                <div className="login-field">
                  <HiOutlinePhone className="login-field-icon" size={17} />
                  <label className="visually-hidden" htmlFor="customer-phone">Telefon</label>
                  <input
                    id="customer-phone"
                    type="tel"
                    name="phone"
                    placeholder="Telefon (isteğe bağlı)"
                    value={form.phone}
                    onChange={handleChange}
                    className="login-input"
                    autoComplete="tel"
                  />
                </div>
              )}

              <div className="login-field">
                <HiOutlineLockClosed className="login-field-icon" size={17} />
                <label className="visually-hidden" htmlFor="customer-password">Şifre</label>
                <input
                  id="customer-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={tab === 'login' ? 'Şifre' : 'Şifre (en az 12 karakter)'}
                  value={form.password}
                  onChange={handleChange}
                  className="login-input"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="login-field-eye"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <HiEyeOff size={17} /> : <HiEye size={17} />}
                </button>
              </div>

              {tab === 'register' && (
                <label className="login-switch" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
                  <span><Link to="/kvkk">KVKK Aydınlatma Metni</Link> ve <Link to="/gizlilik">Gizlilik Politikası</Link>'nı okudum ve hesap verilerimin işlenmesini onaylıyorum.</span>
                </label>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="login-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
              >
                {loading
                  ? (tab === 'login' ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...')
                  : (tab === 'login' ? 'Giriş Yap' : 'Üye Ol')
                }
              </motion.button>

              {tab === 'login' && (
                <p className="login-switch">
                  Hesabınız yok mu?{' '}
                  <button type="button" className="login-switch-btn" onClick={() => switchTab('register')}>
                    Üye olun
                  </button>
                </p>
              )}
              {tab === 'register' && (
                <p className="login-switch">
                  Zaten üye misiniz?{' '}
                  <button type="button" className="login-switch-btn" onClick={() => switchTab('login')}>
                    Giriş yapın
                  </button>
                </p>
              )}
            </motion.form>
          </AnimatePresence>

          <p className="login-legal">Veri işleme ayrıntıları için <Link to="/gizlilik">Gizlilik Politikası</Link>'nı inceleyin.</p>
        </motion.div>
      </div>
    </PageTransition>
  )
}
