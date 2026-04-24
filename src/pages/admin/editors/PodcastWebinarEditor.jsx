import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const PODCAST_DEFAULTS = {
  heroBadge: 'Podcast & Webinar',
  heroTitleBefore: 'Ajans bilgisini',
  heroTitleHighlight: 'açık kaynak',
  heroTitleAfter: ' paylaşıyoruz',
  heroSubtitle: 'Webinar, canlı yayın ve podcast içerikleriyle markaların dijital ekiplerine pratik rehberler.',
  ctaLabel: 'Katılım bilgisi al',
  ctaLink: '/iletisim',
  items: [
    { type: 'Webinar', title: '2026 Sosyal Medya Stratejisi', date: '30 Nisan 2026', ikon: '🎥' },
    { type: 'Podcast', title: 'Ajansla Çalışırken Brief Nasıl Verilir?', date: 'Yayında', ikon: '🎙️' },
    { type: 'Webinar', title: 'Meta Ads Bütçe Planlama Atölyesi', date: '14 Mayıs 2026', ikon: '🎥' },
  ],
}

function normalize(data) {
  const base = { ...PODCAST_DEFAULTS, ...(data || {}) }
  return {
    heroBadge: base.heroBadge || PODCAST_DEFAULTS.heroBadge,
    heroTitleBefore: base.heroTitleBefore ?? PODCAST_DEFAULTS.heroTitleBefore,
    heroTitleHighlight: base.heroTitleHighlight ?? PODCAST_DEFAULTS.heroTitleHighlight,
    heroTitleAfter: base.heroTitleAfter ?? PODCAST_DEFAULTS.heroTitleAfter,
    heroSubtitle: base.heroSubtitle || PODCAST_DEFAULTS.heroSubtitle,
    ctaLabel: base.ctaLabel || PODCAST_DEFAULTS.ctaLabel,
    ctaLink: base.ctaLink || PODCAST_DEFAULTS.ctaLink,
    items: Array.isArray(base.items) && base.items.length ? base.items : PODCAST_DEFAULTS.items,
  }
}

export default function PodcastWebinarEditor({ data, onSave }) {
  const [form, setForm] = useState(() => normalize(data))
  useEffect(() => { setForm(normalize(data)) }, [data])

  const upd = (key, i, field, value) => {
    const list = [...form[key]]
    list[i] = { ...list[i], [field]: value }
    setForm({ ...form, [key]: list })
  }
  const rm = (key, i) => setForm({ ...form, [key]: form[key].filter((_, idx) => idx !== i) })
  const add = (key, empty) => setForm({ ...form, [key]: [...form[key], { ...empty }] })

  return (
    <div className="admin-form">
      <h3>Podcast & Webinar Sayfası</h3>

      <h3 style={{ marginTop: 16 }}>Hero</h3>
      <div className="form-group"><label>Hero Badge</label>
        <input type="text" value={form.heroBadge} onChange={(e) => setForm({ ...form, heroBadge: e.target.value })} />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Başlık (vurgu öncesi)</label>
          <input type="text" value={form.heroTitleBefore} onChange={(e) => setForm({ ...form, heroTitleBefore: e.target.value })} />
        </div>
        <div className="form-group"><label>Vurgulu Kelime</label>
          <input type="text" value={form.heroTitleHighlight} onChange={(e) => setForm({ ...form, heroTitleHighlight: e.target.value })} />
        </div>
      </div>
      <div className="form-group"><label>Başlık (vurgu sonrası)</label>
        <input type="text" value={form.heroTitleAfter} onChange={(e) => setForm({ ...form, heroTitleAfter: e.target.value })} />
      </div>
      <div className="form-group"><label>Alt Metin</label>
        <textarea rows="2" value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>CTA Butonu</h3>
      <div className="form-row">
        <div className="form-group"><label>Buton Metni</label>
          <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
        </div>
        <div className="form-group"><label>Link</label>
          <input type="text" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/iletisim veya https://..." />
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Yayınlar</h3>
      {form.items.map((item, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Yayın {i + 1}</strong>
            {form.items.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('items', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={item.ikon || ''} onChange={(e) => upd('items', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Tür</label>
              <input type="text" value={item.type || ''} onChange={(e) => upd('items', i, 'type', e.target.value)} placeholder="Webinar / Podcast" />
            </div>
          </div>
          <div className="form-group"><label>Başlık</label>
            <input type="text" value={item.title || ''} onChange={(e) => upd('items', i, 'title', e.target.value)} />
          </div>
          <div className="form-group"><label>Tarih / Durum</label>
            <input type="text" value={item.date || ''} onChange={(e) => upd('items', i, 'date', e.target.value)} placeholder="30 Nisan 2026 veya Yayında" />
          </div>
          <div className="form-group"><label>Link (YouTube, Spotify vb. — boş bırakılabilir)</label>
            <input type="url" value={item.url || ''} onChange={(e) => upd('items', i, 'url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => add('items', { type: 'Webinar', title: '', date: '', ikon: '🎥' })}>
        <HiOutlinePlus size={14} /> Yayın Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
