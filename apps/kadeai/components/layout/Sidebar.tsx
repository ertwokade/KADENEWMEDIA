'use client'

import { useEffect, useState, useMemo, type MouseEvent } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Wand2, FileText, Zap, FileCode, Hash, TrendingUp,
  Calendar, Mic2, Lightbulb,
  FlaskConical, Settings, History, X, Scissors,
  GitBranch, LayoutGrid, BookOpen, Link2,
  CalendarDays, ImagePlus, BarChart2, Search, Users,
  MessageSquare, Mail, Radio, AlertCircle,
  Copy, BookMarked, Activity, Library,
  ChevronRight, Clapperboard, LayoutDashboard,
  CircleDollarSign, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/context/SidebarContext'
import { TOOL_CATEGORIES, TOOL_REGISTRY } from '@/lib/tools/registry'
import { apiPath, stripBasePath, withBasePath } from '@/lib/appConfig'
import KadeLogo from '@/components/brand/KadeLogo'
import ThemeToggle from '@/components/theme/ThemeToggle'

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'message-square': MessageSquare,
  clapperboard: Clapperboard,
  'image-plus': ImagePlus,
  'file-code': FileCode,
  radio: Radio,
  'book-open': BookOpen,
  settings: Settings,
  wand: Wand2,
  'file-text': FileText,
  zap: Zap,
  hash: Hash,
  'git-branch': GitBranch,
  'layout-grid': LayoutGrid,
  mail: Mail,
  copy: Copy,
  scissors: Scissors,
  mic: Mic2,
  'trending-up': TrendingUp,
  flask: FlaskConical,
  'alert-circle': AlertCircle,
  search: Search,
  'bar-chart': BarChart2,
  users: Users,
  activity: Activity,
  bookmark: BookMarked,
  lightbulb: Lightbulb,
  'calendar-days': CalendarDays,
  link: Link2,
  calendar: Calendar,
  library: Library,
  history: History,
  'circle-dollar': CircleDollarSign,
} as const

function buildNavItems(ownerAccess: boolean, settingsAccess: boolean) {
  return TOOL_CATEGORIES.map((category) => ({
  category: category.label,
  items: TOOL_REGISTRY
    .filter((tool) => tool.category === category.id)
    .filter((tool) => ownerAccess || !tool.permissions.includes('owner'))
    .filter((tool) => settingsAccess || !tool.permissions.includes('settings-owner'))
    .map((tool) => ({
      id: tool.id,
      label: tool.comingSoon ? `${tool.name} · Yakında` : tool.name,
      href: tool.route,
      icon: iconMap[tool.icon as keyof typeof iconMap] || LayoutDashboard,
    })),
  })).filter((group) => group.items.length > 0)
}

