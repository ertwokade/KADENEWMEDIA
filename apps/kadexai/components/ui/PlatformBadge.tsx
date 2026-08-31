import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

/**
 * Rozet renkleri platformların kendi marka renkleridir; okunurluk buna bağlı.
 * Tailwind aileleri arayüz genelinde marka paletine bağlandığı için burada
 * doğrudan hex kullanılıyor: aksi halde YouTube kırmızısı hata rengine,
 * LinkedIn mavisi bilgi rengine dönüşüyordu.
 */
const platformColors: Record<Platform, string> = {
  youtube: 'bg-[#ff0000]/15 text-[#ff4d4d] border-[#ff0000]/25',
  instagram: 'bg-[#e1306c]/15 text-[#f06d9b] border-[#e1306c]/25',
  tiktok: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  x: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  linkedin: 'bg-[#0a66c2]/15 text-[#4d94dd] border-[#0a66c2]/25',
  pinterest: 'bg-[#e60023]/15 text-[#f05f74] border-[#e60023]/25',
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
