import 'server-only'

import { generateContent } from '@/lib/ai/provider'
import {
  COMPETITOR_SYSTEM_PROMPT,
  CONTENT_PLAN_SYSTEM_PROMPT,
  SYSTEM_PROMPTS,
  TRENDS_SYSTEM_PROMPT,
  buildCompetitorPrompt,
  buildContentPlanPrompt,
  buildHashtagPrompt,
  buildTitlePrompt,
  buildTrendsPrompt,
} from '@/lib/ai/prompts'
import { canUse } from '@/lib/entitlement'
import { getActiveEntitlement } from '@/lib/payments/access'
import { tierOf } from '@/lib/payments/planRules'
import { getUserUsageSummary } from '@/lib/usage/ledger'
import { isTokenQuotaEnforced } from '@/lib/payments/limits'
import { recordAuditEvent } from '@/lib/audit/server'
import { MAX_STEPS_PER_RUN, canInvoke, getPipeline, isEntryStep, type OrchestrationStep } from './registry'
import type { AIModel, Platform } from '@/types'

export * from './registry'

export interface OrchestrationInput {
  pipelineId: string
  niche: string
  platform: Platform
  goal: string
  competitor: string
  region: string
  frequency: string
  model: AIModel
}

export interface StepResult {
  id: string
  label: string
  toolId: string
  status: 'ok' | 'skipped' | 'timeout' | 'failed'
  output?: string
  reason?: string
  model?: AIModel
  tokensUsed?: number
  durationMs: number
}

export interface OrchestrationResult {
  pipelineId: string
  steps: StepResult[]
  stoppedEarly: boolean
}

/**
 * Adımı süre sınırıyla çalıştırır.
 *
 * Not: sağlayıcı isteği kendi 25 sn timeout'una sahip. Buradaki yarış, adımın
 * pipeline'ı kilitlemesini engeller — arka plandaki istek iptal edilmez, ama
 * sonucu artık beklenmez ve zincir sıradaki adıma geçmez.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<{ ok: true; value: T } | { ok: false }> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<{ ok: false }>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false }), ms)
  })
  try {
    const result = await Promise.race([promise.then((value) => ({ ok: true as const, value })), timeout])
    return result
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function truncate(value: string, max = 2_000) {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/** Adım promptunu, önceki adımın çıktısını bağlam olarak alarak kurar. */
function buildStepPrompt(step: OrchestrationStep, input: OrchestrationInput, previous: string | null) {
  const context = previous ? `\n\nÖnceki adımın çıktısı (bağlam olarak kullan, tekrar etme):\n${truncate(previous)}` : ''

  switch (step.id) {
    case 'trends':
      return { system: TRENDS_SYSTEM_PROMPT, prompt: buildTrendsPrompt(input.niche, input.platform, input.region) }
    case 'competitor':
      return { system: COMPETITOR_SYSTEM_PROMPT, prompt: `${buildCompetitorPrompt(input.competitor, input.niche, input.platform)}${context}` }
    case 'content-plan':
      return { system: CONTENT_PLAN_SYSTEM_PROMPT, prompt: `${buildContentPlanPrompt(input.niche, input.platform, input.goal, input.frequency)}${context}` }
    case 'title':
      return { system: SYSTEM_PROMPTS.titleGenerator, prompt: `${buildTitlePrompt(input.niche, input.platform, 'bilgilendirici')}${context}` }
    case 'hashtag':
      return { system: SYSTEM_PROMPTS.hashtagExpert, prompt: `${buildHashtagPrompt(input.niche, input.platform, input.niche, 24)}${context}` }
    default:
      return null
  }
}

/**
 * Sunucuda tanımlı bir pipeline'ı çalıştırır (§8).
 *
 * Her adım için: yetki → doğrulama → kota → timeout → çalıştırma →
 * loglama → audit. Bir adım düşerse zincir DURUR; yarım bağlamla devam edip
 * uydurma çıktı üretilmez.
 */
