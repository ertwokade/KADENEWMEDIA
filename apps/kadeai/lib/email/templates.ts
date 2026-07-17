import type { EmailMessage, EmailTemplate } from './types'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]!)
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#09090b;color:#f4f4f5;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;padding:32px"><p style="color:#f2c322;font-weight:800;letter-spacing:.12em">KADE AI</p><h1 style="font-size:24px">${escapeHtml(title)}</h1>${body}<p style="margin-top:32px;color:#71717a;font-size:12px">Bu e-posta KADE AI hesabınızla ilgili bir işlem için gönderildi.</p></main></body></html>`
}

export function renderEmail(to: string, template: EmailTemplate): EmailMessage {
  if (template.kind === 'welcome') {
    const name = escapeHtml(template.displayName.slice(0, 120))
    return {
      to,
      subject: 'KADE AI hesabınız hazır',
      text: `Merhaba ${template.displayName.slice(0, 120)}, KADE AI çalışma alanınız hazır.`,
      html: layout('Hoş geldiniz', `<p>Merhaba ${name}, KADE AI çalışma alanınız hazır.</p>`),
    }
  }
  if (template.kind === 'password-reset') {
    const resetUrl = new URL(template.resetUrl)
    if (!['https:', 'http:'].includes(resetUrl.protocol)) throw new Error('Geçersiz parola yenileme adresi.')
    const safeUrl = escapeHtml(resetUrl.toString())
    return {
      to,
      subject: 'KADE AI parola yenileme',
      text: `Parolanızı yenilemek için bağlantıyı açın: ${resetUrl.toString()}`,
      html: layout('Parolanızı yenileyin', `<p>Bağlantı süreli ve tek kullanımlıktır.</p><p><a href="${safeUrl}" style="color:#f2c322">Yeni parola belirle</a></p>`),
    }
  }
  return {
    to,
    subject: 'KADE AI ödeme makbuzu',
    text: `Sipariş: ${template.orderId}. Tutar: ${template.amountLabel}.`,
    html: layout('Ödeme alındı', `<p>Sipariş: <strong>${escapeHtml(template.orderId)}</strong></p><p>Tutar: ${escapeHtml(template.amountLabel)}</p>`),
  }
}
