'use client'

import { Menu, Sparkles, Activity } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useModel } from '@/lib/context/ModelContext'
import { useSidebar } from '@/lib/context/SidebarContext'
import ModelSelector from './ModelSelector'
import { cn } from '@/lib/utils'
import ToolRequirementBanner from '@/components/profile/ToolRequirementBanner'

interface TopBarProps {
  title: string
  description?: string
  showModelSelector?: boolean
}

function ModuleBadge() {
  const pathname = usePathname()

  if (pathname.startsWith('/dashboard/operations')) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-900/40 border border-cyan-800/60 flex-shrink-0">
        <Activity className="w-3 h-3 text-cyan-400" />
        <span className="text-cyan-300 text-[10px] font-semibold">Operasyon Merkezi</span>
      </div>
    )
  }
  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-900/40 border border-orange-800/60 flex-shrink-0">
      <Sparkles className="w-3 h-3 text-orange-400" />
      <span className="text-orange-300 text-[10px] font-semibold">İçerik Araçları</span>
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
      'flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b flex-shrink-0 lg:flex-nowrap lg:px-7 min-h-[58px]',
      'bg-zinc-950 shadow-sm',
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

        <ModuleBadge />

        <div className="min-w-0">
          <h1 className="text-zinc-100 font-semibold text-sm leading-tight truncate">{title}</h1>
          {description && (
            <p className="text-zinc-500 text-xs mt-0.5 hidden md:block truncate">{description}</p>
          )}
        </div>
      </div>

      {showModelSelector && (
        <div className="order-3 w-full flex-shrink-0 sm:order-none sm:ml-4 sm:w-[300px] lg:w-[360px]">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        </div>
      )}
      </div>
      <ToolRequirementBanner />
    </>
  )
}
