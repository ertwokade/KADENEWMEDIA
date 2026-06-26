import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineUser, HiOutlineBriefcase, HiOutlineStar, HiOutlineShoppingBag,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineLogout, HiOutlineExclamationCircle,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import { useCustomer } from '../contexts/CustomerContext'
import { customerPortalApi } from '../api'
import PageTransition from '../components/PageTransition'
import './CustomerPortal.css'

const CONSULTING_LABELS = {
  'social-media': 'Sosyal Medya Yönetimi',
  'seo': 'SEO & Arama Motoru Optimizasyonu',
  'content': 'İçerik Üretimi',
  'ads': 'Reklam Yönetimi (Google / Meta)',
  'branding': 'Marka Kimliği & Tasarım',
  'web': 'Web Tasarım & Geliştirme',
  'email-marketing': 'E-posta Pazarlama',
  'analytics': 'Analitik & Raporlama',
  'consulting': 'Dijital Strateji Danışmanlığı',
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Aktif', cls: 'badge-active' },
    expired: { label: 'Süresi Doldu', cls: 'badge-expired' },
    cancelled: { label: 'İptal', cls: 'badge-cancelled' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`cp-badge ${s.cls}`}>{s.label}</span>
}

export default function CustomerPortal() {
  const { customer, checked, logout } = useCustomer()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useSEO({
    title: 'Müşteri Paneli | Kade Media',
    description: 'Paketlerinizi, danışmanlık hizmetlerinizi ve özelliklerinizi yönetin.',
    path: '/musteri-panel',
    noindex: true,
  })

  useEffect(() => {
    if (checked && !customer) navigate('/giris', { replace: true })
  }, [checked, customer, navigate])

  useEffect(() => {
    if (!customer) return
    setLoading(true)
    customerPortalApi()
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [customer])

  const handleLogout = async () => {
    await logout()
    navigate('/giris', { replace: true })
  }

  if (!checked || !customer) return null

  if (loading) {
    return (
      <PageTransition>
        <div className="cp-loading">
          <div className="cp-spinner" />
          <p>Yükleniyor...</p>
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="cp-error-page">
          <HiOutlineExclamationCircle size={48} />
          <h2>Bir hata oluştu</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Tekrar Dene</button>
        </div>
      </PageTransition>
    )
  }

  const { consultingAreas = [], features = [], packages = [] } = data || {}
  const hasPackages = packages.length > 0
  const activePackages = packages.filter(p => p.status === 'active')

  return (
    <PageTransition>
      <div className="cp-page">
        {/* Header */}
        <div className="cp-header">
          <div className="container cp-header-inner">
            <div className="cp-header-user">
              <div className="cp-avatar">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="cp-welcome">Hoş geldin, <span>{customer.name}</span></h1>
                <p className="cp-email">{customer.email}</p>
              </div>
            </div>
            <button type="button" className="cp-logout-btn" onClick={handleLogout}>
              <HiOutlineLogout size={18} />
              Çıkış Yap
            </button>
          </div>
        </div>

        <div className="container cp-container">
          {!hasPackages && (
            <motion.div
              className="cp-empty-state"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="cp-empty-icon">
                <HiOutlineShoppingBag size={32} color="var(--primary)" />
              </div>
              <h2>Henüz paket satın almadınız</h2>
              <p>Hizmetlerimize erişmek için bir paket satın alın.</p>
              <Link to="/paketler" className="btn btn-primary">Paketleri İncele</Link>
            </motion.div>
          )}

          <div className="cp-grid">
            {/* Bölüm 1: Danışmanlık Alanları */}
            <motion.div
              className="cp-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="cp-card-header">
                <div className="cp-card-icon">
                  <HiOutlineBriefcase size={22} />
                </div>
                <div>
                  <h2 className="cp-card-title">Danışmanlık Alanlarım</h2>
                  <p className="cp-card-subtitle">Aktif hizmetleriniz</p>
                </div>
              </div>

              {consultingAreas.length === 0 ? (
                <div className="cp-card-empty">
                  <p>Aktif danışmanlık hizmeti bulunmuyor.</p>
                  <Link to="/paketler" className="cp-link">Paketleri inceleyin →</Link>
                </div>
              ) : (
                <ul className="cp-list">
                  {consultingAreas.map((area, i) => (
                    <motion.li
                      key={area}
                      className="cp-list-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <HiOutlineCheckCircle size={18} className="cp-list-check" />
                      <span>{CONSULTING_LABELS[area] || area}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Bölüm 2: Özellikler */}
            <motion.div
              className="cp-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="cp-card-header">
                <div className="cp-card-icon">
                  <HiOutlineStar size={22} />
                </div>
                <div>
                  <h2 className="cp-card-title">Aktif Özelliklerim</h2>
                  <p className="cp-card-subtitle">{activePackages.length} aktif paket kapsamında</p>
                </div>
              </div>

              {features.length === 0 ? (
                <div className="cp-card-empty">
                  <p>Aktif özellik bulunmuyor.</p>
                </div>
              ) : (
                <div className="cp-features-grid">
                  {features.map((feature, i) => (
                    <motion.div
                      key={feature + i}
                      className="cp-feature-chip"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                    >
                      <HiOutlineCheckCircle size={14} />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Bölüm 3: Satın Alınan Paketler */}
            <motion.div
              className="cp-card cp-card-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="cp-card-header">
                <div className="cp-card-icon">
                  <HiOutlineShoppingBag size={22} />
                </div>
                <div>
                  <h2 className="cp-card-title">Satın Alınan Paketler</h2>
                  <p className="cp-card-subtitle">{packages.length} toplam paket</p>
                </div>
              </div>

              {packages.length === 0 ? (
                <div className="cp-card-empty">
                  <p>Henüz satın alınmış paket yok.</p>
                  <Link to="/paketler" className="cp-link">Paketleri inceleyin →</Link>
                </div>
              ) : (
                <div className="cp-packages-table">
                  {packages.map((pkg, i) => (
                    <motion.div
                      key={pkg.id || i}
                      className={`cp-package-row ${pkg.status === 'active' ? 'cp-package-active' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                    >
                      <div className="cp-package-info">
                        <p className="cp-package-name">{pkg.name}</p>
                        <p className="cp-package-meta">
                          <HiOutlineClock size={13} />
                          Satın alındı: {formatDate(pkg.purchasedAt)}
                          {pkg.expiresAt && <> · Bitiş: {formatDate(pkg.expiresAt)}</>}
                        </p>
                      </div>
                      <StatusBadge status={pkg.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Footer stats */}
          <motion.div
            className="cp-stats-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="cp-stat">
              <span className="cp-stat-num">{packages.length}</span>
              <span className="cp-stat-label">Toplam Paket</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-num">{activePackages.length}</span>
              <span className="cp-stat-label">Aktif Paket</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-num">{consultingAreas.length}</span>
              <span className="cp-stat-label">Danışmanlık Alanı</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-num">{features.length}</span>
              <span className="cp-stat-label">Aktif Özellik</span>
            </div>
          </motion.div>

          <div className="cp-support-banner">
            <HiOutlineUser size={18} />
            <span>Bir sorun mu var? <Link to="/iletisim" className="cp-link">Destek ekibimizle iletişime geçin</Link></span>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
