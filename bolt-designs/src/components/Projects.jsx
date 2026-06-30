import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function CoinpliancePreview() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #080f1e 0%, #0d1f3a 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        fontSize: 'clamp(28px, 4vw, 52px)',
        fontWeight: '200',
        letterSpacing: '-0.04em',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        zIndex: 1,
        fontFamily: "'Inter', sans-serif",
      }}>
        POTENTIAL.
      </div>
      <div style={{
        display: 'flex',
        gap: '16px',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {['●', '◆', '■', '▲', '●'].map((sym, i) => (
          <div key={i} style={{
            width: '60px',
            height: '24px',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'rgba(0,229,255,0.5)',
          }}>{sym}</div>
        ))}
      </div>
    </div>
  )
}

function BlackMangoPreview() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#060606',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* X mark */}
      <svg width="40%" height="40%" viewBox="0 0 100 100" style={{ opacity: 0.85 }}>
        <line x1="10" y1="10" x2="90" y2="90" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="90" y1="10" x2="10" y2="90" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '10px',
        fontWeight: '300',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        Black Mango Production
      </div>
    </div>
  )
}

function ChainLabsPreview() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(160deg, #060e1c 0%, #0a1830 100%)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '10px',
        fontWeight: '400',
        letterSpacing: '0.2em',
        color: 'rgba(0,229,255,0.6)',
        textTransform: 'uppercase',
      }}>
        Recent Projects
      </div>
      {['Protocol 01', 'Layer 02', 'Mesh 03'].map((p, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          background: 'rgba(0,229,255,0.04)',
          border: '1px solid rgba(0,229,255,0.1)',
          borderRadius: '6px',
        }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: '#00e5ff',
            boxShadow: '0 0 6px #00e5ff',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
          }}>{p}</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '10px',
            color: 'rgba(0,229,255,0.5)',
          }}>→</span>
        </div>
      ))}
    </div>
  )
}

const projects = [
  { title: 'Coinpliance', Preview: CoinpliancePreview },
  { title: 'Black Mango Production', Preview: BlackMangoPreview },
  { title: 'Chain — Labs', Preview: ChainLabsPreview },
]

function ProjectCard({ title, Preview, index }) {
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
        <Preview />
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
          e.currentTarget.style.borderColor = 'rgba(0,229,255,0.5)'
          e.currentTarget.style.background = 'rgba(0,229,255,0.08)'
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
          color: 'rgba(0,229,255,0.7)',
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
