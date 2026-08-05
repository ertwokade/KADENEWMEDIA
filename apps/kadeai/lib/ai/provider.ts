import { GenerateRequest, GenerateResult } from '@/types'
import { ModelConfig, getModelConfig } from '@/lib/ai/models'
import { getVercelGatewayToken } from '@/lib/ai/gatewayAuth'
import { getAvailableModels, routeModelForTask } from '@/lib/ai/modelRouter'
import { getRequestProfileInstruction } from '@/lib/ai/profileContext'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { generateMockContent } from '@/lib/ai/mockProvider'

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim())
}

function fallbackModel(): GenerateRequest['model'] {
  return 'groq-llama-70b'
}

async function generateWithFallbackGroq(
  prompt: string,
  systemPrompt: string,
  maxTokens: number
): Promise<GenerateResult> {
  if (hasEnv('GROQ_API_KEY')) {
    return generateWithGroq(prompt, systemPrompt, maxTokens, fallbackModel(), 'llama-3.3-70b-versatile')
  }
  return generateWithVercelGateway(
    prompt,
    systemPrompt,
    maxTokens,
    'vercel-qwen-flash',
    'alibaba/qwen3.5-flash'
  )
}

async function parseChatCompletionResponse(
  response: Response,
  providerName: string
): Promise<{
  content: string
  tokensUsed?: number
}> {
  const rawBody = await response.text()
  let data: {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>
    usage?: { total_tokens?: number }
  } = {}
  try {
    data = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `${providerName} isteği başarısız: ${response.status}`)
  }

  const rawContent = data.choices?.[0]?.message?.content
  const content = Array.isArray(rawContent)
    ? rawContent.map((part) => part.text || '').join('')
    : rawContent || ''

  return {
    content,
    tokensUsed: data.usage?.total_tokens,
  }
}

async function generateWithOpenAICompatibleEndpoint({
  prompt,
  systemPrompt,
  maxTokens,
  requestedModel,
  providerName,
  apiKey,
  endpoint,
  model,
  extraHeaders,
  maxTokenField = 'max_tokens',
}: {
  prompt: string
  systemPrompt: string
  maxTokens: number
  requestedModel: GenerateRequest['model']
  providerName: string
  apiKey: string
  endpoint: string
  model: string
  extraHeaders?: Record<string, string>
  maxTokenField?: 'max_tokens' | 'max_completion_tokens'
}): Promise<GenerateResult> {
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      [maxTokenField]: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const data = await parseChatCompletionResponse(response, providerName)

  return {
    content: data.content,
    model: requestedModel,
    tokensUsed: data.tokensUsed,
  }
}

async function generateWithVercelGateway(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  gatewayModel = 'alibaba/qwen3.5-flash',
  gatewayToken?: string
): Promise<GenerateResult> {
  const token = gatewayToken?.trim() || await getVercelGatewayToken()
  if (!token) {
    throw new Error('Vercel AI Gateway kimliği bulunamadı. Dağıtım OIDC ayarını kontrol et.')
  }

  return generateWithOpenAICompatibleEndpoint({
    prompt,
    systemPrompt,
    maxTokens,
    requestedModel,
    providerName: 'Vercel AI Gateway',
    apiKey: token,
    endpoint: 'https://ai-gateway.vercel.sh/v1/chat/completions',
    model: gatewayModel,
  })
}

async function generateWithGroq(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  groqModel?: string
): Promise<GenerateResult> {
  if (!hasEnv('GROQ_API_KEY')) {
    throw new Error(
      'AI API anahtarı bulunamadı. Vercel env içine GROQ_API_KEY veya seçilen modelin API anahtarını ekle.'
    )
  }

  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 25_000,
    maxRetries: 1,
  })
  const fallback = 'llama-3.3-70b-versatile'
  const targetModel = groqModel || process.env.GROQ_MODEL || fallback

  const createCompletion = (modelName: string) => groq.chat.completions.create({
    model: modelName,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })

  let response: Awaited<ReturnType<typeof createCompletion>>
  let actualModel = requestedModel
  try {
    response = await createCompletion(targetModel)
  } catch (error) {
    if (targetModel === fallback) throw error
    response = await createCompletion(fallback)
    actualModel = fallbackModel()
  }

  return {
    content: response.choices[0]?.message?.content || '',
    model: actualModel,
    tokensUsed: response.usage?.total_tokens,
  }
}

