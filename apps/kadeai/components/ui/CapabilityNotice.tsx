'use client'

/*
 * Aracın bağlı olduğu servis yapılandırılmamışsa kullanıcıyı ÖNCEDEN uyarır.
 *
 * Öncesinde Video Fabrikası, Klip Üretici, Altyazı ve Dublaj sayfaları formu
 * normal gösteriyor, kullanıcı butona bastıktan sonra 503 alıyordu. Kapasite
 * bilgisi zaten /api/config'te var; burada tek yerden okunup gösteriliyor.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'

export type Capability = 'video' | 'transcribe' | 'image' | 'youtube'

const MESSAGES: Record<Capability, { title: string; detail: string }> = {
  video: {
    title: 'Video servisi yapılandırılmamış',
    detail: 'Video üretimi ayrı bir medya servisinde çalışıyor ve şu an bağlı değil. Üretim isteği hata dönecektir.',
  },
  transcribe: {
    title: 'Transkripsiyon yapılandırılmamış',
    detail: 'Ses çözümleme sağlayıcısı tanımlı değil. Döküm gerektiren adımlar çalışmayacaktır.',
  },
  image: {
    title: 'Görsel üretimi yapılandırılmamış',
    detail: 'Görsel sağlayıcısı tanımlı değil.',
  },
  youtube: {
    title: 'YouTube bağlantısı yapılandırılmamış',
    detail: 'YouTube API anahtarı tanımlı değil; kanal verisi çekilemez.',
  },
}

export default function CapabilityNotice({ need }: { need: Capability }) {
  // null = henüz bilinmiyor; bu durumda hiçbir şey gösterme ki sayfa
  // açılışında yanlış alarm vermesin.
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/config', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (cancelled || !data) return
        setAvailable(data[need] !== false)
      })
      .catch(() => {
        // Config okunamadıysa uyarı gösterme: aracı gereksiz yere kapatma.
      })
    return () => { cancelled = true }
  }, [need])

  if (available !== false) return null

  const message = MESSAGES[need]
  return (
    <div role="status" className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{message.title}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{message.detail}</p>
        </div>
      </div>
    </div>
  )
}
