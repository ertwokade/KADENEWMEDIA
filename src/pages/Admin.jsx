import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineLogin, HiOutlineLogout, HiOutlineHome,
  HiOutlinePencilAlt, HiOutlineNewspaper, HiOutlineUsers,
  HiOutlineMail, HiOutlineCog, HiOutlineTrash,
  HiOutlinePlus, HiOutlineSave, HiOutlineEye,
  HiOutlineX, HiOutlineMenuAlt3, HiOutlineDatabase,
  HiOutlineKey, HiOutlineCheck, HiOutlinePencil,
} from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import {
  loginApi, changePasswordApi,
  getBlogsApi, createBlogApi, updateBlogApi, deleteBlogApi,
  getContentApi, updateContentApi,
  getPartnersApi, createPartnerApi, updatePartnerApi, deletePartnerApi,
  getMessagesApi, markMessageReadApi, deleteMessageApi,
  seedApi, isLocalMode,
} from '../api'
import './Admin.css'

// Toast component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return <div className={`admin-toast ${type}`}>{message}</div>
}

// ========== LOGIN SCREEN ==========
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginApi(username, password)
      localStorage.setItem('kade_admin_token', data.token)
      localStorage.setItem('kade_admin_user', JSON.stringify(data.user))
      onLogin(data)
    } catch (err) {
      // Fallback: local login when backend API is unavailable
      if (username === 'admin' && password === 'admin123') {
        const localData = {
          token: 'local-dev-token-' + Date.now(),
          user: { username: 'admin', role: 'admin' }
        }
        localStorage.setItem('kade_admin_token', localData.token)
        localStorage.setItem('kade_admin_user', JSON.stringify(localData.user))
        onLogin(localData)
      } else {
        setError(err.message || 'Geçersiz kullanıcı adı veya şifre')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="admin-login-container">
        <div className="grid-bg" />
        <motion.div
          className="admin-login-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-logo">kade<span>admin</span></div>
          <h2>Yönetici Girişi</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Kullanıcı Adı</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin..."
                className={error ? 'error' : ''}
                required
              />
              {error && <span className="error-text">{error}</span>}
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'} <HiOutlineLogin size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  )
}

// ========== DASHBOARD ==========
function DashboardSection({ stats }) {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Gösterge <span>Paneli</span></h1>
          <p>Kade Media yönetim paneline hoş geldiniz</p>
        </div>
      </div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.10)', color: '#6C63FF' }}>📝</div>
          <div className="stat-number">{stats.blogs || 0}</div>
          <div className="stat-label">Blog Yazısı</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234, 195, 33, 0.10)', color: '#eac321' }}>🤝</div>
          <div className="stat-number">{stats.partners || 0}</div>
          <div className="stat-label">Partner</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(46, 204, 113, 0.10)', color: '#2ECC71' }}>✉️</div>
          <div className="stat-number">{stats.messages || 0}</div>
          <div className="stat-label">Mesaj</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(233, 30, 99, 0.10)', color: '#E91E63' }}>📩</div>
          <div className="stat-number">{stats.unreadMessages || 0}</div>
          <div className="stat-label">Okunmamış Mesaj</div>
        </div>
      </div>
    </div>
  )
}

