import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'kade-theme-mode'
const THEME_MODES = ['light', 'dark']

function getStoredMode() {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_MODES.includes(stored) ? stored : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-theme-mode', theme)
  root.style.colorScheme = theme

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#0b0b0a' : '#fbfaf4')
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getStoredMode)
  const theme = mode

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Private browsing or disabled storage: the theme still works for this visit.
    }
  }, [theme])

  const setMode = useCallback((nextMode) => {
    const safeMode = THEME_MODES.includes(nextMode) ? nextMode : 'light'
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => setModeState(safeMode))
    } else {
      setModeState(safeMode)
    }
  }, [])

  const cycleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark')
  }, [setMode, theme])

  const value = useMemo(() => ({
    mode,
    theme,
    setMode,
    setTheme: setMode,
    cycleTheme,
    toggleTheme: cycleTheme,
  }), [cycleTheme, mode, setMode, theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
