import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import { analytics } from '../utils/analytics'
import './WhatsAppButton.css'

export default function WhatsAppButton() {
  const phoneNumber = '905067293423'
  const message = encodeURIComponent('Merhaba! Kade Media web sitesinden yazıyorum. Bilgi almak istiyorum.')
  const url = `https://wa.me/${phoneNumber}?text=${message}`

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="WhatsApp'tan iletişime geç"
      onClick={() => analytics.whatsappClick('floating-button')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <FaWhatsapp size={28} />
      <span className="whatsapp-tooltip">WhatsApp</span>
    </motion.a>
  )
}
