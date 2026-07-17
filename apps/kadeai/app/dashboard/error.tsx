'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('Dashboard render error:', error)
  }, [error])

  return (
    <div className="grid h-full place-items-center bg-zinc-950 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-xl">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
        <h1 className="mt-4 text-base font-semibold text-zinc-100">Bu ekran tamamlanamadı</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Veriler yüklenirken beklenmeyen bir sorun oluştu. Girdilerin korunuyorsa yeniden deneyebilirsin.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white"
        >
          <RefreshCw className="h-4 w-4" />
          Yeniden dene
        </button>
      </div>
    </div>
  )
}
