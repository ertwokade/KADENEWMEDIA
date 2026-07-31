'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import { cn } from '@/lib/utils'

const themeOptions = {
  system: { label: 'Sistem', next: 'Açık', icon: Monitor },
  light: { label: 'Açık', next: 'Koyu', icon: Sun },
  dark: { label: 'Koyu', next: 'Sistem', icon: Moon },
} as const

type ThemeToggleProps = {
  compact?: boolean
  className?: string
}

export default function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { mode, cycleTheme } = useTheme()
  const option = themeOptions[mode]
  const Icon = option.icon

  return (
    <button
      type="button"
      className={cn('kade-theme-toggle', compact && 'kade-theme-toggle--compact', className)}
      onClick={cycleTheme}
      aria-label={`${option.label} tema etkin. ${option.next} temaya geç`}
      title={`${option.label} tema · ${option.next} temaya geç`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {!compact && <span>{option.label}</span>}
    </button>
  )
}
