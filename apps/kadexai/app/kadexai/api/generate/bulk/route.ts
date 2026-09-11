import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { BULK_SYSTEM_PROMPT, buildBulkPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { requireToolFeature } from '@/lib/payments/featureGuard'
import { SELECTABLE_MODELS } from '@/lib/ai/models'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { parseHashtagGroups } from '@/lib/ai/hashtags'

function normalizeBulkOutput(data: Record<string, unknown>, platforms: string[]) {
  if (Array.isArray(data.basliklar) || data.raw) return data

  const platformItems = platforms.flatMap((platform) => {
    const items = data[platform] ?? (platform === 'x' ? data.twitter : undefined)
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
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim().slice(0, 4_000))
    : []
  const unique = (values: string[]) => [...new Set(values)].slice(0, limit)
  const captions = Object.fromEntries(platforms.map((platform) => [
    platform,
    unique(outputs.flatMap((output) => {
      const map = output.captions
      return map && typeof map === 'object' && !Array.isArray(map)
        ? strings((map as Record<string, unknown>)[platform] ?? (platform === 'x' ? (map as Record<string, unknown>).twitter : undefined))
        : []
    })),
  ]))
  const hashtagSets = outputs
    .flatMap((output) => Array.isArray(output.hashtag_setleri) ? output.hashtag_setleri : [])
    .filter((set): set is string[] => Array.isArray(set) && set.every((tag) => typeof tag === 'string'))
    .map(set => parseHashtagGroups(JSON.stringify(set), 30).niche)
    .filter(set => set.length > 0)
    .filter((set, index, all) => all.findIndex((candidate) => candidate.join('\u0000') === set.join('\u0000')) === index)
    .slice(0, limit)

  return {
    basliklar: unique(outputs.flatMap((output) => strings(output.basliklar))),
    hooklar: unique(outputs.flatMap((output) => strings(output.hooklar))),
    captions,
    hashtag_setleri: hashtagSets,
    kisa_fikirler: unique(outputs.flatMap((output) => strings(output.kisa_fikirler))),
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  // Paket kısıtlaması sunucuda uygulanır; menüdeki kilit yalnızca işarettir.
  const paket = await requireToolFeature('bulk')
  if (paket) return paket
  if (!rateLimit(getRateLimitKey(req)).allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Geçerli üretim bilgileri gerekli.' }, { status: 400 })
    const { topic, niche = '', platforms, count, model } = body
    if (typeof topic !== 'string' || !topic.trim() || topic.length > 500 || typeof niche !== 'string' || niche.length > 200
      || typeof model !== 'string' || !SELECTABLE_MODELS.includes(model as AIModel)
      || !Number.isInteger(count) || count < 3 || count > 50) return NextResponse.json({ error: 'Konu, model ve 3–50 arasında tam sayı içerik adedi gerekli.' }, { status: 400 })
    const allowedPlatforms = new Set(['youtube', 'instagram', 'tiktok', 'linkedin', 'x', 'twitter'])
    if (!Array.isArray(platforms) || !platforms.length || platforms.length > 5 || platforms.some(platform => typeof platform !== 'string' || !allowedPlatforms.has(platform))) {
      return NextResponse.json({ error: 'En az bir geçerli platform seç.' }, { status: 400 })
    }
    const selectedPlatforms = Array.isArray(platforms)
      ? [...new Set(platforms.map((platform: string) => platform === 'twitter' ? 'x' : platform))]
      : []
    const requestedCount = count
    const batchSizes = Array.from({ length: Math.ceil(requestedCount / 10) }, (_, index) => Math.min(10, requestedCount - index * 10))
    const settled = await Promise.allSettled(batchSizes.map((batchSize, index) => generateContent({
      prompt: buildBulkPrompt(topic.trim().slice(0, 500), typeof niche === 'string' ? niche.slice(0, 200) : '', selectedPlatforms, batchSize, `${index + 1}/${batchSizes.length}`),
      model: model as AIModel,
      systemPrompt: BULK_SYSTEM_PROMPT,
      maxTokens: 4000,
      toolId: 'bulk',
    }, req)))
    const results = settled.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
    const outputs = results.map(result => {
      try { return mergeBulkOutputs([normalizeBulkOutput(parseStructuredOutput(result.content), selectedPlatforms)], selectedPlatforms, 10) }
      catch { return null }
    }).filter((output): output is NonNullable<typeof output> => !!output && (output.basliklar.length > 0 || output.hooklar.length > 0 || Object.values(output.captions).some(items => items.length > 0)))
    if (!outputs.length) return NextResponse.json({ error: 'Hiçbir üretim parçasından kullanılabilir içerik alınamadı. Yeniden dene.' }, { status: 502 })
    const data = mergeBulkOutputs(outputs, selectedPlatforms, requestedCount)
    const coverage = { requested: requestedCount, titles: data.basliklar.length, hooks: data.hooklar.length, captions: Object.fromEntries(selectedPlatforms.map(platform => [platform, data.captions[platform].length])) }
    const partial = outputs.length < batchSizes.length || coverage.titles < requestedCount || coverage.hooks < requestedCount || Object.values(coverage.captions).some(count => count < requestedCount)
    return NextResponse.json({
      data,
      partial,
      coverage,
      batches: { total: batchSizes.length, usable: outputs.length, failed: batchSizes.length - outputs.length },
      model: results[0]?.model,
      routingReason: results.map((result) => result.routingReason).filter(Boolean).join(' · '),
      tokensUsed: results.reduce((sum, result) => sum + (result.tokensUsed || 0), 0),
    })
  } catch { return NextResponse.json({ error: 'Toplu üretim tamamlanamadı. Yeniden dene.' }, { status: 500 }) }
}