async function generateWithOpenRouter(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  openRouterModel = 'openrouter/free'
): Promise<GenerateResult> {
  if (!hasEnv('OPENROUTER_API_KEY')) {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }

  try {
    return await generateWithOpenAICompatibleEndpoint({
      prompt,
      systemPrompt,
      maxTokens,
      requestedModel,
      providerName: 'OpenRouter',
      apiKey: process.env.OPENROUTER_API_KEY!,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: openRouterModel,
      extraHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://kadeai.vercel.app',
        'X-Title': 'KadeAI Studio',
      },
    })
  } catch (error) {
    if (openRouterModel === 'openrouter/free') {
      return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
    }
    throw error
  }
}

async function generateWithCerebrasModel(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  cerebrasModel: string
): Promise<GenerateResult> {
  return generateWithOpenAICompatibleEndpoint({
    prompt,
    systemPrompt,
    maxTokens,
    requestedModel,
    providerName: 'Cerebras',
    apiKey: process.env.CEREBRAS_API_KEY!,
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    model: cerebrasModel,
  })
}

async function generateWithCerebras(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  cerebrasModel = 'zai-glm-4.7'
): Promise<GenerateResult> {
  if (!hasEnv('CEREBRAS_API_KEY')) {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }

  try {
    return await generateWithCerebrasModel(prompt, systemPrompt, maxTokens, requestedModel, cerebrasModel)
  } catch (error) {
    if (cerebrasModel !== 'zai-glm-4.7') {
      return generateWithCerebrasModel(prompt, systemPrompt, maxTokens, 'cerebras-glm-4-7', 'zai-glm-4.7')
    }
    throw error
  }
}

