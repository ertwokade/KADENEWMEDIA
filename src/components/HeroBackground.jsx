import { useEffect, useRef } from 'react'

export default function HeroBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationId
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      time += 0.008
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // Yellow light that moves left-right and pulses
      const x = w * 0.5 + Math.sin(time) * w * 0.35
      const y = h * 0.45 + Math.cos(time * 0.7) * h * 0.08
      const pulse = 0.6 + Math.sin(time * 2) * 0.4

      // Outer glow
      const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, 500)
      outerGrad.addColorStop(0, `rgba(250, 204, 21, ${0.12 * pulse})`)
      outerGrad.addColorStop(0.4, `rgba(249, 115, 22, ${0.06 * pulse})`)
      outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = outerGrad
      ctx.fillRect(0, 0, w, h)

      // Inner bright core
      const innerGrad = ctx.createRadialGradient(x, y, 0, x, y, 200)
      innerGrad.addColorStop(0, `rgba(253, 224, 71, ${0.25 * pulse})`)
      innerGrad.addColorStop(0.5, `rgba(250, 204, 21, ${0.1 * pulse})`)
      innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = innerGrad
      ctx.fillRect(0, 0, w, h)

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
