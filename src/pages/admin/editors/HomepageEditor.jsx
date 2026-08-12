import { useEffect, useState } from 'react'
import { HiOutlinePlus, HiOutlineSave, HiOutlineTrash } from 'react-icons/hi'

function TextList({ title, items, onChange, placeholder }) {
  const update = (index, value) => onChange(items.map((item, i) => i === index ? value : item))
  const remove = (index) => onChange(items.filter((_, i) => i !== index))
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <strong>{title}</strong>
        <button type="button" className="btn btn-outline" onClick={() => onChange([...items, ''])}>
          <HiOutlinePlus size={15} /> Satır ekle
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
          <input value={item} onChange={(event) => update(index, event.target.value)} placeholder={placeholder} />
          <button type="button" className="table-action-btn danger" onClick={() => remove(index)} aria-label={`${title} satırını sil`}>
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

function LinkList({ title, items, onChange, work = false }) {
  const update = (index, field, value) => onChange(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  const remove = (index) => onChange(items.filter((_, i) => i !== index))
  const empty = work ? { title: '', label: 'Hizmet', url: '/', image: '' } : { label: '', url: '/' }
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <strong>{title}</strong>
        <button type="button" className="btn btn-outline" onClick={() => onChange([...items, empty])}>
          <HiOutlinePlus size={15} /> Ekle
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="glass-card" style={{ padding: 14, marginBottom: 10 }}>
          <div className="form-row">
            <div className="form-group">
              <label>{work ? 'Başlık' : 'Menü adı'}</label>
              <input value={work ? item.title || '' : item.label || ''} onChange={(event) => update(index, work ? 'title' : 'label', event.target.value)} />
            </div>
            <div className="form-group">
              <label>Bağlantı</label>
              <input value={item.url || ''} onChange={(event) => update(index, 'url', event.target.value)} placeholder="/hizmetler veya https://..." />
            </div>
          </div>
          {work && (
            <div className="form-row">
              <div className="form-group">
                <label>Etiket</label>
                <input value={item.label || ''} onChange={(event) => update(index, 'label', event.target.value)} placeholder="Hizmet" />
              </div>
              <div className="form-group">
                <label>Görsel URL (isteğe bağlı)</label>
                <input value={item.image || ''} onChange={(event) => update(index, 'image', event.target.value)} placeholder="/img/ornek.webp veya https://..." />
              </div>
            </div>
          )}
          <button type="button" className="table-action-btn danger" onClick={() => remove(index)}>
            <HiOutlineTrash size={15} /> Sil
          </button>
        </div>
      ))}
    </div>
  )
}

export default function HomepageEditor({ data, onSave }) {
  const [form, setForm] = useState(data)
  useEffect(() => { setForm(data) }, [data])

  const setHero = (field, value) => setForm((current) => ({ ...current, hero: { ...current.hero, [field]: value } }))
  const setIntro = (field, value) => setForm((current) => ({ ...current, intro: { ...current.intro, [field]: value } }))

  return (
    <div className="admin-form">
      <h3>Haoqi Ana Sayfa</h3>
      <p style={{ color: 'var(--text-secondary)', marginTop: -8, marginBottom: 18 }}>
        Buradaki kayıtlar canlı ana sayfaya anında uygulanır. Menü, çalışma kartı ve sosyal bağlantı listelerine yeni öğe ekleyebilirsiniz.
      </p>

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Genel ve üst alan</h3>
        <div className="form-row">
          <div className="form-group"><label>Marka adı</label><input value={form.brandName || ''} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
          <div className="form-group"><label>Şehir</label><input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>SEO / tarayıcı başlığı</label><input value={form.seoTitle || ''} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></div>
        <div className="form-group"><label>SEO açıklaması</label><textarea rows={2} value={form.seoDescription || ''} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></div>
        <div className="form-row">
          <div className="form-group"><label>Koordinat / alt bilgi</label><input value={form.coordinates || ''} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} /></div>
          <div className="form-group"><label>Tema düğmesi</label><input value={form.themeLabel || ''} onChange={(e) => setForm({ ...form, themeLabel: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Vurgu rengi</label><input type="color" value={form.accentColor || '#e0a81f'} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} /></div>
          <div className="form-group"><label>Giriş düğmesi yazısı</label><input value={form.loginLabel || ''} onChange={(e) => setForm({ ...form, loginLabel: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Giriş düğmesi bağlantısı</label><input value={form.loginUrl || ''} onChange={(e) => setForm({ ...form, loginUrl: e.target.value })} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.showSignature !== false} onChange={(e) => setForm({ ...form, showSignature: e.target.checked })} /> İmza çizimini göster</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.showLogin !== false} onChange={(e) => setForm({ ...form, showLogin: e.target.checked })} /> Giriş düğmesini göster</label>
          </div>
        </div>
      </div>

      <LinkList title="Üst menü" items={form.navItems || []} onChange={(navItems) => setForm({ ...form, navItems })} />

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Hero metinleri</h3>
        <div className="form-row">
          <div className="form-group"><label>Kısa açıklama</label><input value={form.hero?.statement || ''} onChange={(e) => setHero('statement', e.target.value)} /></div>
          <div className="form-group"><label>Sağ açıklama</label><textarea rows={2} value={form.hero?.description || ''} onChange={(e) => setHero('description', e.target.value)} /></div>
        </div>
        <TextList title="Sol üst başlık satırları" items={form.hero?.kickerLines || []} onChange={(value) => setHero('kickerLines', value)} placeholder="Sosyal Medya &" />
        <TextList title="Büyük ana başlık satırları" items={form.hero?.titleLines || []} onChange={(value) => setHero('titleLines', value)} placeholder="BÜYÜTÜYORUZ" />
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Tanıtım metinleri</h3>
        <div className="form-group"><label>Birinci paragraf</label><textarea rows={3} value={form.intro?.primary || ''} onChange={(e) => setIntro('primary', e.target.value)} /></div>
        <div className="form-group"><label>İkinci paragraf</label><textarea rows={3} value={form.intro?.secondary || ''} onChange={(e) => setIntro('secondary', e.target.value)} /></div>
      </div>

      <LinkList title="Çalışma / hizmet kartları" items={form.workItems || []} onChange={(workItems) => setForm({ ...form, workItems })} work />
      <TextList title="Ara slogan satırları" items={form.statementLines || []} onChange={(statementLines) => setForm({ ...form, statementLines })} placeholder="MARKA" />
      <TextList title="İletişim başlığı satırları" items={form.contactLines || []} onChange={(contactLines) => setForm({ ...form, contactLines })} placeholder="BİRLİKTE" />

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>İletişim</h3>
        <div className="form-group"><label>E-posta</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <LinkList title="Sosyal bağlantılar" items={form.socialLinks || []} onChange={(socialLinks) => setForm({ ...form, socialLinks })} />
      </div>

      <div className="admin-form-actions">
        <button type="button" className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Ana sayfayı kaydet
        </button>
        <a className="btn btn-outline" href="/" target="_blank" rel="noopener noreferrer">Canlı önizleme</a>
      </div>
    </div>
  )
}
