'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import AIHealthPanel from '@/components/settings/AIHealthPanel'
import { CheckCircle, XCircle, ExternalLink, Save, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPath } from '@/lib/appConfig'
import AccountSettingsPanel from '@/components/profile/AccountSettingsPanel'

declare global {
  interface Window {
    electronAPI?: {
      getConfigStatus: () => Promise<{ configured: Record<string, boolean>; path: string; encryptionAvailable: boolean }>
      setConfig: (data: Record<string, string>) => Promise<{ ok: boolean }>
      isElectron: boolean
      platform: string
    }
  }
}

const KEY_DEFS = [
  {
    id: 'AI_GATEWAY_API_KEY',
    label: 'Vercel AI Gateway',
    placeholder: 'vck_...',
    url: 'https://vercel.com/ai-gateway',
    urlLabel: 'vercel.com/ai-gateway',
    color: 'text-lime-400',
    dot: 'bg-lime-400',
    models: ['Qwen 3.7 Flash', 'Vercel üzerindeki diğer modeller'],
    optional: true,
  },
  {
    id: 'GROQ_API_KEY',
    label: 'Groq (Açık Modeller)',
    placeholder: 'gsk_...',
    url: 'https://console.groq.com/keys',
    urlLabel: 'console.groq.com',
    color: 'text-lime-400',
    dot: 'bg-lime-400',
    models: ['Llama 3.3 70B', 'GPT-OSS 120B', 'Llama 3.1 8B', 'Qwen3 32B', 'Whisper'],
  },
  {
    id: 'OPENROUTER_API_KEY',
    label: 'OpenRouter (Free Router)',
    placeholder: 'sk-or-v1-...',
    url: 'https://openrouter.ai/keys',
    urlLabel: 'openrouter.ai',
    color: 'text-fuchsia-400',
    dot: 'bg-fuchsia-400',
    models: ['openrouter/free', 'Free model pool'],
  },
  {
    id: 'CEREBRAS_API_KEY',
    label: 'Cerebras (Hızlı Inference)',
    placeholder: 'csk-...',
    url: 'https://cloud.cerebras.ai',
    urlLabel: 'cloud.cerebras.ai',
    color: 'text-violet-400',
    dot: 'bg-violet-400',
    models: ['GLM 4.7', 'GPT-OSS 120B'],
  },
  {
    id: 'MISTRAL_API_KEY',
    label: 'Mistral',
    placeholder: '...',
    url: 'https://console.mistral.ai',
    urlLabel: 'console.mistral.ai',
    color: 'text-red-400',
    dot: 'bg-red-400',
    models: ['NeMo', 'Magistral', 'Codestral'],
  },
  {
    id: 'ANTHROPIC_API_KEY',
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    url: 'https://console.anthropic.com/settings/keys',
    urlLabel: 'console.anthropic.com',
    color: 'text-orange-400',
    dot: 'bg-orange-400',
    models: ['Claude Sonnet 4.5'],
    optional: true,
  },
  {
    id: 'OPENAI_API_KEY',
    label: 'OpenAI (GPT-4o + TTS)',
    placeholder: 'sk-...',
    url: 'https://platform.openai.com/api-keys',
    urlLabel: 'platform.openai.com',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    models: ['GPT-4o', 'GPT Image 2', 'TTS-1-HD'],
    optional: true,
  },
  {
    id: 'GEMINI_API_KEY',
    label: 'Google (Gemini)',
    placeholder: 'AIza...',
    url: 'https://aistudio.google.com/apikey',
    urlLabel: 'aistudio.google.com',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    models: ['Gemini 1.5 Pro'],
  },
  {
    id: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'Supabase URL',
    placeholder: 'https://xxx.supabase.co',
    url: 'https://supabase.com/dashboard',
    urlLabel: 'supabase.com',
    color: 'text-teal-400',
    dot: 'bg-teal-400',
    models: ['Auth', 'Database'],
  },
  {
    id: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    label: 'Supabase Anon Key',
    placeholder: 'eyJ...',
    url: 'https://supabase.com/dashboard',
    urlLabel: 'supabase.com',
    color: 'text-teal-400',
    dot: 'bg-teal-400',
    models: ['Auth', 'Database'],
  },
]

const TEXT_PROVIDER_KEYS = [
  'VERCEL_AI_GATEWAY',
  'AI_GATEWAY_API_KEY',
  'GROQ_API_KEY',
  'CEREBRAS_API_KEY',
  'OPENROUTER_API_KEY',
  'MISTRAL_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
] as const

