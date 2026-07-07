import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function ImagePreview({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  )
}

const projects = [
  { title: 'Coinpliance', src: '/projects/coinpliance.png' },
  { title: 'Chain — Labs', src: '/projects/chain-labs.png' },
  { title: 'Maisonsiete', src: '/projects/maisonsiete.png' },
  { title: 'Black Mango Production', src: '/projects/black-mango.png' },
]

function ProjectCard({ title, src, index }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.0, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
      }}
    >
      {/* Preview frame */}
      <div style={{
        width: '100%',
        height: 'clamp(280px, 40vw, 480px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <ImagePreview src={src} alt={title} />
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 4px',
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: '300',
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </span>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '999px',
          padding: '7px 14px',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'border-color 0.25s, background 0.25s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(217,164,65,0.5)'
          e.currentTarget.style.background = 'rgba(217,164,65,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }}
        >
          View
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section style={{
      position: 'relative',
      zIndex: 10,
      padding: '80px 6vw 120px',
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
          marginBottom: '56px',
        }}
      >
        Our Work
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.title} {...p} index={i} />
        ))}
      </div>
    </section>
  )
}
