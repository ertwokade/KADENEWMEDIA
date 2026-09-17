'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  message: string
  resolve: (value: boolean) => void
}

/** Tarayıcının confirm() penceresi yerine uygulama içi onay penceresi. */
export function useConfirm(): [(message: string, options?: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const ask = useCallback((message: string, options: ConfirmOptions = {}) => new Promise<boolean>((resolve) => {
    setPending({ message, resolve, ...options })
  }), [])

  const close = useCallback((value: boolean) => {
    setPending((current) => { current?.resolve(value); return null })
  }, [])

  useEffect(() => {
    if (!pending) return
    confirmRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, close])

  const dialog = pending ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={() => close(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-100">{pending.title ?? 'Emin misin?'}</h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-zinc-400">{pending.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => close(false)} className="min-h-10 rounded-lg bg-zinc-800 px-4 text-sm text-zinc-300 hover:bg-zinc-700">Vazgeç</button>
          <button ref={confirmRef} type="button" onClick={() => close(true)}
            className={pending.danger ? 'min-h-10 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-400' : 'min-h-10 rounded-lg bg-[#f2c322] px-4 text-sm font-medium text-zinc-950 hover:bg-[#ffda3f]'}>
            {pending.confirmLabel ?? 'Onayla'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return [ask, dialog]
}