const INFRA_DEFS = [
  { id: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase proje adresi', use: 'Oturum, geçmiş, şablon ve takvim bulut eşitlemesi' },
  { id: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anonim anahtarı', use: 'RLS korumalı istemci ve sunucu erişimi' },
  { id: 'YOUTUBE_API_KEY', label: 'YouTube Data API', use: 'Trend toplama, materyal eşitleme ve yorum okuma' },
  { id: 'GOOGLE_OAUTH_CLIENT_ID', label: 'Google OAuth istemcisi', use: 'YouTube kanalını bağlama ve altyazı yükleme' },
  { id: 'GOOGLE_OAUTH_CLIENT_SECRET', label: 'Google OAuth sırrı', use: 'YouTube kanal bağlantısının sunucu tarafı' },
  { id: 'TOKEN_ENCRYPTION_KEY', label: 'Bağlantı şifreleme anahtarı', use: 'YouTube yenileme belirtecini güvenli saklama' },
  { id: 'TIKTOK_COOKIE', label: 'TikTok oturumu', use: 'TikTok trend ve materyal toplama' },
  { id: 'INSTAGRAM_SESSION_ID', label: 'Instagram oturumu', use: 'Instagram trend ve materyal toplama' },
  { id: 'KADE_FASTAPI_BASE_URL', label: 'Medya işlem motoru', use: 'Video Fabrikası, klip ve dublaj işlemleri' },
  { id: 'KADE_BACKEND_TOKEN', label: 'Medya motoru erişim belirteci', use: 'FastAPI isteklerinin kimlik doğrulaması' },
  { id: 'WHATSAPP', label: 'WhatsApp bildirimi', use: 'Operasyon raporları ve trend seçkileri' },
] as const

export default function SettingsPage() {
  const [isElectron, setIsElectron] = useState(false)
  const [config, setConfig]         = useState<Record<string, string>>({})
  const [electronConfigured, setElectronConfigured] = useState<Record<string, boolean>>({})
  const [encryptionAvailable, setEncryptionAvailable] = useState(true)
  const [saved, setSaved]           = useState(false)
  const [configPath, setConfigPath] = useState('')
  const [showKeys, setShowKeys]     = useState<Record<string, boolean>>({})
  const [envLoaded, setEnvLoaded]   = useState(false)
  const [settingsAccess, setSettingsAccess] = useState(false)
  const [serverEnvStatus, setServerEnvStatus] = useState<Record<string, boolean>>({
    VERCEL_AI_GATEWAY: false,
    AI_GATEWAY_API_KEY: false,
    GROQ_API_KEY: false,
    CEREBRAS_API_KEY: false,
    OPENROUTER_API_KEY: false,
    MISTRAL_API_KEY: false,
    ANTHROPIC_API_KEY: false,
    OPENAI_API_KEY: false,
    GEMINI_API_KEY: false,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    YOUTUBE_API_KEY: false,
    GOOGLE_OAUTH_CLIENT_ID: false,
    GOOGLE_OAUTH_CLIENT_SECRET: false,
    TOKEN_ENCRYPTION_KEY: false,
    TIKTOK_COOKIE: false,
    INSTAGRAM_SESSION_ID: false,
    KADE_FASTAPI_BASE_URL: false,
    KADE_BACKEND_TOKEN: false,
    WHATSAPP: false,
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      setIsElectron(true)
      window.electronAPI.getConfigStatus().then((status) => {
        setElectronConfigured(status.configured || {})
        setConfigPath(status.path || '')
        setEncryptionAvailable(status.encryptionAvailable !== false)
        setEnvLoaded(true)
      })
    } else {
      fetch(`${apiPath('/api/config')}?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then(async (appConfig) => {
          const canManage = appConfig.settingsAccess === true
          setSettingsAccess(canManage)
          if (!canManage) {
            setEnvLoaded(true)
            return
          }
          const response = await fetch(`${apiPath('/api/env-status')}?t=${Date.now()}`, { cache: 'no-store' })
          const status = await response.json()
          setServerEnvStatus(status)
          setEnvLoaded(true)
        })
        .catch(() => setEnvLoaded(true))
    }
  }, [])

  const handleSave = async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.setConfig(config)
    if (!result.ok) return
    setElectronConfigured((current) => {
      const next = { ...current }
      for (const [key, value] of Object.entries(config)) next[key] = Boolean(value.trim())
      return next
    })
    setConfig({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleShow = (id: string) =>
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }))

  const isConfigured = (id: string) => isElectron
    ? (Object.prototype.hasOwnProperty.call(config, id) ? Boolean(config[id]) : Boolean(electronConfigured[id]))
    : Boolean(serverEnvStatus[id])
  const textGenerationReady = TEXT_PROVIDER_KEYS.some(isConfigured)
  const imageGenerationReady = isConfigured('GEMINI_API_KEY') || isConfigured('OPENAI_API_KEY')
  const storageReady = isConfigured('NEXT_PUBLIC_SUPABASE_URL') && isConfigured('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const capabilityCount = [textGenerationReady, imageGenerationReady, storageReady].filter(Boolean).length
  const visibleCapabilityCount = envLoaded || isElectron ? capabilityCount : 0
  const [aktifSekme, setAktifSekme] = useState('marka')
  const canManageInfrastructure = isElectron || settingsAccess

  // Ayarlar tek uzun sayfaydı: marka briefi, profil alanları, tercihler,
  // sağlayıcı sağlığı, .env yönergeleri ve veritabanı şeması art arda
  // sıralanıyordu. Bunlar farklı işler ve farklı zamanlarda açılıyor;
  // göreve göre ayrıldı.
  const SEKMELER = ([
    { id: 'marka', etiket: 'Marka ve hafıza', aciklama: 'Şirket briefi, profil ve üretim tercihleri' },
    canManageInfrastructure && { id: 'saglayici', etiket: 'Sağlayıcılar', aciklama: 'Hangi AI sağlayıcıları bağlı, hangi model nereye gidiyor' },
    canManageInfrastructure && { id: 'altyapi', etiket: 'Altyapı', aciklama: 'Anahtar yapılandırması ve veritabanı şeması' },
  ].filter(Boolean) as Array<{ id: string; etiket: string; aciklama: string }>)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Ayarlar" description="Şirket briefi, AI hafızası ve sağlayıcılar" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {SEKMELER.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Ayar bölümleri">
              {SEKMELER.map((sekme) => (
                <button
                  key={sekme.id}
                  type="button"
                  role="tab"
                  aria-selected={aktifSekme === sekme.id}
                  onClick={() => setAktifSekme(sekme.id)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
                    aktifSekme === sekme.id
                      ? 'border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] text-[color:var(--kade-a-600)]'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  {sekme.etiket}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-zinc-500">
            {SEKMELER.find((x) => x.id === aktifSekme)?.aciklama}
          </p>

          {aktifSekme === 'marka' && <AccountSettingsPanel />}

          {canManageInfrastructure && aktifSekme === 'saglayici' && <>
          {/* Status overview */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-zinc-200 font-medium">Sistem Durumu</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                {envLoaded || isElectron
                  ? `${visibleCapabilityCount}/3 çalışma özelliği etkin`
                  : 'API anahtarları kontrol ediliyor'}
              </p>
              {isElectron && (
                <p className="text-violet-400 text-xs mt-1">Masaüstü uygulama — anahtarlar yerel olarak saklanır</p>
              )}
            </div>
            <div className="w-16 h-16 relative flex-shrink-0">
              <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#27272a" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3"
                  strokeDasharray={`${(visibleCapabilityCount / 3) * 88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-zinc-200 text-sm font-semibold">
                {Math.round((visibleCapabilityCount / 3) * 100)}%
              </span>
            </div>
          </div>

          <AIHealthPanel />

          {/* Electron: editable form */}
          {isElectron ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-violet-300 text-sm font-medium mb-1">Masaüstü Uygulama — API Anahtarları</p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Anahtarlar şifrelenmiş şekilde <code className="text-zinc-400">{configPath}</code> dosyasında saklanır.
                  Değişiklikler uygulamayı yeniden başlatınca etkin olur.
                </p>
                {!encryptionAvailable && <p role="alert" className="mt-2 text-xs text-red-300">İşletim sistemi güvenli depolaması kullanılamıyor; anahtar kaydetme devre dışı.</p>}
              </div>

              {KEY_DEFS.map((k) => (
                <div key={k.id} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full', k.dot)} />
                    <span className={cn('text-sm font-medium', k.color)}>{k.label}</span>
                    {isConfigured(k.id) ? (
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Ayarlı
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center gap-1 text-xs text-zinc-600">
                        <XCircle className="w-3.5 h-3.5" /> Boş
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showKeys[k.id] ? 'text' : 'password'}
                      value={config[k.id] || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [k.id]: e.target.value }))}
                      placeholder={isConfigured(k.id) ? 'Değiştirmek için yeni değer girin' : k.placeholder}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] font-mono"
                    />
                    <button onClick={() => toggleShow(k.id)}
                      className="px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                      {showKeys[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <a href={k.url} target="_blank" rel="noopener noreferrer"
                      className="px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-violet-400 transition-colors flex items-center">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}

              <button onClick={handleSave} disabled={!encryptionAvailable || Object.keys(config).length === 0}
                className={cn('w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  saved ? 'bg-emerald-500 text-white' : 'bg-[#f2c322] text-zinc-950 hover:bg-[#ffda3f] disabled:cursor-not-allowed disabled:opacity-50')}>
                <Save className="w-4 h-4" />
                {saved ? '✓ Kaydedildi' : 'Kaydet'}
              </button>
            </div>
          ) : (
            // Web: read-only status + instructions
            <>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
                <h3 className="text-violet-300 font-medium text-sm">Nasıl Yapılandırılır?</h3>
                <ol className="space-y-1.5 text-zinc-400 text-sm">
                  <li className="flex gap-2"><span className="text-violet-400 font-mono text-xs mt-0.5">1.</span>Proje kökündeki <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-violet-300">.env.local</code> dosyasını aç</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-mono text-xs mt-0.5">2.</span>Aşağıdaki linklere git, API anahtarı oluştur</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-mono text-xs mt-0.5">3.</span>Vercel'de <strong>Settings → Environment Variables</strong>'a ekle</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-mono text-xs mt-0.5">4.</span>Yeniden deploy et</li>
                </ol>
              </div>

              <div className="space-y-3">
                {KEY_DEFS.map((k) => {
                  const ok = serverEnvStatus[k.id] ?? false
                  const alternativeProvider = TEXT_PROVIDER_KEYS.includes(k.id as typeof TEXT_PROVIDER_KEYS[number])
                  const optionalMissing = !ok && (k.optional || alternativeProvider)
                  return (
                    <div key={k.id} className={cn('rounded-xl border p-4 space-y-2',
                      ok
                        ? 'border-zinc-700/50 bg-zinc-800/30'
                        : optionalMissing
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-red-500/20 bg-red-500/5')}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2.5 h-2.5 rounded-full', k.dot)} />
                        <span className={cn('text-sm font-medium', k.color)}>{k.label}</span>
                        <span className="ml-auto flex items-center gap-1 text-xs">
                          {!envLoaded
                            ? <span className="text-zinc-500">Kontrol ediliyor</span>
                            : ok
                            ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Yapılandırıldı</span></>
                            : optionalMissing
                              ? <span className="text-zinc-500">Bağlı değil</span>
                            : <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400">Eksik</span></>
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {k.models.map((m) => (
                            <span key={m} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">{m}</span>
                          ))}
                        </div>
                        <a href={k.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          {k.urlLabel} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4 space-y-2">
                <h3 className="text-zinc-300 font-medium text-sm">Supabase DB Schema</h3>
                <pre className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-400 overflow-x-auto">{`-- supabase/schema.sql dosyasını
-- Supabase Dashboard > SQL Editor'da çalıştır`}</pre>
              </div>
            </>
          )}
          </>}

          {canManageInfrastructure && aktifSekme === 'altyapi' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <h2 className="text-sm font-semibold text-cyan-200">Servis ve veri kaynağı durumu</h2>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Bu ekran yalnızca değişkenin yapılandırılıp yapılandırılmadığını gösterir; anahtar değerleri tarayıcıya gönderilmez.
                </p>
              </div>

              <div className="space-y-2">
                {INFRA_DEFS.map((item) => {
                  const configured = isConfigured(item.id)
                  return (
                    <div key={item.id} className={cn('rounded-xl border p-4', configured ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
                      <div className="flex flex-wrap items-center gap-2">
                        {configured ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        <strong className="text-sm text-zinc-200">{item.label}</strong>
                        <span className={cn('ml-auto text-xs font-medium', configured ? 'text-emerald-400' : 'text-red-300')}>{configured ? 'Yapılandırıldı' : 'Eksik'}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{item.use}</p>
                      <code className="mt-2 inline-block rounded bg-zinc-950 px-2 py-1 text-[11px] text-zinc-500">{item.id}</code>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4 space-y-2">
                <h3 className="text-zinc-300 font-medium text-sm">Supabase DB Schema</h3>
                <pre className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-400 overflow-x-auto">{`-- supabase/schema.sql dosyasını\n-- Supabase Dashboard > SQL Editor'da çalıştır`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
