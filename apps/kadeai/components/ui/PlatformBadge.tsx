import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

const platformColors: Record<Platform, string> = {
  youtube: 'bg-red-500/15 text-red-400 border-red-500/25',
  instagram: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  tiktok: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  x: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  linkedin: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  pinterest: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
}

export default function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        platformColors[platform],
        className
      )}
    >
      {getPlatformLabel(platform)}
    </span>
  )
}
