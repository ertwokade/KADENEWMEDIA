import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { PERFORMANCE_SYSTEM_PROMPT, buildPerformancePrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20) : []
}

function normalizePerformance(value: Record<string, unknown>) {
  const score = Number(value.genel_skor)
  if (!Number.isFinite(score)) return null
  const tahminler = value.tahminler && typeof value.tahminler === 'object' && !Array.isArray(value.tahminler)
    ? Object.fromEntries(Object.entries(value.tahminler as Record<string, unknown>).map(([key, item]) => [key, String(item)]))
    : undefined

  return {
    ...value,
    genel_skor: Math.max(0, Math.min(100, Math.round(score))),
    guclu_yonler: stringList(value.guclu_yonler),
    zayif_yonler: stringList(value.zayif_yonler),
    optimizasyon_onerileri: stringList(value.optimizasyon_onerileri),
    tahminler,
    ideal_yayin_zamani: typeof value.ideal_yayin_zamani === 'string' ? value.ideal_yayin_zamani.trim() : undefined,
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { title, thumbnailDesc, contentDesc, platform, niche, model } = await req.json()
    if (!title || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildPerformancePrompt(title, thumbnailDesc || '', contentDesc || '', platform || 'youtube', niche || ''), model: model as AIModel, systemPrompt: PERFORMANCE_SYSTEM_PROMPT, maxTokens: 2500 }, req)
    const parsed = parseStructuredOutput(result.content)
    const data = normalizePerformance(parsed)
    if (!data) {
      return NextResponse.json({ error: 'Model geçerli bir performans skoru döndürmedi. Lütfen yeniden dene.' }, { status: 502 })
    }
    return NextResponse.json({ data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
