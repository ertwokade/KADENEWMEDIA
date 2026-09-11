'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
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

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(withBasePath('/sw.js'), { scope: withBasePath('/') }).catch(() => {})
    }
  }, [])
  return null
}

export default function MobileInstallPrompt() {
  const pathname = usePathname()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    let wasDismissed = true
    try { wasDismissed = localStorage.getItem('kadexai-install-dismissed') === '1' } catch {
      // Do not show a persistent overlay when the browser cannot remember dismissal.
      return
    }
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
    setDismissed(true)
    try { localStorage.setItem('kadexai-install-dismissed', '1') } catch { /* Closing must still work. */ }
  }

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    close()
  }

  // Araç formlarının üstünü örtme; kurulum önerisi yalnız panel girişinde görünür.
  if (!pathname?.endsWith('/dashboard') || dismissed || (!installEvent && !showIOSHint)) return null

  return (
    <div className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl shadow-slate-900/10 md:hidden">
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
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Ekle
            </button>
          )}
        </div>
        <button type="button" aria-label="Kurulum önerisini kapat" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
