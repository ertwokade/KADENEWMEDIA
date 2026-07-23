import { motion } from 'framer-motion'

// NOT: CSS `filter: blur()` animasyonu içerik-yoğun sayfalarda pahalı ve
// bileşiklemede (compositing) takılabiliyor — canlıda 2-4 sn'lik "asılı
// blur" bunun sonucuydu. Blur miktarı 10px→3px'e, süre 0.55→0.32'ye
// düşürüldü; opacity+y geçişi (ucuz, GPU-dostu) korundu. Dekoratif sheen
// daha kısa ve hafif hale getirildi.
export default function PageTransition({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="page-reveal-sheen"
        initial={{ x: '-120%', opacity: 0.18 }}
        animate={{ x: '120%', opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  )
}
