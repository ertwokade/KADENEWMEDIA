import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { CONTENT_DEFAULTS, mergeContent, type ContentKey } from './defaults'

export * from './defaults'

/**
 * CMS okuması (§25). Tablo yoksa, boşsa veya erişilemezse varsayılanlara
 * düşer — içerik hiçbir koşulda boş render edilmez.
 */
export async function getContent<K extends ContentKey>(key: K): Promise<(typeof CONTENT_DEFAULTS)[K]> {
  const defaults = CONTENT_DEFAULTS[key]
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('kadeai_content_blocks')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error || !data) return defaults
    return mergeContent(defaults, data.value)
  } catch {
    return defaults
  }
}

export async function saveContent(key: ContentKey, value: unknown, updatedBy: string) {
  // Varsayılan şemaya göre süz: bilinmeyen alanlar tabloya yazılmaz.
  const merged = mergeContent(CONTENT_DEFAULTS[key], value)
  const admin = createAdminClient()
  const { error } = await admin
    .from('kadeai_content_blocks')
    .upsert({ key, value: merged, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(`İçerik kaydedilemedi: ${error.message}`)
  return merged
}
