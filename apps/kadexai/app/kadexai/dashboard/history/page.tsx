'use client'

import { useCallback, useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import { ChevronDown, ExternalLink, History, RotateCcw, Search, Trash2 } from 'lucide-react'
import { getModelLabel, getModelColor, cn } from '@/lib/utils'
import { apiFetch, LOCAL_HISTORY_KEY, LocalHistoryEntry } from '@/lib/client/api'
import { AIModel } from '@/types'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'
import { withPrefill } from '@/lib/client/prefill'
import { humanizeKey, humanizeValue } from '@/lib/ui/outputLabels'
import { historyReplayEndpoint, mergeAccountHistory } from '@/lib/client/history'
import { getToolById } from '@/lib/tools/registry'
import ModelOutput from '@/components/ui/ModelOutput'
import Link from 'next/link'

interface HistoryEntry {
  owner_id?: string
  remote_id?: string
  id: string
  tool: string
  model: string
  output: string
  input_data: Record<string, unknown>
  created_at: string
  status?: 'completed' | 'failed'
  error_message?: string
  tokens_used?: number
}

/** Araç adlarının kaynağı kayıt defteri; burada yalnızca birleştirilmiş ya da
 *  kaldırılmış eski araçların geçmişte kalan id'leri karşılanıyor. */
const LEGACY_TOOL_LABELS: Record<string, string> = {
  clips: 'Klip Üretici',
  performance: 'Viral Skor',
  analytics: 'Sosyal Medya Analizi',
  trends: 'Trend Radar',
  thread: 'Thread Yazarı',
  bulk: 'Toplu İçerik',
  translate: 'Altyazı Stüdyosu',
  tts: 'Dublaj Stüdyosu',
  'kade-search-script': 'KadeSearch Onay',
  sentscan: 'SentScan',
}

function toolLabel(id: string) {
  return getToolById(id)?.name ?? LEGACY_TOOL_LABELS[id] ?? id
}

const LEGACY_TOOL_ROUTES: Record<string, string> = {
  performance: '/dashboard/viral-score',
  trends: '/dashboard/trend-radar',
  analytics: '/dashboard/social-audit',
  clips: '/dashboard/clip-generator',
  translate: '/dashboard/subtitles',
  tts: '/dashboard/dubbing',
  'kade-search-script': '/dashboard/kade-search',
  sentscan: '/dashboard/operations?view=comments',
}

/** Girdi özetinde teknik alanlar gösterilmez; değerler okunur metne çevrilir. */
const HIDDEN_INPUT_KEYS = new Set(['model', 'profile', 'words', 'file'])

function inputPreview(value: unknown) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' || typeof item === 'number').join(', ')
  if (value && typeof value === 'object') return ''
  return humanizeValue(value)
}

function toolRoute(id: string) {
  return getToolById(id)?.route ?? LEGACY_TOOL_ROUTES[id]
}

