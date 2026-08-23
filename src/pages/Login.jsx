import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiEye, HiEyeOff, HiOutlineExclamationCircle } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useCustomer } from '../contexts/CustomerContext'
import { customerLoginApi, customerRegisterApi } from '../api'
import { useGatePointer } from '../hooks/useGatePointer'
import PageTransition from '../components/PageTransition'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/kade-gate.css'
import './Login.css'

/* Klon rotalarına DIŞ bağlantı: `<Link>` değil `<a href>`.

   Üretimde bu adresler statik klondan servis ediliyor (bkz. scripts/
   merge-clone.mjs). `<Link>` kullanıldığında React Router sayfayı istemci
   tarafında kendi kopyasıyla çiziyordu; sonuç, aynı URL'nin nereden
   gelindiğine göre iki farklı tasarımda açılmasıydı — Google'dan gelen klonu,
   panelden tıklayan React sürümünü görüyordu. Tam sayfa yüklemesi doğru
   katmanı getirir. */

/**
 * Şifre gücü — yalnız kayıt sekmesinde gösterilir ve tek amacı geri bildirim.
 * Sunucu tarafındaki doğrulama bundan bağımsızdır; burada verilen puan hiçbir
 * kararı belirlemez, sadece kullanıcıya "12 karakter yetti mi" sorusunun
 * cevabını yazmadan önce gösterir.
 */
const PASSWORD_LEVELS = ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü']

function scorePassword(password) {
  if (!password) return -1
  let score = 0
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[a-z]/.test(password) && /[A-ZĞÜŞİÖÇ]/.test(password)) score += 1
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1
  return Math.min(score, 4)
}

