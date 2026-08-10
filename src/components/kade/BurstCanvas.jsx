import { useEffect, useRef } from 'react'

/**
 * IŞIN PATLAMASI — merkezden dışa doğru uzayan çizgi alanı.
 *
 * Neden 2B canvas, WebGL değil: sahne yalnız düz çizgiler çiziyor. Three.js
 * bundle'ı (~600 KB) ve bir GPU bağlamı bunun için ölçüsüz kalıyor; ana
 * sayfada zaten bir WebGL bağlamı var (giriş bölümündeki cam obje) ve ikinci
 * bir bağlam mobilde ilkinin kaybolmasına yol açıyor.
 *
 * Erişilebilirlik: dekoratif. `prefers-reduced-motion` açıkken tek kare
 * çizilir ve animasyon hiç başlamaz — hareket yok, kompozisyon korunur.
 */

const COLORS = ['#f7e07a', '#f0b429', '#ef8f5a', '#e8657f', '#f5d84a']

export default function BurstCanvas({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return undefined

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let raf = null
    let rays = []
    let width = 0
    let height = 0

    const seed = () => {
      // Işın sayısı alana göre: küçük ekranda aynı yoğunluk hem gereksiz
      // hem de pahalı.
      const count = Math.round(Math.min(320, Math.max(90, (width * height) / 5200)))
      rays = Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        // Başlangıç mesafesi karekökle dağıtılır; düz rastgelelik merkezde
        // yığılıp dışarıda seyrekleşiyordu.
        dist: Math.sqrt(Math.random()),
        len: 0.04 + Math.random() * 0.16,
        speed: 0.0009 + Math.random() * 0.0034,
        width: 0.6 + Math.random() * 1.9,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      }))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height / 2
      const max = Math.hypot(cx, cy)
      ctx.lineCap = 'round'
      for (const ray of rays) {
        const from = ray.dist * max
        const to = Math.min(max * 1.15, from + ray.len * max)
        const cos = Math.cos(ray.angle)
        const sin = Math.sin(ray.angle)
        // Merkeze yakın çizgiler sönük; dışa doğru açılır. Perspektif hissi
        // tamamen bu opaklık rampasından geliyor.
        ctx.globalAlpha = Math.min(1, ray.dist * 1.6) * 0.85
        ctx.strokeStyle = ray.color
        ctx.lineWidth = ray.width
        ctx.beginPath()
        ctx.moveTo(cx + cos * from, cy + sin * from)
        ctx.lineTo(cx + cos * to, cy + sin * to)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const tick = () => {
      for (const ray of rays) {
        ray.dist += ray.speed
        if (ray.dist > 1.1) {
          ray.dist = 0
          ray.angle = Math.random() * Math.PI * 2
        }
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (reduce?.matches) draw()
      else raf = requestAnimationFrame(tick)
    }

    resize()
    start()

    const observer = new ResizeObserver(() => { resize(); if (reduce?.matches) draw() })
    observer.observe(canvas)
    reduce?.addEventListener?.('change', start)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      reduce?.removeEventListener?.('change', start)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
