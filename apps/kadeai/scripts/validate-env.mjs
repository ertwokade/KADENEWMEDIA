import nextEnv from '@next/env'
import { pathToFileURL } from 'node:url'

nextEnv.loadEnvConfig(process.cwd(), false)

export function validateProductionEnvironment() {
  const errors = []
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!process.env[name]?.trim()) errors.push(`${name} eksik`)
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try { new URL(process.env.NEXT_PUBLIC_APP_URL) } catch { errors.push('NEXT_PUBLIC_APP_URL geçerli bir mutlak URL değil') }
  }
  const aiKeys = ['GROQ_API_KEY', 'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'MISTRAL_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY']
  if (!aiKeys.some((name) => process.env[name]?.trim())) errors.push('en az bir sunucu AI sağlayıcı anahtarı eksik')
  if (process.env.SENTRY_ENABLED === '1' && !process.env.SENTRY_DSN) {
    errors.push('Sentry etkin fakat SENTRY_DSN eksik')
  }
  if (process.env.PAYMENT_PROVIDER === 'mock' && process.env.PAYMENT_SANDBOX_ENABLED !== '1') {
    errors.push('mock ödeme için PAYMENT_SANDBOX_ENABLED=1 gerekli')
  }
  if (process.env.EMAIL_PROVIDER === 'resend' && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
    errors.push('Resend etkin fakat RESEND_API_KEY veya EMAIL_FROM eksik')
  }
  if (errors.length) throw new Error(`Production ortam doğrulaması başarısız:\n- ${errors.join('\n- ')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateProductionEnvironment()
    console.log('Production ortam değişkenleri doğrulandı.')
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
