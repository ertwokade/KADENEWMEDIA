import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import './ThemeToggle.css'

export default function ThemeToggle({ className = '' }) {
  const { theme, cycleTheme } = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? HiOutlineSun : HiOutlineMoon
  const label = isDark ? 'Açık temaya geç' : 'Koyu temaya geç'

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={cycleTheme}
      aria-label={label}
      title={label}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}
