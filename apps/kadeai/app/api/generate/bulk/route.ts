import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { BULK_SYSTEM_PROMPT, buildBulkPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'

function normalizeBulkOutput(data: Record<string, unknown>, platforms: string[]) {
  if (Array.isArray(data.basliklar) || data.raw) return data

  const platformItems = platforms.flatMap((platform) => {
    const items = data[platform]
    if (!Array.isArray(items)) return []
    return items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => ({ platform, item }))
  })

  if (platformItems.length === 0) return data

  const uniqueStrings = (values: unknown[]) => [...new Set(values.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())))]
  const captions = Object.fromEntries(platforms.map((platform) => [
    platform,
    uniqueStrings(platformItems.filter((entry) => entry.platform === platform).map((entry) => entry.item.caption)),
  ]))
  const hashtagSets = platformItems
    .map(({ item }) => item.hashtag_setleri)
    .filter((set): set is string[] => Array.isArray(set) && set.every((tag) => typeof tag === 'string'))

  return {
    basliklar: uniqueStrings(platformItems.map(({ item }) => item.baslik)),
    hooklar: uniqueStrings(platformItems.map(({ item }) => item.hook)),
    captions,
    hashtag_setleri: hashtagSets,
    kisa_fikirler: uniqueStrings(platformItems.map(({ item }) => item.kisa_fikir)),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, niche, platforms, count, model } = await req.json()
    if (!topic || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildBulkPrompt(topic, niche || '', platforms || ['instagram','youtube','tiktok'], count || 5), model: model as AIModel, systemPrompt: BULK_SYSTEM_PROMPT, maxTokens: 4000 })
    const selectedPlatforms = Array.isArray(platforms) && platforms.length > 0 ? platforms : ['instagram', 'youtube', 'tiktok']
    const data = normalizeBulkOutput(parseStructuredOutput(result.content), selectedPlatforms)
    return NextResponse.json({ data, model: result.model, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
