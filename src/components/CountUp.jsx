import { useEffect, useRef, useState } from 'react'

export default function CountUp({
  to = 0,
  from = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = '.',
  className = '',
  once = true,
}) {
  const [value, setValue] = useState(from)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const animate = () => {
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(from + (to - from) * eased)
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true
            animate()
            if (once) io.unobserve(el)
          }
        })
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, from, duration, once])

  const formatted = Number(value).toFixed(decimals)
  const [int, dec] = formatted.split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  const display = dec ? `${withSep},${dec}` : withSep

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
