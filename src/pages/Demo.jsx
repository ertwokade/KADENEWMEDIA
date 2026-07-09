import { Link } from 'react-router-dom'
import { HiOutlineSparkles, HiCheck } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import './Demo.css'

const WHATSAPP = 'https://wa.me/905067293423'

const TOOLS = [
  {
    tag: 'Başlık Üretici', prompt: 'Konu: “evden pasif gelir”',
    out: ['Evde Otururken Ayda 20.000₺: Denedim, İşte Sonuç', '2025’te Kimsenin Anlatmadığı 5 Pasif Gelir Yolu', 'Bunu Bilseydim 1 Yıl Önce Başlardım…'],
  },
  {
    tag: 'Hook Jeneratörü', prompt: 'İlk 3 saniye',
    out: ['“Bunu izlemezsen paranı yakıyorsun.”', '“3 saniyende anlatıyorum, kaçırma.”'],
  },
  {
    tag: 'Hashtag AI', prompt: 'Niche: fitness / TikTok',
    out: ['#fityaşam #evdespor #transformation', '#fittürkiye #antrenman #motivasyon'],
  },
  {
    tag: 'Viral Skor', prompt: 'İçeriğini analiz et',
    out: ['⚡ Viral Skoru: 82/100', 'Hook güçlü · CTA zayıf · Süre ideal'],
  },
  {
    tag: 'Script Yazarı', prompt: 'Hook → İçerik → CTA',
    out: ['00:00 Hook — “Şunu dene…”', '00:05 Değer — 3 adım', '00:40 CTA — “Takip et”'],
  },
  {
    tag: 'İçerik Dönüştür', prompt: 'Reels → LinkedIn + Blog',
    out: ['Tek içerik, 4 platforma uyarlandı', 'Ton ve uzunluk otomatik ayarlandı'],
  },
]

export default function Demo() {
  useSEO({
    title: 'KADE KIT Demo — İçini Gör',
    description: 'KADE KIT içerik araçlarının canlı örnek çıktıları. Başlık, Hook, Script, Hashtag, Viral Skor, Qwen AI Video ve daha fazlası.',
    path: '/demo',
  })

  return (
    <div className="demo-page">
      <section className="demo-top">
        <span className="demo-eyebrow">◆ CANLI DEMO</span>
        <h1 className="demo-title">KADE KIT’in <span>içini gör</span></h1>
        <p className="demo-sub">
          Satın almadan önce araçların ne ürettiğini gör. Aşağıdaki çıktılar KADE KIT’in
          <strong> ContentAI Studio</strong> motorundan gerçek örneklerdir.
        </p>
        <div className="demo-cta-row">
          <Link to="/kade-kit" className="demo-btn primary">Paketleri Gör</Link>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="demo-btn">WhatsApp’tan Sor</a>
        </div>
      </section>

      <section className="demo-grid">
        {TOOLS.map((t) => (
          <article key={t.tag} className="demo-card">
            <div className="demo-card-head">
              <HiOutlineSparkles className="demo-card-ic" />
              <span>{t.tag}</span>
            </div>
            <div className="demo-prompt">{t.prompt}</div>
            <div className="demo-out">
              {t.out.map((o, i) => (
                <div key={i} className="demo-out-line">{o}</div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="demo-video">
        <div className="demo-video-inner">
          <div className="demo-video-badge">🎬 Pro & Ajans</div>
          <h2>Qwen AI Video üretim aracı</h2>
          <p>Metinden veya senaryodan saniyeler içinde sosyal medya videosu üret. Pro ve Ajans paketlerinde dahil.</p>
          <ul className="demo-video-list">
            <li><HiCheck /> Metin → video otomatik üretim</li>
            <li><HiCheck /> Sosyal medya oranları (9:16, 1:1, 16:9)</li>
            <li><HiCheck /> Kade Organizasyon Kiti ile entegre iş akışı</li>
          </ul>
        </div>
      </section>

      <section className="demo-final">
        <h2>Hazır mısın?</h2>
        <p>KADE KIT ile içerik üretimini 10 kat hızlandır.</p>
        <Link to="/kade-kit" className="demo-btn primary lg">Paketleri İncele →</Link>
      </section>
    </div>
  )
}
