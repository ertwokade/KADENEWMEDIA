import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const REFERRAL_DEFAULTS = {
  heroBadge: 'Referans Programı',
  heroTitleBefore: 'Bizi doğru markalarla',
  heroTitleHighlight: 'buluşturun',
  heroTitleAfter: ', birlikte büyüyelim',
  heroSubtitle: 'Dijital pazarlama desteğine ihtiyaç duyan bir işletme tanıyorsanız önerin. Anlaşma başladığında referral ödülünüzü takip edilebilir şekilde panelimize kaydedelim.',
  steps: [
    { ikon: '👥', baslik: 'Tanıdığınızı önerin', aciklama: 'Formdan marka veya işletme bilgisini paylaşın.' },
    { ikon: '📋', baslik: 'Ekibimiz görüşsün', aciklama: 'Uygun ihtiyaç varsa ücretsiz keşif görüşmesi planlayalım.' },
    { ikon: '💰', baslik: 'Ödül kazanın', aciklama: 'Anlaşma başladığında referral ödülünüzü tanımlayalım.' },
  ],
  rewardKicker: 'Ödül modeli',
  rewardTitle: 'İlk ay hizmet bedelinden %10\'a kadar referral ödülü',
  rewardText: 'Ödül oranı proje kapsamına göre netleştirilir ve anlaşma aktif olduktan sonra admin panelinden takip edilir.',
  serviceOptions: [
    'Sosyal Medya Yönetimi',
    'İçerik Üretimi',
    'Reklam Yönetimi',
    'Video Prodüksiyon',
    'Web Sitesi',
    'Strateji Danışmanlığı',
  ],
}

function normalize(data) {
  const base = { ...REFERRAL_DEFAULTS, ...(data || {}) }
  return {
    heroBadge: base.heroBadge || REFERRAL_DEFAULTS.heroBadge,
    heroTitleBefore: base.heroTitleBefore ?? REFERRAL_DEFAULTS.heroTitleBefore,
    heroTitleHighlight: base.heroTitleHighlight ?? REFERRAL_DEFAULTS.heroTitleHighlight,
    heroTitleAfter: base.heroTitleAfter ?? REFERRAL_DEFAULTS.heroTitleAfter,
    heroSubtitle: base.heroSubtitle || REFERRAL_DEFAULTS.heroSubtitle,
    steps: Array.isArray(base.steps) && base.steps.length ? base.steps : REFERRAL_DEFAULTS.steps,
    rewardKicker: base.rewardKicker || REFERRAL_DEFAULTS.rewardKicker,
    rewardTitle: base.rewardTitle || REFERRAL_DEFAULTS.rewardTitle,
    rewardText: base.rewardText || REFERRAL_DEFAULTS.rewardText,
    serviceOptions: Array.isArray(base.serviceOptions) && base.serviceOptions.length ? base.serviceOptions : REFERRAL_DEFAULTS.serviceOptions,
  }
}

export default function ReferralEditor({ data, onSave }) {
  const [form, setForm] = useState(() => normalize(data))
  useEffect(() => { setForm(normalize(data)) }, [data])

  const upd = (key, i, field, value) => {
    const list = [...form[key]]
    list[i] = { ...list[i], [field]: value }
    setForm({ ...form, [key]: list })
  }
  const updString = (key, i, value) => {
    const list = [...form[key]]
    list[i] = value
    setForm({ ...form, [key]: list })
  }
  const rm = (key, i) => setForm({ ...form, [key]: form[key].filter((_, idx) => idx !== i) })
  const add = (key, empty) => setForm({ ...form, [key]: [...form[key], empty] })

  return (
    <div className="admin-form">
      <h3>Referans Programı Sayfası</h3>

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
        <textarea rows="3" value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>Adımlar</h3>
      {form.steps.map((s, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Adım {i + 1}</strong>
            {form.steps.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('steps', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={s.ikon || ''} onChange={(e) => upd('steps', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Başlık</label>
              <input type="text" value={s.baslik || ''} onChange={(e) => upd('steps', i, 'baslik', e.target.value)} />
            </div>
          </div>
          <div className="form-group"><label>Açıklama</label>
            <textarea rows="2" value={s.aciklama || ''} onChange={(e) => upd('steps', i, 'aciklama', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => add('steps', { ikon: '✨', baslik: '', aciklama: '' })}>
        <HiOutlinePlus size={14} /> Adım Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Ödül Kartı</h3>
      <div className="form-group"><label>Etiket (Kicker)</label>
        <input type="text" value={form.rewardKicker} onChange={(e) => setForm({ ...form, rewardKicker: e.target.value })} />
      </div>
      <div className="form-group"><label>Başlık</label>
        <input type="text" value={form.rewardTitle} onChange={(e) => setForm({ ...form, rewardTitle: e.target.value })} />
      </div>
      <div className="form-group"><label>Açıklama</label>
        <textarea rows="2" value={form.rewardText} onChange={(e) => setForm({ ...form, rewardText: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>Hizmet Seçenekleri (Form)</h3>
      {form.serviceOptions.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" value={opt} onChange={(e) => updString('serviceOptions', i, e.target.value)} style={{ flex: 1 }} />
          {form.serviceOptions.length > 1 && (
            <button className="btn btn-outline" style={{ padding: '4px 12px' }} onClick={() => rm('serviceOptions', i)}>
              <HiOutlineTrash size={14} />
            </button>
          )}
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => add('serviceOptions', '')}>
        <HiOutlinePlus size={14} /> Hizmet Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
