import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { parseStructuredOutput } from '@/lib/ai/structured'
import {
  DISCOVERY_LANGUAGES,
  normalizeDiscoveryScript,
  sanitizeDiscoverySource,
  type DiscoveryLanguage,
} from '@/lib/kade-search/discovery'
import { buildDiscoveryScriptPrompt, DISCOVERY_SCRIPT_SYSTEM_PROMPT } from '@/lib/kade-search/scriptGeneration'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { requireReaderAccess } from '../_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const limited = rateLimit(getRateLimitKey(request, 'kade-search-script'), 8, 60_000)
  const headers = { ...rateLimitHeaders(limited), 'Cache-Control': 'private, no-store' }
  if (!limited.allowed) return NextResponse.json({ error: 'Çok fazla senaryo isteği. Bir dakika sonra yeniden dene.' }, { status: 429, headers })

  const guard = await requireReaderAccess()
  if (guard) return guard

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400, headers })
  }

  const source = sanitizeDiscoverySource(body.source)
  const language = String(body.language ?? 'tr') as DiscoveryLanguage
  const durationSec = Math.max(15, Math.min(180, Math.round(Number(body.durationSec) || 45)))
  if (!source) return NextResponse.json({ error: 'Geçerli bir kaynak videosu seç.' }, { status: 400, headers })
  if (!(language in DISCOVERY_LANGUAGES)) {
    return NextResponse.json({ error: 'Desteklenmeyen senaryo dili.' }, { status: 400, headers })
  }

  try {
    const generated = await generateContent({
      model: 'auto',
      toolId: 'trend-radar',
      maxTokens: 4000,
      systemPrompt: DISCOVERY_SCRIPT_SYSTEM_PROMPT,
      prompt: buildDiscoveryScriptPrompt({ source, language, durationSec }),
    }, request)
    const script = normalizeDiscoveryScript(parseStructuredOutput(generated.content), language, source.title)
    return NextResponse.json({
      script,
      source: { title: source.title, platform: source.platform, url: source.url },
      model: generated.model,
      routingReason: generated.routingReason,
      tokensUsed: generated.tokensUsed,
    }, { status: 201, headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const safe = /kota|sağlayıcı|anahtar|oturum|yeterli sahne/i.test(message)
      ? message.slice(0, 300)
      : 'Sahneli video metni üretilemedi.'
    return NextResponse.json({ error: safe }, { status: 503, headers })
  }
}
