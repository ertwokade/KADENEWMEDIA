import Image from 'next/image'
import { withBasePath } from '@/lib/appConfig'
import { cn } from '@/lib/utils'

type KadeLogoProps = {
  className?: string
  priority?: boolean
}

export default function KadeLogo({ className, priority = false }: KadeLogoProps) {
  return (
    <Image
      src={withBasePath('/brand/kade-logo.svg')}
      alt="KADE"
      width={512}
      height={181}
      priority={priority}
      draggable={false}
      className={cn('h-auto select-none', className)}
    />
  )
}
