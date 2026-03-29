import { useEffect, useRef } from 'react'

export default function HeroBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationId
    let time = 0

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.0008,
      speedY: (Math.random() - 0.5) * 0.0005,
      opacity: Math.random() * 0.4 + 0.1,
    }))

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      time += 0.006
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // Primary yellow light - moves left to right
      const x1 = w * 0.5 + Math.sin(time) * w * 0.4
      const y1 = h * 0.4 + Math.cos(time * 0.6) * h * 0.1
      const pulse1 = 0.5 + Math.sin(time * 1.5) * 0.5

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, 450)
      grad1.addColorStop(0, `rgba(234, 195, 33, ${0.15 * pulse1})`)
      grad1.addColorStop(0.3, `rgba(253, 224, 71, ${0.08 * pulse1})`)
      grad1.addColorStop(0.7, `rgba(234, 195, 33, ${0.03 * pulse1})`)
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)

      // Secondary light - slower, offset path
      const x2 = w * 0.4 + Math.cos(time * 0.8) * w * 0.3
      const y2 = h * 0.6 + Math.sin(time * 0.5) * h * 0.15
      const pulse2 = 0.4 + Math.sin(time * 2 + 1) * 0.4

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, 350)
      grad2.addColorStop(0, `rgba(253, 224, 71, ${0.1 * pulse2})`)
      grad2.addColorStop(0.5, `rgba(234, 195, 33, ${0.04 * pulse2})`)
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, w, h)

      // Bright core on primary light
      const coreGrad = ctx.createRadialGradient(x1, y1, 0, x1, y1, 150)
      coreGrad.addColorStop(0, `rgba(253, 224, 71, ${0.2 * pulse1})`)
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = coreGrad
      ctx.fillRect(0, 0, w, h)

      // Floating particles
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY

        // Wrap around
        if (p.x < -0.05) p.x = 1.05
        if (p.x > 1.05) p.x = -0.05
        if (p.y < -0.05) p.y = 1.05
        if (p.y > 1.05) p.y = -0.05

        const px = p.x * w
        const py = p.y * h
        const flicker = p.opacity * (0.6 + Math.sin(time * 3 + p.x * 10) * 0.4)

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(234, 195, 33, ${flicker})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
