/**
 * KadexAI teklif akışının SAF kuralları: durum makinesi, etiketler ve giriş
 * doğrulaması. `server-only` bağımlılığı YOKTUR — testler ve istemci tarafı da
 * kullanabilsin diye DB erişiminden ayrı tutuldu (bkz. kadexaiQuotes.ts).
 */

export const QUOTE_STATUSES = [
  'new',
  'reviewing',
  'offer_prepared',
  'sent',
  'accepted',
  'rejected',
  'payment_pending',
  'completed',
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  new: 'Yeni',
  reviewing: 'İnceleniyor',
  offer_prepared: 'Teklif Hazırlandı',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  payment_pending: 'Ödeme Bekliyor',
  completed: 'Tamamlandı',
}

export const TEAM_SIZES = ['1', '2-5', '6-20', '21-50', '50+'] as const
export type TeamSize = (typeof TEAM_SIZES)[number]

export interface QuoteRequestInput {
  firstName: string
  lastName: string
  company?: string
  email: string
  phone?: string
  useCase: string
  teamSize?: string
  requestedFeatures?: string[]
  apiNeeded?: boolean
  estimatedUsage?: string
  notes?: string
}

export interface QuoteRequestRow {
  id: string
  user_id: string
  first_name: string
  last_name: string
  company: string | null
  email: string
  phone: string | null
  use_case: string
  team_size: string | null
  requested_features: string[]
  api_needed: boolean
  estimated_usage: string | null
  notes: string | null
  status: QuoteStatus
  payment_order_id: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function trimmed(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max)
}

function optional(value: unknown, max: number): string | null {
  const text = trimmed(value, max)
  return text || null
}

export class QuoteValidationError extends Error {}

/** İstemciden gelen gövdeyi doğrular. Fazla alanlar sessizce düşürülür. */
export function validateQuoteInput(body: unknown): Required<Pick<QuoteRequestInput, 'firstName' | 'lastName' | 'email' | 'useCase'>> & QuoteRequestInput {
  const input = (body ?? {}) as Record<string, unknown>

  const firstName = trimmed(input.firstName, 80)
  const lastName = trimmed(input.lastName, 80)
  const email = trimmed(input.email, 254).toLocaleLowerCase('en-US')
  const useCase = trimmed(input.useCase, 2000)

  if (!firstName) throw new QuoteValidationError('Ad zorunlu.')
  if (!lastName) throw new QuoteValidationError('Soyad zorunlu.')
  if (!EMAIL_PATTERN.test(email)) throw new QuoteValidationError('Geçerli bir e-posta gir.')
  if (useCase.length < 10) throw new QuoteValidationError('Kullanım ihtiyacını en az 10 karakterle anlat.')

  const teamSize = trimmed(input.teamSize, 10)
  if (teamSize && !(TEAM_SIZES as readonly string[]).includes(teamSize)) {
    throw new QuoteValidationError('Geçersiz ekip büyüklüğü.')
  }

  const rawFeatures = Array.isArray(input.requestedFeatures) ? input.requestedFeatures : []
  const requestedFeatures = rawFeatures
    .map((item) => trimmed(item, 60))
    .filter(Boolean)
    .slice(0, 20)

  return {
    firstName,
    lastName,
    company: optional(input.company, 160) ?? undefined,
    email,
    phone: optional(input.phone, 32) ?? undefined,
    useCase,
    teamSize: teamSize || undefined,
    requestedFeatures,
    apiNeeded: input.apiNeeded === true,
    estimatedUsage: optional(input.estimatedUsage, 400) ?? undefined,
    notes: optional(input.notes, 2000) ?? undefined,
  }
}
