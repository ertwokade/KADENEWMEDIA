'use client'

import { useEffect, useState } from 'react'
import { ANALYTICS_CONSENT_KEY, setAnalyticsConsent } from '@/lib/analytics/client'

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enabled = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_POSTHOG_ENABLED === '1'
    setVisible(enabled && !window.localStorage.getItem(ANALYTICS_CONSENT_KEY))
  }, [])

  if (!visible) return null
  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted)
    setVisible(false)
  }

  return (
    <aside aria-label="Analitik izni" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
      <p className="text-sm font-semibold text-zinc-100">Gizlilik tercihi</p>
      <p className="mt-1 text-xs leading-5 text-zinc-400">Ürünü iyileştirmek için anonim kullanım olayları gönderebiliriz. Form içerikleri, AI istemleri, e-posta ve kimlik bilgileri gönderilmez.</p>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => choose(false)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300">Reddet</button>
        <button onClick={() => choose(true)} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-zinc-950">İzin ver</button>
      </div>
    </aside>
  )
}
