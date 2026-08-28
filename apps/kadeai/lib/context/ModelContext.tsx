'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { AIModel } from '@/types'
import { SELECTABLE_MODELS, compareModelsFrom } from '@/lib/ai/models'
import { apiFetch } from '@/lib/client/api'

export const MANUAL_MODEL_STORAGE_KEY = 'kade-manual-model-v1'

interface ModelContextType {
  selectedModel: AIModel
  setSelectedModel: (model: AIModel) => void
  autoReason: string | null
  isAutoSelected: boolean
  applyToolDefault: (toolId: string) => void
  /** Yapılandırılmış sağlayıcılarla kesişen karşılaştırma modelleri. */
  compareModels: AIModel[]
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children, initialToolId }: { children: ReactNode; initialToolId?: string }) {
  const [selectedModel, setSelectedModelRaw] = useState<AIModel>('auto')
  const [autoReason, setAutoReason] = useState<string | null>(
    () => initialToolId
      ? 'Otomatik seçim açık: görev içeriği ve çalışan sağlayıcılar değerlendirilecek.'
      : 'Görevin içeriği ve çalışan sağlayıcılar değerlendirilir.'
  )
  const [isAutoSelected, setIsAutoSelected] = useState(true)
  const [compareModels, setCompareModels] = useState<AIModel[]>([])

  // Hangi sağlayıcıların yapılandırıldığını sunucu bilir; tek yerden okunup
  // karşılaştırma sunan tüm araçlara dağıtılır.
  useEffect(() => {
    let cancelled = false
    apiFetch('/api/config', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (cancelled || !Array.isArray(data?.availableModels)) return
        setCompareModels(compareModelsFrom(data.availableModels))
      })
      .catch(() => {
        // Okunamazsa karşılaştırma kapalı kalır; yanlış model adı göstermekten iyidir.
      })
    return () => { cancelled = true }
  }, [])

  const setSelectedModel = useCallback((model: AIModel) => {
    setSelectedModelRaw(model)
    const auto = model === 'auto'
    if (!auto && typeof window !== 'undefined' && SELECTABLE_MODELS.includes(model)) {
      window.localStorage.setItem(MANUAL_MODEL_STORAGE_KEY, model)
    }
    setIsAutoSelected(auto)
    setAutoReason(auto ? 'Görev içeriği ve çalışan sağlayıcılar değerlendirilecek.' : null)
  }, [])

  useEffect(() => {
    const handleRouting = (event: Event) => {
      const detail = (event as CustomEvent<{ model?: string; reason?: string }>).detail
      if (!detail?.model || !isAutoSelected) return
      setAutoReason(`${detail.model}${detail.reason ? ` · ${detail.reason}` : ''}`)
    }

    window.addEventListener('kade:model-routed', handleRouting)
    return () => window.removeEventListener('kade:model-routed', handleRouting)
  }, [isAutoSelected])

  const applyToolDefault = useCallback((toolId: string) => {
    setSelectedModelRaw('auto')
    setAutoReason(
      toolId
        ? 'Otomatik seçim açık: görev içeriği ve çalışan sağlayıcılar değerlendirilecek.'
        : 'Görevin içeriği ve çalışan sağlayıcılar değerlendirilir.'
    )
    setIsAutoSelected(true)
  }, [])

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, autoReason, isAutoSelected, applyToolDefault, compareModels }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModel(): ModelContextType {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}
