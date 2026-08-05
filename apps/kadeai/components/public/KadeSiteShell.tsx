import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import ThemeToggle from '@/components/theme/ThemeToggle'

type KadeSiteShellProps = {
  children: ReactNode
  compact?: boolean
}

const navItems = [
  { label: 'Hizmetler', href: '/#hizmetler' },
]

export default function KadeSiteShell({ children, compact = false }: KadeSiteShellProps) {
  return (
    <main className="kade-public min-h-screen">
      <header className="kade-public-nav">
        <Link href="/" className="kade-public-logo">
          KADE MEDIA
        </Link>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle compact />
        <Link href="/dashboard" className="kade-public-login">
          Giriş
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className={compact ? 'kade-public-wrap compact' : 'kade-public-wrap'}>
        {children}
      </div>
    </main>
  )
}