// ========== BLOG MANAGEMENT ==========
function BlogSection({ showToast }) {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [form, setForm] = useState({
    titleTr: '', titleEn: '', excerptTr: '', excerptEn: '',
    contentTr: '', contentEn: '', category: '', categoryEn: '',
    slug: '', image: '', color: '#eac321', readTime: 5,
  })

  const colors = ['#6C63FF', '#E91E63', '#eac321', '#2ECC71', '#00BCD4', '#9C27B0', '#FF9800', '#607D8B']

  const fetchBlogs = async () => {
    try {
      const data = await getBlogsApi()
      setBlogs(Array.isArray(data) ? data : [])
    } catch {
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBlogs() }, [])

  const resetForm = () => {
    setForm({
      titleTr: '', titleEn: '', excerptTr: '', excerptEn: '',
      contentTr: '', contentEn: '', category: '', categoryEn: '',
      slug: '', image: '', color: '#eac321', readTime: 5,
    })
    setEditingBlog(null)
    setShowForm(false)
  }

  const handleEdit = (blog) => {
    setForm({
      titleTr: blog.titleTr || '', titleEn: blog.titleEn || '',
      excerptTr: blog.excerptTr || '', excerptEn: blog.excerptEn || '',
      contentTr: blog.contentTr || '', contentEn: blog.contentEn || '',
      category: blog.category || '', categoryEn: blog.categoryEn || '',
      slug: blog.slug || '', image: blog.image || '',
      color: blog.color || '#eac321', readTime: blog.readTime || 5,
    })
    setEditingBlog(blog)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — yazma işlemi yapılamaz.', 'error'); return }
    try {
      if (editingBlog) {
        await updateBlogApi({ id: editingBlog._id, ...form })
        showToast('Blog yazısı güncellendi!', 'success')
      } else {
        await createBlogApi(form)
        showToast('Blog yazısı oluşturuldu!', 'success')
      }
      resetForm()
      fetchBlogs()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — silme işlemi yapılamaz.', 'error'); return }
    if (!window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return
    try {
      await deleteBlogApi(id)
      showToast('Blog yazısı silindi!', 'success')
      fetchBlogs()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const generateSlug = (title) => {
    return title.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Blog <span>Yönetimi</span></h1>
          <p>Blog yazılarını oluşturun, düzenleyin veya silin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <HiOutlinePlus size={18} /> Yeni Yazı
        </button>
      </div>

      {/* Blog Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => resetForm()}
          >
            <motion.div
              className="admin-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h3>{editingBlog ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}</h3>
                <button className="admin-modal-close" onClick={resetForm}><HiOutlineX size={18} /></button>
              </div>

              <div className="admin-form" style={{ border: 'none', padding: 0 }}>
                <div className="admin-tabs">
                  <button className="admin-tab active">İçerik</button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Başlık (TR) *</label>
                    <input
                      type="text"
                      value={form.titleTr}
                      onChange={(e) => {
                        setForm({ ...form, titleTr: e.target.value, slug: form.slug || generateSlug(e.target.value) })
                      }}
                      placeholder="Blog yazısı başlığı..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Başlık (EN)</label>
                    <input
                      type="text"
                      value={form.titleEn}
                      onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                      placeholder="Blog post title..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Slug (URL) *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="blog-yazisi-slug"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Özet (TR)</label>
                    <textarea
                      rows="3"
                      value={form.excerptTr}
                      onChange={(e) => setForm({ ...form, excerptTr: e.target.value })}
                      placeholder="Kısa özet..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Özet (EN)</label>
                    <textarea
                      rows="3"
                      value={form.excerptEn}
                      onChange={(e) => setForm({ ...form, excerptEn: e.target.value })}
                      placeholder="Short excerpt..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>İçerik (TR)</label>
                    <textarea
                      rows="6"
                      value={form.contentTr}
                      onChange={(e) => setForm({ ...form, contentTr: e.target.value })}
                      placeholder="Blog yazısı içeriği..."
                    />
                  </div>
                  <div className="form-group">
                    <label>İçerik (EN)</label>
                    <textarea
                      rows="6"
                      value={form.contentEn}
                      onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                      placeholder="Blog post content..."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kategori (TR)</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Sosyal Medya"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori (EN)</label>
                    <input
                      type="text"
                      value={form.categoryEn}
                      onChange={(e) => setForm({ ...form, categoryEn: e.target.value })}
                      placeholder="Social Media"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Okuma Süresi (dk)</label>
                    <input
                      type="number"
                      value={form.readTime}
                      onChange={(e) => setForm({ ...form, readTime: parseInt(e.target.value) || 5 })}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fotoğraf URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                    {form.image && form.image.startsWith('http') && (
                      <img
                        src={form.image}
                        alt="Önizleme"
                        style={{ marginTop: '8px', maxHeight: '100px', borderRadius: '8px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Renk</label>
                  <div className="emoji-grid">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`emoji-btn ${form.color === c ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, color: c })}
                        style={{ background: `${c}25` }}
                      >
                        <span className="color-dot" style={{ background: c }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button className="btn btn-outline" onClick={resetForm}>İptal</button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    <HiOutlineSave size={16} /> {editingBlog ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog List */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Tüm Yazılar ({blogs.length})</h3>
        </div>
        {loading ? (
          <div className="admin-empty-state"><p>Yükleniyor...</p></div>
        ) : blogs.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">📝</div>
            <h3>Henüz blog yazısı yok</h3>
            <p>Yeni bir blog yazısı oluşturarak başlayın</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>İkon</th>
                <th>Başlık</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id}>
                  <td>
                    {blog.image && blog.image.startsWith('http') ? (
                      <img src={blog.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>{blog.image || '-'}</span>
                    )}
                  </td>
                  <td>
                    <strong>{blog.titleTr}</strong>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>/{blog.slug}</div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: `${blog.color}20`, color: blog.color }}>
                      {blog.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{blog.date}</td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" onClick={() => handleEdit(blog)}>
                        <HiOutlinePencil size={14} /> Düzenle
                      </button>
                      <button className="table-action-btn danger" onClick={() => handleDelete(blog._id)}>
                        <HiOutlineTrash size={14} /> Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ========== CONTENT MANAGEMENT ==========
function ContentSection({ showToast }) {
  const [activeTab, setActiveTab] = useState('hero')
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchContent = async () => {
    try {
      const data = await getContentApi()
      if (Array.isArray(data)) {
        const mapped = {}
        data.forEach((item) => { mapped[item.section] = item.data })
        setContent(mapped)
      }
    } catch (err) {
      console.warn('Content fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContent() }, [])

  const handleSave = async (section, data) => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — içerik güncellenemez.', 'error'); return }
    try {
      await updateContentApi(section, data)
      showToast('İçerik güncellendi!', 'success')
      fetchContent()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const tabs = [
    { id: 'hero', label: '🏠 Hero', desc: 'Anasayfa başlık ve açıklama' },
    { id: 'stats', label: '📊 İstatistikler', desc: 'Sayaç verileri' },
    { id: 'services', label: '⚡ Hizmetler', desc: 'Hizmet kartları' },
    { id: 'faq', label: '❓ SSS', desc: 'Sıkça sorulan sorular' },
    { id: 'testimonials', label: '💬 Referanslar', desc: 'Müşteri yorumları' },
    { id: 'packages', label: '💰 Paketler', desc: 'Fiyatlandırma' },
    { id: 'about', label: '👥 Hakkımızda', desc: 'Hakkımızda sayfası' },
    { id: 'footer', label: '🦶 Footer', desc: 'Alt bilgi, iletişim ve sosyal medya' },
    { id: 'careers', label: '💼 Kariyer', desc: 'İş ilanları' },
  ]

  if (loading) return <div className="admin-empty-state"><p>Yükleniyor...</p></div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>İçerik <span>Yönetimi</span></h1>
          <p>Site içeriklerini buradan düzenleyebilirsiniz</p>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hero' && (
        <HeroEditor
          data={content.hero || { tr: { title1: '', title2: '', subtitle: '' }, en: { title1: '', title2: '', subtitle: '' } }}
          onSave={(data) => handleSave('hero', data)}
        />
      )}

      {activeTab === 'stats' && (
        <StatsEditor
          data={content.stats || { clients: '150+', followers: '2M+', campaigns: '500+', satisfaction: '98%' }}
          onSave={(data) => handleSave('stats', data)}
        />
      )}

      {activeTab === 'services' && (
        <ServicesEditor
          data={content.services || { items: [] }}
          onSave={(data) => handleSave('services', data)}
        />
      )}

      {activeTab === 'faq' && (
        <FAQEditor
          data={content.faq || { tr: [], en: [] }}
          onSave={(data) => handleSave('faq', data)}
        />
      )}

      {activeTab === 'testimonials' && (
        <TestimonialsEditor
          data={content.testimonials || { items: [] }}
          onSave={(data) => handleSave('testimonials', data)}
        />
      )}

      {activeTab === 'packages' && (
        <PackagesEditor
          data={content.packages || { items: [] }}
          onSave={(data) => handleSave('packages', data)}
        />
      )}

      {activeTab === 'about' && (
        <AboutEditor
          data={content.about || {}}
          onSave={(data) => handleSave('about', data)}
        />
      )}

      {activeTab === 'footer' && (
        <FooterEditor
          data={content.footer || {}}
          onSave={(data) => handleSave('footer', data)}
        />
      )}

      {activeTab === 'careers' && (
        <CareersEditor
          data={content.careers || { tr: [], en: [] }}
          onSave={(data) => handleSave('careers', data)}
        />
      )}
    </div>
  )
}

function HeroEditor({ data, onSave }) {
  const [form, setForm] = useState(data)
  const [langTab, setLangTab] = useState('tr')

  useEffect(() => { setForm(data) }, [data])

  return (
    <div className="admin-form">
      <h3>Hero Section Metinleri</h3>
      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button className={`admin-tab ${langTab === 'tr' ? 'active' : ''}`} onClick={() => setLangTab('tr')}>🇹🇷 Türkçe</button>
        <button className={`admin-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>🇬🇧 English</button>
      </div>
      <div className="form-group">
        <label>Ana Başlık (1. Satır)</label>
        <input
          type="text"
          value={form[langTab]?.title1 || ''}
          onChange={(e) => setForm({ ...form, [langTab]: { ...form[langTab], title1: e.target.value } })}
        />
      </div>
      <div className="form-group">
        <label>Ana Başlık (2. Satır - Renkli)</label>
        <input
          type="text"
          value={form[langTab]?.title2 || ''}
          onChange={(e) => setForm({ ...form, [langTab]: { ...form[langTab], title2: e.target.value } })}
        />
      </div>
      <div className="form-group">
        <label>Alt Açıklama</label>
        <textarea
          rows="3"
          value={form[langTab]?.subtitle || ''}
          onChange={(e) => setForm({ ...form, [langTab]: { ...form[langTab], subtitle: e.target.value } })}
        />
      </div>
      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

function StatsEditor({ data, onSave }) {
  const [form, setForm] = useState(data)

  useEffect(() => { setForm(data) }, [data])

  return (
    <div className="admin-form">
      <h3>Anasayfa İstatistikler</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Müşteri Sayısı</label>
          <input type="text" value={form.clients || ''} onChange={(e) => setForm({ ...form, clients: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Takipçi Sayısı</label>
          <input type="text" value={form.followers || ''} onChange={(e) => setForm({ ...form, followers: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Kampanya Sayısı</label>
          <input type="text" value={form.campaigns || ''} onChange={(e) => setForm({ ...form, campaigns: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Memnuniyet Oranı</label>
          <input type="text" value={form.satisfaction || ''} onChange={(e) => setForm({ ...form, satisfaction: e.target.value })} />
        </div>
      </div>
      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

function FooterEditor({ data, onSave }) {
  const [form, setForm] = useState(data)

  useEffect(() => { setForm(data) }, [data])

  return (
    <div className="admin-form">
      <h3>Footer & İletişim Bilgileri</h3>
      <div className="form-row">
        <div className="form-group">
          <label>E-posta</label>
          <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Telefon</label>
          <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>Adres</label>
        <input type="text" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <h3 style={{ marginTop: 24 }}>Sosyal Medya Linkleri</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Instagram</label>
          <input type="url" value={form.instagram || ''} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>
        <div className="form-group">
          <label>X (Twitter)</label>
          <input type="url" value={form.twitter || ''} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>YouTube</label>
          <input type="url" value={form.youtube || ''} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
        </div>
        <div className="form-group">
          <label>TikTok</label>
          <input type="url" value={form.tiktok || ''} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>LinkedIn</label>
          <input type="url" value={form.linkedin || ''} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
        </div>
        <div className="form-group">
          <label>WhatsApp</label>
          <input type="url" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
      </div>
      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

// ========== SERVICES EDITOR ==========
function ServicesEditor({ data, onSave }) {
  const emptyItem = { titleTr: '', titleEn: '', descTr: '', descEn: '', featuresTr: '', featuresEn: '' }
  const [items, setItems] = useState(data.items?.length ? data.items : [{ ...emptyItem }])

  useEffect(() => { if (data.items?.length) setItems(data.items) }, [data])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  return (
    <div className="admin-form">
      <h3>Hizmetler</h3>
      <p style={{ color: 'var(--gray-light)', fontSize: '0.85rem', marginBottom: 16 }}>
        Her hizmetin başlık, açıklama ve özelliklerini düzenleyin. Özellikler virgülle ayrılır.
      </p>
      {items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: 'var(--white)' }}>Hizmet {i + 1}</strong>
            {items.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                <HiOutlineTrash size={14} /> Sil
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Başlık (TR)</label>
              <input type="text" value={item.titleTr || ''} onChange={(e) => updateItem(i, 'titleTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Başlık (EN)</label>
              <input type="text" value={item.titleEn || ''} onChange={(e) => updateItem(i, 'titleEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Açıklama (TR)</label>
              <textarea rows="2" value={item.descTr || ''} onChange={(e) => updateItem(i, 'descTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Açıklama (EN)</label>
              <textarea rows="2" value={item.descEn || ''} onChange={(e) => updateItem(i, 'descEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Özellikler (TR, virgülle)</label>
              <input type="text" value={item.featuresTr || ''} onChange={(e) => updateItem(i, 'featuresTr', e.target.value)} placeholder="Özellik 1, Özellik 2, ..." />
            </div>
            <div className="form-group"><label>Özellikler (EN, virgülle)</label>
              <input type="text" value={item.featuresEn || ''} onChange={(e) => updateItem(i, 'featuresEn', e.target.value)} placeholder="Feature 1, Feature 2, ..." />
            </div>
          </div>
        </div>
      ))}
      <div className="admin-form-actions" style={{ gap: 12 }}>
        <button className="btn btn-outline" onClick={() => setItems([...items, { ...emptyItem }])}>
          <HiOutlinePlus size={16} /> Yeni Hizmet Ekle
        </button>
        <button className="btn btn-primary" onClick={() => onSave({ items })}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

// ========== FAQ EDITOR ==========
function FAQEditor({ data, onSave }) {
  const [trItems, setTrItems] = useState(data.tr?.length ? data.tr : [{ q: '', a: '' }])
  const [enItems, setEnItems] = useState(data.en?.length ? data.en : [{ q: '', a: '' }])
  const [langTab, setLangTab] = useState('tr')

  useEffect(() => {
    if (data.tr?.length) setTrItems(data.tr)
    if (data.en?.length) setEnItems(data.en)
  }, [data])

  const items = langTab === 'tr' ? trItems : enItems
  const setItems = langTab === 'tr' ? setTrItems : setEnItems

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  return (
    <div className="admin-form">
      <h3>Sıkça Sorulan Sorular (SSS)</h3>
      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button className={`admin-tab ${langTab === 'tr' ? 'active' : ''}`} onClick={() => setLangTab('tr')}>🇹🇷 Türkçe</button>
        <button className={`admin-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>🇬🇧 English</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--white)' }}>Soru {i + 1}</strong>
            {items.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                <HiOutlineTrash size={14} /> Sil
              </button>
            )}
          </div>
          <div className="form-group"><label>Soru</label>
            <input type="text" value={item.q || ''} onChange={(e) => updateItem(i, 'q', e.target.value)} />
          </div>
          <div className="form-group"><label>Cevap</label>
            <textarea rows="3" value={item.a || ''} onChange={(e) => updateItem(i, 'a', e.target.value)} />
          </div>
        </div>
      ))}
      <div className="admin-form-actions" style={{ gap: 12 }}>
        <button className="btn btn-outline" onClick={() => setItems([...items, { q: '', a: '' }])}>
          <HiOutlinePlus size={16} /> Yeni Soru Ekle
        </button>
        <button className="btn btn-primary" onClick={() => onSave({ tr: trItems, en: enItems })}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

// ========== TESTIMONIALS EDITOR ==========
function TestimonialsEditor({ data, onSave }) {
  const emptyItem = { nameTr: '', nameEn: '', roleTr: '', roleEn: '', textTr: '', textEn: '', avatar: '', color: '#eac321' }
  const [items, setItems] = useState(data.items?.length ? data.items : [{ ...emptyItem }])

  useEffect(() => { if (data.items?.length) setItems(data.items) }, [data])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const colors = ['#eac321', '#6C63FF', '#2ECC71', '#E91E63', '#00BCD4', '#FF9800']

  return (
    <div className="admin-form">
      <h3>Müşteri Referansları</h3>
      {items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: 'var(--white)' }}>Referans {i + 1}</strong>
            {items.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                <HiOutlineTrash size={14} /> Sil
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Ad Soyad (TR)</label>
              <input type="text" value={item.nameTr || ''} onChange={(e) => updateItem(i, 'nameTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Ad Soyad (EN)</label>
              <input type="text" value={item.nameEn || ''} onChange={(e) => updateItem(i, 'nameEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Unvan (TR)</label>
              <input type="text" value={item.roleTr || ''} onChange={(e) => updateItem(i, 'roleTr', e.target.value)} placeholder="CEO, Şirket Adı" />
            </div>
            <div className="form-group"><label>Unvan (EN)</label>
              <input type="text" value={item.roleEn || ''} onChange={(e) => updateItem(i, 'roleEn', e.target.value)} placeholder="CEO, Company Name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Yorum (TR)</label>
              <textarea rows="3" value={item.textTr || ''} onChange={(e) => updateItem(i, 'textTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Yorum (EN)</label>
              <textarea rows="3" value={item.textEn || ''} onChange={(e) => updateItem(i, 'textEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Avatar (İnisiyaller, ör: AY)</label>
              <input type="text" value={item.avatar || ''} onChange={(e) => updateItem(i, 'avatar', e.target.value)} maxLength={3} />
            </div>
            <div className="form-group"><label>Renk</label>
              <div className="emoji-grid">
                {colors.map((c) => (
                  <button key={c} type="button" className={`emoji-btn ${item.color === c ? 'selected' : ''}`}
                    onClick={() => updateItem(i, 'color', c)} style={{ background: `${c}25` }}>
                    <span className="color-dot" style={{ background: c }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="admin-form-actions" style={{ gap: 12 }}>
        <button className="btn btn-outline" onClick={() => setItems([...items, { ...emptyItem }])}>
          <HiOutlinePlus size={16} /> Yeni Referans Ekle
        </button>
        <button className="btn btn-primary" onClick={() => onSave({ items })}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

// ========== PACKAGES EDITOR ==========
function PackagesEditor({ data, onSave }) {
  const emptyItem = {
    nameTr: '', nameEn: '', descTr: '', descEn: '',
    priceTRY: '', priceUSD: '', tier: 'starter', popular: false,
    featuresTr: '', featuresEn: '',
  }
  const [items, setItems] = useState(data.items?.length ? data.items : [{ ...emptyItem }])

  useEffect(() => { if (data.items?.length) setItems(data.items) }, [data])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  return (
    <div className="admin-form">
      <h3>Paketler & Fiyatlandırma</h3>
      <p style={{ color: 'var(--gray-light)', fontSize: '0.85rem', marginBottom: 16 }}>
        Paket özelliklerini virgülle ayırarak yazın.
      </p>
      {items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: 'var(--white)' }}>Paket {i + 1}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-lighter)', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={item.popular || false} onChange={(e) => updateItem(i, 'popular', e.target.checked)} /> Popüler
              </label>
              {items.length > 1 && (
                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                  <HiOutlineTrash size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Paket Adı (TR)</label>
              <input type="text" value={item.nameTr || ''} onChange={(e) => updateItem(i, 'nameTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Paket Adı (EN)</label>
              <input type="text" value={item.nameEn || ''} onChange={(e) => updateItem(i, 'nameEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Açıklama (TR)</label>
              <textarea rows="2" value={item.descTr || ''} onChange={(e) => updateItem(i, 'descTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Açıklama (EN)</label>
              <textarea rows="2" value={item.descEn || ''} onChange={(e) => updateItem(i, 'descEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Fiyat (TRY)</label>
              <input type="text" value={item.priceTRY || ''} onChange={(e) => updateItem(i, 'priceTRY', e.target.value)} placeholder="7.500" />
            </div>
            <div className="form-group"><label>Fiyat (USD)</label>
              <input type="text" value={item.priceUSD || ''} onChange={(e) => updateItem(i, 'priceUSD', e.target.value)} placeholder="220" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Özellikler (TR, virgülle)</label>
              <textarea rows="3" value={item.featuresTr || ''} onChange={(e) => updateItem(i, 'featuresTr', e.target.value)} placeholder="2 Platform Yönetimi, Aylık 20 İçerik, ..." />
            </div>
            <div className="form-group"><label>Özellikler (EN, virgülle)</label>
              <textarea rows="3" value={item.featuresEn || ''} onChange={(e) => updateItem(i, 'featuresEn', e.target.value)} placeholder="2 Platform Management, 20 Monthly Posts, ..." />
            </div>
          </div>
        </div>
      ))}
      <div className="admin-form-actions" style={{ gap: 12 }}>
        <button className="btn btn-outline" onClick={() => setItems([...items, { ...emptyItem }])}>
          <HiOutlinePlus size={16} /> Yeni Paket Ekle
        </button>
        <button className="btn btn-primary" onClick={() => onSave({ items })}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

// ========== ABOUT EDITOR ==========
function AboutEditor({ data, onSave }) {
  const [form, setForm] = useState({
    storyTr: data.storyTr || '',
    storyEn: data.storyEn || '',
    missionTr: data.missionTr || '',
    missionEn: data.missionEn || '',
    experience: data.experience || '8+',
    teamSize: data.teamSize || '5+',
    clients: data.clients || '100+',
    team: data.team || [],
  })
  const [langTab, setLangTab] = useState('tr')

  useEffect(() => {
    setForm({
      storyTr: data.storyTr || '',
      storyEn: data.storyEn || '',
      missionTr: data.missionTr || '',
      missionEn: data.missionEn || '',
      experience: data.experience || '8+',
      teamSize: data.teamSize || '5+',
      clients: data.clients || '100+',
      team: data.team || [],
    })
  }, [data])

  const emptyMember = { name: '', roleTr: '', roleEn: '', avatar: '' }

  const updateTeam = (index, field, value) => {
    const updated = [...form.team]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, team: updated })
  }

  return (
    <div className="admin-form">
      <h3>Hakkımızda Sayfası</h3>
      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button className={`admin-tab ${langTab === 'tr' ? 'active' : ''}`} onClick={() => setLangTab('tr')}>🇹🇷 Türkçe</button>
        <button className={`admin-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>🇬🇧 English</button>
      </div>

      <div className="form-group"><label>Hikayemiz</label>
        <textarea rows="4"
          value={langTab === 'tr' ? form.storyTr : form.storyEn}
          onChange={(e) => setForm({ ...form, [langTab === 'tr' ? 'storyTr' : 'storyEn']: e.target.value })}
        />
      </div>
      <div className="form-group"><label>Misyonumuz</label>
        <textarea rows="3"
          value={langTab === 'tr' ? form.missionTr : form.missionEn}
          onChange={(e) => setForm({ ...form, [langTab === 'tr' ? 'missionTr' : 'missionEn']: e.target.value })}
        />
      </div>

      <h3 style={{ marginTop: 24 }}>İstatistikler</h3>
      <div className="form-row">
        <div className="form-group"><label>Deneyim (Yıl)</label>
          <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
        </div>
        <div className="form-group"><label>Ekip Büyüklüğü</label>
          <input type="text" value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} />
        </div>
        <div className="form-group"><label>Müşteri Sayısı</label>
          <input type="text" value={form.clients} onChange={(e) => setForm({ ...form, clients: e.target.value })} />
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Ekip Üyeleri</h3>
      {form.team.map((member, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--white)' }}>Üye {i + 1}</strong>
            {form.team.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => setForm({ ...form, team: form.team.filter((_, idx) => idx !== i) })}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Ad Soyad</label>
              <input type="text" value={member.name || ''} onChange={(e) => updateTeam(i, 'name', e.target.value)} />
            </div>
            <div className="form-group"><label>Avatar (İnisiyaller)</label>
              <input type="text" value={member.avatar || ''} onChange={(e) => updateTeam(i, 'avatar', e.target.value)} maxLength={3} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Unvan (TR)</label>
              <input type="text" value={member.roleTr || ''} onChange={(e) => updateTeam(i, 'roleTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Unvan (EN)</label>
              <input type="text" value={member.roleEn || ''} onChange={(e) => updateTeam(i, 'roleEn', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <div className="admin-form-actions" style={{ gap: 12 }}>
        <button className="btn btn-outline" onClick={() => setForm({ ...form, team: [...form.team, { ...emptyMember }] })}>
          <HiOutlinePlus size={16} /> Yeni Üye Ekle
        </button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}

function CareersEditor({ data, onSave }) {
  const [form, setForm] = useState(data)
  const [langTab, setLangTab] = useState('tr')

  useEffect(() => { setForm(data) }, [data])

  const jobs = form[langTab] || []

  const updateJob = (index, field, value) => {
    const updated = [...jobs]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, [langTab]: updated })
  }

  const addJob = () => {
    setForm({
      ...form,
      [langTab]: [...jobs, { title: '', department: '', location: '', type: '', description: '', requirements: [] }],
    })
  }

  const removeJob = (index) => {
    setForm({ ...form, [langTab]: jobs.filter((_, i) => i !== index) })
  }

  return (
    <div className="admin-form">
      <h3>Kariyer / İş İlanları</h3>
      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        <button className={`admin-tab ${langTab === 'tr' ? 'active' : ''}`} onClick={() => setLangTab('tr')}>🇹🇷 Türkçe</button>
        <button className={`admin-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>🇬🇧 English</button>
      </div>

      {jobs.map((job, i) => (
        <div key={i} className="admin-form" style={{ border: '1px solid var(--border-color)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong>İlan #{i + 1}</strong>
            <button className="btn-icon danger" onClick={() => removeJob(i)} title="Sil">🗑️</button>
          </div>
          <div className="form-group">
            <label>Pozisyon</label>
            <input type="text" value={job.title || ''} onChange={(e) => updateJob(i, 'title', e.target.value)} />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Departman</label>
              <input type="text" value={job.department || ''} onChange={(e) => updateJob(i, 'department', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Lokasyon</label>
              <input type="text" value={job.location || ''} onChange={(e) => updateJob(i, 'location', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Çalışma Şekli</label>
              <input type="text" value={job.type || ''} onChange={(e) => updateJob(i, 'type', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Açıklama</label>
            <textarea rows={3} value={job.description || ''} onChange={(e) => updateJob(i, 'description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Gereksinimler (her satıra bir tane)</label>
            <textarea rows={4} value={(job.requirements || []).join('\n')} onChange={(e) => updateJob(i, 'requirements', e.target.value.split('\n').filter(r => r.trim()))} />
          </div>
        </div>
      ))}

      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={addJob}>+ Yeni İlan Ekle</button>
      <br />
      <button className="btn btn-primary" onClick={() => onSave(form)}>💾 Kaydet</button>
    </div>
  )
}

// ========== PARTNERS MANAGEMENT ==========
function PartnersSection({ showToast }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [form, setForm] = useState({
    slug: '', name: '', category: '', categoryEn: '', logo: '🏢', color: '#eac321',
    descTr: '', descEn: '', longDescTr: '', longDescEn: '',
    servicesTr: '', servicesEn: '', resultsTr: '', resultsEn: '',
  })

  const emojis = ['🍕', '💻', '🌿', '👗', '🐾', '💪', '🏢', '🎮', '📚', '✈️', '🎨', '🎵']

  const fetchPartners = async () => {
    try {
      const data = await getPartnersApi()
      setPartners(Array.isArray(data) ? data : [])
    } catch {
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPartners() }, [])

  const resetForm = () => {
    setForm({
      slug: '', name: '', category: '', categoryEn: '', logo: '🏢', color: '#eac321',
      descTr: '', descEn: '', longDescTr: '', longDescEn: '',
      servicesTr: '', servicesEn: '', resultsTr: '', resultsEn: '',
    })
    setEditingPartner(null)
    setShowForm(false)
  }

  const handleEdit = (partner) => {
    setForm({
      slug: partner.id || '', name: partner.name || '',
      category: partner.category || '', categoryEn: partner.categoryEn || '',
      logo: partner.logo || '🏢', color: partner.color || '#eac321',
      descTr: partner.descTr || '', descEn: partner.descEn || '',
      longDescTr: partner.longDescTr || '', longDescEn: partner.longDescEn || '',
      servicesTr: (partner.servicesTr || []).join(', '),
      servicesEn: (partner.servicesEn || []).join(', '),
      resultsTr: (partner.resultsTr || []).join(', '),
      resultsEn: (partner.resultsEn || []).join(', '),
    })
    setEditingPartner(partner)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — yazma işlemi yapılamaz.', 'error'); return }
    const payload = {
      id: form.slug,
      name: form.name, category: form.category, categoryEn: form.categoryEn,
      logo: form.logo, color: form.color,
      descTr: form.descTr, descEn: form.descEn,
      longDescTr: form.longDescTr, longDescEn: form.longDescEn,
      servicesTr: form.servicesTr.split(',').map((s) => s.trim()).filter(Boolean),
      servicesEn: form.servicesEn.split(',').map((s) => s.trim()).filter(Boolean),
      resultsTr: form.resultsTr.split(',').map((s) => s.trim()).filter(Boolean),
      resultsEn: form.resultsEn.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      if (editingPartner) {
        await updatePartnerApi({ ...payload, _id: editingPartner._id })
        showToast('Partner güncellendi!', 'success')
      } else {
        await createPartnerApi(payload)
        showToast('Partner oluşturuldu!', 'success')
      }
      resetForm()
      fetchPartners()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — silme işlemi yapılamaz.', 'error'); return }
    if (!window.confirm('Bu partneri silmek istediğinize emin misiniz?')) return
    try {
      await deletePartnerApi(id)
      showToast('Partner silindi!', 'success')
      fetchPartners()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Partner <span>Yönetimi</span></h1>
          <p>Sponsorları ve partnerleri yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <HiOutlinePlus size={18} /> Yeni Partner
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}>
            <motion.div className="admin-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{editingPartner ? 'Partneri Düzenle' : 'Yeni Partner'}</h3>
                <button className="admin-modal-close" onClick={resetForm}><HiOutlineX size={18} /></button>
              </div>
              <div className="admin-form" style={{ border: 'none', padding: 0 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>ID (URL slug)</label>
                    <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="partner-slug" />
                  </div>
                  <div className="form-group">
                    <label>İsim</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Partner Adı" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kategori (TR)</label>
                    <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kategori (EN)</label>
                    <input type="text" value={form.categoryEn} onChange={(e) => setForm({ ...form, categoryEn: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Logo (Emoji)</label>
                  <div className="emoji-grid">
                    {emojis.map((e) => (
                      <button key={e} type="button" className={`emoji-btn ${form.logo === e ? 'selected' : ''}`} onClick={() => setForm({ ...form, logo: e })}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kısa Açıklama (TR)</label>
                    <textarea rows="2" value={form.descTr} onChange={(e) => setForm({ ...form, descTr: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kısa Açıklama (EN)</label>
                    <textarea rows="2" value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Detaylı Açıklama (TR)</label>
                    <textarea rows="3" value={form.longDescTr} onChange={(e) => setForm({ ...form, longDescTr: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Detaylı Açıklama (EN)</label>
                    <textarea rows="3" value={form.longDescEn} onChange={(e) => setForm({ ...form, longDescEn: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hizmetler TR (virgülle ayır)</label>
                    <input type="text" value={form.servicesTr} onChange={(e) => setForm({ ...form, servicesTr: e.target.value })} placeholder="Hizmet 1, Hizmet 2, ..." />
                  </div>
                  <div className="form-group">
                    <label>Hizmetler EN (virgülle ayır)</label>
                    <input type="text" value={form.servicesEn} onChange={(e) => setForm({ ...form, servicesEn: e.target.value })} placeholder="Service 1, Service 2, ..." />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sonuçlar TR (virgülle ayır)</label>
                    <input type="text" value={form.resultsTr} onChange={(e) => setForm({ ...form, resultsTr: e.target.value })} placeholder="%300 artış, 50K takipçi, ..." />
                  </div>
                  <div className="form-group">
                    <label>Sonuçlar EN (virgülle ayır)</label>
                    <input type="text" value={form.resultsEn} onChange={(e) => setForm({ ...form, resultsEn: e.target.value })} placeholder="300% increase, 50K followers, ..." />
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button className="btn btn-outline" onClick={resetForm}>İptal</button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    <HiOutlineSave size={16} /> {editingPartner ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Partnerler ({partners.length})</h3>
        </div>
        {loading ? (
          <div className="admin-empty-state"><p>Yükleniyor...</p></div>
        ) : partners.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">🤝</div>
            <h3>Henüz partner yok</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>İsim</th>
                <th>Kategori</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p._id}>
                  <td><span style={{ fontSize: '1.5rem' }}>{p.logo}</span></td>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="status-badge" style={{ background: `${p.color}20`, color: p.color }}>{p.category}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" onClick={() => handleEdit(p)}><HiOutlinePencil size={14} /> Düzenle</button>
                      <button className="table-action-btn danger" onClick={() => handleDelete(p._id)}><HiOutlineTrash size={14} /> Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ========== MESSAGES ==========
function MessagesSection({ showToast, onNewMessageCount }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)

  const fetchMessages = async () => {
    try {
      const data = await getMessagesApi()
      const arr = Array.isArray(data) ? data : []
      setMessages(arr)
      onNewMessageCount(arr.filter((m) => !m.read).length)
    } catch {
      setMessages([])
      onNewMessageCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessages() }, [])

  const handleRead = async (msg) => {
    setSelectedMessage(msg)
    if (!msg.read) {
      try {
        await markMessageReadApi(msg._id)
        fetchMessages()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDelete = async (id) => {
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — silme işlemi yapılamaz.', 'error'); return }
    if (!window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) return
    try {
      await deleteMessageApi(id)
      showToast('Mesaj silindi!', 'success')
      setSelectedMessage(null)
      fetchMessages()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>İletişim <span>Mesajları</span></h1>
          <p>İletişim formundan gelen mesajları görüntüleyin</p>
        </div>
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMessage(null)}>
            <motion.div className="admin-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Mesaj Detayı</h3>
                <button className="admin-modal-close" onClick={() => setSelectedMessage(null)}><HiOutlineX size={18} /></button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><strong style={{ color: 'var(--accent)' }}>Ad:</strong> {selectedMessage.name}</div>
                <div><strong style={{ color: 'var(--accent)' }}>E-posta:</strong> <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--accent)' }}>{selectedMessage.email}</a></div>
                <div><strong style={{ color: 'var(--accent)' }}>Telefon:</strong> {selectedMessage.phone}</div>
                <div><strong style={{ color: 'var(--accent)' }}>Şirket:</strong> {selectedMessage.company}</div>
                <div><strong style={{ color: 'var(--accent)' }}>Hizmet:</strong> {selectedMessage.service}</div>
                <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                  <strong style={{ color: 'var(--accent)' }}>Mesaj:</strong>
                  <p style={{ marginTop: 8, lineHeight: 1.6 }}>{selectedMessage.message}</p>
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  {new Date(selectedMessage.createdAt).toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-outline" style={{ color: '#ff4444', borderColor: '#ff4444' }} onClick={() => handleDelete(selectedMessage._id)}>
                  <HiOutlineTrash size={16} /> Sil
                </button>
                <a href={`mailto:${selectedMessage.email}`} className="btn btn-primary">
                  <HiOutlineMail size={16} /> Yanıtla
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Tüm Mesajlar ({messages.length})</h3>
        </div>
        {loading ? (
          <div className="admin-empty-state"><p>Yükleniyor...</p></div>
        ) : messages.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">✉️</div>
            <h3>Henüz mesaj yok</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Ad</th>
                <th>E-posta</th>
                <th>Mesaj</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg._id} className={!msg.read ? 'message-unread' : ''}>
                  <td>
                    <span className={`status-badge ${msg.read ? 'read' : 'unread'}`}>
                      {msg.read ? 'Okundu' : 'Yeni'}
                    </span>
                  </td>
                  <td><strong>{msg.name}</strong></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{msg.email}</td>
                  <td><span className="message-preview">{msg.message}</span></td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(msg.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" onClick={() => handleRead(msg)}>
                        <HiOutlineEye size={14} /> Gör
                      </button>
                      <button className="table-action-btn danger" onClick={() => handleDelete(msg._id)}>
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ========== SETTINGS ==========
function SettingsSection({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (isLocalMode()) { showToast('Sunucu bağlantısı yok — şifre değiştirilemez.', 'error'); return }
    if (newPassword !== confirmPassword) {
      showToast('Yeni şifreler eşleşmiyor!', 'error')
      return
    }
    if (newPassword.length < 4) {
      showToast('Şifre en az 4 karakter olmalı!', 'error')
      return
    }
    setLoading(true)
    try {
      await changePasswordApi(currentPassword, newPassword)
      showToast('Şifre başarıyla değiştirildi!', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeedLoading(true)
    try {
      const result = await seedApi()
      showToast('Veritabanı başarıyla oluşturuldu!', 'success')
      console.log('Seed result:', result)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Ayarlar <span>& Güvenlik</span></h1>
          <p>Şifre değiştirme ve veritabanı işlemleri</p>
        </div>
      </div>

      {/* Seed Database */}
      <div className="seed-section">
        <h3>🗄️ Veritabanı Başlat</h3>
        <p>İlk kurulumda veritabanına varsayılan verileri yüklemek için kullanın. Zaten veri varsa tekrar yüklemez.</p>
        <button className="btn btn-primary" onClick={handleSeed} disabled={seedLoading}>
          <HiOutlineDatabase size={16} /> {seedLoading ? 'Yükleniyor...' : 'Veritabanını Başlat'}
        </button>
      </div>

      {/* Change Password */}
      <div className="admin-form password-section">
        <h3>🔐 Şifre Değiştir</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Mevcut Şifre</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mevcut şifreniz..."
              required
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifreniz..."
              required
            />
          </div>
          <div className="form-group">
            <label>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin..."
              required
            />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <HiOutlineKey size={16} /> {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ========== MAIN ADMIN COMPONENT ==========
export default function Admin() {
  const [isAuth, setIsAuth] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Stats for dashboard
  const [stats, setStats] = useState({ blogs: 0, partners: 0, messages: 0, unreadMessages: 0 })

  useEffect(() => {
    const token = localStorage.getItem('kade_admin_token')
    if (token) {
      setIsAuth(true)
      setLocalMode(isLocalMode())
      loadStats()
    }
  }, [])

  const loadStats = async () => {
    try {
      const [blogs, partners, messages] = await Promise.all([
        getBlogsApi().catch(() => []),
        getPartnersApi().catch(() => []),
        getMessagesApi().catch(() => []),
      ])
      const blogArr = Array.isArray(blogs) ? blogs : []
      const partnerArr = Array.isArray(partners) ? partners : []
      const messageArr = Array.isArray(messages) ? messages : []
      const unread = messageArr.filter((m) => !m.read).length
      setStats({
        blogs: blogArr.length,
        partners: partnerArr.length,
        messages: messageArr.length,
        unreadMessages: unread,
      })
      setUnreadCount(unread)
    } catch (err) {
      console.error('Stats load error:', err)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const [localMode, setLocalMode] = useState(false)

  const handleLogin = (data) => {
    setIsAuth(true)
    setLocalMode(isLocalMode())
    loadStats()
  }

  const handleLogout = () => {
    localStorage.removeItem('kade_admin_token')
    localStorage.removeItem('kade_admin_user')
    setIsAuth(false)
    setLocalMode(false)
  }

  const navItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: HiOutlineHome },
    { id: 'blog', label: 'Blog Yazıları', icon: HiOutlineNewspaper },
    { id: 'content', label: 'İçerik Yönetimi', icon: HiOutlinePencilAlt },
    { id: 'partners', label: 'Partnerler', icon: HiOutlineUsers },
    { id: 'messages', label: 'Mesajlar', icon: HiOutlineMail, badge: unreadCount },
    { id: 'settings', label: 'Ayarlar', icon: HiOutlineCog },
  ]

  if (!isAuth) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <PageTransition>
      <div className="admin-dashboard">
        <div className="grid-bg" />

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 300 }}
        >
          <HiOutlineMenuAlt3 size={20} />
        </button>

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div className="admin-logo">kade<span>admin</span></div>
            <p>Yönetim Paneli</p>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(item.id)
                  setSidebarOpen(false)
                  if (item.id === 'dashboard') loadStats()
                }}
              >
                <item.icon size={18} />
                {item.label}
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-nav-item" onClick={handleLogout}>
              <HiOutlineLogout size={18} /> Çıkış Yap
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {localMode && (
            <div className="local-mode-banner">
              ⚠️ Çevrimdışı Mod — Sunucu bağlantısı yok. Veriler okunamıyor, yazma işlemleri çalışmaz.
            </div>
          )}
          {activeSection === 'dashboard' && <DashboardSection stats={stats} />}
          {activeSection === 'blog' && <BlogSection showToast={showToast} />}
          {activeSection === 'content' && <ContentSection showToast={showToast} />}
          {activeSection === 'partners' && <PartnersSection showToast={showToast} />}
          {activeSection === 'messages' && <MessagesSection showToast={showToast} onNewMessageCount={(count) => setUnreadCount(count)} />}
          {activeSection === 'settings' && <SettingsSection showToast={showToast} />}
        </main>

        {/* Toast */}
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
