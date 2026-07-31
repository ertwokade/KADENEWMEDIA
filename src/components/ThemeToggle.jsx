import { HiOutlineDesktopComputer, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'
import { useTheme } from '../i18n/ThemeContext'
import './ThemeToggle.css'

export default function ThemeToggle({ className = '' }) {
  const { mode, cycleTheme } = useTheme()
  const options = {
    system: { icon: HiOutlineDesktopComputer, label: 'Sistem', next: 'Açık' },
    light: { icon: HiOutlineSun, label: 'Açık', next: 'Koyu' },
    dark: { icon: HiOutlineMoon, label: 'Koyu', next: 'Sistem' },
  }
  const option = options[mode] || options.system
  const Icon = option.icon

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={cycleTheme}
      aria-label={`${option.label} tema etkin. ${option.next} temaya geç`}
      title={`Tema: ${option.label}`}
    >
      <span className="theme-toggle__track">
        <span className={`theme-toggle__thumb theme-toggle__thumb--${mode}`}>
          <Icon size={14} aria-hidden="true" />
        </span>
      </span>
    </button>
  )
}
