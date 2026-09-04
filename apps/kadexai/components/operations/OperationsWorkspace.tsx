'use client'

import { useCallback, useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import OperationsFrame from '@/components/operations/OperationsFrame'
import { useModel } from '@/lib/context/ModelContext'

const viewMeta: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'Operasyon Özeti',
    description: 'Bütçe, görevler, üretim durumu ve hızlı operasyon görünümü',
  },
  comments: {
    title: 'SentScan',
    description: 'Video ve transkript üzerinden yapay zeka yorum analizi',
  },
  crm: {
    title: 'Prodüksiyon CRM',
    description: 'Fikir, görev, bütçe, envanter ve yayın akışı',
  },
  banana: {
    title: 'Banana Studio',
    description: 'Görsel ve video üretim stüdyosu',
  },
  calendar: {
    title: 'Prodüksiyon Takvimi',
    description: 'Prodüksiyon kartlarının çekim ve yayın tarihleri',
  },
  clients: {
    title: 'Müşteri & Teslim',
    description: 'Müşteri kayıtları, teslimler ve terminler',
  },
  settings: {
    title: 'Operasyon Ayarları',
    description: 'Sistem yapılandırması ve yerel ayarlar',
  },
  pages: {
    title: 'Notlar',
    description: 'Notion tarzı ekip sayfaları ve dokümanlar',
  },
}

interface OperationsWorkspaceProps {
  initialView: string
  iframeSrc: string
}

export default function OperationsWorkspace({ initialView, iframeSrc }: OperationsWorkspaceProps) {
  const [activeView, setActiveView] = useState(initialView)
  const { selectedModel } = useModel()
  const meta = viewMeta[activeView] || viewMeta.dashboard

  const handleViewChange = useCallback((nextView: string) => {
    if (!viewMeta[nextView]) return
    setActiveView(nextView)

    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    if (url.href !== window.location.href) {
      window.history.pushState(window.history.state, '', url)
    }
    window.dispatchEvent(new CustomEvent('kade:operations-view', { detail: { view: nextView } }))
  }, [])

  useEffect(() => {
    const syncFromLocation = () => {
      const nextView = new URLSearchParams(window.location.search).get('view') || 'dashboard'
      if (viewMeta[nextView]) setActiveView(nextView)
    }

    const handleRequestedView = (event: Event) => {
      const nextView = (event as CustomEvent<{ view?: string }>).detail?.view
      if (nextView && viewMeta[nextView]) setActiveView(nextView)
    }

    window.addEventListener('popstate', syncFromLocation)
    window.addEventListener('kade:operations-request-view', handleRequestedView)
    return () => {
      window.removeEventListener('popstate', syncFromLocation)
      window.removeEventListener('kade:operations-request-view', handleRequestedView)
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <TopBar title={meta.title} description={meta.description} />
      <div className="min-h-0 flex-1 bg-zinc-950">
        <OperationsFrame
          src={iframeSrc}
          title="KADE Operasyon Merkezi"
          activeView={activeView}
          selectedModel={selectedModel}
          onViewChange={handleViewChange}
        />
      </div>
    </div>
  )
}