export default function Login() {
  const [tab, setTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [consent, setConsent] = useState(false)
  const { customer, setCustomer, checked } = useCustomer()
  const navigate = useNavigate()
  const gateRef = useGatePointer()

  useSEO({
    title: 'Danışmanlık Girişi | Kade New Media',
    description: 'Kade New Media danışmanlık ve müşteri hesabınıza giriş yapın veya yeni hesap oluşturun.',
    path: '/giris/danismanlik',
    noindex: true,
  })

  useEffect(() => {
    if (checked && customer) navigate('/musteri-panel', { replace: true })
  }, [checked, customer, navigate])

  const isLogin = tab === 'login'
  const strength = useMemo(() => (isLogin ? -1 : scorePassword(form.password)), [isLogin, form.password])

  const handleChange = (event) => {
    setError('')
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  /* Caps Lock, yanlış şifre hatalarının sessiz sebeplerinden biri. */
  const handlePasswordKey = (event) => {
    setCapsLock(event.getModifierState?.('CapsLock') ?? false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data
      if (isLogin) {
        data = await customerLoginApi(form.email, form.password)
      } else {
        if (!form.name.trim()) { setError('Ad Soyad gerekli'); setLoading(false); return }
        if (!consent) { setError('Hesap oluşturmak için aydınlatma metnini onaylayın.'); setLoading(false); return }
        data = await customerRegisterApi(form.name, form.email, form.password, form.phone, consent)
      }
      setCustomer(data.customer)
      navigate('/musteri-panel', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (nextTab) => {
    setTab(nextTab)
    setError('')
    setForm({ name: '', email: '', phone: '', password: '' })
    setShowPassword(false)
    setCapsLock(false)
    setConsent(false)
  }

  return (
    <PageTransition>
      <div className="kade-gate gate-auth" ref={gateRef}>
        <div className="gate-grid" aria-hidden="true" />
        <h1 className="visually-hidden">Kade New Media danışmanlık girişi</h1>

        <header className="gate-hud">
          <Link to="/" className="gate-hud-brand" aria-label="Kade New Media ana sayfa">
            <span>Kade</span><span>New Media</span>
          </Link>
          <nav className="gate-hud-nav" aria-label="Giriş">
            <Link to="/giris">← <span>Çalışma alanı</span></Link>
            <a className="gate-hud-optional" href="/iletisim">İletişim</a>
            <ThemeToggle />
          </nav>
        </header>

        {/* Oturum kontrolü ile form arasındaki geçiş TEK bir çapraz geçiştir.
            HUD ve ızgara dışarıda kalır: çerçeve sabit dururken yalnız orta
            alan değişir, ekran baştan kurulmuş gibi hissettirmez.

            Daha önce burada üç animasyon üst üste biniyordu — PageTransition'ın
            opaklığı, kartın kendi y kayması ve formun sekme geçişi. Çarpım
            hâlinde içerik gözle görülür bir süre yarı saydam kalıyordu. */}
        <AnimatePresence mode="wait" initial={false}>
          {!checked ? (
            <motion.div
              key="checking"
              className="gate-auth-main gate-auth-main--checking"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <span className="gate-checking-mark" aria-hidden="true" />
              <p>Çalışma alanı hazırlanıyor</p>
            </motion.div>
          ) : (
            <motion.main
              key="form"
              className="gate-auth-main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="gate-form-card">
                <div className="gate-form-heading">
                  <p className="gate-eyebrow">Güvenli müşteri erişimi</p>
                  <h2>{isLogin ? 'Tekrar hoş geldiniz.' : 'Çalışma alanınızı açın.'}</h2>
                  <p>{isLogin ? 'Danışmanlık hesabınıza devam etmek için bilgilerinizi girin.' : 'Projelerinizi ve danışmanlık sürecinizi tek yerden yönetmeye başlayın.'}</p>
                </div>

                <div className="gate-tabs" role="tablist" aria-label="Hesap işlemi">
                  <button type="button" role="tab" aria-selected={isLogin} className={`gate-tab ${isLogin ? 'active' : ''}`} onClick={() => switchTab('login')}>Giriş yap</button>
                  <button type="button" role="tab" aria-selected={!isLogin} className={`gate-tab ${!isLogin ? 'active' : ''}`} onClick={() => switchTab('register')}>Hesap oluştur</button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={tab}
                    onSubmit={handleSubmit}
                    className="gate-form"
                    initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    {!isLogin && (
                      <label className="gate-field" htmlFor="customer-name">
                        <span>Ad Soyad</span>
                        <div><HiOutlineUser className="gate-field-icon" size={18} /><input id="customer-name" type="text" name="name" placeholder="Adınız ve soyadınız" value={form.name} onChange={handleChange} className="gate-input" autoComplete="name" required /></div>
                      </label>
                    )}

                    <label className="gate-field" htmlFor="customer-email">
                      <span>E-posta adresi</span>
                      <div><HiOutlineMail className="gate-field-icon" size={18} /><input id="customer-email" type="email" name="email" placeholder="ornek@marka.com" value={form.email} onChange={handleChange} className="gate-input" autoComplete="email" required /></div>
                    </label>

                    {!isLogin && (
                      <label className="gate-field" htmlFor="customer-phone">
                        <span>Telefon <small>İsteğe bağlı</small></span>
                        <div><HiOutlinePhone className="gate-field-icon" size={18} /><input id="customer-phone" type="tel" name="phone" placeholder="+90 5xx xxx xx xx" value={form.phone} onChange={handleChange} className="gate-input" autoComplete="tel" /></div>
                      </label>
                    )}

                    <label className="gate-field" htmlFor="customer-password">
                      <span>Şifre {!isLogin && <small>En az 12 karakter</small>}</span>
                      <div>
                        <HiOutlineLockClosed className="gate-field-icon" size={18} />
                        <input
                          id="customer-password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder={isLogin ? 'Şifreniz' : 'Güçlü bir şifre belirleyin'}
                          value={form.password}
                          onChange={handleChange}
                          onKeyUp={handlePasswordKey}
                          onKeyDown={handlePasswordKey}
                          onBlur={() => setCapsLock(false)}
                          className="gate-input"
                          autoComplete={isLogin ? 'current-password' : 'new-password'}
                          required
                        />
                        <button type="button" className="gate-field-eye" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}</button>
                      </div>

                      {capsLock && (
                        <span className="gate-field-note" role="status">
                          <HiOutlineExclamationCircle size={14} aria-hidden="true" /> Caps Lock açık.
                        </span>
                      )}

                      {strength >= 0 && (
                        <span className="gate-strength" data-level={strength}>
                          <span className="gate-strength-bar" aria-hidden="true">
                            {[0, 1, 2, 3].map((step) => <i key={step} data-on={step < strength} />)}
                          </span>
                          <small>{PASSWORD_LEVELS[strength]}</small>
                        </span>
                      )}
                    </label>

                    {!isLogin && (
                      <label className="gate-consent">
                        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required />
                        <span><a href="/kvkk">KVKK Aydınlatma Metni</a> ve <a href="/gizlilik">Gizlilik Politikası</a>'nı okudum; hesap verilerimin işlenmesini onaylıyorum.</span>
                      </label>
                    )}

                    <AnimatePresence>
                      {error && <motion.div className="gate-error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>{error}</motion.div>}
                    </AnimatePresence>

                    <button type="submit" className="gate-btn gate-submit" disabled={loading}>
                      <span>{loading ? (isLogin ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...') : (isLogin ? 'Çalışma alanına gir' : 'Hesabımı oluştur')}</span>
                      {!loading && <em aria-hidden="true">↗</em>}
                    </button>

                    <p className="gate-switch">
                      {isLogin ? 'Henüz hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}{' '}
                      <button type="button" className="gate-switch-btn" onClick={() => switchTab(isLogin ? 'register' : 'login')}>{isLogin ? 'Hesap oluşturun' : 'Giriş yapın'}</button>
                    </p>
                  </motion.form>
                </AnimatePresence>

                {/* Content AI ayrı bir hesap: yanlış kapıya gelen ziyaretçi burada
                    şifresini üç kez denemek yerine doğru kapıyı görsün. */}
                <a className="gate-crosslink" href="/kadeai/login">
                  <span>Content AI aramıştınız?</span>
                  <strong>İçerik araçlarına git <em aria-hidden="true">↗</em></strong>
                </a>

                <p className="gate-legal">Devam ederek veri işleme ilkelerimizi kabul etmiş olursunuz. <a href="/gizlilik">Gizlilik Politikası</a></p>
              </div>

              <footer className="gate-auth-meta">
                <span>İstanbul</span>
                <a href="https://kadenewmedia.com">kadenewmedia.com</a>
              </footer>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
