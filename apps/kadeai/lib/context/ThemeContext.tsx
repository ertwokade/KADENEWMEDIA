'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'kade-theme-mode'
export const THEME_MODES: ThemeMode[] = ['light', 'dark']

type ThemeContextValue = {
  mode: ThemeMode
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark'
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
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [theme, setTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    let storedMode: ThemeMode = 'light'
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemeMode(stored)) storedMode = stored
    } catch {
      // Storage may be unavailable; the light default still works for this session.
    }

    const domTheme = document.documentElement.dataset.theme
    const resolved = domTheme === 'dark' || domTheme === 'light'
      ? domTheme
      : storedMode

    setModeState(storedMode)
    setTheme(resolved)
    applyTheme(storedMode, resolved)
  }, [])

  const setMode = useCallback((nextMode: ThemeMode) => {
    const update = () => {
      setModeState(nextMode)
      setTheme(nextMode)
      applyTheme(nextMode, nextMode)
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
    setMode(theme === 'dark' ? 'light' : 'dark')
  }, [setMode, theme])

  const value = useMemo(() => ({ mode, theme, setMode, cycleTheme }), [cycleTheme, mode, setMode, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
