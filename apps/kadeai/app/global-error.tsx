'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html lang="tr">
      <body style={{ minHeight: '100dvh', margin: 0, display: 'grid', placeItems: 'center', padding: 24, background: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 448, padding: 24, border: '1px solid #27272a', borderRadius: 16, background: '#18181b', textAlign: 'center' }}>
          <p style={{ color: '#facc15', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em' }}>KADE AI</p>
          <h1 style={{ marginTop: 12, fontSize: 20 }}>Beklenmeyen bir hata oluştu</h1>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>İçeriğiniz hata raporuna eklenmedi. Güvenle yeniden deneyebilirsiniz.</p>
          <button type="button" onClick={retry} style={{ marginTop: 20, border: 0, borderRadius: 8, padding: '10px 16px', background: '#facc15', color: '#09090b', fontWeight: 700, cursor: 'pointer' }}>Yeniden dene</button>
        </main>
      </body>
    </html>
  )
}