export async function runPipeline(userId: string, input: OrchestrationInput): Promise<OrchestrationResult> {
  const pipeline = getPipeline(input.pipelineId)
  if (!pipeline) throw new Error('Bilinmeyen akış.')

  // Pipeline seviyesinde yetki: paket bu özelliği içermiyorsa hiç başlatma.
  if (!await canUse(pipeline.requiresFeature)) {
    void recordAuditEvent({
      actorUserId: userId,
      action: 'orchestration.denied',
      resourceType: 'pipeline',
      resourceId: pipeline.id,
      outcome: 'denied',
      metadata: { requiresFeature: pipeline.requiresFeature },
    })
    throw new Error('Bu akış paketinde bulunmuyor.')
  }

  const steps = pipeline.steps.slice(0, MAX_STEPS_PER_RUN)
  const results: StepResult[] = []
  let previousOutput: string | null = null
  let stoppedEarly = false

  const entitlement = await getActiveEntitlement()
  const tier = tierOf(entitlement)

  for (const [index, step] of steps.entries()) {
    const startedAt = Date.now()

    // Least-privilege: ilk adım dışında her adım yalnız bir öncekinin
    // devamı olarak çalışabilir. Bu kontrol, registry sırası değişirse
    // zincirin sessizce yeniden bağlanmasını engeller.
    const allowed = index === 0
      ? isEntryStep(pipeline.id, step.id)
      : canInvoke(pipeline.id, steps[index - 1].id, step.id)
    if (!allowed) {
      results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'skipped', reason: 'Akış içinde bu adım tetiklenemez.', durationMs: 0 })
      stoppedEarly = true
      break
    }

    if (step.requiresFeature && !await canUse(step.requiresFeature)) {
      results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'skipped', reason: 'Paketin bu adımı içermiyor.', durationMs: 0 })
      stoppedEarly = true
      break
    }

    if (isTokenQuotaEnforced()) {
      const usage = await getUserUsageSummary(userId, tier)
      if (usage && usage.remaining !== null && usage.remaining <= 0) {
        results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'skipped', reason: 'Aylık token kotan doldu.', durationMs: 0 })
        stoppedEarly = true
        break
      }
    }

    const built = buildStepPrompt(step, input, previousOutput)
    if (!built) {
      results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'failed', reason: 'Adım tanımı eksik.', durationMs: 0 })
      stoppedEarly = true
      break
    }

    try {
      const raced = await withTimeout(
        generateContent({
          prompt: built.prompt,
          systemPrompt: built.system,
          model: input.model,
          maxTokens: step.maxTokens,
          // HTTP isteği yok; kimlik verilmezse araç adı "unknown" kalıyordu.
          toolId: step.toolId,
        }),
        step.timeoutMs,
      )

      if (!raced.ok) {
        results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'timeout', reason: `Adım ${step.timeoutMs / 1000} sn içinde tamamlanmadı.`, durationMs: Date.now() - startedAt })
        void recordAuditEvent({ actorUserId: userId, action: 'orchestration.step_timeout', resourceType: 'pipeline_step', resourceId: `${pipeline.id}:${step.id}`, outcome: 'failed' })
        stoppedEarly = true
        break
      }

      previousOutput = raced.value.content
      results.push({
        id: step.id,
        label: step.label,
        toolId: step.toolId,
        status: 'ok',
        output: raced.value.content,
        model: raced.value.model,
        tokensUsed: raced.value.tokensUsed,
        durationMs: Date.now() - startedAt,
      })
      // Kullanım/maliyet kaydı generateContent içinde otomatik yazılıyor;
      // burada yalnız zincirin akışı denetim izine geçiyor.
      void recordAuditEvent({
        actorUserId: userId,
        action: 'orchestration.step_completed',
        resourceType: 'pipeline_step',
        resourceId: `${pipeline.id}:${step.id}`,
        metadata: { model: raced.value.model, tokensUsed: raced.value.tokensUsed ?? 0 },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Adım başarısız.'
      results.push({ id: step.id, label: step.label, toolId: step.toolId, status: 'failed', reason: message, durationMs: Date.now() - startedAt })
      void recordAuditEvent({ actorUserId: userId, action: 'orchestration.step_failed', resourceType: 'pipeline_step', resourceId: `${pipeline.id}:${step.id}`, outcome: 'failed' })
      stoppedEarly = true
      break
    }
  }

  return { pipelineId: pipeline.id, steps: results, stoppedEarly }
}
