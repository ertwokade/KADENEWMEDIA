'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Settings } from 'lucide-react'
import { useSidebar } from '@/lib/context/SidebarContext'
import { apiPath } from '@/lib/appConfig'

export default function DashboardMobileHeader() {
  const { toggle } = useSidebar()
  const [settingsAccess, setSettingsAccess] = useState(false)

  useEffect(() => {
    let active = true
    fetch(apiPath('/api/config'), { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => { if (active) setSettingsAccess(config?.settingsAccess === true) })
      .catch(() => { if (active) setSettingsAccess(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="mb-3 flex items-center justify-between lg:hidden">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white/80 px-3.5 text-sm font-bold text-[#11110f] shadow-sm"
        aria-label="Menüyü aç"
      >
        <Menu className="h-4.5 w-4.5" />
        Menü
      </button>
      {settingsAccess && (
        <Link
          href="/dashboard/settings"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/80 text-[#555249] shadow-sm"
          aria-label="Ayarlar"
        >
          <Settings className="h-4.5 w-4.5" />
        </Link>
      )}
    </div>
  )
}
