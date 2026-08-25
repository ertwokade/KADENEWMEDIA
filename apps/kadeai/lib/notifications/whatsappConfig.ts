export function whatsappConfiguration() {
  const phone = process.env.WA_PHONE?.replace(/\D/g, '') ?? ''
  const apiKey = process.env.WA_APIKEY?.trim() ?? ''
  const missing: string[] = []
  if (!/^\d{10,15}$/.test(phone)) missing.push('WA_PHONE')
  const placeholderApiKey = /^(?:your|example|replace|change|dummy|test)[-_ ]/i.test(apiKey)
  if (!apiKey || apiKey.length > 256 || /[\r\n]/.test(apiKey) || placeholderApiKey) missing.push('WA_APIKEY')
  return { configured: missing.length === 0, missing, phone, apiKey }
}

export function callMeBotResponseQueued(body: string) {
  return /message\s+queued/i.test(body)
}
