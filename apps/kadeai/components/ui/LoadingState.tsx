import { AIModel } from '@/types'
import { cn } from '@/lib/utils'
import { getModelConfig } from '@/lib/ai/models'

interface LoadingStateProps {
  model?: AIModel
  className?: string
}

export default function LoadingState({ model, className }: LoadingStateProps) {
  const config = model ? getModelConfig(model) : null
  const message = model === 'auto'
    ? 'Göreve uygun model seçiliyor...'
    : config
      ? `${config.shortLabel} üretiyor...`
      : 'Üretiliyor...'
  const colorClass = config ? config.colorClass : 'text-violet-400'

  return (
    <div className={cn('flex items-center gap-3 p-4', className)}>
      <div className={cn('flex gap-1', colorClass)}>
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
      </div>
      <span className={cn('text-sm font-medium', colorClass)}>{message}</span>
    </div>
  )
}
