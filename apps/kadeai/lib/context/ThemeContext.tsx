'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'kade-theme-mode'
export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']

type ThemeContextValue = {
  mode: ThemeMode
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyTheme(mode: ThemeMode, theme: ResolvedTheme) {
  const root = document.documentElement
  root.dataset.themeMode = mode
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? '#08090d' : '#fbfaf4'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [theme, setTheme] = useState<ResolvedTheme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let storedMode: ThemeMode = 'system'
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemeMode(stored)) storedMode = stored
    } catch {
      // Storage may be unavailable; system mode still works for this session.
    }

    const domTheme = document.documentElement.dataset.theme
    const resolved = domTheme === 'dark' || domTheme === 'light'
      ? domTheme
      : resolveTheme(storedMode)

    setModeState(storedMode)
    setTheme(resolved)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || mode !== 'system') return undefined
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      const nextTheme = event.matches ? 'dark' : 'light'
      setTheme(nextTheme)
      applyTheme('system', nextTheme)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [mode, ready])

  const setMode = useCallback((nextMode: ThemeMode) => {
    const nextTheme = resolveTheme(nextMode)
    const update = () => {
      setModeState(nextMode)
      setTheme(nextTheme)
      applyTheme(nextMode, nextTheme)
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode)
      } catch {
        // Keep the in-memory preference if storage is blocked.
      }
    }

    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => void
    }
    if (transitionDocument.startViewTransition) transitionDocument.startViewTransition(update)
    else update()
  }, [])

  const cycleTheme = useCallback(() => {
    const index = THEME_MODES.indexOf(mode)
    setMode(THEME_MODES[(index + 1) % THEME_MODES.length])
  }, [mode, setMode])

  const value = useMemo(() => ({ mode, theme, setMode, cycleTheme }), [cycleTheme, mode, setMode, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