export default function HistoryPage() {
  const workspaceHref = useWorkspaceHref()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('tümü')
  const [status, setStatus]   = useState('tümü')
  const [query, setQuery]     = useState('')
  const [from, setFrom]       = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rerunning, setRerunning] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadHistory = useCallback(() => {
    setLoading(true)
    setError('')
    return apiFetch('/api/history')
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.warning || data.error || 'Geçmiş yüklenemedi.')
        return data
      })
      .then((d) => {
        if (Array.isArray(d.history)) {
          let stored: LocalHistoryEntry[] = []
          try { const raw = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]'); if (Array.isArray(raw)) stored = raw } catch { /* bozuk önbellek sunucu geçmişini engellemez */ }
          setEntries(mergeAccountHistory(d.history, stored, d.ownerId || ''))
        } else {
          throw new Error('Geçmiş yanıtı geçersiz.')
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Geçmiş yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  const handleDelete = async (id: string) => {
    setDeleting(id); setError('')
    try {
      const entry = entries.find((item) => item.id === id)
      const remoteId = entry?.remote_id || (!id.startsWith('local-') ? id : null)
      if (remoteId) {
        const response = await apiFetch('/api/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: remoteId }) })
        if (!response.ok) throw new Error('Kayıt silinemedi. Listede korundu; yeniden deneyebilirsin.')
      }
      try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]')
        if (Array.isArray(stored)) localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(stored.filter((item) => item.id !== id && (!remoteId || item.remote_id !== remoteId))))
      } catch {
        if (!remoteId) throw new Error('Yerel kayıt silinemedi. Tarayıcı depolama iznini kontrol et.')
        setError('Sunucu kaydı silindi, ancak tarayıcı önbelleği temizlenemedi.')
      }
      setEntries((current) => current.filter((item) => item.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kayıt silinemedi.')
    } finally { setDeleting(null) }
  }

  const tools = ['tümü', ...Array.from(new Set(entries.map((e) => e.tool)))]
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
  const filtered = entries.filter((entry) => {
    if (filter !== 'tümü' && entry.tool !== filter) return false
    if (status !== 'tümü' && (entry.status || 'completed') !== status) return false
    if (from && new Date(entry.created_at) < new Date(`${from}T00:00:00`)) return false
    if (normalizedQuery && !`${toolLabel(entry.tool)} ${entry.output} ${entry.error_message || ''}`.toLocaleLowerCase('tr-TR').includes(normalizedQuery)) return false
    return true
  })

  const handleRerun = async (entry: HistoryEntry) => {
    const endpoint = historyReplayEndpoint(entry.tool)
    if (!endpoint) { setError('Bu eski araç doğrudan yeniden çalıştırılamıyor. Güncel aracı açıp girdileri kontrol et.'); return }
    if (!entry.input_data || Object.keys(entry.input_data).length === 0) {
      setError('Bu çalıştırmanın girdileri gizlendiği için yeniden çalıştırılamıyor.')
      return
    }
    setRerunning(entry.id)
    setError('')
    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.input_data),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Araç yeniden çalıştırılamadı.')
      window.setTimeout(() => void loadHistory(), 500)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Araç yeniden çalıştırılamadı.')
    } finally {
      setRerunning(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Geçmiş" description="Daha önce üretilen içerikler" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {loading && (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">Yükleniyor...</div>
          )}

          {error && (
            <div role="alert" className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-amber-400 text-sm">
              {error}
              <button type="button" disabled={loading} onClick={() => void loadHistory()} className="ml-3 underline">Yeniden yükle</button>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px]">
                <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Çıktı veya araç ara…" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-amber-400" /></label>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none"><option value="tümü">Tüm durumlar</option><option value="completed">Başarılı</option><option value="failed">Hatalı</option></select>
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
              {tools.map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    filter === t ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300')}>
                  {t === 'tümü' ? 'Tümü' : toolLabel(t)}
                  {t === 'tümü' && <span className="ml-1 text-zinc-600">({entries.length})</span>}
                </button>
              ))}
              </div>
            </div>
          )}

          {filtered.map((entry) => (
            <div key={entry.id} className={`rounded-xl border p-5 space-y-3 ${(entry.status || 'completed') === 'failed' ? 'border-red-900/60 bg-red-950/15' : 'border-zinc-700/50 bg-zinc-800/50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300 text-sm font-medium">{toolLabel(entry.tool)}</span>
                    <span className={cn('text-xs font-medium', getModelColor(entry.model as AIModel))}>
                      {getModelLabel(entry.model as AIModel)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(entry.status || 'completed') === 'failed' ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>{(entry.status || 'completed') === 'failed' ? 'Hatalı' : 'Başarılı'}</span>
                  </div>
                  <p className="text-zinc-600 text-xs">
                    {new Date(entry.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.output && <CopyButton text={entry.output} />}
                  {toolRoute(entry.tool) && (
                    <Link
                      prefetch={false}
                      href={workspaceHref(withPrefill(toolRoute(entry.tool)!, entry.input_data))}
                      title={`${toolLabel(entry.tool)} aracını bu girdilerle aç`}
                      aria-label={`${toolLabel(entry.tool)} aracını bu girdilerle aç`}
                      className="text-zinc-600 transition-colors hover:text-violet-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button title={historyReplayEndpoint(entry.tool) ? 'Aynı girdilerle yeniden çalıştır (sonuç Geçmiş’e eklenir)' : 'Bu araç doğrudan yeniden çalıştırılamaz; aracı açıp çalıştır'} aria-label="Aynı girdilerle yeniden çalıştır" disabled={rerunning !== null || !historyReplayEndpoint(entry.tool)} onClick={() => handleRerun(entry)} className="text-zinc-600 transition-colors hover:text-amber-300 disabled:opacity-40"><RotateCcw className={cn('h-4 w-4', rerunning === entry.id && 'animate-spin')} /></button>
                  <button aria-label="Kaydı sil" disabled={deleting !== null} onClick={() => handleDelete(entry.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className={cn((entry.status || 'completed') === 'failed' ? 'text-red-300' : 'text-zinc-400', expanded === entry.id ? '' : 'max-h-24 overflow-hidden')}>
                <ModelOutput content={entry.output || entry.error_message || 'Çalıştırma tamamlanamadı.'} />
              </div>
              {entry.input_data && Object.keys(entry.input_data).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(entry.input_data)
                    .filter(([k, v]) => !HIDDEN_INPUT_KEYS.has(k) && inputPreview(v))
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <span key={k} className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
                        {humanizeKey(k)}: {inputPreview(v).slice(0, 40)}
                      </span>
                    ))}
                </div>
              )}
              <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === entry.id ? 'rotate-180' : ''}`} /> {expanded === entry.id ? 'Ayrıntıları kapat' : 'Ayrıntıları göster'}</button>
              {expanded === entry.id && <div className="grid gap-3 border-t border-zinc-700/70 pt-3 text-xs sm:grid-cols-2"><div><p className="mb-1 font-semibold text-zinc-500">Girdiler</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-zinc-400">{JSON.stringify(entry.input_data, null, 2)}</pre></div><div><p className="mb-1 font-semibold text-zinc-500">Çalıştırma</p><div className="space-y-1 rounded-lg bg-zinc-950 p-3 text-zinc-400"><p>Kimlik: {entry.id}</p><p>Model: {entry.model}</p><p>Token: {entry.tokens_used ?? 'Bildirilmedi'}</p><p>Tarih: {new Date(entry.created_at).toLocaleString('tr-TR')}</p></div></div></div>}
            </div>
          ))}

          {!loading && entries.length > 0 && filtered.length === 0 && <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">Bu filtrelerle eşleşen çalıştırma yok.</div>}

          {!loading && !error && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
              <History className="w-10 h-10 opacity-30" />
              <p className="text-sm">Henüz kaydedilmiş içerik yok</p>
              <p className="text-xs text-center max-w-xs">Bir araçtan başarılı çıktı aldığında bu liste otomatik oluşur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
