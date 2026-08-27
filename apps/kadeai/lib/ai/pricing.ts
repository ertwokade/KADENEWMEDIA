import type { AIModel } from '@/types'

/**
 * Model başına tahmini token maliyeti (USD / 1.000.000 token).
 *
 * ⚠️ Bu tablo ELLE bakımlıdır. Sağlayıcılar fiyatlarını haber vermeden
 * değiştirir; buradaki değerler yalnızca **tahmini** maliyet ve brüt marj
 * göstermek içindir, faturalandırma kaynağı DEĞİLDİR.
 *
 * Tabloda karşılığı olmayan model için maliyet `null` döner ve ledger'a
 * `cost_usd = NULL` yazılır. Bilinmeyen maliyeti 0 olarak KAYDETME — aksi
 * halde admin panelindeki brüt marj olduğundan yüksek görünür.
 *
 * Yeniden deploy etmeden güncellemek için `AI_MODEL_RATES_JSON` ortam
 * değişkenine `{"model-id":{"in":0.5,"out":1.5}}` biçiminde JSON verilebilir.
 */

export interface ModelRate {
  /** USD / 1M input token */
  in: number
  /** USD / 1M output token */
  out: number
}

/** Tablonun elle en son gözden geçirildiği tarih. */
export const RATES_REVIEWED_AT = '2026-08-26'

const DEFAULT_RATES: Partial<Record<AIModel, ModelRate>> = {
  // Premium
  claude: { in: 3, out: 15 },
  gpt4o: { in: 2.5, out: 10 },
  gemini: { in: 1.25, out: 10 },

  // Gemini Flash ailesi
  'gemini-flash': { in: 0.3, out: 2.5 },
  'gemini-flash-latest': { in: 0.3, out: 2.5 },
  'gemini-flash-lite': { in: 0.1, out: 0.4 },
  'gemini-lite-latest': { in: 0.1, out: 0.4 },

  // Groq
  'groq-llama-70b': { in: 0.59, out: 0.79 },
  'groq-llama-8b': { in: 0.05, out: 0.08 },
  'groq-gpt-oss-120b': { in: 0.15, out: 0.75 },
  'groq-gpt-oss-20b': { in: 0.1, out: 0.5 },

  // Mistral
  'mistral-nemo': { in: 0.15, out: 0.15 },
  'mistral-small': { in: 0.1, out: 0.3 },
  'mistral-medium': { in: 0.4, out: 2 },

  // Ücretsiz OpenRouter havuzları — kullanıcı kredisi harcanmaz
  'openrouter-free': { in: 0, out: 0 },
  'openrouter-glm-free': { in: 0, out: 0 },
  'openrouter-nemotron-free': { in: 0, out: 0 },
}

let overrideCache: Partial<Record<string, ModelRate>> | null = null

function overrides(): Partial<Record<string, ModelRate>> {
  if (overrideCache) return overrideCache
  overrideCache = {}
  const raw = process.env.AI_MODEL_RATES_JSON?.trim()
  if (!raw) return overrideCache
  try {
    const parsed = JSON.parse(raw) as Record<string, { in?: unknown; out?: unknown }>
    for (const [model, rate] of Object.entries(parsed)) {
      const input = Number(rate?.in)
      const output = Number(rate?.out)
      if (Number.isFinite(input) && Number.isFinite(output) && input >= 0 && output >= 0) {
        overrideCache[model] = { in: input, out: output }
      }
    }
  } catch {
    console.warn('[kadeai/pricing] AI_MODEL_RATES_JSON ayrıştırılamadı; varsayılan tablo kullanılıyor.')
  }
  return overrideCache
}

export function getModelRate(model: string): ModelRate | null {
  return overrides()[model] ?? DEFAULT_RATES[model as AIModel] ?? null
}

/**
 * Tahmini maliyeti USD olarak döndürür.
 *
 * - Model tabloda yoksa `null` (bilinmiyor).
 * - Kullanıcı kendi anahtarını (BYOK) kullanıyorsa maliyet KadeAI'ye ait
 *   olmadığı için `0` döner; bu ayrım `byok` sütunuyla birlikte saklanır.
 * - Sağlayıcı input/output ayrımı vermiyorsa toplam token, çıktı fiyatından
 *   hesaplanır (üst sınır tahmini; marjı olduğundan iyi göstermez).
 */
export function estimateCostUsd(input: {
  model: string
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  byok?: boolean
}): number | null {
  if (input.byok) return 0
  const rate = getModelRate(input.model)
  if (!rate) return null

  const inTok = Number(input.inputTokens)
  const outTok = Number(input.outputTokens)
  if (Number.isFinite(inTok) && Number.isFinite(outTok)) {
    return round6((inTok * rate.in + outTok * rate.out) / 1_000_000)
  }

  const total = Number(input.totalTokens)
  if (Number.isFinite(total) && total > 0) {
    return round6((total * rate.out) / 1_000_000)
  }
  return null
}

function round6(value: number) {
  return Math.round(value * 1e6) / 1e6
}

/** Admin ekranı için tablo görünümü. */
export function listModelRates() {
  const merged = { ...DEFAULT_RATES, ...overrides() } as Record<string, ModelRate>
  return Object.entries(merged)
    .map(([model, rate]) => ({ model, ...rate }))
    .sort((a, b) => a.model.localeCompare(b.model))
}

/** Yalnızca test içindir: env override önbelleğini sıfırlar. */
export function resetRateCacheForTests() {
  overrideCache = null
}
