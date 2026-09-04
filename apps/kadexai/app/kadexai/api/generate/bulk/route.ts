import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { BULK_SYSTEM_PROMPT, buildBulkPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { requireToolFeature } from '@/lib/payments/featureGuard'

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

function mergeBulkOutputs(outputs: Record<string, unknown>[], platforms: string[], limit: number) {
  const strings = (value: unknown) => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : []
  const unique = (values: string[]) => [...new Set(values)].slice(0, limit)
  const captions = Object.fromEntries(platforms.map((platform) => [
    platform,
    unique(outputs.flatMap((output) => {
      const map = output.captions
      return map && typeof map === 'object' && !Array.isArray(map)
        ? strings((map as Record<string, unknown>)[platform])
        : []
    })),
  ]))
  const hashtagSets = outputs
    .flatMap((output) => Array.isArray(output.hashtag_setleri) ? output.hashtag_setleri : [])
    .filter((set): set is string[] => Array.isArray(set) && set.every((tag) => typeof tag === 'string'))
    .filter((set, index, all) => all.findIndex((candidate) => candidate.join('\u0000') === set.join('\u0000')) === index)
    .slice(0, limit)
  const raw = outputs.map((output) => typeof output.raw === 'string' ? output.raw : '').filter(Boolean).join('\n\n')

  return {
    basliklar: unique(outputs.flatMap((output) => strings(output.basliklar))),
    hooklar: unique(outputs.flatMap((output) => strings(output.hooklar))),
    captions,
    hashtag_setleri: hashtagSets,
    kisa_fikirler: unique(outputs.flatMap((output) => strings(output.kisa_fikirler))),
    ...(raw ? { raw } : {}),
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  // Paket kısıtlaması sunucuda uygulanır; menüdeki kilit yalnızca işarettir.
  const paket = await requireToolFeature('bulk')
  if (paket) return paket

  try {
    const { topic, niche, platforms, count, model } = await req.json()
    if (typeof topic !== 'string' || !topic.trim() || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const allowedPlatforms = new Set(['youtube', 'instagram', 'tiktok', 'linkedin', 'twitter'])
    const selectedPlatforms = Array.isArray(platforms)
      ? platforms.filter((platform): platform is string => typeof platform === 'string' && allowedPlatforms.has(platform))
      : []
    if (selectedPlatforms.length === 0) selectedPlatforms.push('instagram', 'youtube', 'tiktok')
    const requestedCount = Math.min(50, Math.max(3, Number.isFinite(Number(count)) ? Math.round(Number(count)) : 5))
    const batchSizes = Array.from({ length: Math.ceil(requestedCount / 10) }, (_, index) => Math.min(10, requestedCount - index * 10))
    const results = await Promise.all(batchSizes.map((batchSize, index) => generateContent({
      prompt: buildBulkPrompt(topic.trim().slice(0, 500), typeof niche === 'string' ? niche.slice(0, 200) : '', selectedPlatforms, batchSize, `${index + 1}/${batchSizes.length}`),
      model: model as AIModel,
      systemPrompt: BULK_SYSTEM_PROMPT,
      maxTokens: 4000,
      toolId: 'bulk',
    }, req)))
    const outputs = results.map((result) => normalizeBulkOutput(parseStructuredOutput(result.content), selectedPlatforms))
    const data = mergeBulkOutputs(outputs, selectedPlatforms, requestedCount)
    return NextResponse.json({
      data,
      model: results[0]?.model,
      routingReason: results.map((result) => result.routingReason).filter(Boolean).join(' · '),
      tokensUsed: results.reduce((sum, result) => sum + (result.tokensUsed || 0), 0),
    })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
