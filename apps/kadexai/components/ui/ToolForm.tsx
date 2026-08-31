'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ToolFormProps {
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
  submitLabel?: string
  isLoading?: boolean
  className?: string
}

export default function ToolForm({
  onSubmit,
  children,
  submitLabel = 'Üret',
  isLoading = false,
  className,
}: ToolFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn('space-y-4', className)}>
      {children}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
          isLoading
            ? 'bg-violet-500/50 text-violet-300 cursor-not-allowed'
            : 'bg-[#f2c322] text-zinc-950 hover:bg-[#ffda3f] active:scale-[0.98]'
        )}
      >
        {isLoading ? 'Üretiliyor...' : submitLabel}
      </button>
    </form>
  )
}
