import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const providers = [
    process.env.GROQ_API_KEY,
    process.env.CEREBRAS_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.MISTRAL_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENAI_API_KEY,
    process.env.GEMINI_API_KEY,
  ]
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const aiConfigured = providers.some((value) => Boolean(value?.trim()))
  const healthy = authConfigured && aiConfigured
  return NextResponse.json({
    status: healthy ? 'ok' : 'degraded',
    service: 'kade-ai',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/kadeai',
    checks: { auth: authConfigured, ai: aiConfigured },
    timestamp: new Date().toISOString(),
  }, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
