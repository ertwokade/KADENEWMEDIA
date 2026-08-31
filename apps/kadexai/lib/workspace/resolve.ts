import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { isAllowedOwnerUser } from '@/lib/featureAccess'
import {
  OWNER_WORKSPACE_SLUG,
  fallbackWorkspaceSlug,
  isValidWorkspaceSlug,
  slugifyWorkspaceName,
} from '@/lib/workspace/slug'

type AuthUserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

function displayNameOf(user: AuthUserLike): string {
  const meta = user.user_metadata ?? {}
  const named = ['display_name', 'full_name', 'name']
    .map((key) => meta[key])
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
  return named ?? user.email?.split('@')[0] ?? ''
}

/**
 * Kullanıcının panel adresini döndürür.
 *
 * Hesap sahibi her zaman `kade` adresinde açılır. Diğer kullanıcılar için
 * görünen addan üretilir; çakışma olursa sonuna sayı eklenir, hiç
 * üretilemezse kullanıcı kimliğinden yedek adres kullanılır.
 *
 * Slug yalnızca adrestir. Bu fonksiyon kimseye yetki vermez; çağıran taraf
 * erişimi zaten oturumdan doğrulamış olmalıdır.
 */
export async function resolveWorkspaceSlug(
  supabase: SupabaseClient,
  user: AuthUserLike,
): Promise<string> {
  const { data: mevcut } = await supabase
    .from('workspaces')
    .select('id, slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const sahip = isAllowedOwnerUser(user)

  if (sahip) {
    // Sahibin adresi sabit. Kayıt varsa ve farklıysa düzeltilir; adres başka
    // bir alanda duruyorsa (benzersiz indeks yüzünden) güncelleme sessizce
    // başarısız olur ve mevcut adres korunur.
    if (mevcut && mevcut.slug !== OWNER_WORKSPACE_SLUG) {
      const { error } = await supabase
        .from('workspaces')
        .update({ slug: OWNER_WORKSPACE_SLUG, updated_at: new Date().toISOString() })
        .eq('id', mevcut.id)
      if (!error) return OWNER_WORKSPACE_SLUG
      return mevcut.slug
    }
    if (mevcut) return mevcut.slug
    return OWNER_WORKSPACE_SLUG
  }

  if (mevcut?.slug && isValidWorkspaceSlug(mevcut.slug)) return mevcut.slug

  const aday = slugifyWorkspaceName(displayNameOf(user))
  const yedek = fallbackWorkspaceSlug(user.id)
  const hedef = aday && isValidWorkspaceSlug(aday) && aday !== OWNER_WORKSPACE_SLUG ? aday : yedek

  if (!mevcut) return hedef

  const { error } = await supabase
    .from('workspaces')
    .update({ slug: hedef, updated_at: new Date().toISOString() })
    .eq('id', mevcut.id)
  // Çakışma varsa kimlik tabanlı yedek her zaman benzersizdir.
  if (error) {
    await supabase
      .from('workspaces')
      .update({ slug: yedek, updated_at: new Date().toISOString() })
      .eq('id', mevcut.id)
    return yedek
  }
  return hedef
}
