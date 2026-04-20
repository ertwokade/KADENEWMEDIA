import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const TESEKKUR_DEFAULTS = {
  baslik: 'Mesajınız iletildi!',
  altMetin: 'İletişim formunuzu aldık. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
  yanitSuresi: '2-4 saat',
  yanitSuresiNot: 'Hafta içi 09:00–18:00',
  adimlarBaslik: 'Bundan sonra ne olacak?',
  acilBaslik: 'Acil görüşme mi istiyorsunuz?',
  acilTelefon: '0506 729 34 23',
  acilTelefonTel: '+905067293423',
  adimlar: [
    { ikon: '📬', baslik: 'Onay E-postası', aciklama: 'Formunuz alındı. Birkaç dakika içinde otomatik bir onay e-postası alacaksınız.' },
    { ikon: '👤', baslik: 'Uzman Eşleştirme', aciklama: '1 iş günü içinde sektörünüze uygun bir uzmanımız sizinle iletişime geçecek.' },
    { ikon: '📋', baslik: 'Strateji Görüşmesi', aciklama: '30 dakikalık ücretsiz keşif görüşmesinde ihtiyaçlarınızı birlikte değerlendireceğiz.' },
    { ikon: '🚀', baslik: 'Özel Teklif', aciklama: 'Görüşmenin ardından size özel bir paket ve fiyat teklifi sunulacak.' },
  ],
}

function normalize(data) {
  const base = { ...TESEKKUR_DEFAULTS, ...(data || {}) }
  return {
    baslik: base.baslik || TESEKKUR_DEFAULTS.baslik,
    altMetin: base.altMetin || TESEKKUR_DEFAULTS.altMetin,
    yanitSuresi: base.yanitSuresi || TESEKKUR_DEFAULTS.yanitSuresi,
    yanitSuresiNot: base.yanitSuresiNot || TESEKKUR_DEFAULTS.yanitSuresiNot,
    adimlarBaslik: base.adimlarBaslik || TESEKKUR_DEFAULTS.adimlarBaslik,
    acilBaslik: base.acilBaslik || TESEKKUR_DEFAULTS.acilBaslik,
    acilTelefon: base.acilTelefon || TESEKKUR_DEFAULTS.acilTelefon,
    acilTelefonTel: base.acilTelefonTel || TESEKKUR_DEFAULTS.acilTelefonTel,
    adimlar: Array.isArray(base.adimlar) && base.adimlar.length ? base.adimlar : TESEKKUR_DEFAULTS.adimlar,
  }
}

export default function TesekkurEditor({ data, onSave }) {
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
      <h3>Teşekkür Sayfası</h3>

      <h3 style={{ marginTop: 16 }}>Başlık & Metinler</h3>
      <div className="form-group"><label>Başlık</label>
        <input type="text" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
      </div>
      <div className="form-group"><label>Alt Metin</label>
        <textarea rows="2" value={form.altMetin} onChange={(e) => setForm({ ...form, altMetin: e.target.value })} />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Yanıt Süresi</label>
          <input type="text" value={form.yanitSuresi} onChange={(e) => setForm({ ...form, yanitSuresi: e.target.value })} placeholder="2-4 saat" />
        </div>
        <div className="form-group"><label>Yanıt Süresi Notu</label>
          <input type="text" value={form.yanitSuresiNot} onChange={(e) => setForm({ ...form, yanitSuresiNot: e.target.value })} placeholder="Hafta içi 09:00–18:00" />
        </div>
      </div>
      <div className="form-group"><label>Adımlar Başlığı</label>
        <input type="text" value={form.adimlarBaslik} onChange={(e) => setForm({ ...form, adimlarBaslik: e.target.value })} />
      </div>

      <h3 style={{ marginTop: 24 }}>Sonraki Adımlar</h3>
      {form.adimlar.map((a, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Adım {i + 1}</strong>
            {form.adimlar.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rm('adimlar', i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={a.ikon || ''} onChange={(e) => upd('adimlar', i, 'ikon', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Başlık</label>
              <input type="text" value={a.baslik || ''} onChange={(e) => upd('adimlar', i, 'baslik', e.target.value)} />
            </div>
          </div>
          <div className="form-group"><label>Açıklama</label>
            <textarea rows="2" value={a.aciklama || ''} onChange={(e) => upd('adimlar', i, 'aciklama', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={() => add('adimlar', { ikon: '✨', baslik: '', aciklama: '' })}>
        <HiOutlinePlus size={14} /> Adım Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Acil İletişim</h3>
      <div className="form-group"><label>Başlık</label>
        <input type="text" value={form.acilBaslik} onChange={(e) => setForm({ ...form, acilBaslik: e.target.value })} />
      </div>
      <div className="form-row">
        <div className="form-group"><label>Telefon (görünen)</label>
          <input type="text" value={form.acilTelefon} onChange={(e) => setForm({ ...form, acilTelefon: e.target.value })} placeholder="0506 729 34 23" />
        </div>
        <div className="form-group"><label>Telefon (tel: linki)</label>
          <input type="text" value={form.acilTelefonTel} onChange={(e) => setForm({ ...form, acilTelefonTel: e.target.value })} placeholder="+905067293423" />
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
