import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './PortfolioGrid.css'

// Each item: { id, title, category, image, video (optional) }
export default function PortfolioGrid({ items }) {
  return (
    <div className="pgrid">
      {items.map((item, i) => (
        <PortfolioCard key={item.id || i} item={item} index={i} />
      ))}
    </div>
  )
}

function PortfolioCard({ item, index }) {
  const videoRef = useRef(null)
  const cardRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [inView, setInView] = useState(false)

  // Intersection Observer — only load when visible
  useEffect(() => {
    if (!item.video) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '100px' }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [item.video])

  // Play/pause on hover
  useEffect(() => {
    if (!videoRef.current) return
    if (hovered) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [hovered])

  return (
    <motion.div
      ref={cardRef}
      className="pgrid-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Static image */}
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className={`pgrid-img ${hovered && item.video ? 'pgrid-img-hidden' : ''}`}
          loading="lazy"
        />
      )}

      {/* Video — only rendered when in view */}
      {item.video && inView && (
        <video
          ref={videoRef}
          className={`pgrid-video ${hovered ? 'pgrid-video-visible' : ''}`}
          src={item.video}
          muted
          loop
          playsInline
          preload="none"
        />
      )}

      {/* Glassmorphism overlay */}
      <div className="pgrid-overlay">
        <span className="pgrid-category">{item.category}</span>
        <h3 className="pgrid-title">{item.title}</h3>
      </div>
    </motion.div>
  )
}
