import { motion } from 'framer-motion'
import { HiOutlineChatAlt2, HiX } from 'react-icons/hi'
import './ChatToggleButton.css'

export default function ChatToggleButton({ isOpen, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className={`chat-toggle-float ${isOpen ? 'active' : ''}`}
      aria-label="Kade AI Chat"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {isOpen ? <HiX size={24} /> : <HiOutlineChatAlt2 size={26} />}
      {!isOpen && <span className="chat-toggle-tooltip">Kade AI</span>}
    </motion.button>
  )
}
