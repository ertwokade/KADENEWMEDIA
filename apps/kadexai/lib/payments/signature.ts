import { createHmac, timingSafeEqual } from 'node:crypto'

export function signPaymentPayload(rawBody: string, secret: string) {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
}

export function verifyPaymentSignature(rawBody: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = Buffer.from(signPaymentPayload(rawBody, secret), 'hex')
  const actual = Buffer.from(signature, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
