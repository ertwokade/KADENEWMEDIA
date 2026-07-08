import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import KadeScene from '../components/kade/KadeScene'
import KadeCursor from '../components/kade/KadeCursor'
import '../styles/kade-design.css'
import '../styles/kade-home.css'

const PARTNERS = [
  { slug: 'flavora', name: 'Flavora', emoji: '🍕', cat: 'YİYECEK & İÇECEK', year: '2024', c1: '#ff6a3d', c2: '#ffb03a', featured: true },
  { slug: 'techvibe', name: 'TechVibe', emoji: '💻', cat: 'TEKNOLOJİ', year: '2024', c1: '#5b6cff', c2: '#9b5bff' },
  { slug: 'greenlife', name: 'GreenLife', emoji: '🌿', cat: 'SAĞLIK', year: '2023', c1: '#2fbf71', c2: '#8fd94a' },
  { slug: 'urbanstyle', name: 'UrbanStyle', emoji: '👗', cat: 'MODA', year: '2023', c1: '#ff4d8d', c2: '#ff8ac4' },
  { slug: 'petpal', name: 'PetPal', emoji: '🐾', cat: 'EVCİL HAYVAN', year: '2023', c1: '#17b3b0', c2: '#4fe0c9' },
  { slug: 'fitzone', name: 'FitZone', emoji: '💪', cat: 'SPOR', year: '2024', c1: '#ff7a1a', c2: '#ffc24b' },
]
const SERVICES = [
  { t: 'Sosyal Medya Yönetimi', d: 'Instagram, TikTok, YouTube ve LinkedIn hesaplarını profesyonelce yönetiyoruz.' },
  { t: 'İçerik Üretimi', d: 'Markaya özel görsel, video ve metin içerikleri üretiyoruz.' },
  { t: 'Reklam Yönetimi', d: 'Meta, Google ve TikTok Ads kampanyalarını verimli yönetiyoruz.' },
  { t: 'Video Prodüksiyon', d: 'Reels, TikTok, YouTube ve reklam filmleri için prodüksiyon.' },
]
const STEPS = [
  { n: '01', t: 'Keşif', d: 'Markanı, sektörünü ve hedeflerini analiz ederiz.' },
  { n: '02', t: 'Strateji', d: 'Veriye dayalı içerik ve reklam stratejisi kurarız.' },
  { n: '03', t: 'Üretim', d: 'Görsel, video ve metin içeriklerini üretiriz.' },
  { n: '04', t: 'Büyüme', d: 'Ölçer, optimize eder, şeffafça raporlarız.' },
]
const WA = 'https://wa.me/905067293423?text=Merhaba%20Kadir%2C%20siteyi%20g%C3%B6rd%C3%BCm.'

