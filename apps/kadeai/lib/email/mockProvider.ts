import type { EmailMessage, EmailProvider } from './types'

export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock'
  readonly sent: Array<{ message: EmailMessage; idempotencyKey: string }> = []

  async send(message: EmailMessage, idempotencyKey: string) {
    this.sent.push({ message, idempotencyKey })
    return { id: `mock-${this.sent.length}` }
  }
}
