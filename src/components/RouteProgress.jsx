import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigation } from 'react-router-dom'
import './RouteProgress.css'

export default function RouteProgress() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const hideRef = useRef(null)
  const firstRef = useRef(true)

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false
      return
    }

    // Start
    setVisible(true)
    setProgress(12)

    const steps = [24, 44, 62, 78, 88]
    let i = 0
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = steps[i] ?? Math.min(92, p + 1)
        i += 1
        return next
      })
    }, 120)

    // Complete
    const complete = setTimeout(() => {
      clearInterval(timerRef.current)
      setProgress(100)
      hideRef.current = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 280)
    }, 520)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(complete)
      clearTimeout(hideRef.current)
    }
  }, [location.pathname])

  return (
    <div
      className={`route-progress ${visible ? 'route-progress--visible' : ''}`}
      aria-hidden="true"
    >
      <div className="route-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  )
}
