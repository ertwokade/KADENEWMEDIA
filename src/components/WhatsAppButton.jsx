import { FaWhatsapp } from 'react-icons/fa'
import { analytics } from '../utils/analytics'
import './WhatsAppButton.css'

export default function WhatsAppButton() {
  const phoneNumber = '905067293423'
  const message = encodeURIComponent('Merhaba! Kade Media web sitesinden yazıyorum. Bilgi almak istiyorum.')
  const url = `https://wa.me/${phoneNumber}?text=${message}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="WhatsApp'tan iletişime geç"
      onClick={() => analytics.whatsappClick('floating-button')}
    >
      <FaWhatsapp size={28} />
      <span className="whatsapp-tooltip">WhatsApp</span>
    </a>
  )
}
