'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { AIModel } from '@/types'

interface OperationsFrameProps {
  src: string
  title: string
  activeView: string
  selectedModel: AIModel
  onViewChange?: (view: string) => void
}

const subscribeToHydration = () => () => undefined

export default function OperationsFrame({ src, title, activeView, selectedModel, onViewChange }: OperationsFrameProps) {
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readinessPollRef = useRef<number | null>(null)
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      if (event.data?.type === 'kade:operations-ready') {
        setLoaded(true)
        setTimedOut(false)
        return
      }
      if (event.data?.type === 'kade:operations-view' && typeof event.data.view === 'string') {
        onViewChange?.(event.data.view)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onViewChange])

  useEffect(() => () => {
    if (readinessPollRef.current !== null) window.clearInterval(readinessPollRef.current)
  }, [])

  useEffect(() => {
    if (!hydrated || loaded) return
    const timeout = window.setTimeout(() => setTimedOut(true), 12000)
    return () => window.clearTimeout(timeout)
  }, [hydrated, loaded, retryCount])

  useEffect(() => {
    if (!loaded) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'kade:set-operations-view', view: activeView },
      window.location.origin
    )
  }, [activeView, loaded])

  useEffect(() => {
    if (!loaded) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'kade:set-operations-model', model: selectedModel },
      window.location.origin
    )
  }, [selectedModel, loaded])

  const retry = () => {
    if (readinessPollRef.current !== null) window.clearInterval(readinessPollRef.current)
    setLoaded(false)
    setTimedOut(false)
    setRetryCount((count) => count + 1)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950" aria-busy={!loaded}>
      {!loaded && !timedOut && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-10 flex flex-col bg-zinc-950 px-4 py-6 sm:px-8"
        >
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            Operasyon alanı hazırlanıyor
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
            ))}
          </div>

          <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
            <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
            <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
          </div>
        </div>
      )}

      {!loaded && timedOut && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-950 px-6 text-center">
          <div className="max-w-sm rounded-2xl border border-amber-500/20 bg-zinc-900 p-6 shadow-2xl">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
            <h2 className="mt-3 text-sm font-semibold text-zinc-100">Operasyon alanı yüklenemedi</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Bağlantı veya uygulama dosyaları zamanında yanıt vermedi. Yeniden deneyebilirsin.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Yeniden dene
            </button>
          </div>
        </div>
      )}

      {hydrated && (
        <iframe
          key={retryCount}
          ref={iframeRef}
          src={src}
          title={title}
          referrerPolicy="same-origin"
          allow="clipboard-write"
          onLoad={() => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'kade:set-operations-model', model: selectedModel },
              window.location.origin
            )
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'kade:set-operations-view', view: activeView },
              window.location.origin
            )

            // The child can post its ready message before React attaches the listener.
            // Polling the same-origin readiness marker closes that race without revealing
            // a half-booted workspace.
            if (readinessPollRef.current !== null) window.clearInterval(readinessPollRef.current)
            const startedAt = Date.now()
            readinessPollRef.current = window.setInterval(() => {
              const isReady = iframeRef.current?.contentDocument?.body?.dataset.operationsReady === 'true'
              if (isReady) {
                if (readinessPollRef.current !== null) window.clearInterval(readinessPollRef.current)
                readinessPollRef.current = null
                setLoaded(true)
                setTimedOut(false)
              } else if (Date.now() - startedAt > 11_000 && readinessPollRef.current !== null) {
                window.clearInterval(readinessPollRef.current)
                readinessPollRef.current = null
              }
            }, 100)
          }}
          className={`h-full w-full border-0 bg-zinc-950 transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
