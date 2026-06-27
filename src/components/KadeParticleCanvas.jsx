import { useEffect, useRef } from 'react'

const ACCENT = '#FFD400'

function hexToRgb(hex = ACCENT) {
  let value = hex.replace('#', '')
  if (value.length === 3) value = value.split('').map((c) => c + c).join('')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function sampleMask(draw, width, height, step) {
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.floor(width))
  off.height = Math.max(1, Math.floor(height))
  const ctx = off.getContext('2d')
  draw(ctx, off.width, off.height)
  const data = ctx.getImageData(0, 0, off.width, off.height).data
  const points = []

  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      if (data[(y * off.width + x) * 4 + 3] > 120) points.push([x, y])
    }
  }

  return points
}

function drawBolt(ctx, width, height) {
  const triangles = [
    [[0.492, 0.004], [0.005, 0.59], [0.492, 0.59]],
    [[0.521, 0.41], [1, 0.41], [0.521, 0.996]],
  ]

  ctx.fillStyle = '#fff'
  triangles.forEach((tri) => {
    ctx.beginPath()
    tri.forEach(([px, py], index) => {
      const x = px * width
      const y = py * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
  })
}

function drawGlyph(char) {
  return (ctx, width, height) => {
    ctx.fillStyle = '#fff'
    ctx.font = `800 ${Math.floor(height * 0.9)}px Sora, Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(char, width / 2, height / 2)
  }
}

function createSprite(accent) {
  const [r, g, b] = hexToRgb(accent)
  const sprite = document.createElement('canvas')
  sprite.width = 64
  sprite.height = 64
  const ctx = sprite.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255, 252, 232, 1)')
  grad.addColorStop(0.26, `rgba(${r}, ${g}, ${b}, 0.82)`)
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return sprite
}

export default function KadeParticleCanvas({
  className = '',
  fixed = false,
  density = 1,
  intensity = 1,
  accent = ACCENT,
  ambient = true,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const sprite = createSprite(accent)
    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let particles = []
    let ambientParticles = []
    let mouseX = 0
    let mouseY = 0
    let smoothX = 0
    let smoothY = 0
    const started = performance.now()

    const icons = [
      { char: '@', x: 0.16, y: 0.3, size: 0.115 },
      { char: '#', x: 0.3, y: 0.62, size: 0.1 },
      { char: '\u25B6', x: 0.205, y: 0.8, size: 0.1 },
      { char: '\u2665', x: 0.84, y: 0.36, size: 0.115 },
      { char: '\u2726', x: 0.88, y: 0.63, size: 0.1 },
      { char: 'K', x: 0.79, y: 0.19, size: 0.1 },
    ]

    const makeParticle = (tx, ty, brightness, size) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      tx,
      ty,
      brightness,
      size,
      phase: Math.random() * Math.PI * 2,
      amp: 0.5 + Math.random() * 1.8,
    })

    const build = () => {
      particles = []
      ambientParticles = []
      if (!width || !height) return

      const figureHeight = height * (fixed ? 0.82 : 0.72)
      const figureWidth = figureHeight * 0.66
      const cx = width * (fixed ? 0.58 : 0.6) - figureWidth / 2
      const cy = height * (fixed ? 0.38 : 0.42) - figureHeight / 2
      const boltStep = Math.max(3, Math.floor((figureHeight / 132) / density))

      sampleMask(drawBolt, figureWidth, figureHeight, boltStep).forEach(([x, y]) => {
        particles.push(makeParticle(cx + x, cy + y, 1, (2.3 + Math.random() * 4.8) * intensity))
      })

      icons.forEach((icon) => {
        const size = height * icon.size
        const step = Math.max(2, Math.floor((size / 30) / density))
        const ix = width * icon.x - size / 2
        const iy = height * icon.y - size / 2

        sampleMask(drawGlyph(icon.char), size, size, step).forEach(([x, y]) => {
          particles.push(makeParticle(ix + x, iy + y, 0.46, (1.8 + Math.random() * 3) * intensity))
        })
      })

      if (ambient) {
        const count = Math.floor((fixed ? 420 : 760) * density)
        ambientParticles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          size: (0.7 + Math.random() * 2.6) * intensity,
          speed: 0.08 + Math.random() * 0.28,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.16 + Math.random() * 0.48,
        }))
      }
    }

    const resize = () => {
      const nextWidth = canvas.clientWidth || window.innerWidth
      const nextHeight = canvas.clientHeight || window.innerHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = nextWidth
      height = nextHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      build()
    }

    const draw = (now) => {
      const time = now - started
      smoothX += (mouseX - smoothX) * 0.05
      smoothY += (mouseY - smoothY) * 0.05

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const halo = ctx.createRadialGradient(width * 0.58, height * 0.44, 0, width * 0.58, height * 0.44, Math.max(width, height) * 0.62)
      halo.addColorStop(0, 'rgba(255, 212, 0, 0.11)')
      halo.addColorStop(0.42, 'rgba(255, 212, 0, 0.045)')
      halo.addColorStop(1, 'rgba(255, 212, 0, 0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'

      for (const p of ambientParticles) {
        p.y += p.speed
        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
        }
        const twinkle = p.alpha * (0.45 + Math.sin(time * 0.003 + p.phase) * 0.35)
        ctx.globalAlpha = Math.max(0.04, twinkle)
        const size = p.size
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size)
      }

      for (const p of particles) {
        p.x += (p.tx - p.x) * 0.045
        p.y += (p.ty - p.y) * 0.045
        const ox = Math.cos(time * 0.0008 + p.phase) * p.amp + smoothX * 18 * p.brightness
        const oy = Math.sin(time * 0.001 + p.phase) * p.amp + smoothY * 18 * p.brightness
        const twinkle = 0.62 + 0.38 * Math.sin(time * 0.003 + p.phase * 2)
        ctx.globalAlpha = Math.max(0.05, p.brightness * twinkle)
        const size = p.size
        ctx.drawImage(sprite, p.x + ox - size / 2, p.y + oy - size / 2, size, size)
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    const onPointerMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = (event.clientY / window.innerHeight) * 2 - 1
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onPointerMove)
    if (document.fonts?.ready) document.fonts.ready.then(build)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onPointerMove)
    }
  }, [accent, ambient, density, fixed, intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`kade-particle-canvas ${fixed ? 'kade-particle-canvas--fixed' : ''} ${className}`}
      aria-hidden="true"
    />
  )
}
