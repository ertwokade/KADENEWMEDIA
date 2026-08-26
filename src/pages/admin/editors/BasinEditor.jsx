import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const BASIN_DEFAULTS = {
  contactEmail: 'thekademedia@gmail.com',
  responseTime: '24 saat içinde',
  ctaTitle: 'Röportaj veya iş birliği mi istiyorsunuz?',
  ctaSubtitle: 'Sosyal medya, dijital pazarlama ve ajansçılık konularında görüş almak için bize ulaşın.',
  companyInfo: [
    { etiket: 'Şirket Adı', deger: 'Kade New Media Dijital Pazarlama A.Ş.' },
    { etiket: 'Kuruluş', deger: '2022, İstanbul' },
    { etiket: 'Merkez', deger: 'Biruni Teknopark, İstanbul' },
    { etiket: 'Çalışan Sayısı', deger: '10-25 kişi' },
    { etiket: 'Müşteri Sayısı', deger: '150+' },
    { etiket: 'Hizmet Verilen Sektör', deger: '15+ sektör' },
  ],
  logoPackages: [
    { isim: 'Ana Logo (SVG)', format: 'SVG', aciklama: 'Vektörel, her boyuta uyumlu', ikon: '🖼️', url: '' },
    { isim: 'Logo Paketi (PNG)', format: 'PNG', aciklama: 'Beyaz arkaplan üzeri, 300dpi', ikon: '📦', url: '' },
    { isim: 'Koyu Arkaplan Logo', format: 'PNG', aciklama: 'Koyu ve şeffaf arkaplan versiyonları', ikon: '🌙', url: '' },
    { isim: 'Marka Renkleri & Tipografi', format: 'PDF', aciklama: 'Hex kodları, font aileleri, kullanım rehberi', ikon: '🎨', url: '' },
  ],
  news: [
    { tarih: 'Mart 2025', kaynak: 'Dijital Pazarlama Dergisi', baslik: 'Türkiye\'nin Yükselen Sosyal Medya Ajansları: Kade New Media\'nın Büyüme Hikayesi', ozet: 'Biruni Teknopark merkezli ajans, kuruluşundan bu yana 150+ müşteriye ulaştı. Kurucusuyla yapılan röportaj.', ikon: '📰', renk: '#6C63FF', link: '' },
    { tarih: 'Şubat 2025', kaynak: 'StartupIstanbul', baslik: 'Teknopark\'tan Dünyaya: Kade New Media\'nın Ajans Modeli', ozet: 'İstanbul\'daki teknoloji ekosisteminde öne çıkan ajans modellerini inceleyen köşe yazısı.', ikon: '🚀', renk: '#eac321', link: '' },
  ],
}

function normalize(data) {
  const base = { ...BASIN_DEFAULTS, ...(data || {}) }
  return {
    contactEmail: base.contactEmail || BASIN_DEFAULTS.contactEmail,
    responseTime: base.responseTime || BASIN_DEFAULTS.responseTime,
    ctaTitle: base.ctaTitle || BASIN_DEFAULTS.ctaTitle,
    ctaSubtitle: base.ctaSubtitle || BASIN_DEFAULTS.ctaSubtitle,
    companyInfo: Array.isArray(base.companyInfo) && base.companyInfo.length ? base.companyInfo : BASIN_DEFAULTS.companyInfo,
    logoPackages: Array.isArray(base.logoPackages) && base.logoPackages.length ? base.logoPackages : BASIN_DEFAULTS.logoPackages,
    news: Array.isArray(base.news) ? base.news : BASIN_DEFAULTS.news,
  }
}

