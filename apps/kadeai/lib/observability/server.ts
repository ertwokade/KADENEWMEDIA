import 'server-only'

import * as Sentry from '@sentry/nextjs'

export function captureApiError(error: unknown, route: string) {
  Sentry.captureException(error, {
    tags: { route, layer: 'api' },
    contexts: { request: { route } },
  })
}
