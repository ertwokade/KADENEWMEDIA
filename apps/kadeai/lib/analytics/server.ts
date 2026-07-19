import 'server-only'

import { createHmac } from 'node:crypto'
import type { AnalyticsEvent } from './client'

export async function captureServerAnalytics(event: AnalyticsEvent, userId: string, consented: boolean) {
  if (!consented || process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== '1') return
  const token = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const hashSecret = process.env.POSTHOG_HASH_SECRET
  if (!token || !hashSecret) return
  const distinctId = createHmac('sha256', hashSecret).update(userId).digest('hex')
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
  try {
    await fetch(new URL('/capture/', host), {
      method: 'POST',
      signal: AbortSignal.timeout(3_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: token, event, properties: { distinct_id: distinctId } }),
    })
  } catch {
    // Analytics must never affect the product flow.
  }
}
