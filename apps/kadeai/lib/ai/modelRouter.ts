import { AIModel } from '@/types'
import { hasVercelGatewayRuntime } from '@/lib/ai/gatewayAuth'

export interface ModelRoutingInput {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}

export type ModelTask =
  | 'coding'
  | 'translation'
  | 'analysis'
  | 'research'
  | 'bulk'
  | 'long-context'
  | 'structured'
  | 'creative'
  | 'general'

export interface ModelRoutingResult {
  model: AIModel
  reason: string
  alternatives: AIModel[]
  task: ModelTask
}

const TASK_LABELS: Record<ModelTask, string> = {
  coding: 'kod ve teknik üretim',
  translation: 'çeviri ve yerelleştirme',
  analysis: 'analiz ve muhakeme',
  research: 'araştırma ve güncellik',
  bulk: 'yüksek hacimli seri üretim',
  'long-context': 'uzun bağlam',
  structured: 'yapılandırılmış çıktı',
  creative: 'yaratıcı içerik',
  general: 'genel amaçlı üretim',
}

const TASK_PATTERNS: Record<Exclude<ModelTask, 'general' | 'long-context'>, RegExp[]> = {
  coding: [
    /\b(typescript|javascript|react|next\.?js|python|sql|api|debug|frontend|backend|html|css)\b/i,
    /kod (yaz|üret|düzelt|incele)|code (write|review|debug)|yazılım geliştirme|hata ayıkla|refactor/i,
  ],
  translation: [
    /çevir|çeviri|translation|dublaj|yerelleştir|lokalizasyon|altyazı|başka dil/i,
  ],
  analysis: [
    /analiz|puan|skor|denetim|audit|performans|retention|rakip|risk|karşılaştır|muhakeme|değerlendir/i,
    /neden|artı ve eksi|avantaj|dezavantaj|güçlü ve zayıf/i,
  ],
  research: [
    /trend bul|trend araştır|güncel trend|güncel kaynak|son gelişme|araştır|kaynak bul|web'de ara/i,
  ],
  bulk: [
    /toplu|çoklu üret|batch|seri üret|çok sayıda varyasyon|(\d{2,})\s+(adet|tane|varyasyon|örnek)/i,
  ],
  structured: [
    /\bjson\b|tablo|liste|kategori|şema|format|faq|hashtag|csv|madde madde|yapılandırılmış/i,
  ],
  creative: [
    /fikir|başlık|hook|metin|açıklama|mail|yaratıcı|hikâye|carousel|senaryo|slogan|caption|reklam/i,
  ],
}

