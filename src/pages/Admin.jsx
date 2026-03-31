import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineLogin, HiOutlineLogout, HiOutlineHome,
  HiOutlinePencilAlt, HiOutlineNewspaper, HiOutlineUsers,
  HiOutlineMail, HiOutlineCog, HiOutlineTrash,
  HiOutlinePlus, HiOutlineSave, HiOutlineEye,
  HiOutlineX, HiOutlineMenuAlt3, HiOutlineDatabase,
  HiOutlineKey, HiOutlineCheck, HiOutlinePencil,
  HiOutlineCalendar,
} from 'react-icons/hi'
import PageTransition from '../components/PageTransition'
import {
  loginApi, changePasswordApi,
  getBlogsApi, createBlogApi, updateBlogApi, deleteBlogApi,
  getContentApi, updateContentApi,
  getPartnersApi, createPartnerApi, updatePartnerApi, deletePartnerApi,
  getMessagesApi, markMessageReadApi, deleteMessageApi,
  seedApi,
  updateMessageStatusApi,
} from '../api'
import './Admin.css'

// Local mode is no longer supported — always returns false
function isLocalMode() { return false }

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
      setError(err.message || 'Geçersiz kullanıcı adı veya şifre')
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
const LEAD_STATUSES = [
  { value: 'yeni', label: 'Yeni', color: '#6C63FF' },
  { value: 'gorusme-bekliyor', label: 'Görüşme Bekliyor', color: '#eac321' },
  { value: 'teklif-gonderildi', label: 'Teklif Gönderildi', color: '#00BCD4' },
  { value: 'kazanildi', label: 'Kazanıldı', color: '#2ECC71' },
  { value: 'kaybedildi', label: 'Kaybedildi', color: '#ff4444' },
]

