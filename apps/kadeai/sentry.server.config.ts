import * as Sentry from '@sentry/nextjs'
import { scrubTelemetryValue } from '@/lib/observability/scrub'

const enabled = process.env.SENTRY_ENABLED === '1' && Boolean(process.env.SENTRY_DSN)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: Math.min(1, Math.max(0, Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0))),
  beforeSend(event) {
    delete event.user
    if (event.request) {
      delete event.request.cookies
      delete event.request.data
      delete event.request.query_string
      event.request.headers = scrubTelemetryValue(event.request.headers) as Record<string, string>
    }
    event.extra = scrubTelemetryValue(event.extra) as typeof event.extra
    event.contexts = scrubTelemetryValue(event.contexts) as typeof event.contexts
    return event
  },
})
