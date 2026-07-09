import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Yeni kade arayüzü açık tema — eski 'dark' tercihini bir kez sıfırla
    const saved = localStorage.getItem('theme')
    if (localStorage.getItem('kade_theme_v2') !== '1') {
      localStorage.setItem('kade_theme_v2', '1')
      return 'light'
    }
    return saved || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => setTheme(next))
    } else {
      setTheme(next)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
