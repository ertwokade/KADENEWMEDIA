import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), false)
const root = join(process.cwd(), '.next', 'static')
if (!existsSync(root)) {
  console.error('Client bundle bulunamadı. Önce production build çalıştırın.')
  process.exit(1)
}

function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

const secretNames = [
  'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY',
  'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'MISTRAL_API_KEY', 'GEMINI_API_KEY',
  'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'SHOPIER_API_SECRET', 'PAYMENT_WEBHOOK_SECRET',
  'SENTRY_AUTH_TOKEN', 'KADE_BACKEND_TOKEN', 'DATABASE_URL', 'ENCRYPTION_KEY',
]
const configured = secretNames
  .map((name) => ({ name, value: process.env[name] || '' }))
  .filter(({ value }) => value.length >= 8 && !/YOUR_|generate-|example|placeholder/i.test(value))

const leaks = []
for (const path of files(root)) {
  if (!/\.(js|css|json|map)$/.test(path)) continue
  const content = readFileSync(path, 'utf8')
  for (const secret of configured) {
    if (content.includes(secret.value)) leaks.push({ name: secret.name, file: relative(process.cwd(), path) })
  }
}

if (leaks.length) {
  console.error('Client bundle secret taraması başarısız:')
  for (const leak of leaks) console.error(`- ${leak.name}: ${leak.file}`)
  process.exit(1)
}
console.log(`Client bundle secret taraması başarılı (${configured.length} yapılandırılmış secret kontrol edildi).`)
