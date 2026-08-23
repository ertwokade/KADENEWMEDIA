'use client'

import { Menu, Sparkles, Activity, Command } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useModel } from '@/lib/context/ModelContext'
import { useSidebar } from '@/lib/context/SidebarContext'
import ModelSelector from './ModelSelector'
import { cn } from '@/lib/utils'
import ToolRequirementBanner from '@/components/profile/ToolRequirementBanner'
import ThemeToggle from '@/components/theme/ThemeToggle'

interface TopBarProps {
  title: string
  description?: string
  showModelSelector?: boolean
}

function ModuleBadge() {
  const pathname = usePathname()

  if (pathname.startsWith('/dashboard/operations')) {
    return (
      <div className="kade-module-badge hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/40 border border-cyan-800/60 flex-shrink-0">
        <Activity className="w-3 h-3 text-cyan-400" />
      <span className="text-cyan-300 text-[10px] font-semibold">OPERASYON</span>
      </div>
    )
  }
  return (
    <div className="kade-module-badge hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0">
      <Sparkles className="w-3 h-3 text-orange-400" />
      <span className="text-orange-300 text-[10px] font-semibold">AI STUDIO</span>
    </div>
  )
}

export default function TopBar({ title, description, showModelSelector = true }: TopBarProps) {
  const { selectedModel, setSelectedModel } = useModel()
  const { toggle } = useSidebar()
  const pathname = usePathname()

  const isOperations = pathname.startsWith('/dashboard/operations')

  const borderColor = isOperations ? 'border-cyan-900/50' : 'border-zinc-800'

  return (
    <>
      <div className={cn(
      'kade-topbar flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0 lg:flex-nowrap lg:px-7',
      'bg-zinc-950',
      borderColor
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <ModuleBadge />
            <span className="kade-topbar-context hidden text-[10px] font-bold uppercase tracking-[0.16em] md:block">KADE NEW MEDIA / WORKSPACE</span>
          </div>
          <h1 className="kade-topbar-title mt-1 text-zinc-100 font-semibold text-sm leading-tight truncate">{title}</h1>
          {description && (
            <p className="kade-topbar-description text-zinc-500 text-xs mt-0.5 hidden md:block truncate">{description}</p>
          )}
        </div>
      </div>

      <div className="kade-topbar-actions order-3 ml-auto flex w-auto flex-shrink-0 items-center gap-2 sm:order-none sm:ml-4">
      <button type="button" className="kade-command-button hidden h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold xl:inline-flex" title="Hızlı komutlar yakında">
        <Command className="h-3.5 w-3.5" />
        Komutlar
        <kbd className="rounded-md px-1.5 py-0.5 text-[9px]">⌘ K</kbd>
      </button>
      {showModelSelector && (
        /* Model seçici üst barın yarısını kaplayan bir panel gibi duruyordu;
           artık sağ uçta küçük bir düğme. Açılır liste aynı, yalnızca tetikleyici
           küçüldü. */
        <div className="w-auto flex-shrink-0">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        </div>
      )}
      <ThemeToggle compact />
      </div>
      </div>
      <ToolRequirementBanner />
    </>
  )
}
