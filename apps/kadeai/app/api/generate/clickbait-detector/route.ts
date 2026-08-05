import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CLICKBAIT_SYSTEM_PROMPT, buildClickbaitPrompt } from '@/lib/ai/prompts'
import { clampScore, extractJsonObject } from '@/lib/ai/json'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { AIModel } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

interface ClickbaitAlternative {
  baslik: string
  clickbait_skoru: number
  aciklama: string
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function normalizeAlternatives(value: unknown): ClickbaitAlternative[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { baslik: item, clickbait_skoru: 35, aciklama: 'Daha dengeli alternatif.' }
      }
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const baslik = String(obj.baslik || obj.title || obj.metin || '').trim()
      if (!baslik) return null
      return {
        baslik,
        clickbait_skoru: clampScore(obj.clickbait_skoru, 35),
        aciklama: String(obj.aciklama || obj.reason || ''),
      }
    })
    .filter((item): item is ClickbaitAlternative => Boolean(item))
}

function normalizeClickbait(value: Record<string, unknown>, title: string) {
  const score = Number(value.clickbait_skoru)
  if (!Number.isFinite(score)) return null
  return {
    clickbait_skoru: clampScore(score),
    seviye: String(value.seviye || '').trim() || (score >= 70 ? 'yüksek' : score >= 40 ? 'orta' : 'düşük'),
    sorunlar: textArray(value.sorunlar),
    guclu_yonler: textArray(value.guclu_yonler),
    alternatifler: normalizeAlternatives(value.alternatifler).slice(0, 5),
    genel_tavsiye: String(value.genel_tavsiye || ''),
    platform_normu: String(value.platform_normu || ''),
    analizlenen_baslik: title,
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Cok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const { title, platform, model } = await req.json()
    if (!title || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildClickbaitPrompt(title, platform || 'youtube'),
      model: model as AIModel,
      systemPrompt: CLICKBAIT_SYSTEM_PROMPT,
      maxTokens: 2000,
    })

    const parsed = extractJsonObject(result.content)
    const data = parsed ? normalizeClickbait(parsed, title) : null
    if (!data) return NextResponse.json({ error: 'Model geçerli bir clickbait analiz şeması döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ ...data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
