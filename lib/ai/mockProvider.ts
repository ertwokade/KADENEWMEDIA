import type { GenerateRequest, GenerateResult } from '@/types'

export function generateMockContent(request: GenerateRequest): GenerateResult {
  const prompt = request.prompt.trim()
  if (!prompt) throw new Error('İstek metni boş olamaz.')
  if (prompt.length > 24_000) throw new Error('İstek metni 24.000 karakter sınırını aşıyor.')

  return {
    content: `[MOCK] İstek güvenli biçimde işlendi (${prompt.length} karakter).`,
    model: request.model === 'auto' ? 'groq-llama-70b' : request.model,
    tokensUsed: 0,
    routingReason: 'Test ortamı mock sağlayıcısı; harici AI çağrısı yapılmadı.',
  }
}
