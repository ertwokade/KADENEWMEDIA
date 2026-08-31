import { AIModel } from '@/types'
import { getModelLabel, getModelColor, cn } from '@/lib/utils'
import CopyButton from './CopyButton'

interface ResultCardProps {
  title?: string
  content: string
  model: AIModel
  isLoading?: boolean
  className?: string
}

export default function ResultCard({ title, content, model, isLoading = false, className }: ResultCardProps) {
  const modelLabel = getModelLabel(model)
  const modelColor = getModelColor(model)

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 space-y-3', className)}>
        <div className="h-4 bg-zinc-700 rounded animate-pulse w-1/3" />
        <div className="space-y-2">
          <div className="h-3 bg-zinc-700 rounded animate-pulse" />
          <div className="h-3 bg-zinc-700 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-zinc-700 rounded animate-pulse w-4/6" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        {title && <h3 className="text-zinc-200 font-medium text-sm">{title}</h3>}
        <span className={cn('text-xs font-medium ml-auto', modelColor)}>{modelLabel}</span>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      <div className="flex justify-end pt-1">
        <CopyButton text={content} />
      </div>
    </div>
  )
}
