'use client'

import { useEffect, useState } from 'react'
import { apiPath } from '@/lib/appConfig'
import { Activity, CheckCircle, Circle, Cpu, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type EnvStatus = Record<string, boolean>

const providers = [
  {
    id: 'VERCEL_AI_GATEWAY',
    label: 'Vercel AI Gateway',
    status: 'Aylık ücretsiz kredi ve otomatik yedek',
    models: 'Qwen 3.7 Flash · düşük maliyet',
    color: 'text-lime-400',
    bg: 'bg-lime-900/30',
  },
  {
    id: 'CEREBRAS_API_KEY',
    label: 'Cerebras',
    status: 'Yüksek hacimli üretim',
    models: 'GLM 4.7, GPT-OSS 120B',
    color: 'text-violet-400',
    bg: 'bg-violet-900/30',
  },
  {
    id: 'GROQ_API_KEY',
    label: 'Groq',
    status: 'Genel üretim, hızlı JSON',
    models: 'Llama 70B, Scout, Qwen, GPT-OSS',
    color: 'text-orange-400',
    bg: 'bg-orange-900/30',
  },
  {
    id: 'GEMINI_API_KEY',
    label: 'Gemini',
    status: 'Uzun bağlam ve planlama',
    models: 'Flash, Flash-Lite, 3.5 Flash',
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
  },
  {
    id: 'MISTRAL_API_KEY',
    label: 'Mistral',
    status: 'Analiz, muhakeme ve kod',
    models: 'Magistral, Medium, Codestral',
    color: 'text-red-400',
    bg: 'bg-red-900/30',
  },
  {
    id: 'OPENROUTER_API_KEY',
    label: 'OpenRouter',
    status: 'Yedek yönlendirme ve alternatifler',
    models: 'Free Router, GLM Air, Nemotron',
    color: 'text-purple-400',
    bg: 'bg-purple-900/30',
  },
]

const roles = [
  ['Konu ve amaç', 'Görev sinyalleri puanlanır'],
  ['Çıktı biçimi', 'JSON / tablo / yaratıcı metin'],
  ['Bağlam uzunluğu', 'Uzun metne uygun pencere'],
  ['Üretim hacmi', 'Hız ve çıktı miktarı'],
  ['Sağlayıcı durumu', 'Yalnızca bağlı modeller'],
  ['Kesinti anı', 'Sıralı otomatik yedek'],
]

export default function AIHealthPanel() {
  const [status, setStatus] = useState<EnvStatus>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiPath('/api/env-status')}?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({}))
      .finally(() => setLoading(false))
  }, [])

  const readyCount = providers.filter((provider) => status[provider.id]).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">AI Sağlık Paneli</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {loading ? 'Sağlayıcı durumları kontrol ediliyor' : `${readyCount}/${providers.length} AI sağlayıcısı bağlı`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300">
          <Activity className="h-3.5 w-3.5 text-orange-400" />
          Otomatik seçim aktif
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {providers.map((provider) => {
          const ok = Boolean(status[provider.id])
          return (
            <div key={provider.id} className="rounded-lg border border-zinc-700/50 bg-zinc-900 p-3">
              <div className="flex items-start gap-2">
                <span className={cn('grid h-8 w-8 place-items-center rounded-lg flex-shrink-0', provider.bg)}>
                  <Cpu className={cn('h-4 w-4', provider.color)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-zinc-200">{provider.label}</p>
                    {ok ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-500">{provider.status}</p>
                  <p className="mt-1 truncate text-[10px] font-medium text-zinc-400">{provider.models}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <p className="text-xs font-semibold text-zinc-200">Konuya Göre Otomatik Model Mantığı</p>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {roles.map(([role, model]) => (
            <div key={role} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-zinc-500">{role}</span>
              <span className="truncate font-semibold text-zinc-300">{model}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
