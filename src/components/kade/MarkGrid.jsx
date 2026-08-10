import { Link } from 'react-router-dom'
import Logo from '../system/Logo'
import Reveal from '../system/Reveal'

/**
 * MARKA IZGARASI — hücre başına bir KADE wordmark'ı ve altında ne olduğunu
 * söyleyen bir alt yazı.
 *
 * Rozet metni ("KADE") yalnız Kade'nin KENDİ ürünlerinde görünür. Referans
 * tasarımda buradaki rozet "İŞ BİRLİĞİ" yazıyordu; doğrulanmış bir iş
 * ortaklığı olmadığı için o metin kullanılmadı — rozetin görsel işlevi aynı,
 * iddiası gerçek. Yeni bir rozet eklerken aynı kurala uyun: kart neyse onu
 * yazın.
 */

const CELLS = [
  { label: 'Kade Portfolio', to: '/portfolio', badge: 'KADE' },
  { label: 'Sosyal Medya', to: '/hizmetler/sosyal-medya-yonetimi' },
  { label: 'Dijital Pazarlama', to: '/hizmetler/strateji-danismanlik' },
  { label: 'İçerik Üretimi', to: '/hizmetler/icerik-uretimi' },
  { label: 'Reklam Yönetimi', to: '/hizmetler/reklam-yonetimi' },
  { label: 'Kade Business', to: '/kade-kit-business', badge: 'KADE' },
]

export default function MarkGrid() {
  return (
    <ul className="kmark-grid">
      {CELLS.map((cell, index) => (
        <Reveal
          as="li"
          key={cell.to}
          className="kmark-cell"
          delay={Math.min(index, 5) * 60}
        >
          <Link to={cell.to} className="kmark-link">
            {cell.badge && <span className="kmark-badge kade-mono">{cell.badge}</span>}
            <span className="kmark-art">
              {/* Wordmark dekoratif: hücrenin erişilebilir adını alt yazı verir. */}
              <Logo variant="light" width={260} decorative className="kmark-logo" />
            </span>
            <span className="kmark-label kade-mono">{cell.label}</span>
          </Link>
        </Reveal>
      ))}
    </ul>
  )
}
