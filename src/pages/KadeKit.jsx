import { useState } from 'react'
import { HiCheck, HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineVideoCamera } from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import './KadeKit.css'

// Shopier ürün linkleri — Shopier panelinde her paketi oluşturup product_reference'ı
// aşağıdaki anahtarlarla eşleştir, sonra ürün URL'sini buraya yapıştır.
// Boş kalırsa buton WhatsApp'a yönlenir (satış kaçmasın diye).
const SHOPIER_LINKS = {
  'kade-kit-baslangic-lifetime': '',
  'kade-kit-baslangic-monthly': '',
  'kade-kit-pro-lifetime': '',
  'kade-kit-pro-monthly': '',
  'kade-kit-ajans-lifetime': '',
  'kade-kit-ajans-monthly': '',
}
const WHATSAPP = 'https://wa.me/905067293423'

const TIERS = [
  {
    id: 'baslangic', name: 'Başlangıç', tagline: 'Bireysel içerik üreticiler',
    icon: HiOutlineSparkles,
    lifetime: { ref: 'kade-kit-baslangic-lifetime', price: 1990 },
    monthly: { ref: 'kade-kit-baslangic-monthly', price: 299 },
    features: [
      'ContentAI Studio — 8 AI aracı',
      'Başlık, Açıklama, Hook, Script, Hashtag',
      'Viral Skor + İçerik Dönüştür + Takvim',
      'Kade Organizasyon Kiti (temel)',
      'Kendi API anahtarınla sınırsız kullanım',
      'Masaüstü + web erişimi',
    ],
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Profesyoneller & küçük ekipler', popular: true,
    icon: HiOutlineLightningBolt,
    lifetime: { ref: 'kade-kit-pro-lifetime', price: 3990 },
    monthly: { ref: 'kade-kit-pro-monthly', price: 599 },
    features: [
      'Başlangıç’taki her şey',
      'Qwen AI Video üretim aracı 🎬',
      'Kade Organizasyon Kiti (tam)',
      'Fractional New Media Director planı',
      'Ömürlük güncellemeler',
      'Öncelikli e-posta desteği',
    ],
  },
  {
    id: 'ajans', name: 'Ajans', tagline: 'Ajanslar & büyük ekipler',
    icon: HiOutlineVideoCamera,
    lifetime: { ref: 'kade-kit-ajans-lifetime', price: 7990 },
    monthly: { ref: 'kade-kit-ajans-monthly', price: 1290 },
    features: [
      'Pro’daki her şey',
      '5 kullanıcı koltuğu',
      'Öncelikli destek (WhatsApp)',
      '1 saat kurulum danışmanlığı',
      'Ekip için ortak içerik takvimi',
    ],
  },
]

function buyUrl(ref, tierName, billing) {
  const link = SHOPIER_LINKS[ref]
  if (link) return link
  const msg = encodeURIComponent(`Merhaba, KADE KIT ${tierName} (${billing === 'monthly' ? 'aylık' : 'ömürlük'}) paketini almak istiyorum.`)
  return `${WHATSAPP}?text=${msg}`
}

const fmt = (n) => n.toLocaleString('tr-TR')

export default function KadeKit() {
  const [billing, setBilling] = useState('lifetime')
  useSEO({
    title: 'KADE KIT — AI İçerik Üretim Kiti | Fiyatlar',
    description: 'KADE KIT: Claude, GPT-4o ve Gemini destekli 8 AI içerik aracı + Kade Organizasyon Kiti + Qwen AI Video. Tek seferlik veya aylık. Markanı dijitalde büyüt.',
    keywords: 'ai içerik üretim, sosyal medya ai, içerik aracı, kade kit, contentai studio, ai video, qwen',
    path: '/kade-kit',
  })

  return (
    <div className="kk-page">
      <section className="kk-top">
        <span className="kk-eyebrow">◆ KADE KIT</span>
        <h1 className="kk-title">Markanı büyüten<br /><span>AI içerik kiti</span></h1>
        <p className="kk-sub">
          Claude + GPT-4o + Gemini destekli <strong>8 AI aracı</strong>, Kade Organizasyon Kiti
          ve <strong>Qwen AI Video</strong> — hepsi tek pakette. Kendi API anahtarınla, sınırsız.
        </p>

        <div className="kk-toggle" role="tablist" aria-label="Fatura tipi">
          <button role="tab" aria-selected={billing === 'lifetime'} className={billing === 'lifetime' ? 'on' : ''} onClick={() => setBilling('lifetime')}>
            Tek Seferlik <em>ömürlük</em>
          </button>
          <button role="tab" aria-selected={billing === 'monthly'} className={billing === 'monthly' ? 'on' : ''} onClick={() => setBilling('monthly')}>
            Aylık
          </button>
        </div>
      </section>

      <section className="kk-grid">
        {TIERS.map((t) => {
          const plan = t[billing]
          return (
            <article key={t.id} className={`kk-card ${t.popular ? 'popular' : ''}`}>
              {t.popular && <div className="kk-badge">En Popüler</div>}
              <div className="kk-card-head">
                <t.icon className="kk-card-ic" />
                <div>
                  <h2>{t.name}</h2>
                  <p>{t.tagline}</p>
                </div>
              </div>
              <div className="kk-price">
                <span className="kk-amount">₺{fmt(plan.price)}</span>
                <span className="kk-period">{billing === 'monthly' ? '/ay' : 'tek seferlik'}</span>
              </div>
              <ul className="kk-features">
                {t.features.map((f, i) => (
                  <li key={i}><HiCheck className="kk-chk" /> {f}</li>
                ))}
              </ul>
              <a
                className={`kk-buy ${t.popular ? 'primary' : ''}`}
                href={buyUrl(plan.ref, t.name, billing)}
                target="_blank" rel="noopener noreferrer"
              >
                Satın Al
              </a>
            </article>
          )
        })}
      </section>

      <section className="kk-note">
        <p>💳 Güvenli ödeme <strong>Shopier</strong> ile · 🔑 Kendi API anahtarınla çalışır · 🔄 Aylık planı istediğin an iptal et</p>
        <p className="kk-help">Emin değil misin? <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp’tan sor</a> ya da <a href="/kade-kit-business">demoyu incele</a>.</p>
      </section>
    </div>
  )
}
