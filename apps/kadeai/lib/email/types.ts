export type EmailTemplate =
  | { kind: 'welcome'; displayName: string }
  | { kind: 'password-reset'; resetUrl: string }
  | { kind: 'payment-receipt'; orderId: string; amountLabel: string }

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage, idempotencyKey: string): Promise<{ id: string }>
}
