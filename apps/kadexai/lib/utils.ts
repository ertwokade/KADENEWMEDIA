import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Platform, AIModel } from '@/types'
import { getModelConfig } from '@/lib/ai/models'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    x: 'X (Twitter)',
    linkedin: 'LinkedIn',
    pinterest: 'Pinterest',
  }
  return labels[platform]
}

export function getModelLabel(model: AIModel): string {
  return getModelConfig(model).label
}

export function getModelColor(model: AIModel): string {
  return getModelConfig(model).colorClass
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function collectSettledResults<T>(settled: PromiseSettledResult<T>[]) {
  const values = settled
    .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
    .map((result) => result.value)
  const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
  const firstReason = failures[0]?.reason
  const firstMessage = firstReason instanceof Error ? firstReason.message : String(firstReason || '')

  return {
    values,
    failureCount: failures.length,
    failureMessage: failures.length
      ? `${failures.length} istek tamamlanamadı${firstMessage ? `: ${firstMessage}` : '.'}`
      : '',
  }
}

export function checkEnvVars(): void {
  const hasTextProvider = Boolean(
    process.env.GROQ_API_KEY ||
      process.env.CEREBRAS_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.MISTRAL_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY
  )

  if (!hasTextProvider) {
    console.warn('[ContentAI] Eksik AI API anahtari. GROQ_API_KEY veya model saglayici anahtarlarindan birini ekle.')
  }
}
