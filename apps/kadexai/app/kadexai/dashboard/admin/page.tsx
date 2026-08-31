'use client'

/*
 * Sahip yönetim ekranı: maliyet/marj ve teklif pipeline'ı tek yerde.
 * Erişim iki katmanda kapalı — proxy `isAdminOnlyRoute` ile, handler
 * kendi owner kontrolüyle.
 */

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CostPanel from '@/components/admin/CostPanel'
import UsersPanel from '@/components/admin/UsersPanel'
import QuotePipeline from '@/components/admin/QuotePipeline'
import ContentEditor from '@/components/admin/ContentEditor'
import LegalDocuments from '@/components/admin/LegalDocuments'

const TABS = [
  { id: 'users', label: 'Kullanıcılar' },
  { id: 'cost', label: 'Maliyet ve Marj' },
  { id: 'quotes', label: 'Teklif Talepleri' },
  { id: 'content', label: 'İçerik (CMS)' },
  { id: 'legal', label: 'Yasal Metinler' },
] as const

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('users')

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Platform Yönetimi" description="Kullanıcılar, maliyet, marj ve teklif akışı" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <nav className="flex gap-2 border-b border-zinc-800" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${tab === item.id ? 'border-violet-500 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {tab === 'users' && <UsersPanel />}
          {tab === 'cost' && <CostPanel />}
          {tab === 'quotes' && <QuotePipeline />}
          {tab === 'content' && <ContentEditor />}
          {tab === 'legal' && <LegalDocuments />}
        </div>
      </div>
    </div>
  )
}
