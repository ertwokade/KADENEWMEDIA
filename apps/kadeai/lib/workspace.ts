import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Kullanicinin aktif calisma alanini bulur, yoksa olusturur.
 * `integrations` gibi workspace_id zorunlu tablolara yazarken kullanilir.
 */
export async function resolveWorkspaceId(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<string> {
  const { data: preference } = await supabase
    .from('user_preferences')
    .select('active_workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const active = preference?.active_workspace_id as string | undefined
  if (active) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', active)
      .eq('user_id', user.id)
      .maybeSingle()
    if (membership) return active
  }

  const { data: anyMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (anyMembership?.workspace_id) return anyMembership.workspace_id as string

  const name =
    (typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : null) ||
    user.email?.split('@')[0] ||
    'Kullanıcı'

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ owner_id: user.id, name: `${name} Çalışma Alanı`, slug: 'ana-calisma-alani' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  await supabase.from('workspace_members').upsert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
  return workspace.id as string
}
