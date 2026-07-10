import { Link } from 'react-router-dom'
import {
  FaWhatsapp, FaInstagram, FaYoutube, FaLinkedinIn,
} from 'react-icons/fa'
import {
  HiOutlineSparkles, HiOutlineTemplate, HiOutlineBriefcase,
  HiOutlineMail, HiOutlineChevronRight,
} from 'react-icons/hi'
import { useSEO } from '../hooks/useSEO'
import './KadeLinks.css'

const WHATSAPP = 'https://wa.me/905067293423'
const EMAIL = 'mailto:hello@kademedia.com'

// Öne çıkan aksiyon
const PRIMARY = {
  label: 'WhatsApp’tan Yaz', sub: 'En hızlı dönüş — 5 dk içinde',
  href: WHATSAPP, icon: FaWhatsapp, external: true,
}

// Site içi linkler
const INTERNAL = [
  { label: 'Ücretsiz Teklif Al', sub: 'Sana özel fiyat', to: '/teklif-al', icon: HiOutlineSparkles },
  { label: 'Hizmetlerimiz', sub: 'Sosyal medya, reklam, içerik, prodüksiyon', to: '/hizmetler', icon: HiOutlineBriefcase },
  { label: 'Paketler & Fiyatlar', sub: 'Her bütçeye uygun', to: '/paketler', icon: HiOutlineTemplate },
  { label: 'İşlerimiz / Portfolyo', sub: 'Başarı hikayeleri', to: '/portfolio', icon: HiOutlineChevronRight },
  { label: 'İletişim', sub: 'Bize ulaş', to: '/iletisim', icon: HiOutlineMail },
]

// Sosyal kanallar
const SOCIAL = [
  { label: 'Instagram', handle: '@kadenewmedia', href: 'https://instagram.com/kadenewmedia', icon: FaInstagram, cls: 'ig' },
  { label: 'YouTube', handle: '@kadenewmedia', href: 'https://youtube.com/@kadenewmedia', icon: FaYoutube, cls: 'yt' },
  { label: 'LinkedIn', handle: '@kadenewmedia', href: 'https://www.linkedin.com/company/kadenewmedia', icon: FaLinkedinIn, cls: 'in' },
]

export default function KadeLinks() {
  useSEO({
    title: 'Kade Media — Tüm Bağlantılar | links',
    description: 'Kade Media resmi bağlantılar sayfası. WhatsApp, teklif, hizmetler, paketler ve sosyal medya kanallarımıza tek yerden ulaşın.',
    path: '/links',
    baseUrl: 'https://kadirardademir.com',
  })

  return (
    <div className="kl-wrap">
      <div className="kl-bg" aria-hidden="true" />
      <main className="kl-card">
        <div className="kl-head">
          <div className="kl-avatar" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24"><path d="M13 1.5 3.5 14h7.1l-2.1 8.5L20.5 8.5H13Z" fill="currentColor" /></svg>
          </div>
          <h1 className="kl-name">Kade Media</h1>
          <p className="kl-bio">İstanbul Sosyal Medya &amp; Dijital Pazarlama Ajansı</p>
          <p className="kl-tag">Markanı dijitalde büyütüyoruz.</p>
        </div>

        <a className="kl-btn kl-primary" href={PRIMARY.href} target="_blank" rel="noopener noreferrer">
          <PRIMARY.icon className="kl-ic" />
          <span className="kl-txt"><strong>{PRIMARY.label}</strong><em>{PRIMARY.sub}</em></span>
          <HiOutlineChevronRight className="kl-arr" />
        </a>

        <nav className="kl-list">
          {INTERNAL.map((l) => (
            <Link key={l.to} className="kl-btn" to={l.to}>
              <l.icon className="kl-ic" />
              <span className="kl-txt"><strong>{l.label}</strong><em>{l.sub}</em></span>
              <HiOutlineChevronRight className="kl-arr" />
            </Link>
          ))}
        </nav>

        <div className="kl-social">
          {SOCIAL.map((s) => (
            <a key={s.label} className={`kl-soc ${s.cls}`} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
              <s.icon />
              <span>{s.label}</span>
            </a>
          ))}
        </div>

        <a className="kl-mail" href={EMAIL}>hello@kademedia.com</a>
        <footer className="kl-foot">© {new Date().getFullYear()} Kade Media · kadirardademir.com/links</footer>
      </main>
    </div>
  )
}
