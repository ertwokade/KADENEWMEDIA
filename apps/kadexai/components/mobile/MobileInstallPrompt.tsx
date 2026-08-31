'use client'

import { useEffect, useState } from 'react'
import { withBasePath } from '@/lib/appConfig'
import { Download, Smartphone, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && Boolean(window.navigator.standalone))
  )
}

export default function MobileInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(withBasePath('/sw.js'), { scope: withBasePath('/') }).catch(() => {})
    }

    const wasDismissed = localStorage.getItem('kadexai-install-dismissed') === '1'
    const mobile = window.matchMedia('(max-width: 768px)').matches
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

    if (!mobile || isStandalone() || wasDismissed) return

    setDismissed(false)
    setShowIOSHint(ios)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setShowIOSHint(false)
      setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const close = () => {
    localStorage.setItem('kadexai-install-dismissed', '1')
    setDismissed(true)
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    close()
  }

  if (dismissed || (!installEvent && !showIOSHint)) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl shadow-slate-900/10 md:hidden">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-violet-500/15 p-2 text-violet-500">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">Telefona ekle</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
            {showIOSHint
              ? 'Safari paylaş menüsü ile Ana Ekrana Ekle seçeneğini kullan.'
              : 'KadexAI mobilde uygulama gibi açılsın.'}
          </p>
          {installEvent && (
            <button
              type="button"
              onClick={install}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Ekle
            </button>
          )}
        </div>
        <button type="button" onClick={close} className="rounded-lg p-1 text-zinc-500 hover:text-zinc-200">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
