'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('KADE UI error', error) }, [error])
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-md rounded-2xl border border-red-900/60 bg-zinc-900 p-7 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-red-400">Beklenmeyen hata</p>
        <h1 className="mt-3 text-2xl font-bold">Bu ekran yüklenemedi</h1>
        <p className="mt-2 text-sm text-zinc-400">Verilerin korunuyor. Ekranı yeniden yükleyerek kaldığın yerden devam edebilirsin.</p>
        {error.digest && <p className="mt-2 text-[11px] text-zinc-600">Hata kodu: {error.digest}</p>}
        <button onClick={reset} className="mt-5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300">Yeniden dene</button>
      </div>
    </main>
  )
}
