import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { LEGAL_DOCUMENTS, getLegalSpec, type LegalDocumentSpec } from './registry'

export * from './registry'

export interface LegalDocumentRow {
  slug: string
  title: string
  version: number
  body: string
  status: 'draft' | 'published'
  requires_checkout_consent: boolean
  updated_at: string
  published_at: string | null
}

export interface LegalDocumentStatus extends LegalDocumentSpec {
  published: boolean
  version: number | null
  updatedAt: string | null
  hasBody: boolean
  /**
   * Metin ana sitede zaten yayında mı? Bu dördü (KVKK, Gizlilik, Çerez,
   * Telif) KadeAI'den önce yayımlanmıştı; panelde "eksik" görünmeleri
   * yanıltıcıydı. Ödeme öncesi onay gerektiren metinler bunun kapsamında
   * DEĞİL — onlar sürümlenmiş olmak zorunda, bkz. legal_consents.
   */
  coveredByMainSite: boolean
}

async function fetchAll(): Promise<LegalDocumentRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('legal_documents').select('*')
    if (error) return []
    return (data || []) as LegalDocumentRow[]
  } catch {
    return []
  }
}

/** Gerekli belge listesi + her birinin canlı durumu. Eksikler görünür kalır. */
export async function getLegalStatus(): Promise<LegalDocumentStatus[]> {
  const rows = await fetchAll()
  const byslug = new Map(rows.map((row) => [row.slug, row]))
  return LEGAL_DOCUMENTS.map((spec) => {
    const row = byslug.get(spec.slug)
    return {
      ...spec,
      published: row?.status === 'published',
      version: row?.version ?? null,
      updatedAt: row?.updated_at ?? null,
      hasBody: Boolean(row?.body?.trim()),
      coveredByMainSite: Boolean(spec.existingPath) && !spec.checkoutConsent,
    }
  })
}

export async function getPublishedLegalDocument(slug: string): Promise<LegalDocumentRow | null> {
  if (!getLegalSpec(slug)) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('legal_documents')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !data) return null
    return data as LegalDocumentRow
  } catch {
    return null
  }
}

/**
 * Ödeme sırasında onayı ZORUNLU olan belgeler.
 *
 * Yalnızca hem yayınlanmış hem de onay bayrağı açık olanlar döner. Hiç
 * yayınlanmış belge yoksa boş dizi döner ve checkout davranışı değişmez —
 * altyapı hazır, metinler hazır olduğunda kendiliğinden devreye girer.
 */
export async function getRequiredCheckoutDocuments(): Promise<Array<{ slug: string; title: string; version: number }>> {
  const rows = await fetchAll()
  return rows
    .filter((row) => row.status === 'published' && row.requires_checkout_consent && row.body.trim())
    .map((row) => ({ slug: row.slug, title: row.title, version: row.version }))
}

/** Onay kaydı değiştirilemez; yalnızca eklenir. */
export async function recordLegalConsents(input: {
  userId: string
  orderId: string | null
  documents: Array<{ slug: string; version: number }>
}) {
  if (input.documents.length === 0) return
  const admin = createAdminClient()
  await admin.from('legal_consents').insert(
    input.documents.map((document) => ({
      user_id: input.userId,
      order_id: input.orderId,
      document_slug: document.slug,
      document_version: document.version,
    })),
  )
}

export async function saveLegalDocument(input: {
  slug: string
  title?: string
  body?: string
  status?: 'draft' | 'published'
  requiresCheckoutConsent?: boolean
  updatedBy: string
}): Promise<LegalDocumentRow> {
  const spec = getLegalSpec(input.slug)
  if (!spec) throw new Error('Bilinmeyen yasal metin.')

  const admin = createAdminClient()
  const { data: existing } = await admin.from('legal_documents').select('*').eq('slug', input.slug).maybeSingle()
  const current = existing as LegalDocumentRow | null

  const body = input.body ?? current?.body ?? ''
  // Metin değiştiyse sürüm artar: alınmış onaylar eski sürüme bağlı kalsın.
  const bodyChanged = current ? body !== current.body : Boolean(body.trim())
  const version = (current?.version ?? 0) + (bodyChanged || !current ? 1 : 0)
  const status = input.status ?? current?.status ?? 'draft'

  if (status === 'published' && !body.trim()) {
    throw new Error('Boş metin yayınlanamaz.')
  }

  const { data, error } = await admin
    .from('legal_documents')
    .upsert({
      slug: input.slug,
      title: input.title?.trim() || current?.title || spec.title,
      body,
      version,
      status,
      requires_checkout_consent: input.requiresCheckoutConsent ?? current?.requires_checkout_consent ?? spec.checkoutConsent,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
      published_at: status === 'published' ? new Date().toISOString() : current?.published_at ?? null,
    }, { onConflict: 'slug' })
    .select('*')
    .single()

  if (error) throw new Error(`Yasal metin kaydedilemedi: ${error.message}`)
  return data as LegalDocumentRow
}
