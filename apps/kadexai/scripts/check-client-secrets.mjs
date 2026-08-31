import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), false)

function files(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

const canaryNames = ['SECRET_CANARY_ROOT', 'SECRET_CANARY_KadexAI', 'SECRET_CANARY_FASTAPI']
const canaries = canaryNames.map((name) => ({ name, value: process.env[name] || '' }))
if (canaries.some(({ value }) => value.length < 16)) {
  console.error('Bundle secret taraması için üç sentetik canary zorunludur.')
  process.exit(1)
}

const secretNames = [
  'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY',
  'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'MISTRAL_API_KEY', 'GEMINI_API_KEY',
  'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'SHOPIER_API_SECRET', 'PAYMENT_WEBHOOK_SECRET',
  'SENTRY_AUTH_TOKEN', 'KADE_BACKEND_TOKEN', 'DATABASE_URL', 'ENCRYPTION_KEY', 'JWT_SECRET',
]
const configured = secretNames
  .map((name) => ({ name, value: process.env[name] || '' }))
  .filter(({ value }) => value.length >= 8 && !/YOUR_|generate-|example|placeholder/i.test(value))

const roots = [
  join(process.cwd(), '.next', 'static'),
  join(process.cwd(), '.next', 'server', 'app'),
  resolve(process.cwd(), '..', '..', 'dist'),
]
if (!existsSync(roots[0])) {
  console.error('Client bundle bulunamadı. Önce production build çalıştırın.')
  process.exit(1)
}

const leaks = []
for (const path of roots.flatMap(files)) {
  if (!/\.(?:js|css|json|map|html|rsc|txt)$/i.test(path)) continue
  const content = readFileSync(path, 'utf8')
  for (const secret of [...canaries, ...configured]) {
    if (content.includes(secret.value)) leaks.push({ name: secret.name, file: relative(process.cwd(), path) })
  }
}

if (leaks.length) {
  console.error('Client bundle secret taraması başarısız:')
  for (const leak of leaks) console.error(`- ${leak.name}: ${leak.file}`)
  process.exit(1)
}
console.log(`Client bundle secret taraması başarılı (3 sentetik canary, ${configured.length} yapılandırılmış secret).`)
