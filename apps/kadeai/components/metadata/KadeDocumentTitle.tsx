'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { resolveKadePageTitle } from '@/lib/pageTitle'

export default function KadeDocumentTitle() {
  const pathname = usePathname()

  useEffect(() => {
    const syncTitle = () => {
      const title = resolveKadePageTitle(pathname || '/', window.location.search)
      if (document.title !== title) document.title = title
    }

    syncTitle()
    const delayedSync = window.setTimeout(syncTitle, 250)
    const metadataObserver = new MutationObserver(syncTitle)
    metadataObserver.observe(document.head, { childList: true, subtree: true, characterData: true })
    window.addEventListener('popstate', syncTitle)
    window.addEventListener('kade:operations-view', syncTitle)
    window.addEventListener('kade:operations-request-view', syncTitle)

    return () => {
      window.clearTimeout(delayedSync)
      metadataObserver.disconnect()
      window.removeEventListener('popstate', syncTitle)
      window.removeEventListener('kade:operations-view', syncTitle)
      window.removeEventListener('kade:operations-request-view', syncTitle)
    }
  }, [pathname])

  return null
}
