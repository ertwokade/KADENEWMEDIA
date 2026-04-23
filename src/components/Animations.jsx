import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useCallback } from 'react'

const defaultVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export function FadeIn({ children, delay = 0, direction = 'up', className, style }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className, style, staggerDelay = 0.1 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={defaultVariants}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, delay = 0, className, style }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

export function TiltCard({ children, className, style, strength = 8 }) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(700px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(4px)`
  }, [strength])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transition: 'transform 0.25s ease', willChange: 'transform' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

export function CountUp({ target, duration = 2, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current || !ref.current) return
    hasAnimated.current = true

    const start = 0
    const end = typeof target === 'number' ? target : parseInt(target, 10) || 0
    const startTime = performance.now()

    function update(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      // easeOut curve
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      if (ref.current) {
        ref.current.textContent = current + suffix
      }
      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }

    requestAnimationFrame(update)
  }, [isInView, target, duration, suffix])

  return (
    <span ref={ref}>
      {`0${suffix}`}
    </span>
  )
}
