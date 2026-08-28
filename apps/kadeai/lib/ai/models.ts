import { AIModel } from '@/types'

export type ModelProviderId = 'auto' | 'vercel' | 'groq' | 'cerebras' | 'openrouter' | 'anthropic' | 'openai' | 'google' | 'mistral'
export type ModelSpeed = 'fastest' | 'fast' | 'balanced'

export interface ModelConfig {
  id: AIModel
  label: string
  shortLabel: string
  description: string
  provider: ModelProviderId
  groqModel?: string
  cerebrasModel?: string
  gatewayModel?: string
  openRouterModel?: string
  geminiModel?: string
  mistralModel?: string
  colorClass: string
  activeClass: string
  dotClass: string
  free: boolean
  speed?: ModelSpeed
  speedLabel?: string
  contextLabel?: string
  badge?: string
}

export interface ModelProviderGroup {
  id: ModelProviderId | 'all'
  label: string
  description: string
}

const classes = {
  violet: ['text-violet-500', 'border-violet-300 bg-violet-50 text-violet-700 shadow-sm', 'bg-violet-500'],
  fuchsia: ['text-fuchsia-500', 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 shadow-sm', 'bg-fuchsia-500'],
  orange: ['text-orange-500', 'border-orange-300 bg-orange-50 text-orange-700 shadow-sm', 'bg-orange-500'],
  amber: ['text-amber-500', 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm', 'bg-amber-500'],
  teal: ['text-teal-500', 'border-teal-300 bg-teal-50 text-teal-700 shadow-sm', 'bg-teal-500'],
  lime: ['text-lime-600', 'border-lime-300 bg-lime-50 text-lime-700 shadow-sm', 'bg-lime-500'],
  emerald: ['text-emerald-600', 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm', 'bg-emerald-500'],
  cyan: ['text-cyan-600', 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-sm', 'bg-cyan-500'],
  blue: ['text-blue-600', 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm', 'bg-blue-500'],
  sky: ['text-sky-600', 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm', 'bg-sky-500'],
  purple: ['text-purple-600', 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm', 'bg-purple-500'],
  rose: ['text-rose-600', 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm', 'bg-rose-500'],
  red: ['text-red-600', 'border-red-300 bg-red-50 text-red-700 shadow-sm', 'bg-red-500'],
} as const

function style(color: keyof typeof classes) {
  const [colorClass, activeClass, dotClass] = classes[color]
  return { colorClass, activeClass, dotClass }
}

export const MODEL_PROVIDER_GROUPS: ModelProviderGroup[] = [
  { id: 'all', label: 'Hepsi', description: 'Yapılandırılmış modeller' },
  { id: 'vercel', label: 'Ekonomik', description: 'Vercel ücretsiz kredisi ve düşük maliyetli modeller' },
  { id: 'cerebras', label: 'Cerebras', description: 'En hızlı çıkarım' },
  { id: 'groq', label: 'Groq', description: 'Düşük gecikme' },
  { id: 'openrouter', label: 'OpenRouter', description: 'Ücretsiz yönlendirici ve kredi modelleri' },
  { id: 'google', label: 'Gemini', description: 'Google Flash ailesi' },
  { id: 'mistral', label: 'Mistral', description: 'NeMo, reasoning ve code' },
  { id: 'anthropic', label: 'Claude', description: 'Anthropic modelleri' },
  { id: 'openai', label: 'OpenAI', description: 'OpenAI modelleri' },
]

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  auto: {
    id: 'auto',
    label: 'Otomatik model seçimi',
    shortLabel: 'Otomatik',
    description: 'Konu, amaç, çıktı biçimi, uzunluk ve kullanılabilir sağlayıcılar birlikte puanlanır',
    provider: 'auto',
    free: true,
    speed: 'fast',
    speedLabel: 'Göreve göre',
    contextLabel: 'Akıllı yönlendirme',
    ...style('orange'),
  },
  'vercel-qwen-flash': {
    id: 'vercel-qwen-flash',
    label: 'Qwen 3.5 Flash (Ekonomik)',
    shortLabel: 'Qwen Flash',
    description: 'Vercel AI Gateway üzerinden çok düşük maliyetli genel üretim modeli',
    provider: 'vercel',
    gatewayModel: 'alibaba/qwen3.5-flash',
    free: true,
    speed: 'fastest',
    speedLabel: 'Ekonomik',
    contextLabel: '1M',
    badge: 'Varsayılan',
    ...style('lime'),
  },
  'cerebras-glm-4-7': {
    id: 'cerebras-glm-4-7',
    label: 'Cerebras GLM 4.7',
    shortLabel: 'GLM 4.7',
    description: 'Hızlı seri üretim ve uzun çıktılar',
    provider: 'cerebras',
    cerebrasModel: 'zai-glm-4.7',
    free: true,
    speed: 'fastest',
    speedLabel: 'Cerebras',
    contextLabel: 'GLM',
    badge: 'En Hızlı',
    ...style('violet'),
  },
  'cerebras-gpt-oss-120b': {
    id: 'cerebras-gpt-oss-120b',
    label: 'Cerebras GPT-OSS 120B',
    shortLabel: 'Cerebras 120B',
    description: 'Büyük analiz; yoğunlukta GLM 4.7 yedeğini kullanır',
    provider: 'cerebras',
    cerebrasModel: 'gpt-oss-120b',
    free: true,
    speed: 'fastest',
    speedLabel: 'Cerebras',
    contextLabel: '120B',
    ...style('fuchsia'),
  },
  'groq-llama-70b': {
    id: 'groq-llama-70b',
    label: 'Groq Llama 3.3 70B',
    shortLabel: 'Llama 70B',
    description: 'Genel kalite, Türkçe içerik ve dengeli üretim',
    provider: 'groq',
    groqModel: 'llama-3.3-70b-versatile',
    free: true,
    speed: 'fast',
    speedLabel: '500 tok/sn',
    contextLabel: '70B',
    ...style('orange'),
  },
  'groq-llama4': {
    id: 'groq-llama4',
    label: 'Groq Llama 4 Scout',
    shortLabel: 'Llama 4 Scout',
    description: 'Canlı Groq listesinde çalışan Llama 4 varyantı',
    provider: 'groq',
    groqModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    free: true,
    speed: 'fast',
    speedLabel: 'Hızlı',
    contextLabel: '10M',
    badge: 'Yeni',
    ...style('amber'),
  },
  'groq-qwen-32b': {
    id: 'groq-qwen-32b',
    label: 'Groq Qwen3 32B',
    shortLabel: 'Qwen 32B',
    description: 'Planlama, teknik içerik ve formatlı çıktılar',
    provider: 'groq',
    groqModel: 'qwen/qwen3-32b',
    free: true,
    speed: 'fast',
    speedLabel: 'Hızlı',
    contextLabel: '32B',
    ...style('teal'),
  },
  'groq-llama-8b': {
    id: 'groq-llama-8b',
    label: 'Groq Llama 3.1 8B',
    shortLabel: 'Hızlı 8B',
    description: 'Kısa taslak, hızlı varyasyon ve seri işler',
    provider: 'groq',
    groqModel: 'llama-3.1-8b-instant',
    free: true,
    speed: 'fastest',
    speedLabel: 'Instant',
    contextLabel: '8B',
    ...style('lime'),
  },
  'groq-gpt-oss-120b': {
    id: 'groq-gpt-oss-120b',
    label: 'Groq GPT-OSS 120B',
    shortLabel: 'GPT-OSS 120B',
    description: 'Analiz, yapılandırılmış çıktı ve geniş bilgi',
    provider: 'groq',
    groqModel: 'openai/gpt-oss-120b',
    free: true,
    speed: 'fast',
    speedLabel: 'Hızlı',
    contextLabel: '120B',
    ...style('emerald'),
  },
  'groq-gpt-oss-20b': {
    id: 'groq-gpt-oss-20b',
    label: 'Groq GPT-OSS 20B',
    shortLabel: 'GPT-OSS 20B',
    description: 'Hızlı analiz, JSON ve seri operasyon',
    provider: 'groq',
    groqModel: 'openai/gpt-oss-20b',
    free: true,
    speed: 'fastest',
    speedLabel: 'Çok hızlı',
    contextLabel: '20B',
    ...style('cyan'),
  },
  'groq-compound-mini': {
    id: 'groq-compound-mini',
    label: 'Groq Compound Mini',
    shortLabel: 'Compound Mini',
    description: 'Groq yönlendirici; hızlı araştırma ve araç odaklı işler',
    provider: 'groq',
    groqModel: 'groq/compound-mini',
    free: true,
    speed: 'fastest',
    speedLabel: 'Router',
    badge: 'Yeni',
    ...style('sky'),
  },
  'openrouter-free': {
    id: 'openrouter-free',
    label: 'OpenRouter Free Router',
    shortLabel: 'OR Free',
    description: 'OpenRouter üzerinden erişilebilir modeli seçer',
    provider: 'openrouter',
    openRouterModel: 'openrouter/free',
    free: true,
    speed: 'balanced',
    speedLabel: 'Auto',
    ...style('purple'),
  },
  'openrouter-glm-free': {
    id: 'openrouter-glm-free',
    label: 'Z.ai GLM 4.5 Air (OpenRouter)',
    shortLabel: 'GLM 4.5 Free',
    description: 'Canlı testte çalışan ücretsiz OpenRouter modeli',
    provider: 'openrouter',
    openRouterModel: 'z-ai/glm-4.5-air:free',
    free: true,
    speed: 'balanced',
    speedLabel: 'Free',
    contextLabel: '128K',
    ...style('violet'),
  },
  'openrouter-nemotron-free': {
    id: 'openrouter-nemotron-free',
    label: 'Nemotron 3 Super (OpenRouter)',
    shortLabel: 'Nemotron Free',
    description: 'Canlı testte çalışan büyük ücretsiz OpenRouter modeli',
    provider: 'openrouter',
    openRouterModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    free: true,
    speed: 'balanced',
    speedLabel: 'Free',
    contextLabel: '1M',
    badge: 'Büyük',
    ...style('rose'),
  },
  'openrouter-deepseek-r1': {
    id: 'openrouter-deepseek-r1',
    label: 'DeepSeek R1 (OpenRouter)',
    shortLabel: 'DeepSeek R1',
    description: 'Kredi eklendiğinde tam R1 muhakeme modeli',
    provider: 'openrouter',
    openRouterModel: 'deepseek/deepseek-r1',
    free: false,
    speed: 'balanced',
    speedLabel: 'Kredi',
    contextLabel: 'R1',
    badge: 'Reasoning',
    ...style('blue'),
  },
  'openrouter-llama4': {
    id: 'openrouter-llama4',
    label: 'Llama 4 Maverick (OpenRouter)',
    shortLabel: 'Llama 4 OR',
    description: 'Kredi gerektiren geniş bağlamlı Llama 4 modeli',
    provider: 'openrouter',
    openRouterModel: 'meta-llama/llama-4-maverick',
    free: false,
    speed: 'balanced',
    speedLabel: 'Kredi',
    contextLabel: '1M',
    ...style('amber'),
  },
  'openrouter-qwen3-235b': {
    id: 'openrouter-qwen3-235b',
    label: 'Qwen3 235B A22B (OpenRouter)',
    shortLabel: 'Qwen3 235B',
    description: 'Kredi gerektiren büyük Qwen modeli',
    provider: 'openrouter',
    openRouterModel: 'qwen/qwen3-235b-a22b',
    free: false,
    speed: 'balanced',
    speedLabel: 'Kredi',
    contextLabel: '235B',
    badge: 'En Büyük',
    ...style('rose'),
  },
  'gemini-flash': {
    id: 'gemini-flash',
    label: 'Gemini 2.5 Flash',
    shortLabel: 'Gemini Flash',
    description: 'Uzun metin, çeviri ve dengeli üretim',
    provider: 'google',
    geminiModel: 'gemini-2.5-flash',
    free: true,
    speed: 'fast',
    speedLabel: 'Flash',
    contextLabel: '1M',
    ...style('blue'),
  },
  'gemini-flash-lite': {
    id: 'gemini-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    shortLabel: 'Gemini Lite',
    description: 'Ekonomik ve seri Google Flash-Lite varyantı',
    provider: 'google',
    geminiModel: 'gemini-2.5-flash-lite',
    free: true,
    speed: 'fastest',
    speedLabel: 'Lite',
    contextLabel: '1M',
    ...style('sky'),
  },
  'gemini-flash-latest': {
    id: 'gemini-flash-latest',
    label: 'Gemini Flash Latest',
    shortLabel: 'Flash Latest',
    description: 'Google tarafındaki güncel Flash diğer adı',
    provider: 'google',
    geminiModel: 'gemini-flash-latest',
    free: true,
    speed: 'fast',
    speedLabel: 'Latest',
    contextLabel: '1M',
    ...style('blue'),
  },
  'gemini-lite-latest': {
    id: 'gemini-lite-latest',
    label: 'Gemini Flash-Lite Latest',
    shortLabel: 'Lite Latest',
    description: 'Google tarafındaki güncel Flash-Lite diğer adı',
    provider: 'google',
    geminiModel: 'gemini-flash-lite-latest',
    free: true,
    speed: 'fastest',
    speedLabel: 'Latest',
    contextLabel: '1M',
    ...style('sky'),
  },
  'gemini-3-5-flash': {
    id: 'gemini-3-5-flash',
    label: 'Gemini 3.5 Flash',
    shortLabel: 'Gemini 3.5',
    description: 'Canlı anahtar listesinde çalışan yeni Flash modeli',
    provider: 'google',
    geminiModel: 'gemini-3.5-flash',
    free: true,
    speed: 'fast',
    speedLabel: '3.5',
    contextLabel: '1M',
    badge: 'Yeni',
    ...style('blue'),
  },
  'gemini-3-1-lite': {
    id: 'gemini-3-1-lite',
    label: 'Gemini 3.1 Flash Lite',
    shortLabel: 'Gemini 3.1 Lite',
    description: 'Canlı anahtar listesinde çalışan yeni Lite modeli',
    provider: 'google',
    geminiModel: 'gemini-3.1-flash-lite',
    free: true,
    speed: 'fastest',
    speedLabel: '3.1 Lite',
    contextLabel: '1M',
    ...style('sky'),
  },
  'mistral-nemo': {
    id: 'mistral-nemo',
    label: 'Mistral NeMo',
    shortLabel: 'Mistral NeMo',
    description: 'Açık model; kod ve içerik için hızlı seçenek',
    provider: 'mistral',
    mistralModel: 'open-mistral-nemo',
    free: true,
    speed: 'fast',
    speedLabel: 'Open',
    contextLabel: '128K',
    ...style('red'),
  },
  'mistral-small': {
    id: 'mistral-small',
    label: 'Mistral Small Latest',
    shortLabel: 'Mistral Small',
    description: 'Genel metin ve muhakeme görevleri',
    provider: 'mistral',
    mistralModel: 'mistral-small-latest',
    free: true,
    speed: 'fast',
    speedLabel: 'Reasoning',
    contextLabel: '260K',
    ...style('orange'),
  },
  'mistral-magistral': {
    id: 'mistral-magistral',
    label: 'Magistral Small Latest',
    shortLabel: 'Magistral',
    description: 'Mistral muhakeme modeli; analiz ve karar işleri',
    provider: 'mistral',
    mistralModel: 'magistral-small-latest',
    free: true,
    speed: 'balanced',
    speedLabel: 'Reasoning',
    badge: 'Reasoning',
    ...style('amber'),
  },
  'mistral-medium': {
    id: 'mistral-medium',
    label: 'Mistral Medium Latest',
    shortLabel: 'Mistral Medium',
    description: 'Daha kaliteli Mistral genel model',
    provider: 'mistral',
    mistralModel: 'mistral-medium-latest',
    free: true,
    speed: 'balanced',
    speedLabel: 'Medium',
    ...style('red'),
  },
  'mistral-codestral': {
    id: 'mistral-codestral',
    label: 'Codestral Latest',
    shortLabel: 'Codestral',
    description: 'Kod, teknik metin ve iş akışı taslağı',
    provider: 'mistral',
    mistralModel: 'codestral-latest',
    free: true,
    speed: 'fast',
    speedLabel: 'Code',
    badge: 'Code',
    ...style('cyan'),
  },
  'mistral-devstral': {
    id: 'mistral-devstral',
    label: 'Devstral Latest',
    shortLabel: 'Devstral',
    description: 'Kod ajanları ve teknik planlama için',
    provider: 'mistral',
    mistralModel: 'devstral-latest',
    free: true,
    speed: 'fast',
    speedLabel: 'Code',
    badge: 'Code',
    ...style('teal'),
  },
  claude: {
    id: 'claude',
    label: 'Claude Sonnet',
    shortLabel: 'Claude',
    description: 'Premium kalite, ANTHROPIC_API_KEY gerekli',
    provider: 'anthropic',
    free: false,
    speed: 'balanced',
    speedLabel: 'Premium',
    ...style('orange'),
  },
  gpt4o: {
    id: 'gpt4o',
    label: 'GPT-4o',
    shortLabel: 'GPT-4o',
    description: 'OpenAI flagship, OPENAI_API_KEY gerekli',
    provider: 'openai',
    free: false,
    speed: 'balanced',
    speedLabel: 'Premium',
    ...style('emerald'),
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini Pro',
    shortLabel: 'Gemini Pro',
    description: 'Google premium Gemini, GEMINI_API_KEY gerekli',
    provider: 'google',
    geminiModel: 'gemini-2.5-pro',
    free: false,
    speed: 'balanced',
    speedLabel: 'Premium',
    contextLabel: '1M',
    ...style('blue'),
  },
}

export const WORKING_MODELS: AIModel[] = [
  'cerebras-glm-4-7',
  'cerebras-gpt-oss-120b',
  'groq-llama-70b',
  'groq-llama4',
  'groq-qwen-32b',
  'groq-llama-8b',
  'groq-gpt-oss-120b',
  'groq-gpt-oss-20b',
  'groq-compound-mini',
  'openrouter-free',
  'openrouter-glm-free',
  'openrouter-nemotron-free',
  'gemini-flash',
  'gemini-flash-lite',
  'gemini-flash-latest',
  'gemini-lite-latest',
  'gemini-3-5-flash',
  'gemini-3-1-lite',
  'mistral-nemo',
  'mistral-small',
  'mistral-magistral',
  'mistral-medium',
  'mistral-codestral',
  'mistral-devstral',
]

export const CREDIT_MODELS: AIModel[] = [
  'openrouter-deepseek-r1',
  'openrouter-llama4',
  'openrouter-qwen3-235b',
]

export const PREMIUM_MODELS: AIModel[] = ['claude', 'gpt4o', 'gemini']

export const FREE_MODELS: AIModel[] = WORKING_MODELS
export const SELECTABLE_MODELS: AIModel[] = ['auto', ...WORKING_MODELS, ...CREDIT_MODELS, ...PREMIUM_MODELS]
export const FREE_GROQ_MODELS: AIModel[] = FREE_MODELS

export const COMPARE_MODELS: AIModel[] = [
  'cerebras-glm-4-7',
  'groq-llama-70b',
  'gemini-flash',
]

/**
 * Karşılaştırmaya GERÇEKTEN girebilecek modeller.
 *
 * COMPARE_MODELS sabit bir listeydi ve anahtarı olmayan sağlayıcılar da
 * içindeydi: canlıda yalnız Gemini yapılandırılıyken "3 Modelle Karşılaştır"
 * üç ayrı model adı gösteriyor ama üçü de aynı yedeğe düşüyordu. Artık
 * yapılandırılmış sağlayıcılarla kesişim alınıyor; ikiden az kalırsa
 * karşılaştırma anlamsızdır ve boş dizi döner (arayüz butonu gizler).
 */
export function compareModelsFrom(available: readonly string[]): AIModel[] {
  const usable = COMPARE_MODELS.filter((model) => available.includes(model))
  return usable.length >= 2 ? usable : []
}

export function getModelConfig(model: AIModel): ModelConfig {
  return MODEL_CONFIGS[model] ?? MODEL_CONFIGS['groq-llama-70b']
}
