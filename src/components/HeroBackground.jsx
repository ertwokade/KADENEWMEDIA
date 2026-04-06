import { useEffect, useRef } from 'react'

export default function HeroBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationId
    let time = 0
    let dpr = 1
    let w = 0
    let h = 0

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.0008,
      speedY: (Math.random() - 0.5) * 0.0005,
      opacity: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    const shootingStars = []
    const spawnStar = () => ({
      x: Math.random() * w * 0.5,
      y: Math.random() * h * 0.3,
      speed: 3 + Math.random() * 4,
      length: 40 + Math.random() * 60,
      opacity: 0.6 + Math.random() * 0.4,
      life: 0,
      maxLife: 40 + Math.random() * 30,
    })

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      time += 0.008
      ctx.clearRect(0, 0, w, h)

      // Main light
      const x1 = w * 0.5 + Math.sin(time * 0.7) * w * 0.42
      const y1 = h * 0.38 + Math.cos(time * 0.5) * h * 0.12
      const pulse1 = 0.55 + Math.sin(time * 1.2) * 0.45

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, 450)
      grad1.addColorStop(0, `rgba(234, 195, 33, ${0.15 * pulse1})`)
      grad1.addColorStop(0.3, `rgba(253, 224, 71, ${0.07 * pulse1})`)
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)

      // Secondary light
      const x2 = w * 0.5 - Math.sin(time * 0.7) * w * 0.35
      const y2 = h * 0.6 + Math.sin(time * 0.4) * h * 0.15
      const pulse2 = 0.4 + Math.sin(time * 1.8 + 2) * 0.4

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, 350)
      grad2.addColorStop(0, `rgba(253, 224, 71, ${0.10 * pulse2})`)
      grad2.addColorStop(0.5, `rgba(234, 195, 33, ${0.03 * pulse2})`)
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, w, h)

      // Particles
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < -0.05) p.x = 1.05
        if (p.x > 1.05) p.x = -0.05
        if (p.y < -0.05) p.y = 1.05
        if (p.y > 1.05) p.y = -0.05

        const px = p.x * w
        const py = p.y * h
        const flicker = p.opacity * (0.5 + Math.sin(time * 2.5 + p.phase) * 0.5)

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(253, 224, 71, ${flicker})`
        ctx.fill()
      }

      // Shooting stars
      if (Math.random() < 0.006 && shootingStars.length < 2) {
        shootingStars.push(spawnStar())
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        s.x += s.speed
        s.y += s.speed * 0.4
        s.life++

        const fade = s.life < 10 ? s.life / 10 : Math.max(0, 1 - (s.life - 10) / (s.maxLife - 10))
        const alpha = s.opacity * fade

        const lineGrad = ctx.createLinearGradient(s.x, s.y, s.x - s.length * 0.7, s.y - s.length * 0.28)
        lineGrad.addColorStop(0, `rgba(253, 224, 71, ${alpha})`)
        lineGrad.addColorStop(1, 'rgba(253, 224, 71, 0)')

        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.length * 0.7, s.y - s.length * 0.28)
        ctx.strokeStyle = lineGrad
        ctx.lineWidth = 1.5
        ctx.stroke()

        if (s.life >= s.maxLife) shootingStars.splice(i, 1)
      }

      animationId = requestAnimationFrame(animate)
    }

    // Delay start so hero text renders first without jank
    const startTimer = setTimeout(() => { animate() }, 150)

    return () => {
      clearTimeout(startTimer)
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
