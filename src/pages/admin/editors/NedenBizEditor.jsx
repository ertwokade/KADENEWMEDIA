import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const NEDENBIZ_DEFAULTS = {
  heroBadge: 'Fark Yaratan Ajans',
  heroSubtitle: 'Her ajans "en iyiyiz" der. Biz gösteriyoruz. İşte somut farklar.',
  ctaTitle: 'Farkı kendiniz görün',
  ctaSubtitle: '30 dakikalık ücretsiz strateji görüşmesiyle başlayın. Taahhüt yok, baskı yok.',
  rakamlar: [
    { sayi: '150+', etiket: 'Yönetilen Hesap', ikon: '📱' },
    { sayi: '%94', etiket: 'Müşteri Tutma Oranı', ikon: '🔄' },
    { sayi: '4.9/5', etiket: 'Ortalama Memnuniyet', ikon: '⭐' },
    { sayi: '2x', etiket: 'Ortalama Takipçi Büyümesi', ikon: '📈' },
  ],
  karsilastirma: [
    { kriter: 'İçerik Onay Süreci', biz: 'Aylık takvim, 3-5 gün önceden onay', diger: 'Genellikle son dakika' },
    { kriter: 'Aylık Raporlama', biz: 'Detaylı PDF rapor + görüşme', diger: 'Excel veya sözlü bilgilendirme' },
    { kriter: 'Dedicated Uzman', biz: 'Her müşteriye 1 dedicated yönetici', diger: 'Hesap paylaşımlı, anonim ekip' },
    { kriter: 'Platform Uzmanlığı', biz: 'Meta, Google, TikTok reklam yönetiminde aktif deneyim', diger: 'Sadece 1-2 platformda sınırlı deneyim' },
    { kriter: 'Şeffaf Fiyatlandırma', biz: 'Sabit aylık paket, gizli ücret yok', diger: 'Değişken, belirsiz fiyat' },
  ],
  avantajlar: [
    { ikon: '🎯', baslik: 'Sektöre Özel Strateji', aciklama: '15+ sektörde deneyimle her markanın dinamiklerine özel içerik ve reklam stratejisi.', renk: '#6C63FF' },
    { ikon: '⚡', baslik: '5 Günde Başlangıç', aciklama: 'Onboarding\'den ilk içeriğe kadar 5-7 iş günü. Diğer ajanslar haftalar alır.', renk: '#eac321' },
  ],
}

function normalize(data) {
  const base = { ...NEDENBIZ_DEFAULTS, ...(data || {}) }
  return {
    heroBadge: base.heroBadge || NEDENBIZ_DEFAULTS.heroBadge,
    heroSubtitle: base.heroSubtitle || NEDENBIZ_DEFAULTS.heroSubtitle,
    ctaTitle: base.ctaTitle || NEDENBIZ_DEFAULTS.ctaTitle,
    ctaSubtitle: base.ctaSubtitle || NEDENBIZ_DEFAULTS.ctaSubtitle,
    rakamlar: Array.isArray(base.rakamlar) && base.rakamlar.length ? base.rakamlar : NEDENBIZ_DEFAULTS.rakamlar,
    karsilastirma: Array.isArray(base.karsilastirma) && base.karsilastirma.length ? base.karsilastirma : NEDENBIZ_DEFAULTS.karsilastirma,
    avantajlar: Array.isArray(base.avantajlar) && base.avantajlar.length ? base.avantajlar : NEDENBIZ_DEFAULTS.avantajlar,
  }
}

export default function NedenBizEditor({ data, onSave }) {
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
      <h3>Neden Biz? Sayfası</h3>

      <h3 style={{ marginTop: 16 }}>Hero & CTA</h3>
      <div className="form-row">
        <div className="form-group"><label>Hero Badge</label>
          <input type="text" value={form.heroBadge} onChange={(e) => setForm({ ...form, heroBadge: e.target.value })} />
        </div>
      </div>
      <div className="form-group"><label>Hero Alt Metni</label>
        <textarea rows="2" value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
      </div>
      <div className="form-group"><label>CTA Başlığı</label>
        <input type="text" value={form.ctaTitle} onChange={(e) => setForm({ ...form, ctaTitle: e.target.value })} />
      </div>
      <div className="form-group"><label>CTA Alt Metni</label>
        <textarea rows="2" value={form.ctaSubtitle} onChange={(e) => setForm({ ...form, ctaSubtitle: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>Rakamlar (İstatistikler)</h3>
      {form.rakamlar.map((r, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Rakam {i + 1}</strong>
            {form.rakamlar.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('rakamlar', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Sayı</label>
              <input type="text" value={r.sayi || ''} onChange={(e) => upd('rakamlar', i, 'sayi', e.target.value)} />
            </div>
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={r.ikon || ''} onChange={(e) => upd('rakamlar', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
          </div>
          <div className="form-group"><label>Etiket</label>
            <input type="text" value={r.etiket || ''} onChange={(e) => upd('rakamlar', i, 'etiket', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => add('rakamlar', { sayi: '', etiket: '', ikon: '📊' })}>
        <HiOutlinePlus size={14} /> Rakam Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Karşılaştırma Tablosu</h3>
      {form.karsilastirma.map((row, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Satır {i + 1}</strong>
            {form.karsilastirma.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('karsilastirma', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-group"><label>Kriter</label>
            <input type="text" value={row.kriter || ''} onChange={(e) => upd('karsilastirma', i, 'kriter', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Biz</label>
              <input type="text" value={row.biz || ''} onChange={(e) => upd('karsilastirma', i, 'biz', e.target.value)} />
            </div>
            <div className="form-group"><label>Diğerleri</label>
              <input type="text" value={row.diger || ''} onChange={(e) => upd('karsilastirma', i, 'diger', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => add('karsilastirma', { kriter: '', biz: '', diger: '' })}>
        <HiOutlinePlus size={14} /> Karşılaştırma Satırı Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Avantajlar</h3>
      {form.avantajlar.map((a, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Avantaj {i + 1}</strong>
            {form.avantajlar.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('avantajlar', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={a.ikon || ''} onChange={(e) => upd('avantajlar', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Renk (hex)</label>
              <input type="text" value={a.renk || ''} onChange={(e) => upd('avantajlar', i, 'renk', e.target.value)} placeholder="#6C63FF" />
            </div>
          </div>
          <div className="form-group"><label>Başlık</label>
            <input type="text" value={a.baslik || ''} onChange={(e) => upd('avantajlar', i, 'baslik', e.target.value)} />
          </div>
          <div className="form-group"><label>Açıklama</label>
            <textarea rows="2" value={a.aciklama || ''} onChange={(e) => upd('avantajlar', i, 'aciklama', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => add('avantajlar', { ikon: '🎯', baslik: '', aciklama: '', renk: '#6C63FF' })}>
        <HiOutlinePlus size={14} /> Avantaj Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
