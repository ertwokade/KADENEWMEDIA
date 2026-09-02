'use client'

import { ComponentProps, ReactNode, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Adım kartı — bir işin yürütülüşünü gösterir.
 *
 * Kaynak: simple-ai.dev "tool invocation" (Alwurts, MIT). Oradaki sürüm
 * shadcn Card + Radix Collapsible istiyor; bu projede ikisi de yok ve
 * yalnızca bunun için Radix eklemek bağımlılık zincirini büyütürdü.
 * Katlanma tek bir useState ile çözüldü, renkler kade tokenlarından geliyor.
 */

export type AdimDurumu = 'calisiyor' | 'bitti' | 'hata'

export function ToolInvocation({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'max-w-full overflow-hidden rounded-[var(--kade-r-inner)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]',
        className,
      )}
      {...props}
    />
  )
}

export function ToolInvocationHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-3 py-2', className)} {...props} />
}

/** Adımın adı ve durumu. Ad zaten okunur yazıldığı için başlık dönüşümü yok. */
export function ToolInvocationName({
  name,
  durum,
  className,
}: {
  name: string
  durum: AdimDurumu
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {durum === 'calisiyor' && (
        <ToolInvocationLoadingIcon className="h-3.5 w-3.5 text-[color:var(--kade-accent)]" duration="2s" />
      )}
      {durum === 'bitti' && <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--kade-ok-400)]" />}
      {durum === 'hata' && <AlertCircle className="h-3.5 w-3.5 text-[color:var(--kade-err-400)]" />}
      <span className={cn('font-medium text-zinc-300', durum === 'hata' && 'text-[color:var(--kade-err-400)]')}>
        {name}
      </span>
    </div>
  )
}

export function ToolInvocationContentCollapsible({
  children,
  className,
  defaultOpen = false,
}: {
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const [acik, setAcik] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        className="flex w-full items-center justify-between border-t border-[color:var(--kade-line)] px-3 py-1.5 text-left transition-colors hover:bg-[color:var(--kade-surface-raised)]"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Ayrıntı</span>
        <span className="text-[10px] text-zinc-500">{acik ? 'gizle' : 'göster'}</span>
      </button>
      {acik && <div className={cn('space-y-3 px-3 py-2.5', className)}>{children}</div>}
    </div>
  )
}

export function ToolInvocationRawData({ data, title = 'Veri' }: { data: unknown; title?: string }) {
  const metin = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{title}</h4>
      <div className="max-h-48 overflow-auto">
        <pre className="whitespace-pre-wrap break-words rounded-[var(--kade-r-inner)] border border-[color:var(--kade-line)] bg-[color:var(--kade-bg)] p-2.5 font-mono text-[11px] text-zinc-400">
          {metin}
        </pre>
      </div>
    </div>
  )
}

/**
 * Üç kürenin birbirini kovaladığı yükleniyor işareti.
 * Kaynaktaki yarıçap 20; satır içinde 14px'e küçülünce küreler birbirine
 * yapışıp tek bir lekeye dönüşüyordu, o yüzden 13'e indirildi.
 */
export function ToolInvocationLoadingIcon({
  duration = '3s',
  sphereRadius = 13,
  ...props
}: ComponentProps<'svg'> & { duration?: string; sphereRadius?: number }) {
  const ust = { x: 50, y: sphereRadius }
  const solAlt = { x: sphereRadius, y: 100 - sphereRadius }
  const sagAlt = { x: 100 - sphereRadius, y: 100 - sphereRadius }

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx={ust.x} cy={ust.y} r={sphereRadius}>
        <animateMotion path={`M 0 0 L ${solAlt.x - ust.x} ${solAlt.y - ust.y}`} dur={duration} repeatCount="indefinite" calcMode="linear" />
      </circle>
      <circle cx={solAlt.x} cy={solAlt.y} r={sphereRadius}>
        <animateMotion path={`M 0 0 L ${sagAlt.x - solAlt.x} ${sagAlt.y - solAlt.y}`} dur={duration} repeatCount="indefinite" calcMode="linear" />
      </circle>
      <circle cx={sagAlt.x} cy={sagAlt.y} r={sphereRadius}>
        <animateMotion path={`M 0 0 L ${ust.x - sagAlt.x} ${ust.y - sagAlt.y}`} dur={duration} repeatCount="indefinite" calcMode="linear" />
      </circle>
    </svg>
  )
}