const MODEL_PREFERENCES: Record<ModelTask, AIModel[]> = {
  coding: [
    'claude', 'gpt4o', 'mistral-codestral', 'mistral-devstral', 'groq-qwen-32b',
    'openrouter-qwen3-235b', 'groq-gpt-oss-120b', 'gemini-flash',
  ],
  translation: [
    'gemini', 'gemini-3-5-flash', 'gemini-flash', 'mistral-medium', 'claude',
    'gpt4o', 'groq-llama-70b', 'mistral-nemo',
  ],
  analysis: [
    'claude', 'gpt4o', 'openrouter-deepseek-r1', 'mistral-magistral',
    'groq-gpt-oss-120b', 'cerebras-gpt-oss-120b', 'openrouter-qwen3-235b',
    'gemini', 'groq-qwen-32b',
  ],
  research: [
    'groq-compound-mini', 'gemini', 'gemini-3-5-flash', 'openrouter-free',
    'openrouter-nemotron-free', 'groq-qwen-32b', 'groq-llama4',
  ],
  bulk: [
    'vercel-qwen-flash', 'cerebras-glm-4-7', 'groq-gpt-oss-20b', 'groq-llama-8b', 'gemini-flash-lite',
    'gemini-lite-latest', 'gemini-flash', 'mistral-small',
  ],
  'long-context': [
    'gemini', 'gemini-3-5-flash', 'gemini-flash', 'openrouter-nemotron-free',
    'mistral-medium', 'groq-llama4', 'claude', 'gpt4o',
  ],
  structured: [
    'gpt4o', 'vercel-qwen-flash', 'groq-gpt-oss-20b', 'groq-qwen-32b', 'cerebras-glm-4-7',
    'mistral-small', 'gemini-flash', 'openrouter-glm-free',
  ],
  creative: [
    'claude', 'gpt4o', 'groq-llama-70b', 'gemini-3-5-flash', 'gemini-flash',
    'mistral-medium', 'groq-llama4', 'mistral-nemo',
  ],
  general: [
    'vercel-qwen-flash', 'groq-llama-70b', 'gemini-flash', 'mistral-small', 'cerebras-glm-4-7',
    'groq-gpt-oss-20b', 'openrouter-free', 'groq-llama4',
  ],
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function getAvailableModels(): AIModel[] {
  const models: AIModel[] = ['auto']

  if (hasVercelGatewayRuntime()) models.push('vercel-qwen-flash')

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

function classifyTask(text: string, maxTokens: number) {
  const scores = Object.fromEntries(
    (Object.keys(TASK_LABELS) as ModelTask[]).map((task) => [task, task === 'general' ? 1 : 0])
  ) as Record<ModelTask, number>
  const signals: string[] = []

  for (const [task, patterns] of Object.entries(TASK_PATTERNS) as Array<
    [Exclude<ModelTask, 'general' | 'long-context'>, RegExp[]]
  >) {
    const matches = patterns.filter((pattern) => pattern.test(text)).length
    if (matches > 0) {
      scores[task] += 4 + (matches - 1) * 2
      signals.push(TASK_LABELS[task])
    }
  }

  if (text.length > 7_000) {
    scores['long-context'] += 8
    signals.push('uzun metin')
  } else if (text.length > 3_500) {
    scores['long-context'] += 4
    signals.push('geniş bağlam')
  }

  if (maxTokens >= 2_800) {
    scores.bulk += 4
    scores['long-context'] += 2
    signals.push('uzun çıktı')
  } else if (maxTokens >= 2_000) {
    scores.bulk += 2
    signals.push('yüksek çıktı hacmi')
  }

  const task = (Object.entries(scores) as Array<[ModelTask, number]>)
    .sort(([leftTask, left], [rightTask, right]) =>
      right - left || MODEL_TASK_PRIORITY.indexOf(leftTask) - MODEL_TASK_PRIORITY.indexOf(rightTask)
    )[0][0]

  return { task, signals: [...new Set(signals)].slice(0, 3) }
}

const MODEL_TASK_PRIORITY: ModelTask[] = [
  'coding', 'translation', 'analysis', 'research', 'bulk',
  'long-context', 'structured', 'creative', 'general',
]

function rankedAvailableModels(task: ModelTask, availableModels: AIModel[]) {
  const available = new Set(availableModels.filter((model) => model !== 'auto'))
  const taskRanking = MODEL_PREFERENCES[task]
  const generalRanking = MODEL_PREFERENCES.general
  return [...new Set([...taskRanking, ...generalRanking, ...availableModels])]
    .filter((model): model is AIModel => model !== 'auto' && available.has(model))
}

export function routeModelForTask(
  input: ModelRoutingInput,
  availableModels: AIModel[] = getAvailableModels()
): ModelRoutingResult {
  const text = `${input.systemPrompt || ''}\n${input.prompt}`.toLocaleLowerCase('tr-TR')
  const maxTokens = input.maxTokens || 1_500
  const { task, signals } = classifyTask(text, maxTokens)
  const ranked = rankedAvailableModels(task, availableModels)
  const model = ranked[0] || 'groq-llama-70b'
  const signalText = signals.length > 0 ? signals.join(', ') : TASK_LABELS[task]
  const providerCount = new Set(
    availableModels.filter((candidate) => candidate !== 'auto').map((candidate) => candidate.split('-')[0])
  ).size

  return {
    model,
    alternatives: ranked.slice(1),
    task,
    reason: `${TASK_LABELS[task][0].toLocaleUpperCase('tr-TR')}${TASK_LABELS[task].slice(1)} için seçildi; ${signalText} sinyalleri ve ${providerCount || 1} bağlı sağlayıcı değerlendirildi`,
  }
}
