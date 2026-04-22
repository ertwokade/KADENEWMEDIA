import './LiveTicker.css'

const DEFAULT_BRANDS = [
  'Flavora', 'TechVibe', 'GreenLife', 'UrbanNest', 'Moda House',
  'Pixel Peak', 'Kahve Kültürü', 'Nova Fitness', 'Lumen Studio',
  'Delivery+', 'Açelya Cafe', 'Bazaar 34', 'Studio Neon', 'Orbit Gaming',
]

export default function LiveTicker({ brands = DEFAULT_BRANDS, label = 'Şu an çalıştığımız' }) {
  const loop = [...brands, ...brands]
  return (
    <section className="live-ticker" aria-label={label}>
      <div className="live-ticker__label">
        <span className="live-ticker__pulse" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="live-ticker__track-wrap">
        <div className="live-ticker__track">
          {loop.map((b, i) => (
            <span className="live-ticker__item" key={`${b}-${i}`}>
              <span className="live-ticker__dot" aria-hidden="true" />
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
