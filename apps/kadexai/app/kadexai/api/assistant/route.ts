import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SELECTABLE_MODELS } from '@/lib/ai/models'
import { AIModel } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim())
}

function selectOperationsModel(): AIModel | null {
  if (hasEnv('GEMINI_API_KEY')) return 'gemini-flash'
  if (hasEnv('GROQ_API_KEY')) return 'groq-llama-70b'
  if (hasEnv('OPENROUTER_API_KEY')) return 'openrouter-free'
  if (hasEnv('OPENAI_API_KEY')) return 'gpt4o'
  return null
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const body = await req.json()
    const question = String(body.question || '').slice(0, 4000)
    const context = String(body.context || '').slice(0, 12000)
    if (!question) return NextResponse.json({ error: 'Soru boş.' }, { status: 400 })

    const requestedModel = String(body.model || '') as AIModel
    const model = SELECTABLE_MODELS.includes(requestedModel)
      ? requestedModel
      : selectOperationsModel()
    if (!model) {
      return NextResponse.json({ error: 'Operasyon asistanı için GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY veya OPENAI_API_KEY gerekli.' })
    }

    const result = await generateContent({
      model,
      maxTokens: 1200,
      systemPrompt:
        'Sen KADE ekibinin Türkçe konuşan yapım ve operasyon asistanısın. ' +
        'Aşağıdaki ekip verisine dayanarak kısa, net ve uygulanabilir cevap ver. ' +
        'Veri yoksa genel öneride bulun.\n\n--- EKIP VERISI ---\n' + context,
      prompt: question,
    })

    return NextResponse.json({ answer: result.content, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
