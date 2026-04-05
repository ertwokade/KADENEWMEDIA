import { useEffect, useRef } from 'react'

/**
 * Rich canvas-based animated background for every page hero section.
 * Each page type gets its own color accent and animation style while
 * maintaining the same premium quality as the Home page HeroBackground.
 *
 * @param {'home'|'services'|'packages'|'contact'|'about'|'blog'|'careers'|'partners'|'portfolio'|'team'} type
 */

const THEMES = {
  home: {
    primary: [234, 195, 33],    // #eac321
    secondary: [253, 224, 71],  // #fde047
    accent: [255, 250, 200],
    particleCount: 60,
    shootingStars: true,
    waveLines: false,
    orbCount: 3,
  },
  services: {
    primary: [234, 195, 33],
    secondary: [180, 154, 24],  // darker gold
    accent: [255, 240, 180],
    particleCount: 45,
    shootingStars: false,
    waveLines: true,
    orbCount: 3,
  },
  packages: {
    primary: [234, 195, 33],
    secondary: [212, 184, 32],
    accent: [255, 255, 220],
    particleCount: 50,
    shootingStars: true,
    waveLines: false,
    orbCount: 2,
  },
  contact: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 248, 200],
    particleCount: 35,
    shootingStars: false,
    waveLines: false,
    orbCount: 3,
  },
  about: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 250, 200],
    particleCount: 40,
    shootingStars: false,
    waveLines: false,
    orbCount: 3,
  },
  blog: {
    primary: [234, 195, 33],
    secondary: [200, 170, 30],
    accent: [255, 245, 190],
    particleCount: 40,
    shootingStars: false,
    waveLines: true,
    orbCount: 2,
  },
  careers: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 250, 200],
    particleCount: 45,
    shootingStars: true,
    waveLines: false,
    orbCount: 2,
  },
  partners: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 250, 200],
    particleCount: 35,
    shootingStars: false,
    waveLines: false,
    orbCount: 3,
  },
  portfolio: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 250, 200],
    particleCount: 50,
    shootingStars: true,
    waveLines: false,
    orbCount: 3,
  },
  team: {
    primary: [234, 195, 33],
    secondary: [253, 224, 71],
    accent: [255, 250, 200],
    particleCount: 35,
    shootingStars: false,
    waveLines: false,
    orbCount: 2,
  },
}

export default function PageHeroCanvas({ type = 'home' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const theme = THEMES[type] || THEMES.home
    const [pr, pg, pb] = theme.primary
    const [sr, sg, sb] = theme.secondary
    const [ar, ag, ab] = theme.accent

    let animationId
    let time = 0

    // Particles
    const particles = Array.from({ length: theme.particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 3 + 0.5,
      speedX: (Math.random() - 0.5) * 0.001,
      speedY: (Math.random() - 0.5) * 0.0007,
      opacity: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    // Shooting stars
    const shootingStars = []
    const spawnStar = (w, h) => ({
      x: Math.random() * w * 0.5,
      y: Math.random() * h * 0.3,
      speed: 3 + Math.random() * 4,
      length: 40 + Math.random() * 60,
      opacity: 0.6 + Math.random() * 0.4,
      life: 0,
      maxLife: 40 + Math.random() * 30,
    })

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      time += 0.008
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // ── Orb 1: main sweeping light ──
      const x1 = w * 0.5 + Math.sin(time * 0.7) * w * 0.42
      const y1 = h * 0.38 + Math.cos(time * 0.5) * h * 0.12
      const pulse1 = 0.55 + Math.sin(time * 1.2) * 0.45

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, 500)
      grad1.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${0.18 * pulse1})`)
      grad1.addColorStop(0.25, `rgba(${sr}, ${sg}, ${sb}, ${0.1 * pulse1})`)
      grad1.addColorStop(0.6, `rgba(${pr}, ${pg}, ${pb}, ${0.04 * pulse1})`)
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, w, h)

      // ── Orb 2: secondary light ──
      if (theme.orbCount >= 2) {
        const x2 = w * 0.5 - Math.sin(time * 0.7) * w * 0.35
        const y2 = h * 0.6 + Math.sin(time * 0.4) * h * 0.15
        const pulse2 = 0.4 + Math.sin(time * 1.8 + 2) * 0.4

        const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, 400)
        grad2.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${0.12 * pulse2})`)
        grad2.addColorStop(0.4, `rgba(${pr}, ${pg}, ${pb}, ${0.05 * pulse2})`)
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad2
        ctx.fillRect(0, 0, w, h)
      }

      // ── Orb 3: accent light ──
      if (theme.orbCount >= 3) {
        const x3 = w * 0.5 + Math.cos(time * 0.9) * w * 0.25
        const y3 = h * 0.5 + Math.sin(time * 0.9) * h * 0.2
        const pulse3 = 0.3 + Math.sin(time * 2.5) * 0.3

        const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, 250)
        grad3.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${0.15 * pulse3})`)
        grad3.addColorStop(0.5, `rgba(${pr}, ${pg}, ${pb}, ${0.05 * pulse3})`)
        grad3.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad3
        ctx.fillRect(0, 0, w, h)
      }

      // ── Bright core on main orb ──
      const coreGrad = ctx.createRadialGradient(x1, y1, 0, x1, y1, 120)
      coreGrad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${0.25 * pulse1})`)
      coreGrad.addColorStop(0.5, `rgba(${sr}, ${sg}, ${sb}, ${0.1 * pulse1})`)
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = coreGrad
      ctx.fillRect(0, 0, w, h)

      // ── Wave lines (services / blog style) ──
      if (theme.waveLines) {
        ctx.save()
        for (let i = 0; i < 4; i++) {
          ctx.beginPath()
          const baseY = h * (0.3 + i * 0.15)
          const amp = 20 + i * 8
          const freq = 0.003 + i * 0.001
          const alpha = 0.04 + (i % 2) * 0.02
          for (let x = 0; x < w; x += 2) {
            const y = baseY + Math.sin(x * freq + time * (1 + i * 0.3)) * amp
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.restore()
      }

      // ── Floating particles with glow ──
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

        // Particle glow
        const pglow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4)
        pglow.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${flicker * 0.3})`)
        pglow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = pglow
        ctx.fillRect(px - p.size * 4, py - p.size * 4, p.size * 8, p.size * 8)

        // Particle core
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${flicker})`
        ctx.fill()
      }

      // ── Shooting stars ──
      if (theme.shootingStars) {
        if (Math.random() < 0.008 && shootingStars.length < 2) {
          shootingStars.push(spawnStar(w, h))
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i]
          s.x += s.speed
          s.y += s.speed * 0.4
          s.life++

          const fade = s.life < 10 ? s.life / 10 : Math.max(0, 1 - (s.life - 10) / (s.maxLife - 10))
          const alpha = s.opacity * fade

          const lineGrad = ctx.createLinearGradient(s.x, s.y, s.x - s.length * 0.7, s.y - s.length * 0.28)
          lineGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${alpha})`)
          lineGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`)

          ctx.beginPath()
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x - s.length * 0.7, s.y - s.length * 0.28)
          ctx.strokeStyle = lineGrad
          ctx.lineWidth = 1.5
          ctx.stroke()

          if (s.life >= s.maxLife) shootingStars.splice(i, 1)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [type])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
