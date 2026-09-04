'use client'

import { useEffect, useState } from 'react'
import { AIModel } from '@/types'
import { cn } from '@/lib/utils'
import { getModelConfig } from '@/lib/ai/models'

interface LoadingStateProps {
  model?: AIModel
  className?: string
}

export default function LoadingState({ model, className }: LoadingStateProps) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const config = model ? getModelConfig(model) : null
  const baseMessage = model === 'auto'
    ? 'Uygun model seçiliyor'
    : config
      ? `${config.shortLabel} çalışıyor`
      : 'Model çalışıyor'
  const detail = elapsed < 4
    ? 'İstek hazırlanıyor'
    : elapsed < 20
      ? 'Yanıt üretiliyor'
      : elapsed < 45
        ? 'Uzun yanıt işleniyor'
        : 'İşlem sürüyor; sayfayı kapatma'
  const colorClass = config ? config.colorClass : 'text-violet-400'

  return (
    <div role="status" aria-live="polite" className={cn('flex items-center gap-3 p-4', className)}>
      <div className={cn('flex gap-1', colorClass)}>
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-medium', colorClass)}>{baseMessage}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{detail} · {elapsed} sn</p>
      </div>
    </div>
  )
}
