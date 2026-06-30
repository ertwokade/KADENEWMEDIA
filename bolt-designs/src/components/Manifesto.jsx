import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function ManifestoText({ children, delay = 0 }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.h2
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(36px, 5.5vw, 80px)',
        fontWeight: '300',
        lineHeight: '1.08',
        letterSpacing: '-0.03em',
        color: '#ffffff',
        maxWidth: '700px',
      }}
    >
      {children}
    </motion.h2>
  )
}

export default function Manifesto() {
  return (
    <>
      {/* Block 1 */}
      <section style={{
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 6vw',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ManifestoText delay={0}>
            One with a passion<br />
            for visuals, the<br />
            other with an eye<br />
            for clean, fast tech
          </ManifestoText>
        </div>
      </section>

      {/* Block 2 */}
      <section style={{
        position: 'relative',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        padding: '80px 6vw',
        zIndex: 10,
      }}>
        <ManifestoText delay={0}>
          Quick on the reply.<br />
          Sharp with design.<br />
          Always plugged in.
        </ManifestoText>
      </section>
    </>
  )
}
