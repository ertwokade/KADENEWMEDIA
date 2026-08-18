import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { extractJsonArray } from '@/lib/ai/json'
import { requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { languageByCode } from '@/lib/subtitles/languages'
import type { AIModel } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Model bir seferde ne kadar kutu cevirsin: fazlasi cikti sinirina takilir,
// azi gereksiz cok istek uretir.
const BATCH_SIZE = 35

interface TranslateBody {
  cues?: Array<{ index: number; text: string }>
  targetLang?: string
  sourceLang?: string
  model?: AIModel
  /** 'dubbing' modunda ceviri, seslendirme suresine sigacak sekilde kisaltilir. */
  mode?: 'subtitle' | 'dubbing'
}

const SYSTEM_PROMPT = `Sen profesyonel bir altyazı çevirmenisin.
Kurallar:
- Her kutuyu AYRI AYRI çevir, kutu sayısını ve sırasını ASLA değiştirme.
- Konuşma dilini koru; birebir sözlük çevirisi yapma, doğal karşılığını yaz.
- Özel isimleri, marka ve ürün adlarını çevirme.
- Küfür ve argoyu yumuşatma, aynı tonda karşıla.
- Yalnızca JSON dizisi döndür, açıklama yazma.`

function buildPrompt(
  cues: Array<{ index: number; text: string }>,
  sourceLabel: string,
  targetLabel: string,
  mode: 'subtitle' | 'dubbing'
) {
  const lengthRule =
    mode === 'dubbing'
      ? 'Bu metin SESLENDİRİLECEK: her kutunun çevirisi, kaynak metinle yaklaşık aynı sürede okunabilecek uzunlukta olsun (gerekirse sadeleştir).'
      : 'Her kutu en fazla 84 karakter olsun; uzarsa anlamı koruyarak sadeleştir.'

  return `${sourceLabel} dilindeki altyazı kutularını ${targetLabel} diline çevir.
${lengthRule}

Girdi kutuları (JSON):
${JSON.stringify(cues.map((c) => ({ i: c.index, t: c.text })))}

Çıktı biçimi — SADECE bu JSON dizisi:
[{"i": <kutu numarası>, "t": "<çeviri>"}]`
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const limit = rateLimit(getRateLimitKey(req, 'subtitle-translate'), 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  let body: TranslateBody
  try {
    body = (await req.json()) as TranslateBody
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const cues = (body.cues ?? [])
    .filter((c) => typeof c?.index === 'number' && typeof c?.text === 'string' && c.text.trim())
    .map((c) => ({ index: c.index, text: c.text.trim().slice(0, 600) }))

  if (!cues.length) return NextResponse.json({ error: 'Çevrilecek altyazı yok.' }, { status: 400 })
  if (cues.length > 900) return NextResponse.json({ error: 'Altyazı çok uzun (en fazla 900 kutu).' }, { status: 413 })

  const target = languageByCode(String(body.targetLang ?? ''))
  if (!target) return NextResponse.json({ error: 'Desteklenmeyen hedef dil.' }, { status: 400 })
  const source = languageByCode(String(body.sourceLang ?? 'tr'))
  const mode = body.mode === 'dubbing' ? 'dubbing' : 'subtitle'
  const model: AIModel = body.model ?? 'auto'

  try {
    const translated = new Map<number, string>()
    let usedModel: AIModel = model
    let tokens = 0

    for (let i = 0; i < cues.length; i += BATCH_SIZE) {
      const batch = cues.slice(i, i + BATCH_SIZE)
      const result = await generateContent(
        {
          prompt: buildPrompt(batch, source?.label ?? 'Türkçe', target.label, mode),
          model,
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 4000,
        },
        req
      )
      usedModel = result.model
      tokens += result.tokensUsed ?? 0

      const parsed = extractJsonArray<Array<{ i?: number; t?: string }>>(result.content)
      if (!parsed) throw new Error('Çeviri yanıtı çözümlenemedi.')
      for (const row of parsed) {
        if (typeof row?.i === 'number' && typeof row?.t === 'string') translated.set(row.i, row.t.trim())
      }
    }

    // Model bazi kutulari atlarsa kaynak metin korunur; kutu sayisi hic degismez.
    const ceviriler = cues.map((c) => ({
      index: c.index,
      text: translated.get(c.index) || c.text,
      atlandi: !translated.has(c.index),
    }))

    return NextResponse.json({
      ceviriler,
      hedefDil: target.code,
      atlanan: ceviriler.filter((c) => c.atlandi).length,
      model: usedModel,
      tokensUsed: tokens,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Çeviri tamamlanamadı.' }, { status: 500 })
  }
}
