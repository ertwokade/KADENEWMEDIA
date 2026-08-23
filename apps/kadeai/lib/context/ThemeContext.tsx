'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * TEMA — kadenewmedia.com ile ORTAK TERCİH
 *
 * KadeAI aynı origin altında `/kadeai` yolunda çalışır, yani localStorage'ı
 * pazarlama sitesi ve React uygulamasıyla paylaşır. Site tercihi `theme`
 * anahtarında `light | dark | system` olarak tutuyor (bkz. src/i18n/
 * ThemeContext.jsx ve haoqi-clone/kade-brand.js). Burada aynı anahtar, aynı
 * değer kümesi kullanılır ve yazarken ikisi birden güncellenir; aksi hâlde
 * ziyaretçi siteyi koyu, paneli açık temada görüyordu.
 *
 * `system`, işletim sistemi tercihini izler ve sayfa açıkken değişirse
 * anında uygulanır — kullanıcının bir şey seçmediği durumun doğru karşılığı.
 */
export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const LEGACY_THEME_STORAGE_KEY = 'kade-theme-mode'
export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system']

type ThemeContextValue = {
  mode: ThemeMode
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light'
  return mode
}

function readStoredMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(stored)) return stored
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (isThemeMode(legacy)) return legacy
  } catch {
    // Storage may be unavailable; the system default still works for this session.
  }
  return 'system'
}

function applyTheme(mode: ThemeMode, theme: ResolvedTheme) {
  const root = document.documentElement
  root.dataset.themeMode = mode
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? '#0f1111' : '#fdf6e3'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [theme, setTheme] = useState<ResolvedTheme>('light')

  // İlk okuma sunucuda yapılamaz: localStorage ve matchMedia yalnız istemcide
  // var. layout.tsx'teki satır içi script aynı kararı ilk boyadan önce verir,
  // burada React durumu onunla eşitlenir.
  useEffect(() => {
    const storedMode = readStoredMode()
    setModeState(storedMode)
    const resolved = resolveTheme(storedMode)
    setTheme(resolved)
    applyTheme(storedMode, resolved)
  }, [])

  useEffect(() => {
    if (mode !== 'system') return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = resolveTheme('system')
      setTheme(resolved)
      applyTheme('system', resolved)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    const safeMode = isThemeMode(nextMode) ? nextMode : 'system'
    const resolved = resolveTheme(safeMode)
    setModeState(safeMode)
    setTheme(resolved)
    applyTheme(safeMode, resolved)
    try {
      // İki anahtar da yazılır: tercih siteye de geri taşınsın.
      window.localStorage.setItem(THEME_STORAGE_KEY, safeMode)
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, safeMode)
    } catch {
      // Keep the in-memory preference if storage is blocked.
    }
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
