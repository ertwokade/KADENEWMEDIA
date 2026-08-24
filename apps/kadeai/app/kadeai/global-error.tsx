'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html lang="tr">
      <body className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-zinc-100">
        <main className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">KADE AI</p>
          <h1 className="mt-3 text-xl font-bold">Beklenmeyen bir hata oluştu</h1>
          <p className="mt-2 text-sm text-zinc-400">İçeriğiniz hata raporuna eklenmedi. Güvenle yeniden deneyebilirsiniz.</p>
          <button onClick={reset} className="mt-5 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-950">Yeniden dene</button>
        </main>
      </body>
    </html>
  )
}
