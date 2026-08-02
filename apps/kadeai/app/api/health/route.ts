import { NextResponse } from 'next/server'
import { hasVercelGatewayRuntime } from '@/lib/ai/gatewayAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const providers = [
    process.env.GROQ_API_KEY,
    process.env.CEREBRAS_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.MISTRAL_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.GEMINI_API_KEY,
  ]
  const aiGateway = hasVercelGatewayRuntime(request)
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const aiConfigured = aiGateway || providers.some((value) => Boolean(value?.trim()))
  const healthy = authConfigured && aiConfigured
  return NextResponse.json({
    status: healthy ? 'ok' : 'degraded',
    service: 'kade-ai',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/kadeai',
    checks: { auth: authConfigured, ai: aiConfigured, aiGateway },
    timestamp: new Date().toISOString(),
  }, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
