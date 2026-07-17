'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/lib/context/ProfileContext'
import { stripBasePath } from '@/lib/appConfig'
import { getMissingProfileFields, PROFILE_FIELD_LABELS } from '@/lib/profile/types'
import { getToolByRoute } from '@/lib/tools/registry'

export default function ToolRequirementBanner() {
  const pathname = stripBasePath(usePathname())
  const { account, loading, cloudBacked } = useProfile()
  const tool = getToolByRoute(pathname)
  if (!tool || tool.requiredProfileFields.length === 0) return null

  if (loading) {
    return (
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-500 lg:px-7">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Marka bilgileri kontrol ediliyor…
      </div>
    )
  }

  const missing = getMissingProfileFields(account, tool.requiredProfileFields)
  if (missing.length === 0) {
    return (
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-emerald-950 bg-emerald-950/20 px-4 py-2 text-xs text-emerald-300 lg:px-7">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span><strong>{account.brand.name}</strong> bağlamı otomatik kullanılacak.</span>
        <span className="ml-auto hidden text-emerald-500/80 sm:inline">{cloudBacked ? 'Hesaba kaydedildi' : 'Bu cihazda kayıtlı'}</span>
      </div>
    )
  }

  const labels = missing.slice(0, 3).map((field) => PROFILE_FIELD_LABELS[field]).join(', ')
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-900/50 bg-amber-950/25 px-4 py-2 text-xs text-amber-200 lg:px-7">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Bu araç için eksik: <strong>{labels}{missing.length > 3 ? ` +${missing.length - 3}` : ''}</strong></span>
      <Link href="/onboarding" className="ml-auto rounded-md bg-amber-400 px-2.5 py-1 font-semibold text-zinc-950 hover:bg-amber-300">
        Bilgileri tamamla
      </Link>
    </div>
  )
}