async function generateWithGemini(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  model: GenerateRequest['model'],
  modelConfig: ModelConfig
): Promise<GenerateResult> {
  if (!hasEnv('GEMINI_API_KEY')) {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const geminiModel = geminiAI.getGenerativeModel({ model: modelConfig.geminiModel || 'gemini-2.5-flash' })
  const fullPrompt = `${systemPrompt}\n\n${prompt}`
  const result = await geminiModel.generateContent(fullPrompt)
  const content = result.response.text()
  return { content, model }
}

async function generateWithMistral(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  requestedModel: GenerateRequest['model'],
  mistralModel = 'open-mistral-nemo'
): Promise<GenerateResult> {
  if (!hasEnv('MISTRAL_API_KEY')) {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }

  try {
    return await generateWithOpenAICompatibleEndpoint({
      prompt,
      systemPrompt,
      maxTokens,
      requestedModel,
      providerName: 'Mistral',
      apiKey: process.env.MISTRAL_API_KEY!,
      endpoint: 'https://api.mistral.ai/v1/chat/completions',
      model: mistralModel,
    })
  } catch {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }
}

async function generateWithResolvedModel(req: GenerateRequest, gatewayToken?: string): Promise<GenerateResult> {
  const { prompt, model, systemPrompt, maxTokens = 1500 } = req
  const sysText = systemPrompt || 'Sen uzman bir sosyal medya içerik stratejistisin. Türkçe yanıt ver.'
  const modelConfig = getModelConfig(model)

  try {
    if (modelConfig.provider === 'vercel') {
      return generateWithVercelGateway(prompt, sysText, maxTokens, model, modelConfig.gatewayModel, gatewayToken)
    }

    if (modelConfig.provider === 'groq') {
      return generateWithGroq(prompt, sysText, maxTokens, model, modelConfig.groqModel)
    }

    if (modelConfig.provider === 'cerebras') {
      return generateWithCerebras(prompt, sysText, maxTokens, model, modelConfig.cerebrasModel)
    }

    if (modelConfig.provider === 'openrouter') {
      return generateWithOpenRouter(prompt, sysText, maxTokens, model, modelConfig.openRouterModel)
    }

    if (modelConfig.provider === 'google' && modelConfig.geminiModel) {
      return generateWithGemini(prompt, sysText, maxTokens, model, modelConfig)
    }

    if (modelConfig.provider === 'mistral') {
      return generateWithMistral(prompt, sysText, maxTokens, model, modelConfig.mistralModel)
    }

    if (model === 'claude') {
      if (!hasEnv('ANTHROPIC_API_KEY')) {
        return generateWithFallbackGroq(prompt, sysText, maxTokens)
      }

      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 25_000, maxRetries: 1 })
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        system: [
          {
            type: 'text',
            text: sysText,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: prompt }],
      })
      const content = response.content[0].type === 'text' ? response.content[0].text : ''
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
      return { content, model, tokensUsed }
    }

    if (model === 'gpt4o') {
      if (!hasEnv('OPENAI_API_KEY')) {
        return generateWithGroq(prompt, sysText, maxTokens, 'groq-gpt-oss-120b', 'openai/gpt-oss-120b')
      }

      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: sysText },
          { role: 'user', content: prompt },
        ],
      })
      const content = response.choices[0].message.content || ''
      return { content, model, tokensUsed: response.usage?.total_tokens }
    }

    throw new Error(`Bilinmeyen model: ${model}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    throw new Error(`${model} API hatası: ${message}`)
  }
}

export async function generateContent(req: GenerateRequest, request?: Request): Promise<GenerateResult> {
  await assertAuthenticatedUser()
  const gatewayToken = await getVercelGatewayToken(request)
  const prompt = typeof req.prompt === 'string' ? req.prompt.trim() : ''
  if (!prompt) throw new Error('İstek metni boş olamaz.')
  if (prompt.length > 24_000) throw new Error('İstek metni 24.000 karakter sınırını aşıyor.')
  if ((req.systemPrompt || '').length > 32_000) throw new Error('Sistem bağlamı izin verilen sınırı aşıyor.')
  const boundedRequest: GenerateRequest = {
    ...req,
    prompt,
    maxTokens: Math.min(4_000, Math.max(1, Number(req.maxTokens) || 1_500)),
  }
  if (process.env.AI_PROVIDER_MODE === 'mock') {
    if (process.env.NODE_ENV === 'production') throw new Error('Mock AI sağlayıcısı production ortamında kullanılamaz.')
    return generateMockContent(boundedRequest)
  }
  const profileInstruction = await getRequestProfileInstruction()
  const enrichedRequest: GenerateRequest = profileInstruction
    ? { ...boundedRequest, systemPrompt: `${boundedRequest.systemPrompt || 'Kullanıcıya doğru ve yararlı bir yanıt ver.'}${profileInstruction}` }
    : boundedRequest

  if (enrichedRequest.model !== 'auto') return generateWithResolvedModel(enrichedRequest, gatewayToken)

  const availableModels = getAvailableModels()
  if (gatewayToken && !availableModels.includes('vercel-qwen-flash')) {
    availableModels.push('vercel-qwen-flash')
  }

  const routed = routeModelForTask({
    prompt: boundedRequest.prompt,
    systemPrompt: boundedRequest.systemPrompt,
    maxTokens: boundedRequest.maxTokens,
  }, availableModels)

  const available = new Set(availableModels)
  const fallbackOrder: GenerateRequest['model'][] = [routed.model, ...routed.alternatives]
  const candidates = [...new Set(fallbackOrder)].filter(
    (model) => model !== 'auto' && available.has(model)
  )

  // Router her zaman bir model döndürür. Hiç anahtar yoksa ilk isteğin
  // kullanıcıya açıklayıcı yapılandırma hatasını vermesine izin ver.
  if (candidates.length === 0) candidates.push(routed.model)

  let lastError: unknown
  for (const [index, model] of candidates.entries()) {
    try {
      const result = await generateWithResolvedModel({ ...enrichedRequest, model }, gatewayToken)
      const routingReason = index === 0
        ? routed.reason
        : `${routed.reason}; ilk sağlayıcı yanıt vermediği için ${getModelConfig(model).shortLabel} yedeği kullanıldı`
      return { ...result, routingReason }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : 'Bilinmeyen sağlayıcı hatası'
      console.error('[kadeai/ai] sağlayıcı isteği başarısız:', {
        model,
        gatewayIdentity: Boolean(gatewayToken),
        message: message
          .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
          .replace(/[A-Za-z0-9_-]{80,}/g, '[redacted]')
          .slice(0, 500),
      })
    }
  }

  if (lastError instanceof Error && lastError.message === 'Oturum gerekli.') throw lastError
  throw new Error('AI sağlayıcısı isteği tamamlanamadı.')
}
