import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  QUOTE_STATUSES,
  QuoteValidationError,
  type QuoteRequestInput,
  type QuoteRequestRow,
  type QuoteStatus,
} from './quoteRules'

/**
 * KadeAI "Teklif Al" akışı (§15) ve tekliften ödemeye dönüşüm (§16).
 *
 * Yazma işlemlerinin tamamı service-role ile yapılır: status ve
 * payment_order_id gibi alanlar hiçbir zaman istemciden gelmez.
 */

export {
  QUOTE_STATUSES,
  QUOTE_STATUS_LABEL,
  TEAM_SIZES,
  QuoteValidationError,
  validateQuoteInput,
} from './quoteRules'
export type { QuoteStatus, TeamSize, QuoteRequestInput, QuoteRequestRow } from './quoteRules'

export async function createQuoteRequest(userId: string, input: QuoteRequestInput): Promise<QuoteRequestRow> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('kadeai_quote_requests')
    .insert({
      user_id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      company: input.company || null,
      email: input.email,
      phone: input.phone || null,
      use_case: input.useCase,
      team_size: input.teamSize || null,
      requested_features: input.requestedFeatures || [],
      api_needed: Boolean(input.apiNeeded),
      estimated_usage: input.estimatedUsage || null,
      notes: input.notes || null,
      // status istemciden ASLA alınmaz; her talep 'new' başlar.
      status: 'new',
    })
    .select('*')
    .single()

  if (error) throw new Error(`Teklif talebi kaydedilemedi: ${error.message}`)
  return data as QuoteRequestRow
}

export async function listOwnQuoteRequests(userId: string): Promise<QuoteRequestRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('kadeai_quote_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error('Teklif talepleri okunamadı.')
  return (data || []) as QuoteRequestRow[]
}

export async function listAllQuoteRequests(status?: QuoteStatus | null): Promise<QuoteRequestRow[]> {
  const admin = createAdminClient()
  let query = admin.from('kadeai_quote_requests').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw new Error('Teklif talepleri okunamadı.')
  return (data || []) as QuoteRequestRow[]
}

/** Yalnız sahip çağırır; status ve admin notu güncellenir. */
export async function updateQuoteRequest(input: {
  id: string
  status?: QuoteStatus
  adminNote?: string | null
  paymentOrderId?: string | null
  updatedBy: string
}): Promise<QuoteRequestRow> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: input.updatedBy }
  if (input.status) {
    if (!(QUOTE_STATUSES as readonly string[]).includes(input.status)) {
      throw new QuoteValidationError('Geçersiz durum.')
    }
    patch.status = input.status
  }
  if (input.adminNote !== undefined) patch.admin_note = input.adminNote ? String(input.adminNote).slice(0, 2000) : null
  if (input.paymentOrderId !== undefined) patch.payment_order_id = input.paymentOrderId

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('kadeai_quote_requests')
    .update(patch)
    .eq('id', input.id)
    .select('*')
    .single()

  if (error) throw new Error(`Teklif güncellenemedi: ${error.message}`)
  return data as QuoteRequestRow
}
