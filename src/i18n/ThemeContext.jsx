import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'kade-theme-mode'
const THEME_MODES = ['system', 'light', 'dark']

function getStoredMode() {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode, resolvedTheme) {
  const root = document.documentElement
  root.setAttribute('data-theme', resolvedTheme)
  root.setAttribute('data-theme-mode', mode)
  root.style.colorScheme = resolvedTheme

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0b0b0a' : '#fbfaf4')
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getStoredMode)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const theme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    syncSystemTheme(media)
    media.addEventListener?.('change', syncSystemTheme)
    return () => media.removeEventListener?.('change', syncSystemTheme)
  }, [])

  useEffect(() => {
    applyTheme(mode, theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // Private browsing or disabled storage: the theme still works for this visit.
    }
  }, [mode, theme])

  const setMode = useCallback((nextMode) => {
    const safeMode = THEME_MODES.includes(nextMode) ? nextMode : 'system'
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => setModeState(safeMode))
    } else {
      setModeState(safeMode)
    }
  }, [])

  const cycleTheme = useCallback(() => {
    const index = THEME_MODES.indexOf(mode)
    setMode(THEME_MODES[(index + 1) % THEME_MODES.length])
  }, [mode, setMode])

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
