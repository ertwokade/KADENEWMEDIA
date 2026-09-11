import type { ModelProviderId } from '@/lib/ai/models'

type PlatformProviderId = Exclude<ModelProviderId, 'auto'>

const PROVIDER_ENV_KEYS: Record<PlatformProviderId, string> = {
  vercel: 'AI_GATEWAY_API_KEY',
  groq: 'GROQ_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GEMINI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
}

function commaSeparatedSet(name: string) {
  return new Set(
    (process.env[name] || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isPlatformProviderEnabled(provider: PlatformProviderId) {
  const disabled = commaSeparatedSet('KADE_DISABLED_AI_PROVIDERS')
  return !disabled.has(provider) && Boolean(process.env[PROVIDER_ENV_KEYS[provider]]?.trim())
}

export function isIntegrationEnabled(integration: string) {
  return !commaSeparatedSet('KADE_DISABLED_INTEGRATIONS').has(integration.trim().toLowerCase())
}
