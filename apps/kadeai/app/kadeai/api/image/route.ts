import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitKey, rateLimit } from '@/lib/rateLimit'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { getRequestProfileInstruction } from '@/lib/ai/profileContext'
import { requireApiUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

function imageSize(width: number, height: number) {
  const ratio = width / height
  return ratio > 1.15 ? '1536x1024' : ratio < 0.87 ? '1024x1536' : '1024x1024'
}

async function generateWithOpenAI(prompt: string, width: number, height: number) {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    signal: AbortSignal.timeout(45000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2', prompt, n: 1, size: imageSize(width, height) }),
  })
  const data = await response.json()
  if (!response.ok) return { error: 'OpenAI görsel isteği tamamlanamadı.' }
  const b64 = data.data?.[0]?.b64_json
  return b64 ? { image: `data:image/png;base64,${b64}` } : { error: 'Görsel dönmedi.' }
}

async function generateWithGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) return null

  const model = process.env.OPERATIONS_IMAGE_MODEL || 'gemini-2.5-flash-image'
  const endpoint = model.startsWith('imagen') ? 'predict' : 'generateContent'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${key}`
  const body = model.startsWith('imagen')
    ? { instances: [{ prompt }], parameters: { sampleCount: 1 } }
    : { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } }

  const response = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(45000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) return { error: 'Gemini görsel isteği tamamlanamadı.' }

  if (model.startsWith('imagen')) {
    const b64 = data.predictions?.[0]?.bytesBase64Encoded
    return b64 ? { image: `data:image/png;base64,${b64}` } : { error: 'Görsel dönmedi.' }
  }

  const inline = data.candidates?.[0]?.content?.parts?.find((part: { inlineData?: { mimeType?: string; data?: string } }) => part.inlineData)?.inlineData
  return inline?.data
    ? { image: `data:${inline.mimeType || 'image/png'};base64,${inline.data}` }
    : { error: 'Görsel dönmedi.' }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  if (!(await hasAuthenticatedUser())) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })
  try {
    const body = await req.json()
    const width = Math.min(1600, Math.max(512, Number(body.width) || 1280))
    const height = Math.min(1600, Math.max(512, Number(body.height) || 720))
    const ratio = width / height > 1.15 ? '16:9 yatay' : width / height < 0.87 ? '9:16 dikey' : '1:1 kare'
    const requestedPrompt = String(body.prompt || '').trim().slice(0, 4000)
    if (!requestedPrompt) return NextResponse.json({ error: 'Prompt boş.' }, { status: 400 })
    const profileContext = await getRequestProfileInstruction()
    const prompt = `${requestedPrompt}\nİstenen kompozisyon oranı: ${ratio}.${profileContext}`

    const result = process.env.OPERATIONS_IMAGE_PROVIDER === 'openai'
      ? await generateWithOpenAI(prompt, width, height)
      : await generateWithGemini(prompt) || await generateWithOpenAI(prompt, width, height)

    if (!result || 'error' in result) {
      return NextResponse.json({
        error: result && 'error' in result ? result.error : 'Görsel sağlayıcısı yapılandırılmamış. Ayarlar bölümünde Gemini veya OpenAI durumunu kontrol et.',
      }, { status: 503 })
    }
    return NextResponse.json({ ...result, provider: process.env.OPERATIONS_IMAGE_PROVIDER || 'gemini' })
  } catch {
    return NextResponse.json({ error: 'Görsel isteği tamamlanamadı.' }, { status: 500 })
  }
}
