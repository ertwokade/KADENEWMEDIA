import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildViralScorePrompt } from '@/lib/ai/prompts'
import { clampScore, extractJsonObject } from '@/lib/ai/json'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { ViralScoreRequest } from '@/types'

interface ViralCriterion {
  puan: number
  yorum: string
}

interface ViralAnalysis {
  toplam_puan: number
  kriterler: Record<string, ViralCriterion>
  guclu_yonler: string[]
  iyilestirme_onerileri: string[]
  revize_edilmis_baslik: string
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function normalizeAnalysis(value: Record<string, unknown>, title: string): ViralAnalysis | null {
  const total = Number(value.toplam_puan)
  if (!Number.isFinite(total)) return null
  const criteria = value.kriterler && typeof value.kriterler === 'object'
    ? value.kriterler as Record<string, Record<string, unknown>>
    : {}

  const requiredCriteria = ['baslik_guc', 'platform_uyum', 'seo_guc', 'merak_faktoru', 'cta_guc']
  const normalizedCriteria = Object.fromEntries(
    requiredCriteria.map((key) => {
      const item = criteria[key] || {}
      const score = Number(item.puan)
      return [key, {
        puan: Number.isFinite(score) ? clampScore(score) : clampScore(total),
        yorum: String(item.yorum || '').trim(),
      }]
    })
  )

  return {
    toplam_puan: clampScore(total),
    kriterler: normalizedCriteria,
    guclu_yonler: textArray(value.guclu_yonler),
    iyilestirme_onerileri: textArray(value.iyilestirme_onerileri),
    revize_edilmis_baslik: String(value.revize_edilmis_baslik || title),
  }
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: ViralScoreRequest = await req.json()
    const { title, platform, model, description, hashtags } = body

    if (!title || !platform || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildViralScorePrompt(title, platform, description, hashtags),
      model,
      systemPrompt: SYSTEM_PROMPTS.viralScoreAnalyst,
      maxTokens: 2500,
    })

    const parsed = extractJsonObject(result.content)
    const analysis = parsed ? normalizeAnalysis(parsed, title) : null
    if (!analysis) {
      return NextResponse.json({ error: 'Model geçerli bir viral skor şeması döndürmedi. Lütfen yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ analysis, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
