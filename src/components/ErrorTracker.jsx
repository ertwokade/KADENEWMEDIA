import { useEffect } from 'react'
import { trackClientErrorApi } from '../api'

export default function ErrorTracker() {
  useEffect(() => {
    const send = (payload) => {
      trackClientErrorApi({
        ...payload,
        path: window.location.pathname,
        source: 'browser',
      })
    }

    const onError = (event) => {
      send({
        message: event.message,
        stack: event.error?.stack || '',
      })
    }

    const onRejection = (event) => {
      send({
        message: event.reason?.message || String(event.reason || 'Unhandled promise rejection'),
        stack: event.reason?.stack || '',
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
