import './ComparisonMatrix.css'

const DEFAULT_ROWS = [
  { label: 'Strateji & analiz', us: true, freelance: 'partial', other: true },
  { label: 'Çok kanal yayın (Meta, Google, TikTok)', us: true, freelance: false, other: true },
  { label: 'Yerinde profesyonel video prodüksiyon', us: true, freelance: false, other: 'partial' },
  { label: 'Gerçek zamanlı raporlama paneli', us: true, freelance: false, other: 'partial' },
  { label: 'Marka özel AI içerik asistanı', us: true, freelance: false, other: false },
  { label: 'Aylık sabit fiyat, sürpriz yok', us: true, freelance: 'partial', other: false },
  { label: 'Minimum 3 ay kilit ya da 1 ay deneme', us: '1 ay deneme', freelance: 'Değişken', other: '12 ay' },
  { label: '7/24 WhatsApp + panel desteği', us: true, freelance: 'partial', other: false },
]

function Cell({ value }) {
  if (value === true) {
    return (
      <span className="cmx__cell cmx__cell--yes" aria-label="var">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="cmx__cell cmx__cell--no" aria-label="yok">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </span>
    )
  }
  if (value === 'partial') {
    return <span className="cmx__cell cmx__cell--partial" aria-label="kısmi">~</span>
  }
  return <span className="cmx__cell cmx__cell--text">{value}</span>
}

export default function ComparisonMatrix({ rows = DEFAULT_ROWS }) {
  return (
    <div className="cmx-wrap">
      <div className="cmx" role="table" aria-label="Kade Media vs alternatifler">
        <div className="cmx__head" role="row">
          <div className="cmx__th cmx__th--label" role="columnheader" />
          <div className="cmx__th cmx__th--us" role="columnheader">
            <span className="cmx__badge">Kade Media</span>
          </div>
          <div className="cmx__th" role="columnheader">Freelancer</div>
          <div className="cmx__th" role="columnheader">Diğer ajanslar</div>
        </div>
        {rows.map((r, i) => (
          <div className="cmx__row" role="row" key={i}>
            <div className="cmx__td cmx__td--label" role="cell">{r.label}</div>
            <div className="cmx__td cmx__td--us" role="cell"><Cell value={r.us} /></div>
            <div className="cmx__td" role="cell"><Cell value={r.freelance} /></div>
            <div className="cmx__td" role="cell"><Cell value={r.other} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
