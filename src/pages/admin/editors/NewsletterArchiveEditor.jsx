import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const DEFAULTS = {
  items: [
    { title: 'Nisan 2026 Sosyal Medya Trendleri', date: '12 Nisan 2026', desc: 'Reels dağıtımı, TikTok arama ve LinkedIn carousel performansı.' },
    { title: 'KOBİler için reklam bütçesi rehberi', date: '29 Mart 2026', desc: 'Meta ve Google Ads bütçesini ilk 90 gün nasıl bölüştürmeli?' },
    { title: 'İçerik takvimi örnekleri', date: '15 Mart 2026', desc: 'Restoran, klinik ve e-ticaret markaları için örnek yayın planları.' },
  ],
}

function normalize(data) {
  const base = data || {}
  return {
    items: Array.isArray(base.items) && base.items.length ? base.items : DEFAULTS.items,
  }
}

export default function NewsletterArchiveEditor({ data, onSave }) {
  const [form, setForm] = useState(() => normalize(data))
  useEffect(() => { setForm(normalize(data)) }, [data])

  const upd = (i, field, value) => {
    const list = [...form.items]
    list[i] = { ...list[i], [field]: value }
    setForm({ ...form, items: list })
  }
  const rm = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const add = () => setForm({ ...form, items: [...form.items, { title: '', date: '', desc: '' }] })

  return (
    <div className="admin-form">
      <h3>Bülten Arşivi</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        /bulten-arsivi sayfasında gösterilecek newsletter başlıkları.
      </p>

      {form.items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Bülten {i + 1}</strong>
            {form.items.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm(i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-group"><label>Başlık</label>
            <input type="text" value={item.title || ''} onChange={(e) => upd(i, 'title', e.target.value)} placeholder="Bülten başlığı" />
          </div>
          <div className="form-group"><label>Tarih</label>
            <input type="text" value={item.date || ''} onChange={(e) => upd(i, 'date', e.target.value)} placeholder="12 Nisan 2026" />
          </div>
          <div className="form-group"><label>Özet</label>
            <textarea rows="2" value={item.desc || ''} onChange={(e) => upd(i, 'desc', e.target.value)} placeholder="Kısa açıklama..." />
          </div>
        </div>
      ))}

      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={add}>
        <HiOutlinePlus size={14} /> Bülten Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
