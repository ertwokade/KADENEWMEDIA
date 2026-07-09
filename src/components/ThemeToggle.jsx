import { useEffect, useState } from 'react'
import './ThemeToggle.css'

const STORAGE_KEY = 'kade-theme'

function getInitial() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore unavailable storage */ }
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (document.startViewTransition) {
      document.startViewTransition(() => setTheme(next))
    } else {
      setTheme(next)
    }
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
      title={theme === 'dark' ? 'Açık mod' : 'Koyu mod'}
    >
      <span className="theme-toggle__track">
        <span className={`theme-toggle__thumb theme-toggle__thumb--${theme}`}>
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
              </g>
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
