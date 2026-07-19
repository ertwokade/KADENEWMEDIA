'use client'

import { AIModel } from '@/types'
import { apiPath } from '@/lib/appConfig'
import { accountContextForRequest, normalizeAccountContext, PROFILE_STORAGE_KEY } from '@/lib/profile/types'
import { captureAnalytics } from '@/lib/analytics/client'

export const LOCAL_HISTORY_KEY = 'kade-generation-history'

export interface LocalHistoryEntry {
  id: string
  tool: string
  model: AIModel | string
  output: string
  input_data: Record<string, unknown>
  created_at: string
  status: 'completed' | 'failed'
  error_message?: string
  tokens_used?: number
  provider?: string
  profile_snapshot?: Record<string, unknown>
}

function extractOutput(data: Record<string, unknown>) {
  if (typeof data.image === 'string') return `Görsel üretildi (${typeof data.provider === 'string' ? data.provider : 'AI sağlayıcısı'})`
  const directKeys = ['content', 'text', 'description', 'analysis', 'report']
  for (const key of directKeys) {
    if (typeof data[key] === 'string' && data[key]) return data[key]
  }

  const useful = Object.fromEntries(
    Object.entries(data).filter(([key]) => !['model', 'tokensUsed', 'routingReason'].includes(key))
  )
  return Object.keys(useful).length ? JSON.stringify(useful, null, 2) : ''
}

function readAccountContext() {
  try {
    return normalizeAccountContext(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null'))
  } catch {
    return normalizeAccountContext(null)
  }
}

function encodeProfileHeader() {
  const compact = JSON.stringify(accountContextForRequest(readAccountContext()))
  const bytes = new TextEncoder().encode(compact)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function prepareInit(url: string, init?: RequestInit): RequestInit | undefined {
  if (!url.startsWith('/api/generate/') && url !== '/api/image') return init
  const headers = new Headers(init?.headers)
  headers.set('X-Kade-Profile', encodeProfileHeader())
  return { ...init, headers }
}

function persistHistory(entry: LocalHistoryEntry) {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]')
    const history = Array.isArray(stored) ? stored : []
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, 200)))
  } catch {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify([entry]))
  }

  void fetch(apiPath('/api/history'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => undefined)
}

function saveGenerationResult(url: string, init: RequestInit | undefined, response: Response) {
  if (typeof window === 'undefined' || (!url.startsWith('/api/generate/') && url !== '/api/image')) return

  void response.clone().json().then((data: Record<string, unknown>) => {
    if (response.ok && typeof data.model === 'string') {
      window.dispatchEvent(new CustomEvent('kade:model-routed', {
        detail: {
          model: data.model,
          reason: typeof data.routingReason === 'string' ? data.routingReason : undefined,
        },
      }))
    }

    const output = response.ok ? extractOutput(data) : ''
    captureAnalytics(response.ok ? 'ai_request_completed' : 'ai_request_failed', {
      tool: url === '/api/image' ? 'image' : (url.split('/').pop() || 'generation'),
      status: response.status,
    })

    let inputData: Record<string, unknown> = {}
    if (typeof init?.body === 'string') {
      try {
        const parsed = JSON.parse(init.body)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) inputData = parsed
      } catch {
        // Form ve ham metin gövdeleri geçmiş önizlemesine eklenmez.
      }
    }

    const account = readAccountContext()
    const entry: LocalHistoryEntry = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool: url === '/api/image' ? 'ai-thumbnail' : (url.split('/').pop() || 'generation'),
      model: typeof data.model === 'string'
        ? data.model
        : typeof inputData.model === 'string'
          ? inputData.model
          : 'auto',
      output,
      input_data: account.preferences.rememberInputs ? inputData : {},
      created_at: new Date().toISOString(),
      status: response.ok ? 'completed' : 'failed',
      error_message: response.ok ? undefined : (typeof data.error === 'string' ? data.error : `HTTP ${response.status}`),
      tokens_used: typeof data.tokensUsed === 'number' ? data.tokensUsed : undefined,
      profile_snapshot: accountContextForRequest(account) as unknown as Record<string, unknown>,
    }
    persistHistory(entry)
  }).catch(() => undefined)
}

function saveNetworkFailure(url: string, init: RequestInit | undefined, error: unknown) {
  if (!url.startsWith('/api/generate/') && url !== '/api/image') return
  captureAnalytics('ai_request_failed', { tool: url.split('/').pop() || 'generation', status: 0 })
  let inputData: Record<string, unknown> = {}
  if (typeof init?.body === 'string') {
    try { inputData = JSON.parse(init.body) as Record<string, unknown> } catch {}
  }
  const account = readAccountContext()
  persistHistory({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tool: url === '/api/image' ? 'ai-thumbnail' : (url.split('/').pop() || 'generation'),
    model: typeof inputData.model === 'string' ? inputData.model : 'auto',
    output: '',
    input_data: account.preferences.rememberInputs ? inputData : {},
    created_at: new Date().toISOString(),
    status: 'failed',
    error_message: error instanceof Error ? error.message : 'Ağ isteği tamamlanamadı.',
    profile_snapshot: accountContextForRequest(account) as unknown as Record<string, unknown>,
  })
}

export async function apiFetch(input: string, init?: RequestInit, timeoutMs = 60_000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const externalSignal = init?.signal
  const abortFromExternal = () => controller.abort()
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  try {
    const requestUrl = input.startsWith('/api/') ? apiPath(input) : input
    const preparedInit = prepareInit(input, init)
    const response = await fetch(requestUrl, { ...preparedInit, signal: controller.signal })
    saveGenerationResult(input, init, response)
    return response
  } catch (error) {
    saveNetworkFailure(input, init, error)
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new Error('İstek zaman aşımına uğradı. Bağlantını kontrol edip yeniden dene.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}