function LeadStatusBadge({ status }) {
  const s = LEAD_STATUSES.find((x) => x.value === status) || LEAD_STATUSES[0]
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: `${s.color}20`, color: s.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function MessagesSection({ showToast, onNewMessageCount }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

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

  const handleStatusChange = async (id, status) => {
    try {
      await updateMessageStatusApi(id, status)
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, status } : m))
      if (selectedMessage?._id === id) setSelectedMessage((p) => ({ ...p, status }))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
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

  const filteredMessages = filterStatus === 'all'
    ? messages
    : messages.filter((m) => (m.status || 'yeni') === filterStatus)

  const counts = LEAD_STATUSES.reduce((acc, s) => {
    acc[s.value] = messages.filter((m) => (m.status || 'yeni') === s.value).length
    return acc
  }, {})

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>İletişim <span>& CRM</span></h1>
          <p>Leadleri takip edin, durumlarını güncelleyin</p>
        </div>
      </div>

      {/* CRM Status Counters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          className={`table-action-btn ${filterStatus === 'all' ? 'primary' : ''}`}
          onClick={() => setFilterStatus('all')}
          style={{ padding: '8px 16px', borderRadius: 8 }}
        >
          Tümü ({messages.length})
        </button>
        {LEAD_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: `1px solid ${s.color}40`,
              background: filterStatus === s.value ? `${s.color}20` : 'transparent',
              color: s.color, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
            }}
          >
            {s.label} ({counts[s.value] || 0})
          </button>
        ))}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMessage(null)}>
            <motion.div className="admin-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Lead Detayı</h3>
                <button className="admin-modal-close" onClick={() => setSelectedMessage(null)}><HiOutlineX size={18} /></button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><strong style={{ color: 'var(--accent)' }}>Ad:</strong> {selectedMessage.name}</div>
                <div><strong style={{ color: 'var(--accent)' }}>E-posta:</strong> <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--accent)' }}>{selectedMessage.email}</a></div>
                <div><strong style={{ color: 'var(--accent)' }}>Telefon:</strong> {selectedMessage.phone}</div>
                <div><strong style={{ color: 'var(--accent)' }}>Şirket:</strong> {selectedMessage.company}</div>
                <div><strong style={{ color: 'var(--accent)' }}>Hizmet:</strong> {selectedMessage.service}</div>
                <div><strong style={{ color: 'var(--accent)' }}>Kaynak:</strong> {selectedMessage.source || 'iletisim-formu'}</div>
                <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginTop: 8 }}>
                  <strong style={{ color: 'var(--accent)' }}>Mesaj:</strong>
                  <p style={{ marginTop: 8, lineHeight: 1.6 }}>{selectedMessage.message}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--accent)' }}>Lead Durumu:</strong>
                  <select
                    value={selectedMessage.status || 'yeni'}
                    onChange={(e) => handleStatusChange(selectedMessage._id, e.target.value)}
                    style={{ marginLeft: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--white)', border: '1px solid var(--border-color)' }}
                  >
                    {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
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
          <h3>Mesajlar ({filteredMessages.length})</h3>
        </div>
        {loading ? (
          <div className="admin-empty-state"><p>Yükleniyor...</p></div>
        ) : filteredMessages.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">✉️</div>
            <h3>Mesaj bulunamadı</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Lead Durumu</th>
                <th>Ad</th>
                <th>E-posta</th>
                <th>Hizmet</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr key={msg._id} className={!msg.read ? 'message-unread' : ''}>
                  <td>
                    <LeadStatusBadge status={msg.status || 'yeni'} />
                  </td>
                  <td><strong>{msg.name}</strong><br /><span style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{msg.company !== '-' ? msg.company : ''}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{msg.email}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{msg.service !== '-' ? msg.service : '—'}</td>
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
  const [seedSecret, setSeedSecret] = useState('')

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
    if (!seedSecret) { showToast('Seed secret giriniz', 'error'); return }
    setSeedLoading(true)
    try {
      const result = await seedApi(seedSecret)
      showToast('Veritabanı başarıyla oluşturuldu!', 'success')
      setSeedSecret('')
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
        <p>İlk kurulumda veritabanına varsayılan verileri yüklemek için kullanın. Zaten veri varsa tekrar yüklemez. SEED_SECRET ortam değişkenini giriniz.</p>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            value={seedSecret}
            onChange={(e) => setSeedSecret(e.target.value)}
            placeholder="Seed secret..."
            className="form-input"
          />
        </div>
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

// ========== CONTENT CALENDAR ==========
function CalendarSection({ showToast }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    platform: 'instagram',
    type: 'post',
    time: '10:00',
    description: '',
    status: 'planned',
  })

  const currentYear = selectedDate.getFullYear()
  const currentMonth = selectedDate.getMonth()

  // Load events from API
  useEffect(() => {
    getContentApi('calendar')
      .then(res => {
        if (res?.data?.events) setEvents(res.data.events)
      })
      .catch(() => {})
  }, [])

  const saveEvents = async (updatedEvents) => {
    setEvents(updatedEvents)
    if (!isLocalMode()) {
      try {
        await updateContentApi('calendar', { events: updatedEvents })
        showToast('Takvim güncellendi!', 'success')
      } catch (err) {
        showToast(err.message, 'error')
      }
    }
  }

  // Calendar helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 // Monday start

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const platformIcons = { instagram: '📸', tiktok: '🎵', youtube: '🎬', twitter: '🐦', linkedin: '💼', facebook: '📘' }
  const statusColors = { planned: '#6C63FF', ready: '#eac321', published: '#2ECC71', cancelled: '#ff4444' }
  const statusLabels = { planned: 'Planlandı', ready: 'Hazır', published: 'Yayınlandı', cancelled: 'İptal' }
  const typeLabels = { post: 'Gönderi', story: 'Story', reel: 'Reels', video: 'Video', live: 'Canlı Yayın', ad: 'Reklam' }

  const getEventsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const today = new Date()
  const isToday = (day) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day

  const prevMonth = () => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
  const nextMonth = () => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))

  const openNewEvent = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setEventForm({ title: '', platform: 'instagram', type: 'post', time: '10:00', description: '', status: 'planned', date: dateStr })
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const openEditEvent = (event) => {
    setEventForm({ ...event })
    setEditingEvent(event)
    setShowEventForm(true)
  }

  const handleSaveEvent = () => {
    if (!eventForm.title.trim()) { showToast('Başlık gerekli', 'error'); return }
    let updated
    if (editingEvent) {
      updated = events.map(e => e.id === editingEvent.id ? { ...eventForm, id: editingEvent.id } : e)
    } else {
      updated = [...events, { ...eventForm, id: Date.now().toString() }]
    }
    saveEvents(updated)
    setShowEventForm(false)
  }

  const handleDeleteEvent = (id) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return
    saveEvents(events.filter(e => e.id !== id))
  }

  // Auto-generate suggestions
  const generateSuggestions = () => {
    const suggestions = [
      { title: 'Motivasyon Pazartesi', platform: 'instagram', type: 'post', time: '09:00', dayOffset: 0 },
      { title: 'Bilgi Paylaşımı', platform: 'instagram', type: 'reel', time: '12:00', dayOffset: 1 },
      { title: 'Müşteri Başarı Hikayesi', platform: 'instagram', type: 'story', time: '18:00', dayOffset: 2 },
      { title: 'Trend Analizi', platform: 'tiktok', type: 'video', time: '15:00', dayOffset: 3 },
      { title: 'Cuma İpuçları', platform: 'linkedin', type: 'post', time: '10:00', dayOffset: 4 },
    ]
    const newEvents = []
    for (let week = 0; week < 4; week++) {
      suggestions.forEach(s => {
        const date = new Date(currentYear, currentMonth, 1 + (week * 7) + s.dayOffset)
        if (date.getMonth() === currentMonth) {
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          if (!events.some(e => e.date === dateStr && e.title === s.title)) {
            newEvents.push({
              id: Date.now().toString() + Math.random(),
              title: s.title,
              platform: s.platform,
              type: s.type,
              time: s.time,
              description: '',
              status: 'planned',
              date: dateStr,
            })
          }
        }
      })
    }
    if (newEvents.length > 0) {
      saveEvents([...events, ...newEvents])
    } else {
      showToast('Bu ay için öneriler zaten eklenmiş', 'error')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>İçerik <span>Takvimi</span></h1>
          <p>Sosyal medya içeriklerinizi planlayın ve takip edin</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={generateSuggestions}>
            ✨ Otomatik Öner
          </button>
          <button className="btn btn-primary" onClick={() => openNewEvent(today.getDate())}>
            <HiOutlinePlus size={16} /> Yeni İçerik
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-outline" onClick={prevMonth}>← Önceki</button>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{monthNames[currentMonth]} {currentYear}</h2>
        <button className="btn btn-outline" onClick={nextMonth}>Sonraki →</button>
      </div>

      {/* Calendar Grid */}
      <div className="admin-form" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              {d}
            </div>
          ))}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: 100, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)', opacity: 0.5 }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = getEventsForDay(day)
            return (
              <div
                key={day}
                onClick={() => openNewEvent(day)}
                style={{
                  minHeight: 100,
                  padding: 6,
                  borderBottom: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isToday(day) ? 'rgba(234, 195, 33, 0.06)' : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!isToday(day)) e.currentTarget.style.background = 'var(--accent-alpha)' }}
                onMouseLeave={e => { if (!isToday(day)) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontWeight: isToday(day) ? 800 : 500, fontSize: '0.85rem', color: isToday(day) ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                  {day}
                </div>
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEditEvent(ev) }}
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginBottom: 2,
                      background: `${statusColors[ev.status]}20`,
                      color: statusColors[ev.status],
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}
                  >
                    {platformIcons[ev.platform]} {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>+{dayEvents.length - 3} daha</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[key] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Upcoming Events List */}
      <div className="admin-form" style={{ marginTop: 24 }}>
        <h3>📋 Bu Aydaki İçerikler ({events.filter(e => e.date?.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length})</h3>
        {events
          .filter(e => e.date?.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))
          .sort((a, b) => a.date.localeCompare(b.date) || a.time?.localeCompare(b.time))
          .map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {ev.date?.split('-')[2]}
              </div>
              <div style={{ fontSize: '1.2rem' }}>{platformIcons[ev.platform]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ev.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {ev.time} · {typeLabels[ev.type]}
                </div>
              </div>
              <span className="status-badge" style={{ background: `${statusColors[ev.status]}20`, color: statusColors[ev.status] }}>
                {statusLabels[ev.status]}
              </span>
              <button className="table-action-btn" onClick={() => openEditEvent(ev)}>
                <HiOutlinePencil size={14} />
              </button>
              <button className="table-action-btn danger" onClick={() => handleDeleteEvent(ev.id)}>
                <HiOutlineTrash size={14} />
              </button>
            </div>
          ))}
        {events.filter(e => e.date?.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length === 0 && (
          <div className="admin-empty-state">
            <div className="empty-icon">📅</div>
            <h3>Bu ay için planlanmış içerik yok</h3>
            <p>Takvimde bir güne tıklayarak veya "Otomatik Öner" butonuyla içerik ekleyin</p>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <AnimatePresence>
        {showEventForm && (
          <motion.div
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventForm(false)}
          >
            <motion.div
              className="admin-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 500 }}
            >
              <div className="admin-modal-header">
                <h3>{editingEvent ? 'İçeriği Düzenle' : 'Yeni İçerik Planla'}</h3>
                <button className="admin-modal-close" onClick={() => setShowEventForm(false)}>
                  <HiOutlineX size={18} />
                </button>
              </div>
              <div className="admin-form" style={{ border: 'none', padding: 0 }}>
                <div className="form-group">
                  <label>Başlık *</label>
                  <input type="text" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="İçerik başlığı..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Platform</label>
                    <select value={eventForm.platform} onChange={e => setEventForm({ ...eventForm, platform: e.target.value })}>
                      <option value="instagram">📸 Instagram</option>
                      <option value="tiktok">🎵 TikTok</option>
                      <option value="youtube">🎬 YouTube</option>
                      <option value="twitter">🐦 X (Twitter)</option>
                      <option value="linkedin">💼 LinkedIn</option>
                      <option value="facebook">📘 Facebook</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>İçerik Türü</label>
                    <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>
                      <option value="post">Gönderi</option>
                      <option value="story">Story</option>
                      <option value="reel">Reels</option>
                      <option value="video">Video</option>
                      <option value="live">Canlı Yayın</option>
                      <option value="ad">Reklam</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tarih</label>
                    <input type="date" value={eventForm.date || ''} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Saat</label>
                    <input type="time" value={eventForm.time || '10:00'} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Durum</label>
                  <select value={eventForm.status} onChange={e => setEventForm({ ...eventForm, status: e.target.value })}>
                    <option value="planned">📋 Planlandı</option>
                    <option value="ready">✅ Hazır</option>
                    <option value="published">🚀 Yayınlandı</option>
                    <option value="cancelled">❌ İptal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea rows={3} value={eventForm.description || ''} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="İçerik detayları, notlar..." />
                </div>
                <div className="admin-form-actions">
                  <button className="btn btn-outline" onClick={() => setShowEventForm(false)}>İptal</button>
                  <button className="btn btn-primary" onClick={handleSaveEvent}>
                    <HiOutlineSave size={16} /> {editingEvent ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    { id: 'calendar', label: 'İçerik Takvimi', icon: HiOutlineCalendar },
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
          {activeSection === 'calendar' && <CalendarSection showToast={showToast} />}
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
