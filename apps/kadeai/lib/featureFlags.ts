import 'server-only'

import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export interface FeatureFlagContext {
  userId?: string | null
  tier?: string | null
  isAdmin?: boolean
  isBeta?: boolean
}

function rolloutBucket(flag: string, userId: string) {
  const digest = createHash('sha256').update(`${flag}:${userId}`).digest()
  return digest.readUInt32BE(0) % 100
}

export async function isFeatureEnabled(key: string, context: FeatureFlagContext = {}) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feature_flags')
    .select('enabled, admin_only, beta_only, allowed_users, allowed_tiers, rollout_percent')
    .eq('key', key)
    .maybeSingle()
  if (error || !data || !data.enabled) return false
  if (data.admin_only && !context.isAdmin) return false
  if (data.beta_only && !context.isBeta) return false
  if (context.userId && (data.allowed_users || []).includes(context.userId)) return true
  if (context.tier && (data.allowed_tiers || []).includes(context.tier)) return true
  if (!context.userId) return data.rollout_percent === 100
  return rolloutBucket(key, context.userId) < data.rollout_percent
}
