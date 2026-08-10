import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext()

/**
 * TEK TEMA KAYNAĞI
 *
 * Anasayfa ("/") derlenmiş bir snapshot'tan servis ediliyor ve tema tercihini
 * localStorage'da `theme` anahtarında, `light | dark | system` değerleriyle
 * tutuyor. React uygulaması bir dönem ayrı bir anahtar (`kade-theme-mode`) ve
 * ayrı bir varsayılan (dark) kullanıyordu; sonuç, sistemi açık temada olan
 * ziyaretçinin anasayfayı krem, menüden geçtiği iç sayfayı koyu görmesiydi.
 *
 * Bu yüzden burada snapshot'ın anahtarı ve değer kümesi birebir kullanılır.
 * Varsayılan `system`: iki taraf da işletim sistemini izler, tercih tek yerde
 * saklanır ve iki yönde de taşınır.
 */
const THEME_STORAGE_KEY = 'theme'
const LEGACY_STORAGE_KEY = 'kade-theme-mode'
const MODES = ['light', 'dark', 'system']
const DEFAULT_MODE = 'system'

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches

/** Mod → gerçekte boyanacak tema. */
const resolveTheme = (mode) => (mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode)

function getStoredMode() {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (MODES.includes(stored)) return stored
    // Eski anahtarla kaydedilmiş tercih varsa bir kez devralınır.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return MODES.includes(legacy) ? legacy : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-theme-mode', theme)
  root.style.colorScheme = theme

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#0f1111' : '#fbfaf4')
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getStoredMode)
  const [theme, setTheme] = useState(() => resolveTheme(getStoredMode()))

  // `system` modunda işletim sistemi teması sayfa açıkken de değişebilir.
  useEffect(() => {
    setTheme(resolveTheme(mode))
    if (mode !== 'system' || typeof window === 'undefined') return undefined

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(resolveTheme('system'))
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [mode])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    try {
      // Snapshot anasayfa bu anahtarı okur; tercih iki yönde de taşınsın.
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
      window.localStorage.setItem(LEGACY_STORAGE_KEY, mode)
    } catch {
      // Private browsing or disabled storage: the theme still works for this visit.
    }
  }, [mode])

  const setMode = useCallback((nextMode) => {
    const safeMode = MODES.includes(nextMode) ? nextMode : DEFAULT_MODE
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => setModeState(safeMode))
    } else {
      setModeState(safeMode)
    }
  }, [])

  /**
   * Düğme iki durum arasında gezer: koyu ↔ açık. `system` modundayken ilk
   * tıklama, o an görünenin tersini seçer — ziyaretçi için beklenen davranış.
   */
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
