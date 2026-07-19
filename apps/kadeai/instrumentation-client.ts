import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { scrubTelemetryValue } from '@/lib/observability/scrub'

const sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === '1' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: sentryEnabled,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: Math.min(1, Math.max(0, Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0))),
  beforeSend(event) {
    delete event.user
    if (event.request) {
      delete event.request.cookies
      delete event.request.data
      delete event.request.query_string
      event.request.headers = scrubTelemetryValue(event.request.headers) as Record<string, string>
    }
    event.extra = scrubTelemetryValue(event.extra) as typeof event.extra
    return event
  },
})

if (
  process.env.NODE_ENV === 'production'
  && process.env.NEXT_PUBLIC_POSTHOG_ENABLED === '1'
  && process.env.NEXT_PUBLIC_POSTHOG_KEY
  && typeof window !== 'undefined'
  && window.localStorage.getItem('kade-analytics-consent') === 'granted'
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    defaults: '2026-05-30',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: 'localStorage',
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
