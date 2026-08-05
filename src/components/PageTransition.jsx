import { motion } from 'framer-motion'

// `filter: blur()` geçişten TAMAMEN çıkarıldı.
//
// Gerekçe, bu dosyanın önceki sürümünde kayıtlı: canlıda 2-4 saniyelik
// "asılı blur" gözlenmiş ve blur 10px→3px'e düşürülerek hafifletilmeye
// çalışılmıştı. Kök sebep miktar değil yöntem: blur GPU'da bileşiklenemez,
// her karede sayfanın TAMAMI yeniden boyanır; içerik yoğunlaştıkça kare
// süresi büyür. Azaltmak semptomu geciktirir, kaldırmak bitirir.
//
// Geriye kalan opacity + y geçişi transform/opacity üzerinden GPU'da
// bileşikleniyor: boyama maliyeti yok, süresi sayfa içeriğinden bağımsız.
export default function PageTransition({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
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
