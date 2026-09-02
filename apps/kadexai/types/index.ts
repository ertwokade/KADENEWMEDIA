export type AIModel =
  | 'auto'                    // Göreve ve mevcut sağlayıcılara göre otomatik seçim
  // Vercel AI Gateway
  | 'vercel-qwen-flash'       // En düşük maliyetli varsayılan gateway modeli
  // Groq
  | 'groq-llama-70b'          // Llama 3.3 70B  ~500 t/s
  | 'groq-llama4'             // Llama 4 Scout 17B
  | 'groq-qwen-32b'           // Qwen3 32B
  | 'groq-llama-8b'           // Llama 3.1 8B
  | 'groq-gpt-oss-120b'       // GPT-OSS 120B
  | 'groq-gpt-oss-20b'        // GPT-OSS 20B
  | 'groq-compound-mini'       // Groq Compound Mini
  // Cerebras
  | 'cerebras-glm-4-7'        // Z.ai GLM 4.7 on Cerebras
  | 'cerebras-gpt-oss-120b'   // GPT-OSS 120B on Cerebras
  // OpenRouter
  | 'openrouter-free'         // Genel ucretsiz OR router
  | 'openrouter-glm-free'     // Z.ai GLM 4.5 Air free
  | 'openrouter-nemotron-free' // NVIDIA Nemotron 3 Super free
  | 'openrouter-deepseek-r1'  // DeepSeek R1, kredi gerekir
  | 'openrouter-llama4'       // Llama 4 Maverick
  | 'openrouter-qwen3-235b'   // Qwen3 235B, kredi gerekir
  // Gemini
  | 'gemini-flash'            // Gemini 2.5 Flash
  | 'gemini-flash-lite'       // Gemini 2.5 Flash-Lite
  | 'gemini-flash-latest'     // Gemini Flash latest alias
  | 'gemini-lite-latest'      // Gemini Flash-Lite latest alias
  | 'gemini-3-5-flash'        // Gemini 3.5 Flash
  | 'gemini-3-1-lite'         // Gemini 3.1 Flash Lite
  // Mistral
  | 'mistral-nemo'            // Mistral NeMo
  | 'mistral-small'           // Mistral Small latest
  | 'mistral-magistral'       // Magistral Small latest
  | 'mistral-medium'          // Mistral Medium latest
  | 'mistral-codestral'       // Codestral latest
  | 'mistral-devstral'        // Devstral latest
  // Premium
  | 'claude'                  // Claude Sonnet (ANTHROPIC_API_KEY)
  | 'gpt4o'                   // GPT-4o (OPENAI_API_KEY)
  | 'gemini'                  // Gemini Pro (GEMINI_API_KEY)

export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'pinterest'

export type ContentTone = 'bilgilendirici' | 'eğlenceli' | 'ilham verici' | 'dikkat çekici' | 'samimi'

export interface GenerateRequest {
  prompt: string
  model: AIModel
  systemPrompt?: string
  maxTokens?: number
  /**
   * Aracın kayıt defterindeki kimliği. Normalde istek yolundan çıkarılır;
   * ancak akışlar gibi HTTP isteği taşımayan çağrılarda yol yok ve araç adı
   * "unknown" olarak kaydediliyordu — bildirimler de öyle geliyordu.
   */
  toolId?: string
}

export interface GenerateResult {
  content: string
  model: AIModel
  tokensUsed?: number
  /** Sağlayıcı input/output ayrımı bildirdiyse dolu; maliyet hesabı bunu kullanır. */
  inputTokens?: number
  outputTokens?: number
  /** Çağrı kullanıcının kendi sağlayıcı anahtarıyla yapıldıysa true. */
  byok?: boolean
  routingReason?: string
}

export interface TitleGenerateRequest {
  topic: string
  platform: Platform
  tone: ContentTone
  model: AIModel
  keywords?: string
}

export interface DescriptionGenerateRequest {
  title: string
  summary: string
  platform: Platform
  targetAudience: string
  model: AIModel
  includeHashtags?: boolean
  includeCTA?: boolean
}

export interface HookGenerateRequest {
  topic: string
  format: 'reels' | 'shorts' | 'tiktok' | 'youtube'
  niche: string
  model: AIModel
}

export interface HashtagRequest {
  topic: string
  platform: Platform
  niche: string
  model: AIModel
  count?: number
}

export interface ScriptRequest {
  title: string
  hook?: string
  duration: '30s' | '60s' | '3min' | '5min' | '10min'
  platform: Platform
  tone: ContentTone
  model: AIModel
}

export interface ViralScoreRequest {
  title: string
  platform: Platform
  model: AIModel
  description?: string
  hashtags?: string
}

export interface IdeasRequest {
  niche: string
  platform: Platform
  model: AIModel
  count?: number
  style?: string
}

export interface ThumbnailRequest {
  title: string
  platform: Platform
  niche: string
  model: AIModel
  style?: string
}

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
export type TTSModel = 'tts-1' | 'tts-1-hd'

export interface TTSRequest {
  text: string
  voice: TTSVoice
  model: TTSModel
}

export type DubbingLanguage =
  | 'english' | 'german' | 'french' | 'spanish' | 'arabic'
  | 'japanese' | 'korean' | 'russian' | 'portuguese' | 'italian'

export interface TranslateRequest {
  content: string
  sourceLang: string
  targetLang: DubbingLanguage
  model: AIModel
  includePronunciation?: boolean
  includeTimingNotes?: boolean
  includeCulturalNotes?: boolean
}

export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  category: string
}
