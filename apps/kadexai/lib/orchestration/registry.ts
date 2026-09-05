/**
 * Tool-to-tool orchestration (§8) — SAF tanım katmanı.
 *
 * Least-privilege ilkesi: hiçbir tool "istediği tool'u" çağıramaz. Yalnızca
 * burada tanımlı, SUNUCUDA sabit pipeline'lar çalışır ve her pipeline içinde
 * bir adım yalnızca kendisinden hemen sonraki adıma veri geçirebilir. İstemci
 * yalnızca pipeline KİMLİĞİNİ seçer; adım listesini asla göndermez.
 */

export interface OrchestrationStep {
  id: string
  /** TOOL_REGISTRY'deki araç kimliği — audit ve yetki için. */
  toolId: string
  label: string
  /** Bu adımın çalışması için gereken paket özelliği (entitlement). */
  requiresFeature?: string
  /** Adım için üst sınır; aşılırsa adım iptal edilir, pipeline devam eder. */
  timeoutMs: number
  maxTokens: number
}

export interface Pipeline {
  id: string
  label: string
  description: string
  /** Pipeline'ın tamamı için gereken paket özelliği. */
  requiresFeature: string
  steps: readonly OrchestrationStep[]
}

const CONTENT_SPRINT: Pipeline = {
  id: 'content-sprint',
  label: 'İçerik Sprinti',
  description: 'Trend tespiti → rakip analizi → içerik planı → başlık → hashtag zinciri.',
  requiresFeature: 'content-generation',
  steps: [
    { id: 'trends', toolId: 'trends', label: 'Trend tespiti', timeoutMs: 30_000, maxTokens: 1_600 },
    { id: 'competitor', toolId: 'competitor', label: 'Rakip analizi', timeoutMs: 30_000, maxTokens: 1_600 },
    { id: 'content-plan', toolId: 'content-plan', label: 'İçerik planı', timeoutMs: 35_000, maxTokens: 2_000 },
    { id: 'title', toolId: 'title', label: 'Başlık üretimi', timeoutMs: 25_000, maxTokens: 1_200 },
    { id: 'hashtag', toolId: 'hashtag', label: 'Hashtag seti', timeoutMs: 20_000, maxTokens: 800 },
  ],
}

const TREND_TO_POST: Pipeline = {
  id: 'trend-to-post',
  label: 'Trendden Yayına',
  description: 'Trend tespiti → içerik planı → başlık → hashtag zinciri.',
  requiresFeature: 'content-generation',
  steps: [
    { id: 'trends', toolId: 'trends', label: 'Trend tespiti', timeoutMs: 30_000, maxTokens: 1_600 },
    { id: 'content-plan', toolId: 'content-plan', label: 'İçerik planı', timeoutMs: 35_000, maxTokens: 2_000 },
    { id: 'title', toolId: 'title', label: 'Başlık üretimi', timeoutMs: 25_000, maxTokens: 1_200 },
    { id: 'hashtag', toolId: 'hashtag', label: 'Hashtag seti', timeoutMs: 20_000, maxTokens: 800 },
  ],
}

const COMPETITOR_GAP: Pipeline = {
  id: 'competitor-gap',
  label: 'Rakip Açığı',
  description: 'Rakip analizi → içerik planı → başlık zinciri.',
  requiresFeature: 'content-generation',
  steps: [
    { id: 'competitor', toolId: 'competitor', label: 'Rakip analizi', timeoutMs: 30_000, maxTokens: 1_600 },
    { id: 'content-plan', toolId: 'content-plan', label: 'İçerik planı', timeoutMs: 35_000, maxTokens: 2_000 },
    { id: 'title', toolId: 'title', label: 'Başlık üretimi', timeoutMs: 25_000, maxTokens: 1_200 },
  ],
}

export const PIPELINES: readonly Pipeline[] = [CONTENT_SPRINT, TREND_TO_POST, COMPETITOR_GAP]

/** Tüm pipeline'lar için toplam adım tavanı — kaçak zincirlemeye karşı. */
export const MAX_STEPS_PER_RUN = 8

/**
 * Özel akışta seçilebilen adımların sunucu tarafı allowlist'i. İstemci yalnız
 * bu kimlikleri sıralayabilir; prompt, araç kimliği, timeout veya token tavanı
 * gönderemez.
 */
export const CUSTOM_STEP_CATALOG: readonly OrchestrationStep[] = [
  { id: 'trends', toolId: 'trends', label: 'Trend tespiti', timeoutMs: 30_000, maxTokens: 1_600 },
  { id: 'competitor', toolId: 'competitor', label: 'Rakip analizi', timeoutMs: 30_000, maxTokens: 1_600 },
  { id: 'content-plan', toolId: 'content-plan', label: 'İçerik planı', timeoutMs: 35_000, maxTokens: 2_000 },
  { id: 'title', toolId: 'title', label: 'Başlık üretimi', timeoutMs: 25_000, maxTokens: 1_200 },
  { id: 'hashtag', toolId: 'hashtag', label: 'Hashtag seti', timeoutMs: 20_000, maxTokens: 800 },
]

export function createCustomPipeline(stepIds: unknown): Pipeline | undefined {
  if (!Array.isArray(stepIds) || stepIds.length < 2 || stepIds.length > CUSTOM_STEP_CATALOG.length) return undefined
  const ids = stepIds.map((id) => String(id))
  if (new Set(ids).size !== ids.length) return undefined
  const steps = ids.map((id) => CUSTOM_STEP_CATALOG.find((step) => step.id === id))
  if (steps.some((step) => !step)) return undefined
  return {
    id: 'custom',
    label: 'Özel Akış',
    description: 'Seçtiğin güvenli araç adımlarını belirlediğin sırayla çalıştırır.',
    requiresFeature: 'content-generation',
    steps: steps as OrchestrationStep[],
  }
}

export function getPipeline(id: string): Pipeline | undefined {
  return PIPELINES.find((pipeline) => pipeline.id === id)
}

/**
 * `fromStepId` adımı `toStepId` adımını tetikleyebilir mi?
 *
 * Yalnızca sıradaki adım. Geriye dönüş, atlama ve kendini çağırma yasak —
 * böylece bir adım sonsuz döngü ya da beklenmedik bir aracı çalıştıramaz.
 */
export function canInvoke(pipelineId: string, fromStepId: string, toStepId: string): boolean {
  const pipeline = getPipeline(pipelineId)
  if (!pipeline) return false
  const fromIndex = pipeline.steps.findIndex((step) => step.id === fromStepId)
  const toIndex = pipeline.steps.findIndex((step) => step.id === toStepId)
  if (fromIndex < 0 || toIndex < 0) return false
  return toIndex === fromIndex + 1
}

/** İlk adım dışarıdan (kullanıcı isteğiyle) tetiklenebilen tek adımdır. */
export function isEntryStep(pipelineId: string, stepId: string): boolean {
  return getPipeline(pipelineId)?.steps[0]?.id === stepId
}