function useClock() {
  const [t, setT] = useState('--:--')
  useEffect(() => {
    const tick = () => { const n = new Date(); setT(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return t
}

export default function Home() {
  const [dark, setDark] = useState(false)
  const [coords, setCoords] = useState({ x: 720, y: 450 })
  const clock = useClock()

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    lenis.on('scroll', ({ scroll }) => { window.__kscroll = Math.min(1, scroll / innerHeight) })
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.__kscroll = 0 }
  }, [])

  useEffect(() => {
    let raf
    let pending = [...document.querySelectorAll('.kade-home [data-kr]')]
    const check = () => {
      const trig = innerHeight * 0.9
      pending = pending.filter((el) => { if (el.getBoundingClientRect().top < trig) { el.classList.add('in'); return false } return true })
      if (pending.length) raf = requestAnimationFrame(check)
    }
    raf = requestAnimationFrame(check)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onMove = (e) => setCoords({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className={`kade-home${dark ? ' kdark' : ''}`}>
      <KadeScene dark={dark} />
      <KadeCursor />
      <div className="kade-grid" aria-hidden />

      <header className="kade-nav">
        <Link className="kade-brand ktech" to="/">KADE MEDIA</Link>
        <nav className="kade-navlinks ktech">
          <Link to="/portfolio">İŞLER</Link>
          <Link to="/hizmetler">HİZMETLER</Link>
          <Link to="/paketler">PAKETLER</Link>
          <Link to="/iletisim">İLETİŞİM</Link>
          <button onClick={() => setDark((d) => !d)}>TEMA[A]</button>
        </nav>
      </header>

      <footer className="kade-status ktech">
        <span>GMT+3 İST {clock} 24°C</span>
        <span className="kcoords">{String(coords.x).padStart(4, '0')} X {String(coords.y).padStart(4, '0')} Y</span>
        <span>◍</span>
      </footer>

      <main className="kade-content">
        <section className="kade-screen">
          <div className="kade-intro">
            <div className="kl kdisplay">Sosyal Medya &amp;<br />Dijital Pazarlama</div>
            <div className="km ktech">Markaları dijitalde<br />büyütüyoruz.</div>
            <div className="kr ktech">Kade Media — İstanbul merkezli dijital pazarlama ajansı. Sosyal medya, içerik, reklam ve prodüksiyonla markanı dijitalde konumlandırıyoruz.</div>
          </div>
          <h1 className="kade-bring kdisplay">BİZ MARKANI<br />BÜYÜTÜYORUZ</h1>
        </section>

        <div className="kade-sheet">
          <section className="kade-about kade-screen">
            <p className="kade-lead kdisplay" data-kr>Güçlü iş birlikleriyle markaları dijital dünyada büyütüyoruz.</p>
            <p className="kade-sub ktech" data-kr>Strateji, içerik, reklam ve prodüksiyon — hepsi tek çatı altında. Veri odaklı, şeffaf raporlamayla.</p>
          </section>

          <div className="kade-marquee" aria-hidden>
            <div className="kade-mtrack kdisplay">
              {['SOSYAL MEDYA', 'İÇERİK ÜRETİMİ', 'REKLAM YÖNETİMİ', 'VİDEO PRODÜKSİYON', 'MARKA STRATEJİSİ', 'SOSYAL MEDYA', 'İÇERİK ÜRETİMİ', 'REKLAM YÖNETİMİ', 'VİDEO PRODÜKSİYON', 'MARKA STRATEJİSİ'].map((t, i) => (
                <span key={i} className="kade-mitem">{t}<span className="kade-mdot">✦</span></span>
              ))}
            </div>
          </div>

          <section className="kade-stats">
            <div className="kade-statgrid">
              {[['6+', 'Aktif Marka'], ['180%', 'Ort. Etkileşim Artışı'], ['4', 'Hizmet Alanı'], ['100%', 'Şeffaf Raporlama']].map(([n, l]) => (
                <div className="kade-stat" key={l} data-kr><span className="kade-statnum kdisplay">{n}</span><span className="kade-statlabel ktech">{l}</span></div>
              ))}
            </div>
          </section>

          <section id="isler" className="kade-work">
            <div className="kade-head ktech" data-kr><span>İŞLER / PARTNERLER</span><span>{PARTNERS.length} MARKA</span></div>
            <div className="kade-workgrid">
              {PARTNERS.map((p, i) => (
                <Link key={p.slug} className={`kade-block${p.featured ? ' featured' : ''}`} to="/portfolio" data-kr>
                  <div className="kade-visual" style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}>
                    <span className="kade-num ktech">{String(i + 1).padStart(2, '0')}</span>
                    <span className="kade-emoji">{p.emoji}</span>
                    <span className="kade-tag ktech">PARTNER</span>
                  </div>
                  <div className="kade-meta ktech"><span>{p.name} · {p.cat}</span><span>{p.year} ↗</span></div>
                </Link>
              ))}
            </div>
          </section>

          <section id="hizmetler" className="kade-services">
            <div className="kade-head ktech" data-kr><span>HİZMETLER</span><span>{SERVICES.length} ALAN</span></div>
            <div className="kade-servgrid">
              {SERVICES.map((s, i) => (
                <div className="kade-servcard" key={s.t} data-kr><span className="ktech">0{i + 1}</span><h3 className="kdisplay">{s.t}</h3><p className="ktech">{s.d}</p></div>
              ))}
            </div>
          </section>

          <section className="kade-process">
            <div className="kade-head ktech" data-kr><span>SÜREÇ</span><span>NASIL ÇALIŞIYORUZ?</span></div>
            <div className="kade-plist">
              {STEPS.map((s) => (
                <div className="kade-prow" key={s.n} data-kr><span className="ktech kade-pn">{s.n}</span><h3 className="kdisplay">{s.t}</h3><p className="ktech">{s.d}</p></div>
              ))}
            </div>
          </section>

          <section className="kade-statement kade-screen">
            <h2 className="kdisplay" data-kr>BİRLİKTE<br />BÜYÜYORUZ</h2>
          </section>
        </div>

        <section id="iletisim" className="kade-contact kade-screen">
          <h2 className="kade-cta kdisplay" data-kr>BİRLİKTE<br />BÜYÜYELİM</h2>
          <a className="kade-wa ktech" href={WA} target="_blank" rel="noreferrer" data-magnetic>WHATSAPP&apos;TAN YAZ →</a>
          <div className="kade-footer ktech">
            <a href="mailto:thekademedia@gmail.com">THEKADEMEDIA@GMAIL.COM</a>
            <div className="kade-social">
              <a href="https://instagram.com/kademediacom" target="_blank" rel="noreferrer">INSTAGRAM</a>
              <a href="https://tiktok.com/@kademediacom" target="_blank" rel="noreferrer">TIKTOK</a>
              <a href="https://www.youtube.com/@kademediacom" target="_blank" rel="noreferrer">YOUTUBE</a>
            </div>
          </div>
          <div className="kade-copy ktech">KADE MEDIA © 2026 · İSTANBUL</div>
        </section>
      </main>
    </div>
  )
}
