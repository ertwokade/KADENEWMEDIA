'use client'

import { useEffect } from 'react'
import { apiPath, appRoutes, withBasePath } from '@/lib/appConfig'

export default function LogoutPage() {
  useEffect(() => {
    fetch(apiPath('/api/auth/logout'), { method: 'POST' })
      .catch(() => undefined)
      .finally(() => { window.location.href = withBasePath(appRoutes.login) })
  }, [])

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 text-sm text-zinc-400">
      Güvenli çıkış yapılıyor…
    </main>
  )
}