const catAccent: Record<string, { label: string; activeBg: string; activeIcon: string; dot: string }> = {
  'PLATFORM':         { label: 'text-violet-500', activeBg: 'bg-violet-50 text-violet-700 border-violet-200',   activeIcon: 'text-violet-500', dot: 'bg-violet-400'  },
  'OPERASYON':        { label: 'text-cyan-500',   activeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',         activeIcon: 'text-cyan-500',   dot: 'bg-cyan-400'    },
  'ÜRETİM':          { label: 'text-orange-500', activeBg: 'bg-orange-50 text-orange-700 border-orange-200',    activeIcon: 'text-orange-500', dot: 'bg-orange-400'  },
  'MEDYA':           { label: 'text-pink-500',   activeBg: 'bg-pink-50 text-pink-700 border-pink-200',          activeIcon: 'text-pink-500',   dot: 'bg-pink-400'    },
  'ANALİZ':          { label: 'text-blue-500',   activeBg: 'bg-blue-50 text-blue-700 border-blue-200',          activeIcon: 'text-blue-500',   dot: 'bg-blue-400'    },
  'PLANLAMA':        { label: 'text-teal-500',   activeBg: 'bg-teal-50 text-teal-700 border-teal-200',          activeIcon: 'text-teal-500',   dot: 'bg-teal-400'    },
  'SAHİP':           { label: 'text-amber-500',  activeBg: 'bg-amber-50 text-amber-800 border-amber-200',         activeIcon: 'text-amber-500',  dot: 'bg-amber-400'   },
  'AYARLAR':         { label: 'text-zinc-500',   activeBg: 'bg-zinc-100 text-zinc-700 border-zinc-200',         activeIcon: 'text-zinc-500',   dot: 'bg-zinc-400'    },
}

function NavLinkStatus({ isActive, dotClass }: { isActive: boolean; dotClass: string }) {
  const { pending } = useLinkStatus()

  if (pending) {
    return (
      <span
        aria-label="Sayfa yükleniyor"
        className="ml-auto h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-[#f2c322]/30 border-t-[#f2c322]"
      />
    )
  }

  if (!isActive) return null

  return <span className={`ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClass}`} />
}

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const [search, setSearch] = useState('')
  const [operationsView, setOperationsView] = useState('dashboard')
  const [ownerAccess, setOwnerAccess] = useState(false)
  const [settingsAccess, setSettingsAccess] = useState(false)
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(['PLATFORM'])
  )

  const toggleCat = (cat: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const isSearching = search.trim().length > 0
  const q = search.toLowerCase()
  const navItems = useMemo(() => buildNavItems(ownerAccess, settingsAccess), [ownerAccess, settingsAccess])

  useEffect(() => {
    let active = true
    fetch(apiPath('/api/config'), { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => {
        if (!active) return
        setOwnerAccess(config?.ownerAccess === true)
        setSettingsAccess(config?.settingsAccess === true)
      })
      .catch(() => {
        if (!active) return
        setOwnerAccess(false)
        setSettingsAccess(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [close, isOpen])

  const filtered = useMemo(() => {
    const visibleItems = navItems

    if (!isSearching) return visibleItems
    return visibleItems
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0)
  }, [isSearching, navItems, q])

  const isHrefActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split('?')
    const pathMatches = pathname === hrefPath || (hrefPath !== '/dashboard' && pathname.startsWith(hrefPath + '/'))
    if (!pathMatches) return false
    if (!hrefQuery) return true
    const hrefView = new URLSearchParams(hrefQuery).get('view')
    return hrefView ? hrefView === operationsView : true
  }

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const [hrefPath, hrefQuery] = href.split('?')
    if (hrefPath === '/dashboard/operations' && pathname === '/dashboard/operations') {
      event.preventDefault()
      const view = new URLSearchParams(hrefQuery || '').get('view') || 'dashboard'
      setOperationsView(view)
      window.history.pushState(window.history.state, '', withBasePath(href))
      window.dispatchEvent(new CustomEvent('kade:operations-request-view', { detail: { view } }))
    }
    close()
  }

  useEffect(() => {
    const syncOperationsView = () => {
      if (stripBasePath(window.location.pathname) === '/dashboard/operations') {
        const view = new URLSearchParams(window.location.search).get('view') || 'dashboard'
        setOperationsView(view)
        window.dispatchEvent(new CustomEvent('kade:operations-request-view', { detail: { view } }))
      }
    }

    syncOperationsView()
    const syncEmbeddedView = (event: Event) => {
      const view = (event as CustomEvent<{ view?: string }>).detail?.view
      if (view) setOperationsView(view)
    }
    window.addEventListener('popstate', syncOperationsView)
    window.addEventListener('kade:operations-view', syncEmbeddedView)
    return () => {
      window.removeEventListener('popstate', syncOperationsView)
      window.removeEventListener('kade:operations-view', syncEmbeddedView)
    }
  }, [pathname])

  useEffect(() => {
    const activeGroup = navItems.find((group) =>
      group.items.some((item) => {
        const [hrefPath] = item.href.split('?')
        return pathname === hrefPath || (hrefPath !== '/dashboard' && pathname.startsWith(`${hrefPath}/`))
      })
    )

    if (activeGroup) {
      setOpenCats((previous) => {
        if (previous.has(activeGroup.category)) return previous
        return new Set(previous).add(activeGroup.category)
      })
    }
  }, [navItems, pathname])

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-30 lg:hidden" onClick={close} />
      )}

      <aside
        className={cn(
        'kade-sidebar fixed left-0 top-0 h-full w-[272px] flex flex-col z-40 transition-transform duration-300',
        'bg-white border-r border-zinc-100',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>

        {/* Logo */}
        <div className="relative flex items-center justify-between px-5 py-5 border-b border-zinc-100 flex-shrink-0">
          <div className="relative flex min-w-0 flex-1 items-center">
            <KadeLogo className="w-[176px] max-w-full rounded-md" priority />
          </div>
          <button onClick={close} aria-label="Menüyü kapat" className="lg:hidden rounded-lg p-2 text-[#aaa79c] transition-colors hover:bg-white/5 hover:text-[#fffdf5]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Araç ara..."
              className="kade-sidebar-search w-full rounded-xl border pl-8 pr-3 py-2.5 text-xs focus:outline-none transition-colors"
            />
            {isSearching && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {filtered.map((group) => {
            const catOpen = isSearching || openCats.has(group.category)
            const activeInGroup = group.items.some(i => isHrefActive(i.href))
            const accent = catAccent[group.category] ?? catAccent['AYARLAR']

            return (
              <div key={group.category}>
                <button
                  data-active={activeInGroup}
                  onClick={() => !isSearching && toggleCat(group.category)}
                  className={cn(
                    'kade-sidebar-category w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors group',
                    isSearching ? 'cursor-default' : 'hover:bg-zinc-50 cursor-pointer'
                  )}
                >
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.15em]',
                    activeInGroup ? accent.label : 'text-zinc-400 group-hover:text-zinc-600'
                  )}>
                    {group.category}
                    <span className="ml-2 inline-flex min-w-5 justify-center rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold normal-case tracking-normal text-[#77746b]">
                      {group.items.length}
                    </span>
                  </span>
                  {!isSearching && (
                    <ChevronRight className={cn(
                      'w-3 h-3 text-zinc-300 transition-transform duration-200',
                      catOpen && 'rotate-90'
                    )} />
                  )}
                </button>

                {catOpen && (
                  <ul className="space-y-px pb-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = isHrefActive(item.href)
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={(event) => handleLinkClick(event, item.href)}
                            data-active={isActive}
                            className={cn(
                              'kade-sidebar-link group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all duration-150 border',
                              isActive
                                ? `${accent.activeBg} font-semibold`
                                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border-transparent'
                            )}
                          >
                            <Icon className={cn(
                              'w-3.5 h-3.5 flex-shrink-0 transition-colors',
                              isActive ? accent.activeIcon : 'text-zinc-400 group-hover:text-zinc-600'
                            )} />
                            <span className="truncate">{item.label}</span>
                            <NavLinkStatus isActive={isActive} dotClass={accent.dot} />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-zinc-100 px-4 py-4 flex-shrink-0">
          <ThemeToggle className="w-full" />
          {settingsAccess && (
            <Link
              href="/dashboard/settings"
              onClick={() => close()}
              className="kade-sidebar-footer flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors hover:bg-zinc-50"
            >
              <Activity className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
              <p className="text-[10px] font-medium text-[#8f8b80]">Sistem durumunu kontrol et</p>
            </Link>
          )}
          <Link
            href="/logout"
            onClick={() => close()}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-[11px] font-semibold">Çıkış Yap</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
