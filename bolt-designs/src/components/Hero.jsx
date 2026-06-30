import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      padding: '0 6vw',
      overflow: 'hidden',
    }}>
      {/* Left heading */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: '55%', zIndex: 10 }}
      >
        <h1 style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(52px, 7vw, 108px)',
          fontWeight: '300',
          lineHeight: '1.0',
          letterSpacing: '-0.03em',
          color: '#ffffff',
          whiteSpace: 'pre-line',
        }}>
          {'Shockingly\nGood Websites'}
        </h1>
      </motion.div>

      {/* Bottom-right tagline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '6vw',
          maxWidth: '380px',
          zIndex: 10,
        }}
      >
        <p style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: '14px',
          fontWeight: '300',
          lineHeight: '1.7',
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.01em',
        }}>
          We don't do slow. We don't do boring. At Bolt<br />
          Designs, we create high-voltage websites that load<br />
          fast, look sharp, and leave an impact.
        </p>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
            <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,0.5)"/>
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
