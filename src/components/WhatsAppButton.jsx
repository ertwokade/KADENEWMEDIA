import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import './WhatsAppButton.css'

export default function WhatsAppButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="whatsapp-float"
      aria-label="WhatsApp Chat"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <FaWhatsapp size={28} />
      <span className="whatsapp-tooltip">WhatsApp</span>
    </motion.button>
  )
}
