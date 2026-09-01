'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MANUAL_MODEL_STORAGE_KEY, ModelProvider, useModel } from '@/lib/context/ModelContext'
import { SidebarProvider } from '@/lib/context/SidebarContext'
import { ProfileProvider, useProfile } from '@/lib/context/ProfileContext'
import WorkspaceAssistant from '@/components/assistant/WorkspaceAssistant'
import { SELECTABLE_MODELS } from '@/lib/ai/models'
import type { AIModel } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import AnalyticsConsent from '@/components/privacy/AnalyticsConsent'

function AutoModelApplier({ toolId }: { toolId?: string }) {
  const { applyToolDefault, isAutoSelected, setSelectedModel } = useModel()
  const { account, loading } = useProfile()

  useLayoutEffect(() => {
    if (loading || !toolId) return
    if (account.preferences.autoModel) {
      applyToolDefault(toolId)
      return
    }

    if (isAutoSelected) {
      const stored = window.localStorage.getItem(MANUAL_MODEL_STORAGE_KEY) as AIModel | null
      if (stored && stored !== 'auto' && SELECTABLE_MODELS.includes(stored)) setSelectedModel(stored)
    }
  }, [account.preferences.autoModel, applyToolDefault, isAutoSelected, loading, setSelectedModel, toolId])

  return null
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''  // usePathname() null dönebilir; boş yol güvenli varsayılan.
  const toolId = pathname.split('/dashboard/')[1]?.split('/')[0]

  return (
    <ProfileProvider>
      <ModelProvider initialToolId={toolId}>
        <SidebarProvider>
          <AutoModelApplier toolId={toolId} />
          <div className="kade-panel flex h-dvh bg-zinc-950">
            <Sidebar />
            <main className="kade-main flex-1 lg:ml-[272px] flex flex-col overflow-hidden min-w-0">
              {children}
            </main>
          </div>
          <WorkspaceAssistant />
          <AnalyticsConsent />
        </SidebarProvider>
      </ModelProvider>
    </ProfileProvider>
  )
}
