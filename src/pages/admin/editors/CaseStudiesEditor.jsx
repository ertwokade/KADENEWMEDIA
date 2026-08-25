import { useEffect, useState } from 'react'
import { HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import { KADE_CASE_STUDIES } from '../../../data/caseStudies'

const CASE_STUDIES_DEFAULTS = KADE_CASE_STUDIES

function normalize(data) {
  const base = { ...CASE_STUDIES_DEFAULTS, ...(data || {}) }
  return {
    summaryStats: Array.isArray(base.summaryStats) && base.summaryStats.length ? base.summaryStats : CASE_STUDIES_DEFAULTS.summaryStats,
    cases: Array.isArray(base.cases) && base.cases.length ? base.cases : CASE_STUDIES_DEFAULTS.cases,
  }
}

export default function CaseStudiesEditor({ data, onSave }) {
  const [form, setForm] = useState(() => normalize(data))
  useEffect(() => { setForm(normalize(data)) }, [data])

  const updStat = (i, field, value) => {
    const list = [...form.summaryStats]
    list[i] = { ...list[i], [field]: value }
    setForm({ ...form, summaryStats: list })
  }
  const rmStat = (i) => setForm({ ...form, summaryStats: form.summaryStats.filter((_, idx) => idx !== i) })
  const addStat = () => setForm({ ...form, summaryStats: [...form.summaryStats, { value: '', labelTr: '', labelEn: '', ikon: '📊' }] })

  const updCase = (i, field, value) => {
    const list = [...form.cases]
    list[i] = { ...list[i], [field]: value }
    setForm({ ...form, cases: list })
  }
  const rmCase = (i) => setForm({ ...form, cases: form.cases.filter((_, idx) => idx !== i) })
  const addCase = () => setForm({
    ...form,
    cases: [...form.cases, {
      id: `case-${Date.now()}`,
      client: '', industryTr: '', industryEn: '', logo: '🏢', color: '#6C63FF',
      durationTr: '', durationEn: '', platforms: [],
      challengeTr: '', challengeEn: '', solutionTr: '', solutionEn: '',
      metrics: [],
      testimonialTextTr: '', testimonialTextEn: '', testimonialName: '', testimonialRole: '',
    }],
  })

  const updCasePlatform = (caseIdx, platformIdx, value) => {
    const cases = [...form.cases]
    const platforms = [...(cases[caseIdx].platforms || [])]
    platforms[platformIdx] = value
    cases[caseIdx] = { ...cases[caseIdx], platforms }
    setForm({ ...form, cases })
  }
  const rmCasePlatform = (caseIdx, platformIdx) => {
    const cases = [...form.cases]
    cases[caseIdx] = { ...cases[caseIdx], platforms: (cases[caseIdx].platforms || []).filter((_, i) => i !== platformIdx) }
    setForm({ ...form, cases })
  }
  const addCasePlatform = (caseIdx) => {
    const cases = [...form.cases]
    cases[caseIdx] = { ...cases[caseIdx], platforms: [...(cases[caseIdx].platforms || []), ''] }
    setForm({ ...form, cases })
  }

  const updMetric = (caseIdx, metricIdx, field, value) => {
    const cases = [...form.cases]
    const metrics = [...(cases[caseIdx].metrics || [])]
    metrics[metricIdx] = { ...metrics[metricIdx], [field]: value }
    cases[caseIdx] = { ...cases[caseIdx], metrics }
    setForm({ ...form, cases })
  }
  const rmMetric = (caseIdx, metricIdx) => {
    const cases = [...form.cases]
    cases[caseIdx] = { ...cases[caseIdx], metrics: (cases[caseIdx].metrics || []).filter((_, i) => i !== metricIdx) }
    setForm({ ...form, cases })
  }
  const addMetric = (caseIdx) => {
    const cases = [...form.cases]
    cases[caseIdx] = {
      ...cases[caseIdx],
      metrics: [...(cases[caseIdx].metrics || []), { labelTr: '', labelEn: '', before: '', after: '', change: '', ikon: '📈' }],
    }
    setForm({ ...form, cases })
  }

  return (
    <div className="admin-form">
      <h3>Başarı Hikayeleri Sayfası</h3>

      <h3 style={{ marginTop: 16 }}>Özet İstatistikler (üst kartlar)</h3>
      {form.summaryStats.map((s, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Stat {i + 1}</strong>
            {form.summaryStats.length > 1 && (
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rmStat(i)}>
                <HiOutlineTrash size={14} />
              </button>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Değer</label>
              <input type="text" value={s.value || ''} onChange={(e) => updStat(i, 'value', e.target.value)} placeholder="%300+" />
            </div>
            <div className="form-group"><label>İkon (emoji)</label>
              <input type="text" value={s.ikon || ''} onChange={(e) => updStat(i, 'ikon', e.target.value)} maxLength={4} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Etiket (TR)</label>
              <input type="text" value={s.labelTr || ''} onChange={(e) => updStat(i, 'labelTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Etiket (EN)</label>
              <input type="text" value={s.labelEn || ''} onChange={(e) => updStat(i, 'labelEn', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 8 }} onClick={addStat}>
        <HiOutlinePlus size={14} /> İstatistik Ekle
      </button>

      <h3 style={{ marginTop: 24 }}>Vaka Çalışmaları</h3>
      {form.cases.map((c, i) => (
        <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 16, border: `2px solid ${c.color || '#6C63FF'}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{c.logo} {c.client || `Vaka ${i + 1}`}</strong>
            <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => rmCase(i)}>
              <HiOutlineTrash size={14} />
            </button>
          </div>

          <div className="form-row">
            <div className="form-group"><label>ID (URL dostu)</label>
              <input type="text" value={c.id || ''} onChange={(e) => updCase(i, 'id', e.target.value)} placeholder="flavora" />
            </div>
            <div className="form-group"><label>Müşteri Adı</label>
              <input type="text" value={c.client || ''} onChange={(e) => updCase(i, 'client', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Logo (emoji)</label>
              <input type="text" value={c.logo || ''} onChange={(e) => updCase(i, 'logo', e.target.value)} maxLength={4} />
            </div>
            <div className="form-group"><label>Marka Rengi</label>
              <input type="text" value={c.color || ''} onChange={(e) => updCase(i, 'color', e.target.value)} placeholder="#eac321" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Sektör (TR)</label>
              <input type="text" value={c.industryTr || ''} onChange={(e) => updCase(i, 'industryTr', e.target.value)} />
            </div>
            <div className="form-group"><label>Sektör (EN)</label>
              <input type="text" value={c.industryEn || ''} onChange={(e) => updCase(i, 'industryEn', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Süre (TR)</label>
              <input type="text" value={c.durationTr || ''} onChange={(e) => updCase(i, 'durationTr', e.target.value)} placeholder="6 Ay" />
            </div>
            <div className="form-group"><label>Süre (EN)</label>
              <input type="text" value={c.durationEn || ''} onChange={(e) => updCase(i, 'durationEn', e.target.value)} placeholder="6 Months" />
            </div>
          </div>

          <label style={{ color: 'var(--text-primary)', marginTop: 12, display: 'block' }}>Platformlar</label>
          {(c.platforms || []).map((p, pi) => (
            <div key={pi} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input type="text" value={p} onChange={(e) => updCasePlatform(i, pi, e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-outline" style={{ padding: '4px 12px' }} onClick={() => rmCasePlatform(i, pi)}>
                <HiOutlineTrash size={14} />
              </button>
            </div>
          ))}
          <button className="btn btn-outline" style={{ marginBottom: 12, fontSize: '0.8rem' }} onClick={() => addCasePlatform(i)}>
            <HiOutlinePlus size={14} /> Platform Ekle
          </button>

          <div className="form-group"><label>Zorluk (TR)</label>
            <textarea rows="3" value={c.challengeTr || ''} onChange={(e) => updCase(i, 'challengeTr', e.target.value)} />
          </div>
          <div className="form-group"><label>Zorluk (EN)</label>
            <textarea rows="3" value={c.challengeEn || ''} onChange={(e) => updCase(i, 'challengeEn', e.target.value)} />
          </div>
          <div className="form-group"><label>Çözüm (TR)</label>
            <textarea rows="3" value={c.solutionTr || ''} onChange={(e) => updCase(i, 'solutionTr', e.target.value)} />
          </div>
          <div className="form-group"><label>Çözüm (EN)</label>
            <textarea rows="3" value={c.solutionEn || ''} onChange={(e) => updCase(i, 'solutionEn', e.target.value)} />
          </div>

          <h4 style={{ color: 'var(--text-primary)', marginTop: 12 }}>Metrikler</h4>
          {(c.metrics || []).map((m, mi) => (
            <div key={mi} className="glass-card" style={{ padding: 12, marginBottom: 8, background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Metrik {mi + 1}</strong>
                <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => rmMetric(i, mi)}>
                  <HiOutlineTrash size={12} />
                </button>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Etiket (TR)</label>
                  <input type="text" value={m.labelTr || ''} onChange={(e) => updMetric(i, mi, 'labelTr', e.target.value)} />
                </div>
                <div className="form-group"><label>Etiket (EN)</label>
                  <input type="text" value={m.labelEn || ''} onChange={(e) => updMetric(i, mi, 'labelEn', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Öncesi</label>
                  <input type="text" value={m.before || ''} onChange={(e) => updMetric(i, mi, 'before', e.target.value)} />
                </div>
                <div className="form-group"><label>Sonrası</label>
                  <input type="text" value={m.after || ''} onChange={(e) => updMetric(i, mi, 'after', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Değişim</label>
                  <input type="text" value={m.change || ''} onChange={(e) => updMetric(i, mi, 'change', e.target.value)} placeholder="+45K" />
                </div>
                <div className="form-group"><label>İkon (emoji)</label>
                  <input type="text" value={m.ikon || ''} onChange={(e) => updMetric(i, mi, 'ikon', e.target.value)} maxLength={4} />
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn-outline" style={{ marginBottom: 12, fontSize: '0.8rem' }} onClick={() => addMetric(i)}>
            <HiOutlinePlus size={14} /> Metrik Ekle
          </button>

          <h4 style={{ color: 'var(--text-primary)', marginTop: 12 }}>Referans Yorumu</h4>
          <div className="form-group"><label>Metin (TR)</label>
            <textarea rows="2" value={c.testimonialTextTr || ''} onChange={(e) => updCase(i, 'testimonialTextTr', e.target.value)} />
          </div>
          <div className="form-group"><label>Metin (EN)</label>
            <textarea rows="2" value={c.testimonialTextEn || ''} onChange={(e) => updCase(i, 'testimonialTextEn', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Ad</label>
              <input type="text" value={c.testimonialName || ''} onChange={(e) => updCase(i, 'testimonialName', e.target.value)} />
            </div>
            <div className="form-group"><label>Rol</label>
              <input type="text" value={c.testimonialRole || ''} onChange={(e) => updCase(i, 'testimonialRole', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={addCase}>
        <HiOutlinePlus size={14} /> Vaka Ekle
      </button>

      <div className="admin-form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <HiOutlineSave size={16} /> Kaydet
        </button>
      </div>
    </div>
  )
}
