'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { AIModel } from '@/types'
import { useTheme } from '@/lib/context/ThemeContext'
import { apiPath } from '@/lib/appConfig'

interface OperationsFrameProps {
  src: string
  title: string
  activeView: string
  selectedModel: AIModel
  onViewChange?: (view: string) => void
}

const subscribeToHydration = () => () => undefined

export default function OperationsFrame({ src, title, activeView, selectedModel, onViewChange }: OperationsFrameProps) {
  const { theme } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [reportError, setReportError] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const reportQueueRef = useRef<Promise<unknown>>(Promise.resolve())
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
      // Kit gömülüyken kendi tema tercihini uygulamaz, panele sorar. Yükleme
      // sırası ne olursa olsun doğru temayla açılsın diye istek anında
      // cevaplanır; `loaded` efektini beklemek yarışa açıktı.
      if (event.data?.type === 'kade:request-operations-theme') {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'kade:set-operations-theme', theme },
          window.location.origin,
        )
        return
      }
      if (event.data?.type === 'kade:operations-view' && typeof event.data.view === 'string') {
        onViewChange?.(event.data.view)
        return
      }
      if (event.data?.type === 'kade:operations-report' && typeof event.data.message === 'string') {
        const payload = {
          message: event.data.message,
          view: typeof event.data.view === 'string' ? event.data.view : activeView,
          type: typeof event.data.reportType === 'string' ? event.data.reportType : 'info',
        }
        reportQueueRef.current = reportQueueRef.current
          .then(() => fetch(apiPath('/api/operations-report'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }))
          .then(async (response) => {
            if (!response.ok) throw new Error('Operasyon raporu gönderilemedi.')
            setReportError('')
          })
          .catch(() => {
            setReportError('WhatsApp operasyon raporu gönderilemedi. Bildirim ayarlarını kontrol edin.')
          })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [activeView, onViewChange, theme])

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

  useEffect(() => {
    if (!loaded) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'kade:set-operations-theme', theme },
      window.location.origin
    )
  }, [theme, loaded])

  const retry = () => {
    setLoaded(false)
    setTimedOut(false)
    setRetryCount((count) => count + 1)
  }

  return (
    <div className="kade-operations-frame relative h-full w-full overflow-hidden" aria-busy={!loaded}>
      {reportError && (
        <div role="alert" className="absolute left-1/2 top-3 z-30 w-[min(92%,32rem)] -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/95 px-4 py-3 text-center text-xs font-medium text-red-100 shadow-xl">
          {reportError}
        </div>
      )}
      {!loaded && !timedOut && (
        <div
          role="status"
          aria-live="polite"
          className="kade-operations-loading absolute inset-0 z-10 flex flex-col px-4 py-6 sm:px-8"
        >
          <div className="mb-5 flex items-center gap-2 text-xs font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            Operasyon alanı hazırlanıyor
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="kade-operations-skeleton h-24 animate-pulse rounded-xl border" />
            ))}
          </div>

          <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
            <div className="kade-operations-skeleton animate-pulse rounded-xl border" />
            <div className="kade-operations-skeleton animate-pulse rounded-xl border" />
          </div>
        </div>
      )}

      {!loaded && timedOut && (
        <div className="kade-operations-loading absolute inset-0 z-20 grid place-items-center px-6 text-center">
          <div className="kade-operations-error max-w-sm rounded-2xl border p-6 shadow-2xl">
            <AlertTriangle className="mx-auto h-8 w-8" />
            <h2 className="mt-3 text-sm font-semibold">Operasyon alanı yüklenemedi</h2>
            <p className="mt-2 text-xs leading-relaxed">
              Bağlantı veya uygulama dosyaları zamanında yanıt vermedi. Yeniden deneyebilirsin.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mx-auto mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
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
            /* Aynı origin'deki statik operasyon uygulamasının `load` olayı,
               defer scriptleri çalıştıktan sonra gelir. Hazır mesajı React
               dinleyicisinden önce gönderilse bile çerçeveyi güvenle açar. */
            setLoaded(true)
            setTimedOut(false)
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'kade:set-operations-model', model: selectedModel },
              window.location.origin
            )
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'kade:set-operations-view', view: activeView },
              window.location.origin
            )
            iframeRef.current?.contentWindow?.postMessage(
              { type: 'kade:set-operations-theme', theme },
              window.location.origin
            )
          }}
          className={`h-full w-full border-0 bg-transparent transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