export default function BasinEditor({ data, onSave }) {
  const [form, setForm] = useState(() => normalize(data))

  useEffect(() => { setForm(normalize(data)) }, [data])

  const updateArrayItem = (key, index, field, value) => {
    const list = [...form[key]]
    list[index] = { ...list[index], [field]: value }
    setForm({ ...form, [key]: list })
  }
  const removeItem = (key, index) => {
    setForm({ ...form, [key]: form[key].filter((_, i) => i !== index) })
  }
  const addItem = (key, empty) => {
    setForm({ ...form, [key]: [...form[key], { ...empty }] })
  }

  return (
    <div className="admin-form">
      <h3>Basın Sayfası</h3>

      <h3 style={{ marginTop: 16 }}>İletişim & CTA</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Basın e-posta</label>
          <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Yanıt süresi</label>
          <input type="text" value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>CTA Başlığı</label>
        <input type="text" value={form.ctaTitle} onChange={(e) => setForm({ ...form, ctaTitle: e.target.value })} />
      </div>
      <div className="form-group">
        <label>CTA Alt Metni</label>
        <textarea rows="2" value={form.ctaSubtitle} onChange={(e) => setForm({ ...form, ctaSubtitle: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>Şirket Bilgileri</h3>
      {form.companyInfo.map((row, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Satır {i + 1}</strong>
            {form.companyInfo.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => removeItem('companyInfo', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Etiket</label>
              <input type="text" value={row.etiket || ''} onChange={(e) => updateArrayItem('companyInfo', i, 'etiket', e.target.value)} />
            </div>
            <div className="form-group"><label>Değer</label>
              <input type="text" value={row.deger || ''} onChange={(e) => updateArrayItem('companyInfo', i, 'deger', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => addItem('companyInfo', { etiket: '', deger: '' })}>
        <HiOutlinePlus size={14} /> Satır Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Logo & Marka Paketleri</h3>
      {form.logoPackages.map((pkg, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Paket {i + 1}</strong>
            {form.logoPackages.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => removeItem('logoPackages', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>İsim</label>
              <input type="text" value={pkg.isim || ''} onChange={(e) => updateArrayItem('logoPackages', i, 'isim', e.target.value)} />
            </div>
            <div className="form-group"><label>Format (SVG/PNG/PDF)</label>
              <input type="text" value={pkg.format || ''} onChange={(e) => updateArrayItem('logoPackages', i, 'format', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Açıklama</label>
              <input type="text" value={pkg.aciklama || ''} onChange={(e) => updateArrayItem('logoPackages', i, 'aciklama', e.target.value)} />
            </div>
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={pkg.ikon || ''} onChange={(e) => updateArrayItem('logoPackages', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
          </div>
          <div className="form-group">
            <label>İndirme Linki (URL, boş bırakılırsa butonsuz)</label>
            <input type="url" value={pkg.url || ''} onChange={(e) => updateArrayItem('logoPackages', i, 'url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => addItem('logoPackages', { isim: '', format: '', aciklama: '', ikon: '📦', url: '' })}>
        <HiOutlinePlus size={14} /> Paket Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Basın Haberleri</h3>
      {form.news.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Haber {i + 1}</strong>
            <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => removeItem('news', i)}>
              <HiOutlineTrash size={14} />
            </button>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Tarih</label>
              <input type="text" value={item.tarih || ''} onChange={(e) => updateArrayItem('news', i, 'tarih', e.target.value)} placeholder="Mart 2025" />
            </div>
            <div className="form-group"><label>Kaynak</label>
              <input type="text" value={item.kaynak || ''} onChange={(e) => updateArrayItem('news', i, 'kaynak', e.target.value)} placeholder="Forbes Türkiye" />
            </div>
          </div>
          <div className="form-group"><label>Başlık</label>
            <input type="text" value={item.baslik || ''} onChange={(e) => updateArrayItem('news', i, 'baslik', e.target.value)} />
          </div>
          <div className="form-group"><label>Özet</label>
            <textarea rows="2" value={item.ozet || ''} onChange={(e) => updateArrayItem('news', i, 'ozet', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={item.ikon || ''} onChange={(e) => updateArrayItem('news', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Renk (hex)</label>
              <input type="text" value={item.renk || ''} onChange={(e) => updateArrayItem('news', i, 'renk', e.target.value)} placeholder="#6C63FF" />
            </div>
          </div>
          <div className="form-group">
            <label>Haber Linki (URL, boş bırakılabilir)</label>
            <input type="url" value={item.link || ''} onChange={(e) => updateArrayItem('news', i, 'link', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => addItem('news', { tarih: '', kaynak: '', baslik: '', ozet: '', ikon: '📰', renk: '#6C63FF', link: '' })}>
        <HiOutlinePlus size={14} /> Haber Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
