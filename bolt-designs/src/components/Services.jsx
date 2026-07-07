import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const services = [
  {
    title: 'Web Design',
    desc: 'We craft bold, conversion-driven layouts that look stunning and feel effortless. Every pixel has a purpose.',
    offset: '0px',
    delay: 0,
  },
  {
    title: 'Web Dev',
    desc: 'From smooth scroll to lightning-fast load speeds, we build websites that work as good as they look.',
    offset: '-40px',
    delay: 0.1,
  },
  {
    title: '3D Design',
    desc: 'Immersive 3D elements that add depth, emotion, and a touch of wow to your digital experience.',
    offset: '40px',
    delay: 0.2,
  },
  {
    title: 'Animations',
    desc: 'Micro to macro, we animate interactions that bring your brand to life and keep users engaged.',
    offset: '-20px',
    delay: 0.3,
  },
]

function GlassCard({ title, desc, offset, delay }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flex: '0 0 240px',
        marginTop: offset,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'default',
        transition: 'border-color 0.3s, background 0.3s',
      }}
      whileHover={{
        borderColor: 'rgba(217,164,65,0.35)',
        background: 'rgba(217,164,65,0.04)',
      }}
    >
      <div style={{
        width: '32px',
        height: '2px',
        background: 'linear-gradient(90deg, #d9a441, transparent)',
        borderRadius: '1px',
      }} />
      <h3 style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '18px',
        fontWeight: '400',
        color: '#ffffff',
        letterSpacing: '-0.02em',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: '300',
        lineHeight: '1.65',
        color: 'rgba(255,255,255,0.55)',
      }}>
        {desc}
      </p>
    </motion.div>
  )
}

export default function Services() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section style={{
      position: 'relative',
      minHeight: '80vh',
      padding: '100px 6vw',
      zIndex: 10,
    }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          fontWeight: '400',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(217,164,65,0.7)',
          marginBottom: '48px',
        }}
      >
        What we do
      </motion.div>

      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}>
        {services.map((s) => (
          <GlassCard key={s.title} {...s} />
        ))}
      </div>
    </section>
  )
}
