import { AIModel } from '@/types'

export interface ModelRoutingInput {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}

export interface ModelRoutingResult {
  model: AIModel
  reason: string
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function getAvailableModels(): AIModel[] {
  const models: AIModel[] = ['auto']

  if (configured('GROQ_API_KEY')) {
    models.push(
      'groq-llama-70b',
      'groq-llama4',
      'groq-qwen-32b',
      'groq-llama-8b',
      'groq-gpt-oss-120b',
      'groq-gpt-oss-20b',
      'groq-compound-mini'
    )
  }
  if (configured('CEREBRAS_API_KEY')) {
    models.push('cerebras-glm-4-7', 'cerebras-gpt-oss-120b')
  }
  if (configured('OPENROUTER_API_KEY')) {
    models.push(
      'openrouter-free',
      'openrouter-glm-free',
      'openrouter-nemotron-free'
    )
    if (process.env.OPENROUTER_CREDITS_ENABLED?.trim() === '1') {
      models.push('openrouter-deepseek-r1', 'openrouter-llama4', 'openrouter-qwen3-235b')
    }
  }
  if (configured('GEMINI_API_KEY')) {
    models.push(
      'gemini-flash',
      'gemini-flash-lite',
      'gemini-flash-latest',
      'gemini-lite-latest',
      'gemini-3-5-flash',
      'gemini-3-1-lite',
      'gemini'
    )
  }
  if (configured('MISTRAL_API_KEY')) {
    models.push(
      'mistral-nemo',
      'mistral-small',
      'mistral-magistral',
      'mistral-medium',
      'mistral-codestral',
      'mistral-devstral'
    )
  }
  if (configured('ANTHROPIC_API_KEY')) models.push('claude')
  if (configured('OPENAI_API_KEY')) models.push('gpt4o')

  return [...new Set(models)]
}

export function routeModelForTask(input: ModelRoutingInput): ModelRoutingResult {
  const available = new Set(getAvailableModels())
  const text = `${input.systemPrompt || ''}\n${input.prompt}`.toLocaleLowerCase('tr-TR')
  const maxTokens = input.maxTokens || 1500

  const choose = (candidates: AIModel[], reason: string): ModelRoutingResult | null => {
    const model = candidates.find((candidate) => available.has(candidate))
    return model ? { model, reason } : null
  }

  const rules: Array<ModelRoutingResult | null> = [
    /\b(typescript|javascript|react|debug)\b|kod (yaz|üret|düzelt|incele)|code (write|review|debug)|yazılım geliştirme|hata ayıkla/.test(text)
      ? choose(['mistral-codestral', 'mistral-devstral', 'groq-qwen-32b'], 'Teknik ve kod odaklı görev')
      : null,
    /çevir|çeviri|translation|dublaj|yerelleştir|lokalizasyon/.test(text)
      ? choose(['gemini-flash', 'mistral-medium', 'groq-llama-70b'], 'Uzun bağlamlı dil dönüşümü')
      : null,
    /analiz|puan|skor|denetim|audit|performans|retention|rakip|risk|karşılaştır/.test(text)
      ? choose(['groq-gpt-oss-120b', 'mistral-magistral', 'cerebras-gpt-oss-120b'], 'Muhakeme ve analiz görevi')
      : null,
    /trend bul|trend araştır|güncel trend|güncel kaynak|son gelişme/.test(text)
      ? choose(['groq-compound-mini', 'openrouter-free', 'groq-qwen-32b'], 'Araştırma ve güncellik odaklı görev')
      : null,
    /toplu|çoklu üret|batch|seri üret|çok sayıda varyasyon/.test(text)
      ? choose(['cerebras-glm-4-7', 'groq-gpt-oss-20b', 'gemini-flash'], 'Yüksek hacimli seri üretim')
      : null,
    text.length > 7000
      ? choose(['gemini-flash', 'mistral-medium', 'groq-llama-70b'], 'Uzun bağlam veya uzun çıktı')
      : null,
    maxTokens >= 2200
      ? choose(['cerebras-glm-4-7', 'gemini-flash', 'groq-llama-70b'], 'Yüksek hacimli üretim')
      : null,
    /json|tablo|liste|kategori|şema|format|faq|hashtag|toplu/.test(text)
      ? choose(['groq-gpt-oss-20b', 'cerebras-glm-4-7', 'groq-qwen-32b'], 'Yapılandırılmış çıktı görevi')
      : null,
    /fikir|başlık|hook|metin|açıklama|mail|yaratıcı|hikâye|carousel/.test(text)
      ? choose(['groq-llama-70b', 'gemini-flash', 'mistral-medium'], 'Yaratıcı Türkçe içerik görevi')
      : null,
    choose(['groq-llama-70b', 'gemini-flash', 'mistral-small', 'cerebras-glm-4-7'], 'Genel amaçlı dengeli seçim'),
  ]

  const routed = rules.find((rule): rule is ModelRoutingResult => Boolean(rule))
  if (routed) return routed

  return {
    model: 'groq-llama-70b',
    reason: 'Yapılandırılmış bir sağlayıcı bulunamadığı için güvenli varsayılan',
  }
}
