import { GenerateRequest, GenerateResult } from '@/types'
import { ModelConfig, getModelConfig } from '@/lib/ai/models'
import { getVercelGatewayToken } from '@/lib/ai/gatewayAuth'
import { getAvailableModels, routeModelForTask } from '@/lib/ai/modelRouter'
import { getRequestProfileInstruction } from '@/lib/ai/profileContext'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { generateMockContent } from '@/lib/ai/mockProvider'
import { getActiveEntitlement } from '@/lib/payments/access'
import { getUserProviderKey, type UserKeyProvider } from '@/lib/ai/userProviderKeys'
import { recordAiUsage, getUserUsageSummary } from '@/lib/usage/ledger'
import { notifyOperation } from '@/lib/notifications/operationFeed'
import { isTokenQuotaEnforced, FREE_TIER, type LimitTier } from '@/lib/payments/limits'

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
  inputTokens?: number
  outputTokens?: number
}> {
  const rawBody = await response.text()
  let data: {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>
    usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
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
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
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
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
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
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
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
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://kadexai.vercel.app',
        'X-Title': 'KadexAI Studio',
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
  modelConfig: ModelConfig,
  apiKeyOverride?: string,
): Promise<GenerateResult> {
  const apiKey = apiKeyOverride?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return generateWithFallbackGroq(prompt, systemPrompt, maxTokens)
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const geminiAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = geminiAI.getGenerativeModel({ model: modelConfig.geminiModel || 'gemini-2.5-flash' })
  const fullPrompt = `${systemPrompt}\n\n${prompt}`
  const result = await geminiModel.generateContent(fullPrompt)
  const content = result.response.text()
  const usage = result.response.usageMetadata
  return {
    content,
    model,
    tokensUsed: usage?.totalTokenCount,
    inputTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
  }
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

interface ByokCredential {
  provider: UserKeyProvider
  apiKey: string
}

async function generateWithResolvedModel(
  req: GenerateRequest,
  gatewayToken?: string,
  byok?: ByokCredential,
): Promise<GenerateResult> {
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
      return generateWithGemini(prompt, sysText, maxTokens, model, modelConfig, byok?.provider === 'google' ? byok.apiKey : undefined)
    }

    if (modelConfig.provider === 'mistral') {
      return generateWithMistral(prompt, sysText, maxTokens, model, modelConfig.mistralModel)
    }

    if (model === 'claude') {
      const anthropicKey = byok?.provider === 'anthropic' ? byok.apiKey : process.env.ANTHROPIC_API_KEY?.trim()
      if (!anthropicKey) {
        return generateWithFallbackGroq(prompt, sysText, maxTokens)
      }

      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({ apiKey: anthropicKey, timeout: 25_000, maxRetries: 1 })
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
      return {
        content,
        model,
        tokensUsed,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    }

    if (model === 'gpt4o') {
      const openaiKey = byok?.provider === 'openai' ? byok.apiKey : process.env.OPENAI_API_KEY?.trim()
      if (!openaiKey) {
        return generateWithGroq(prompt, sysText, maxTokens, 'groq-gpt-oss-120b', 'openai/gpt-oss-120b')
      }

      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: openaiKey, timeout: 25_000, maxRetries: 1 })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: sysText },
          { role: 'user', content: prompt },
        ],
      })
      const content = response.choices[0].message.content || ''
      return {
        content,
        model,
        tokensUsed: response.usage?.total_tokens,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      }
    }

    throw new Error(`Bilinmeyen model: ${model}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    throw new Error(`${model} API hatası: ${message}`)
  }
}

function byokProviderForModel(model: GenerateRequest['model']): UserKeyProvider | null {
  if (model === 'claude') return 'anthropic'
  if (model === 'gpt4o') return 'openai'
  if (getModelConfig(model).provider === 'google') return 'google'
  return null
}

async function generateWithByok(req: GenerateRequest, userId: string): Promise<GenerateResult> {
  let targetModel = req.model
  let provider = targetModel === 'auto' ? null : byokProviderForModel(targetModel)
  let apiKey: string | null = null

  if (provider) apiKey = await getUserProviderKey(userId, provider)

  if (!provider || !apiKey) {
    for (const candidate of [
      { provider: 'openai' as const, model: 'gpt4o' as const },
      { provider: 'anthropic' as const, model: 'claude' as const },
      { provider: 'google' as const, model: 'gemini-flash' as const },
    ]) {
      const candidateKey = await getUserProviderKey(userId, candidate.provider)
      if (candidateKey) {
        provider = candidate.provider
        targetModel = candidate.model
        apiKey = candidateKey
        break
      }
    }
  }

  if (!provider || !apiKey) {
    throw new Error('Kendi Anahtarın paketi için önce OpenAI, Anthropic veya Gemini API anahtarı eklemelisin.')
  }

  const result = await generateWithResolvedModel(
    { ...req, model: targetModel },
    undefined,
    { provider, apiKey },
  )
  return {
    ...result,
    byok: true,
    routingReason: `${provider} BYOK anahtarı kullanıldı; KadexAI sağlayıcı anahtarı kullanılmadı`,
  }
}

/**
 * SAĞLAYICI SAĞLIK HAFIZASI
 * -----------------------------------------------------------------------------
 * `auto` yönlendirmesi aday modelleri sırayla dener ve her deneme 25 sn'lik
 * sağlayıcı timeout'una kadar bekleyebilir. Canlıda ölçüldü: `auto` 76 saniye,
 * açıkça seçilmiş model 4 saniye sürüyordu — aradaki fark, yanıt vermeyen bir
 * sağlayıcının her istekte yeniden denenmesiydi. "Otomatik" arayüzün
 * varsayılanı olduğu için bu, kullanıcıların ÇOĞUNLUKLA gördüğü yoldu.
 *
 * Başarısız olan model kısa süre için devre dışı bırakılır; başarı kaydı siler.
 * Bellek örnek başınadır (serverless), kalıcı olması da gerekmez: amaç aynı
 * örnek üzerinden gelen sonraki isteklerin aynı duvara toslamaması.
 */
const PROVIDER_COOLDOWN_MS = 5 * 60_000
const recentProviderFailures = new Map<string, number>()

/**
 * Bir adaya ayrılan üst süre.
 *
 * Yukarıdaki hafıza tek başına yetmedi: trafik düşük olduğu için neredeyse her
 * istek soğuk başlıyor ve bellek hep boş geliyor. Ölçüm: yanıt vermeyen ilk
 * aday yedeğe düşmeden önce ~125 saniye harcıyordu, çünkü sağlayıcı zinciri
 * iç içe 25 sn'lik timeout'lar barındırıyor.
 *
 * Bu sınır soğuk başlangıçtan bağımsız çalışır: kötü aday sabit bir bedelle
 * elenir, sıradaki aday denenir. Gemini'nin sağlıklı yanıt süresi ölçümde
 * 4 saniyeydi, 15 saniye rahat bir tavan.
 */
const CANDIDATE_TIMEOUT_MS = 15_000

/**
 * `promise`i süreyle sınırlar. Zaman aşımında altta koşan istek iptal
 * EDİLMEZ — sonucu artık beklenmez. Amaç kullanıcıyı bekletmemek.
 */
async function withCandidateTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Sağlayıcı ${ms / 1000} sn içinde yanıt vermedi.`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function isProviderCoolingDown(model: string) {
  const failedAt = recentProviderFailures.get(model)
  if (!failedAt) return false
  if (Date.now() - failedAt > PROVIDER_COOLDOWN_MS) {
    recentProviderFailures.delete(model)
    return false
  }
  return true
}

function markProviderFailed(model: string) {
  recentProviderFailures.set(model, Date.now())
}

function markProviderHealthy(model: string) {
  recentProviderFailures.delete(model)
}

/**
 * Açık API anahtarı olan sağlayıcılar öne alınır.
 *
 * Vercel AI Gateway kimliği OIDC ile çözülür ve "yapılandırılmış" görünür;
 * gerçekte yanıt vermediğinde ise auto sırasının BAŞINDA durduğu için her
 * isteğe 25 saniye ekliyordu. Anahtarı elle girilmiş bir sağlayıcı varsa
 * ona öncelik vermek daha güvenilir bir varsayılan.
 */
function preferExplicitlyKeyedProviders(models: GenerateRequest['model'][]): GenerateRequest['model'][] {
  const score = (model: GenerateRequest['model']) => {
    const provider = getModelConfig(model).provider
    if (provider === 'vercel') return 1
    return 0
  }
  return [...models].sort((a, b) => score(a) - score(b))
}


/**
 * İstek yolundan araç adını çıkarır: `/kadexai/api/generate/title` → `title`.
 * Kullanım defterine hangi aracın harcadığını yazmak için; rotalara dokunmadan.
 */
function toolNameFromRequest(request?: Request): string {
  if (!request) return 'unknown'
  try {
    const segments = new URL(request.url).pathname.split('/').filter(Boolean)
    const generateIndex = segments.indexOf('generate')
    if (generateIndex >= 0 && segments[generateIndex + 1]) return segments.slice(generateIndex + 1).join('/')
    const apiIndex = segments.indexOf('api')
    if (apiIndex >= 0 && segments[apiIndex + 1]) return segments.slice(apiIndex + 1).join('/')
    return segments.at(-1) || 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * AI üretiminin tek giriş kapısı.
 *
 * Kota kontrolü ve kullanım defteri BURADA yapılır; her generate rotasında
 * ayrı ayrı değil. Böylece yeni bir rota eklendiğinde muhasebe otomatik gelir
 * ve tarayıcının bildirdiği token sayısına hiçbir yerde güvenilmez.
 */
export async function generateContent(req: GenerateRequest, request?: Request): Promise<GenerateResult> {
  const user = await assertAuthenticatedUser()
  const entitlement = user ? await getActiveEntitlement() : null
  const tier: LimitTier = (entitlement?.tier as LimitTier) ?? FREE_TIER

  if (user && isTokenQuotaEnforced()) {
    const summary = await getUserUsageSummary(user.id, tier)
    // summary === null → defter okunamadı; kotayı zorlamadan devam et (fail-open).
    if (summary && summary.remaining !== null && summary.remaining <= 0) {
      throw new Error('Aylık AI token kotan doldu. Paketini yükseltebilir veya kendi API anahtarını bağlayabilirsin.')
    }
  }

  const result = await runGeneration(req, request, user, entitlement)

  if (user) {
    const config = getModelConfig(result.model)
    const tool = toolNameFromRequest(request)
    void notifyOperation({
      kind: 'tool_used',
      title: tool,
      detail: `${result.model}${result.tokensUsed ? ` · ${result.tokensUsed} token` : ''}`,
      userId: user.id,
    })
    void recordAiUsage({
      userId: user.id,
      tool,
      model: result.model,
      provider: config.provider,
      tier,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.tokensUsed,
      byok: result.byok,
    })
  }

  return result
}

async function runGeneration(
  req: GenerateRequest,
  request: Request | undefined,
  user: Awaited<ReturnType<typeof assertAuthenticatedUser>>,
  entitlement: Awaited<ReturnType<typeof getActiveEntitlement>>,
): Promise<GenerateResult> {
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

  if (user && entitlement?.api_included === false) {
    return generateWithByok(enrichedRequest, user.id)
  }

  if (enrichedRequest.model !== 'auto') return generateWithResolvedModel(enrichedRequest, gatewayToken)

  // Not: gateway modeli burada AYRICA eklenmez. Eskiden ekleniyordu ve
  // getAvailableModels()'in kasıtlı elemesini geçersiz kılıyordu; faturası
  // olmayan gateway her auto isteğinde yeniden deneniyordu.
  const availableModels = getAvailableModels()

  const routed = routeModelForTask({
    prompt: boundedRequest.prompt,
    systemPrompt: boundedRequest.systemPrompt,
    maxTokens: boundedRequest.maxTokens,
  }, availableModels)

  const available = new Set(availableModels)
  const fallbackOrder: GenerateRequest['model'][] = [routed.model, ...routed.alternatives]
  const usable = [...new Set(fallbackOrder)].filter(
    (model) => model !== 'auto' && available.has(model)
  )

  // Son dakikalarda düşen sağlayıcıyı atla. Hepsi düşmüşse listeyi olduğu gibi
  // bırak: kullanıcıyı seçeneksiz bırakmaktansa denemek yeğdir.
  const healthy = usable.filter((model) => !isProviderCoolingDown(model))
  const candidates = preferExplicitlyKeyedProviders(healthy.length > 0 ? healthy : usable)

  // Router her zaman bir model döndürür. Hiç anahtar yoksa ilk isteğin
  // kullanıcıya açıklayıcı yapılandırma hatasını vermesine izin ver.
  if (candidates.length === 0) candidates.push(routed.model)

  let lastError: unknown
  for (const [index, model] of candidates.entries()) {
    try {
      // Son adayda sınır uygulanmaz: elde başka seçenek yokken erken vazgeçip
      // kullanıcıyı boş döndürmektense sağlayıcının kendi süresini bekle.
      const isLastCandidate = index === candidates.length - 1
      const attempt = generateWithResolvedModel({ ...enrichedRequest, model }, gatewayToken)
      const result = isLastCandidate ? await attempt : await withCandidateTimeout(attempt, CANDIDATE_TIMEOUT_MS)
      markProviderHealthy(model)
      const routingReason = index === 0
        ? routed.reason
        : `${routed.reason}; ilk sağlayıcı yanıt vermediği için ${getModelConfig(model).shortLabel} yedeği kullanıldı`
      return { ...result, routingReason }
    } catch (error) {
      lastError = error
      markProviderFailed(model)
      const message = error instanceof Error ? error.message : 'Bilinmeyen sağlayıcı hatası'
      console.error('[kadexai/ai] sağlayıcı isteği başarısız:', {
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
