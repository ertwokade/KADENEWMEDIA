'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AIModel } from '@/types'
import { useModel } from '@/lib/context/ModelContext'
import { cn } from '@/lib/utils'
import {
  MODEL_PROVIDER_GROUPS,
  ModelProviderId,
  SELECTABLE_MODELS,
  getModelConfig,
} from '@/lib/ai/models'
import {
  Brain,
  Check,
  ChevronDown,
  Cpu,
  Gauge,
  Gem,
  Globe2,
  Route,
  Sparkles,
  Zap,
} from 'lucide-react'
import { apiPath } from '@/lib/appConfig'

interface ModelSelectorProps {
  value: AIModel
  onChange: (model: AIModel) => void
}

type ActiveProvider = ModelProviderId | 'all'

const models = SELECTABLE_MODELS
  .filter((model) => model !== 'auto')
  .map(getModelConfig)

const providerIcons: Record<ModelProviderId | 'all', typeof Cpu> = {
  all: Sparkles,
  auto: Sparkles,
  vercel: Zap,
  cerebras: Zap,
  groq: Gauge,
  openrouter: Route,
  google: Gem,
  mistral: Globe2,
  anthropic: Brain,
  openai: Cpu,
}

const speedLabels = {
  fastest: 'Çok hızlı',
  fast: 'Hızlı',
  balanced: 'Dengeli',
} as const

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { isAutoSelected, autoReason } = useModel()
  const [isOpen, setIsOpen] = useState(false)
  const [activeProvider, setActiveProvider] = useState<ActiveProvider>('all')
  const [availableModels, setAvailableModels] = useState<Set<AIModel>>(new Set(['auto']))
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = getModelConfig(value)
  const SelectedIcon = providerIcons[selected.provider]

  const directlyAvailableModels = useMemo(
    () => models.filter((model) => availableModels.has(model.id)),
    [availableModels]
  )

  const visibleModels = useMemo(() => {
    if (activeProvider === 'all') return directlyAvailableModels
    return directlyAvailableModels.filter((model) => model.provider === activeProvider)
  }, [activeProvider, directlyAvailableModels])

  const visibleProviders = useMemo(() => {
    const ids = new Set(directlyAvailableModels.map((model) => model.provider))
    return MODEL_PROVIDER_GROUPS.filter((provider) => provider.id === 'all' || ids.has(provider.id))
  }, [directlyAvailableModels])

  useEffect(() => {
    const controller = new AbortController()
    fetch(apiPath('/api/config'), { cache: 'no-store', signal: controller.signal })
      .then((response) => response.json())
      .then((data: { availableModels?: AIModel[] }) => {
        setAvailableModels(new Set(data.availableModels?.length ? data.availableModels : ['auto']))
        setAvailabilityLoaded(true)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setAvailabilityLoaded(true)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  return (
    <div ref={rootRef} className="relative w-auto min-w-0 max-w-[220px]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        title={isAutoSelected && autoReason ? autoReason : undefined}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-3 rounded-lg border bg-zinc-900 px-3 text-left shadow-sm transition-colors',
          isOpen ? 'border-orange-400' : 'border-zinc-700 hover:border-orange-400'
        )}
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('grid h-6 w-6 place-items-center rounded-lg bg-zinc-950', selected.colorClass)}>
            <SelectedIcon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-zinc-100">{selected.shortLabel}</span>
              {isAutoSelected && <Sparkles className="h-3 w-3 shrink-0 text-orange-500" />}
            </span>
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-500 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,520px)] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40">
          <div className="border-b border-zinc-800 p-2">
            <button
              type="button"
              onClick={() => {
                onChange('auto')
                setActiveProvider('all')
                setIsOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                value === 'auto'
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-200'
                  : 'border-transparent text-zinc-200 hover:border-zinc-700 hover:bg-zinc-950'
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-orange-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">Otomatik seçim</span>
                <span className="mt-0.5 block text-[10px] text-zinc-500">
                  Konu, amaç, çıktı biçimi, uzunluk ve çalışan sağlayıcıları birlikte puanlar
                </span>
              </span>
              {value === 'auto' && <Check className="h-4 w-4" />}
            </button>
          </div>
          <div className="border-b border-zinc-800 p-2">
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Manuel seçim</p>
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
              {visibleProviders.map((provider) => {
                const ProviderIcon = providerIcons[provider.id]
                const active = activeProvider === provider.id
                return (
                  <button
                    key={provider.id}
                    type="button"
                    title={provider.description}
                    onClick={() => setActiveProvider(provider.id)}
                    className={cn(
                      'flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-semibold transition-colors',
                      active
                        ? 'border-orange-500/50 bg-orange-900/30 text-orange-300'
                        : 'border-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                    )}
                  >
                    <ProviderIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{provider.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            <div className="grid gap-1">
              {!availabilityLoaded && (
                <p className="px-3 py-6 text-center text-xs text-zinc-500">Çalışan modeller kontrol ediliyor…</p>
              )}
              {visibleModels.map((model) => {
                const ProviderIcon = providerIcons[model.provider]
                const isActive = value === model.id
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange(model.id)
                      setActiveProvider(model.provider)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'grid min-h-16 grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                      isActive
                        ? model.activeClass
                        : 'border-transparent text-zinc-100 hover:border-zinc-700 hover:bg-zinc-950'
                    )}
                  >
                    <span className={cn('grid h-8 w-8 place-items-center rounded-lg bg-zinc-800', model.colorClass)}>
                      <ProviderIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">{model.label}</span>
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug opacity-70">{model.description}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5 text-[9px] text-zinc-500">
                        <span>{model.provider.toUpperCase()}</span>
                        {model.speed && <span>· {speedLabels[model.speed]}</span>}
                        {model.contextLabel && <span>· {model.contextLabel}</span>}
                      </span>
                    </span>
                    <span className="grid h-7 w-7 place-items-center">
                      {isActive && <Check className="h-4 w-4" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Otomatik seçim açıklaması üst barda ikinci bir satır açıyordu; artık
          yalnızca düğmenin başlığında (title) duruyor. */}
    </div>
  )
}
