import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export async function recordAuditEvent(input: {
  actorUserId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  outcome?: 'success' | 'denied' | 'failed'
  metadata?: Record<string, string | number | boolean | null>
}) {
  try {
    const admin = createAdminClient()
    await admin.from('platform_audit_events').insert({
      actor_user_id: input.actorUserId || null,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      outcome: input.outcome || 'success',
      metadata: input.metadata || {},
    })
  } catch {
    // Audit telemetry may not break the primary flow; Sentry/API error logging
    // remains the fallback until the migration is present.
  }
}
