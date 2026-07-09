import { useEffect, useRef, useState } from 'react'
import './CatcherGame.css'

const W = 420
const H = 320
const PADDLE_W = 80
const PADDLE_H = 12
const ITEM_R = 10

export default function CatcherGame() {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const stateRef = useRef(null)
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem('kade_404_best') || 0) } catch { return 0 }
  })
  const [lives, setLives] = useState(3)

  useEffect(() => {
    try { localStorage.setItem('kade_404_best', String(best)) } catch { /* ignore unavailable storage */ }
  }, [best])

  const start = () => {
    stateRef.current = {
      paddleX: W / 2 - PADDLE_W / 2,
      items: [],
      spawnT: 0,
      speed: 1.4,
      score: 0,
      lives: 3,
    }
    setScore(0)
    setLives(3)
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const ratio = W / rect.width
      stateRef.current.paddleX = Math.max(0, Math.min(W - PADDLE_W, x * ratio - PADDLE_W / 2))
    }

    const onKey = (e) => {
      if (!stateRef.current) return
      if (e.key === 'ArrowLeft')  stateRef.current.paddleX = Math.max(0, stateRef.current.paddleX - 22)
      if (e.key === 'ArrowRight') stateRef.current.paddleX = Math.min(W - PADDLE_W, stateRef.current.paddleX + 22)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('keydown', onKey)

    const tick = () => {
      const s = stateRef.current
      if (!s) return
      ctx.clearRect(0, 0, W, H)

      // bg dots
      ctx.fillStyle = 'rgba(234,195,33,0.06)'
      for (let i = 0; i < 30; i++) {
        ctx.fillRect((i * 47) % W, (i * 83) % H, 2, 2)
      }

      // spawn
      s.spawnT += 1
      if (s.spawnT > Math.max(28, 70 - s.score * 2)) {
        s.spawnT = 0
        const kind = Math.random() < 0.15 ? 'bomb' : 'coin'
        s.items.push({
          x: 20 + Math.random() * (W - 40),
          y: -20,
          vy: s.speed + Math.random() * 1.2,
          kind,
        })
      }

      // update + draw items
      s.items.forEach((it) => { it.y += it.vy })

      const pX = s.paddleX
      const pY = H - 28

      s.items = s.items.filter((it) => {
        // collision with paddle
        if (it.y + ITEM_R >= pY && it.y - ITEM_R <= pY + PADDLE_H && it.x > pX && it.x < pX + PADDLE_W) {
          if (it.kind === 'coin') {
            s.score += 1
            setScore(s.score)
            if (s.score > best) setBest(s.score)
            s.speed = 1.4 + s.score * 0.05
          } else {
            s.lives -= 1
            setLives(s.lives)
          }
          return false
        }
        if (it.y > H + 20) {
          if (it.kind === 'coin') {
            s.lives -= 1
            setLives(s.lives)
          }
          return false
        }
        return true
      })

      // draw items
      s.items.forEach((it) => {
        if (it.kind === 'coin') {
          ctx.beginPath()
          ctx.fillStyle = '#eac321'
          ctx.shadowColor = 'rgba(234,195,33,0.6)'
          ctx.shadowBlur = 12
          ctx.arc(it.x, it.y, ITEM_R, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.fillStyle = '#000'
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('K', it.x, it.y + 1)
        } else {
          ctx.beginPath()
          ctx.fillStyle = '#e74c3c'
          ctx.arc(it.x, it.y, ITEM_R, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ffb3a8'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      // paddle
      const grad = ctx.createLinearGradient(pX, pY, pX + PADDLE_W, pY)
      grad.addColorStop(0, '#f5e058')
      grad.addColorStop(1, '#c9a81c')
      ctx.fillStyle = grad
      ctx.fillRect(pX, pY, PADDLE_W, PADDLE_H)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(pX, pY, PADDLE_W, 2)

      if (s.lives <= 0) {
        setRunning(false)
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [running, best])

  return (
    <div className="cgame">
      <div className="cgame__hud">
        <div><span>Skor</span><strong>{score}</strong></div>
        <div><span>Rekor</span><strong>{best}</strong></div>
        <div className="cgame__lives" aria-label={`${lives} can`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`cgame__heart ${i < lives ? '' : 'cgame__heart--dim'}`}>
              ♥
            </span>
          ))}
        </div>
      </div>
      <div className="cgame__stage">
        <canvas ref={canvasRef} width={W} height={H} className="cgame__canvas" />
        {!running && (
          <div className="cgame__overlay">
            <h3>{score > 0 ? 'Oyun bitti' : 'Mini oyun'}</h3>
            <p>
              {score > 0
                ? `${score} puan yakaladın. Tekrar dene!`
                : 'Sarı "K" rozetlerini topla, kırmızı bombalardan kaç.'}
            </p>
            <button type="button" className="cgame__btn" onClick={start}>
              {score > 0 ? 'Tekrar oyna' : 'Başla'}
            </button>
            <p className="cgame__hint">Fare / parmak / ← → tuşları ile hareket</p>
          </div>
        )}
      </div>
    </div>
  )
}
