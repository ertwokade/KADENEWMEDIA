import type { PaymentEventStore, VerifiedPaymentEvent } from './types'

export async function processVerifiedPaymentEvent(event: VerifiedPaymentEvent, store: PaymentEventStore) {
  if (await store.has(event.eventId)) return { duplicate: true }
  await store.record(event)
  await store.updateOrder(event)
  return { duplicate: false }
}
