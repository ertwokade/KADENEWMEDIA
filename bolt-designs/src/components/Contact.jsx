import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const fieldLabelStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '12px',
  fontWeight: '400',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '6px',
  display: 'block',
}

const fieldBaseStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '6px',
  padding: '11px 14px',
  color: '#ffffff',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.25s',
}

function Field({ label, children }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  )
}

function focusHandlers(setter) {
  return {
    onFocus: e => { e.currentTarget.style.borderColor = 'rgba(217,164,65,0.6)' },
    onBlur: e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' },
  }
}

export default function Contact() {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '90vh',
        padding: '120px 6vw 100px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Giant background wordmark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: '38%',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '600',
          fontSize: 'clamp(120px, 16vw, 260px)',
          lineHeight: '1',
          letterSpacing: '-0.04em',
          color: 'rgba(255,255,255,0.9)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        Bolt — Designs
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          marginLeft: 'auto',
          width: 'min(420px, 92vw)',
          background: 'rgba(4,13,30,0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <h2 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(28px, 3vw, 36px)',
          fontWeight: '400',
          color: '#ffffff',
          marginBottom: '28px',
          letterSpacing: '-0.02em',
        }}>
          Get in touch
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Name *">
            <input required type="text" style={fieldBaseStyle} {...focusHandlers()} />
          </Field>
          <Field label="Email *">
            <input required type="email" style={fieldBaseStyle} {...focusHandlers()} />
          </Field>
          <Field label="Company name *">
            <input required type="text" style={fieldBaseStyle} {...focusHandlers()} />
          </Field>
          <Field label="Service *">
            <select required defaultValue="" style={{ ...fieldBaseStyle, appearance: 'auto' }} {...focusHandlers()}>
              <option value="" disabled>Select a service</option>
              <option value="web-design">Web Design</option>
              <option value="web-dev">Web Dev</option>
              <option value="3d-design">3D Design</option>
              <option value="animations">Animations</option>
            </select>
          </Field>
          <Field label="Budget Range *">
            <input required type="text" placeholder="$5k – $10k" style={fieldBaseStyle} {...focusHandlers()} />
          </Field>
          <Field label="Project Brief *">
            <textarea required rows={4} style={{ ...fieldBaseStyle, resize: 'vertical', fontFamily: "'Inter', sans-serif" }} {...focusHandlers()} />
          </Field>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              background: '#ffffff',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '6px',
              padding: '13px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {submitted ? 'Sent ✓' : 'Submit'}
          </button>
        </form>
      </motion.div>
    </section>
  )
}
