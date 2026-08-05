'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  compact?: boolean
  className?: string
}

export default function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Açık temaya geç' : 'Koyu temaya geç'

  return (
    <button
      type="button"
      className={cn('kade-theme-toggle', compact && 'kade-theme-toggle--compact', className)}
      onClick={cycleTheme}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
