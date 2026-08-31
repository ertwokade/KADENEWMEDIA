'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BarChart2, Bell, Eye, Lightbulb, Loader2,
  MessageCircle, Radio, Search, Send, Sprout, Trash2, X,
} from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import TopBar from '@/components/layout/TopBar'
import TrendCard from '@/components/dashboard/trend-radar/TrendCard'
import CollectPanel from '@/components/dashboard/trend-radar/CollectPanel'
import { CATEGORIES, KIND_LABELS, STAGES, platformLabel } from '@/lib/kade-search/taxonomy'
import { fmtCount } from '@/lib/kade-search/util'
import type { CurrentTrendRow } from '@/lib/kade-search/types'
import { cn } from '@/lib/utils'

type TabKey = 'trendler' | 'radar' | 'nabiz' | 'fikirler' | 'uyarilar'

const TABS: Array<{ key: TabKey; label: string; icon: typeof Radio }> = [
  { key: 'trendler', label: 'Trendler', icon: BarChart2 },
  { key: 'radar', label: 'Erken Radar', icon: Sprout },
  { key: 'nabiz', label: 'Kategori Nabzı', icon: Activity },
  { key: 'fikirler', label: 'İçerik Fikirleri', icon: Lightbulb },
  { key: 'uyarilar', label: 'Uyarılar', icon: Bell },
]

const PLATFORMS = ['tiktok', 'instagram', 'youtube_shorts', 'youtube', 'google', 'reddit', 'music']
const KINDS = ['hashtag', 'sound', 'video', 'creator', 'topic', 'keyword']
const SORTS: Array<{ key: string; label: string }> = [
  { key: 'score', label: 'Skor' },
  { key: 'velocity', label: 'Hız' },
  { key: 'views', label: 'Hacim' },
  { key: 'new', label: 'Yeni' },
]

interface StatsResponse {
  trends: number
  snapshots: number
  links: number
  alerts: number
  lastRun: { started_at: string; status: string; items_found: number; items_new: number } | null
  byPlatform: Array<{ value: string; count: number }>
  byStage: Array<{ value: string; count: number }>
  kaynaklar: Array<{ id: string; label: string; configured: boolean }>
}

interface PulseGroup {
  kategori: string
  label: string
  emoji: string
  ortalamaSkor: number
  trendler: Array<{ id: string; title: string; platform: string; url: string | null; score: number | null; stage: string | null }>
}

interface Idea {
  trendId: string
  baslik: string
  kaynak: { platform: string; skor: number; asama: string; hacim: string; url: string | null }
  kategori: string
  format: { label: string; aciklama: string }
  kanca: string
  alternatifKancalar: string[]
  kurgu: string[]
  cta: string
  hashtagler: string[]
  sesOnerisi: { title: string; author: string | null } | null
  zorluk: { level: string; note: string }
  paylasimSaati: string[]
  neden: string
}

interface AlertRow {
  id: number
  type: string
  message: string
  severity: string
  created_at: string
  url?: string | null
}

interface WatchItem {
  id: string
  term: string
  normalized: string
}

interface TrendDetail extends CurrentTrendRow {
  history: Array<{ captured_at: string; views: number; likes: number; posts: number }>
  related: Array<{ id: string; title: string; platform: string; confidence: number }>
}

const severityStyles: Record<string, string> = {
  high: 'border-red-500/30 bg-red-500/10 text-red-300',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info: 'border-zinc-700 bg-zinc-800/50 text-zinc-400',
}

export default function TrendRadarPage() {
  const [tab, setTab] = useState<TabKey>('trendler')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [platform, setPlatform] = useState('all')
  const [category, setCategory] = useState('all')
  const [kind, setKind] = useState('all')
  const [stage, setStage] = useState('all')
  const [sort, setSort] = useState('score')
  const [since, setSince] = useState('168')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')

  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [trends, setTrends] = useState<CurrentTrendRow[]>([])
  const [pulse, setPulse] = useState<PulseGroup[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [watchTerm, setWatchTerm] = useState('')
  const [detail, setDetail] = useState<TrendDetail | null>(null)
  const [canCollect, setCanCollect] = useState(false)
  const [digestSending, setDigestSending] = useState(false)
  const [digestStatus, setDigestStatus] = useState('')
  const [selectionSending, setSelectionSending] = useState(false)
  const [selectionStatus, setSelectionStatus] = useState('')

  const categoryOptions = useMemo(
    () => Object.entries(CATEGORIES).map(([key, def]) => ({ key, label: `${def.emoji} ${def.label}` })),
    []
  )

  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/kade-search/stats')
      const json = await res.json()
      if (res.ok) setStats(json)
      else setError(json.error || 'Durum bilgisi alınamadı')
    } catch {
      setError('Durum bilgisi alınamadı')
    }
  }, [])

  const loadWatchlist = useCallback(async () => {
    try {
      const res = await apiFetch('/api/kade-search/watchlist')
      const json = await res.json()
      if (res.ok) setWatchlist(json.liste ?? [])
    } catch {
      /* izleme listesi kritik degil */
    }
  }, [])

  const loadTab = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (platform !== 'all') params.set('platform', platform)
      if (category !== 'all') params.set('category', category)
      if (kind !== 'all') params.set('kind', kind)
      if (stage !== 'all') params.set('stage', stage)
      if (search) params.set('q', search)
      params.set('sort', sort)
      params.set('since', since)
      params.set('limit', '60')

      const url =
        tab === 'trendler' ? `/api/kade-search/trends?${params}`
        : tab === 'radar' ? `/api/kade-search/radar?since=${since}&limit=40`
        : tab === 'nabiz' ? '/api/kade-search/pulse?limit=4'
        : tab === 'fikirler' ? `/api/kade-search/ideas?${new URLSearchParams({
            limit: '12',
            ...(category !== 'all' ? { category } : {}),
            ...(platform !== 'all' ? { platform } : {}),
          })}`
        : '/api/kade-search/alerts?limit=60'

      const res = await apiFetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Veri alınamadı')

      if (tab === 'trendler' || tab === 'radar') setTrends(json.trendler ?? [])
      else if (tab === 'nabiz') setPulse(json.nabiz ?? [])
      else if (tab === 'fikirler') setIdeas(json.fikirler ?? [])
      else setAlerts(json.uyarilar ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [tab, platform, category, kind, stage, sort, since, search])

  useEffect(() => {
    void loadStats()
    void loadWatchlist()
    fetch(apiPath('/api/config'), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => setCanCollect(config?.settingsAccess === true))
      .catch(() => setCanCollect(false))
  }, [loadStats, loadWatchlist])

  useEffect(() => {
    void loadTab()
  }, [loadTab])

  const openDetail = async (trend: CurrentTrendRow) => {
    setSelectionStatus('')
    try {
      const res = await apiFetch(`/api/kade-search/trend/${encodeURIComponent(trend.id)}`)
      const json = await res.json()
      if (res.ok) setDetail(json.trend)
    } catch {
      /* detay acilamadi - liste calismaya devam eder */
    }
  }

  useEffect(() => {
    const trendId = new URLSearchParams(window.location.search).get('trend')
    if (!trendId) return
    let cancelled = false
    void apiFetch(`/api/kade-search/trend/${encodeURIComponent(trendId)}`)
      .then(async (res) => ({ res, json: await res.json() }))
      .then(({ res, json }) => {
        if (!cancelled && res.ok) setDetail(json.trend)
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  const addWatch = async () => {
    if (!watchTerm.trim()) return
    const res = await apiFetch('/api/kade-search/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: watchTerm.trim() }),
    })
    const json = await res.json()
    if (res.ok) {
      setWatchlist(json.liste ?? [])
      setWatchTerm('')
    }
  }

  const removeWatch = async (term: string) => {
    const res = await apiFetch(`/api/kade-search/watchlist?term=${encodeURIComponent(term)}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.ok) setWatchlist(json.liste ?? [])
  }

  const sendDailyDigest = async () => {
    setDigestSending(true)
    setDigestStatus('')
    try {
      const res = await apiFetch('/api/kade-search/daily-digest', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'WhatsApp özeti gönderilemedi.')
      setDigestStatus(json.duplicate ? 'Bugünün seçkisi zaten gönderildi.' : `${json.items} aday WhatsApp’a gönderildi.`)
    } catch (e) {
      setDigestStatus(e instanceof Error ? e.message : 'WhatsApp özeti gönderilemedi.')
    } finally {
      setDigestSending(false)
    }
  }

  const sendSelectedTrend = async () => {
    if (!detail) return
    setSelectionSending(true)
    setSelectionStatus('')
    try {
      const res = await apiFetch(`/api/kade-search/trend/${encodeURIComponent(detail.id)}/whatsapp`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Seçilen içerik gönderilemedi.')
      setSelectionStatus('Seçtiğin içerik WhatsApp’a gönderildi.')
    } catch (e) {
      setSelectionStatus(e instanceof Error ? e.message : 'Seçilen içerik gönderilemedi.')
    } finally {
      setSelectionSending(false)
    }
  }

  const isEmpty =
    !loading &&
    ((tab === 'trendler' || tab === 'radar') ? trends.length === 0
      : tab === 'nabiz' ? pulse.length === 0
      : tab === 'fikirler' ? ideas.length === 0
      : alerts.length === 0)

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title="Trend Radar"
        description="TikTok · Reels · Shorts · YouTube · Google · Reddit — ölçülmüş trend verisi"
        showModelSelector={false}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          {/* ── Sol sütun: durum, filtreler, izleme listesi ───────────────── */}
          <div className="w-full flex-shrink-0 space-y-4 lg:w-80">
            {stats && (
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Trend', value: fmtCount(stats.trends) },
                    { label: 'Ölçüm', value: fmtCount(stats.snapshots) },
                    { label: 'Uyarı', value: fmtCount(stats.alerts) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-lg font-bold text-zinc-100">{item.value}</p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</p>
                    </div>
                  ))}
                </div>
                {stats.lastRun && (
                  <p className="mt-3 border-t border-zinc-800 pt-2.5 text-[11px] text-zinc-500">
                    Son toplama:{' '}
                    {new Date(stats.lastRun.started_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}{' '}
                    · {stats.lastRun.items_found} kayıt
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ara</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setSearch(query)}
                    onBlur={() => setSearch(query)}
                    placeholder="Kelime, şarkı, kanal..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#f2c322] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platform</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlatform('all')}
                    className={cn(
                      'rounded-lg border py-1.5 text-xs transition-colors',
                      platform === 'all'
                        ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-500'
                    )}
                  >
                    Tümü
                  </button>
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={cn(
                        'rounded-lg border py-1.5 text-xs transition-colors',
                        platform === p
                          ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-500'
                      )}
                    >
                      {platformLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                  >
                    <option value="all">Tüm kategoriler</option>
                    {categoryOptions.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tür</label>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-xs text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                    >
                      <option value="all">Tümü</option>
                      {KINDS.map((k) => (
                        <option key={k} value={k}>{KIND_LABELS[k] ?? k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Aşama</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-xs text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                    >
                      <option value="all">Tümü</option>
                      {Object.entries(STAGES).map(([key, def]) => (
                        <option key={key} value={key}>{def.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Sırala</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-xs text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Dönem</label>
                    <select
                      value={since}
                      onChange={(e) => setSince(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-xs text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                    >
                      <option value="24">Son 24 saat</option>
                      <option value="72">Son 3 gün</option>
                      <option value="168">Son 7 gün</option>
                      <option value="720">Son 30 gün</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Eye className="h-3.5 w-3.5 text-zinc-400" />
                İzleme listesi
              </h3>
              <p className="text-[11px] text-zinc-500">
                Eklediğin kelime yeni bir trendde geçtiğinde uyarı üretilir.
              </p>
              <div className="flex gap-1.5">
                <input
                  value={watchTerm}
                  onChange={(e) => setWatchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addWatch()}
                  placeholder="örn. yapay zeka"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#f2c322] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addWatch}
                  className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#f2c322]/50"
                >
                  Ekle
                </button>
              </div>
              {watchlist.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {watchlist.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="truncate">{w.term}</span>
                      <button
                        type="button"
                        onClick={() => removeWatch(w.term)}
                        className="text-zinc-600 transition-colors hover:text-red-400"
                        aria-label={`${w.term} terimini kaldır`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canCollect && stats?.kaynaklar && (
              <>
                <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-2.5">
                    <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Günlük WhatsApp seçkisi</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                        Yeni KadexAI adayları her gün 09:00’da gelir. Bağlantıya dokunup istediğini seçebilirsin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={sendDailyDigest}
                    disabled={digestSending}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    {digestSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {digestSending ? 'Gönderiliyor...' : 'Bugünün seçkisini şimdi gönder'}
                  </button>
                  {digestStatus && <p className="text-[11px] text-zinc-400" role="status">{digestStatus}</p>}
                </div>
                <CollectPanel
                  sources={stats.kaynaklar}
                  onDone={() => {
                    void loadStats()
                    void loadTab()
                  }}
                />
              </>
            )}
          </div>

          {/* ── Sağ sütun: sekmeler ve içerik ─────────────────────────────── */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap gap-2">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    tab === key ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 p-4 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#f2c322]" />
                Trend verisi getiriliyor...
              </div>
            )}

            {isEmpty && !error && (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-600">
                <Radio className="h-8 w-8 text-zinc-700" />
                <p>Bu filtrelerde kayıt yok.</p>
                {canCollect && <p className="text-xs">Soldaki panelden bir toplama başlat.</p>}
              </div>
            )}

            {!loading && (tab === 'trendler' || tab === 'radar') && trends.length > 0 && (
              <div className="space-y-3">
                {tab === 'radar' && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    🌱 Erken radar: düşük hacim + yüksek hız. Rekabetin henüz oluşmadığı, girmek için en uygun trendler.
                  </p>
                )}
                {trends.map((t, i) => (
                  <TrendCard key={t.id} trend={t} rank={i + 1} onSelect={openDetail} />
                ))}
              </div>
            )}

            {!loading && tab === 'nabiz' && pulse.length > 0 && (
              <div className="space-y-3">
                {pulse.map((group) => (
                  <div key={group.kategori} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {group.emoji} {group.label}
                      </h3>
                      <span className="text-xs text-zinc-500">ort. skor {group.ortalamaSkor}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {group.trendler.map((t) => (
                        <li key={t.id} className="flex items-start gap-2 text-xs">
                          <span className="w-7 flex-shrink-0 font-medium text-zinc-500">
                            {(t.score ?? 0).toFixed(0)}
                          </span>
                          <a
                            href={t.url ?? '#'}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="min-w-0 flex-1 truncate text-zinc-300 transition-colors hover:text-[#f2c322]"
                          >
                            {t.title}
                          </a>
                          <span className="flex-shrink-0 text-zinc-600">{platformLabel(t.platform)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {!loading && tab === 'fikirler' && ideas.length > 0 && (
              <div className="space-y-3">
                {ideas.map((idea) => (
                  <div key={idea.trendId} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100">{idea.baslik}</h3>
                      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {idea.format.label}
                      </span>
                    </div>
                    <p className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/10 p-2.5 text-xs text-violet-200">
                      🎣 {idea.kanca}
                    </p>
                    <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Kurgu</p>
                        <ul className="space-y-0.5 text-[11px] text-zinc-400">
                          {idea.kurgu.map((step) => (
                            <li key={step}>• {step}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Hashtagler</p>
                          <p className="text-[11px] text-zinc-400">{idea.hashtagler.join(' ')}</p>
                        </div>
                        {idea.sesOnerisi && (
                          <div>
                            <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Ses önerisi</p>
                            <p className="text-[11px] text-zinc-400">
                              🎵 {idea.sesOnerisi.title}
                              {idea.sesOnerisi.author ? ` — ${idea.sesOnerisi.author}` : ''}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Zorluk</p>
                          <p className="text-[11px] text-zinc-400">
                            {idea.zorluk.level} — {idea.zorluk.note}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 border-t border-zinc-700/50 pt-2 text-[11px] text-zinc-500">
                      {idea.neden} · CTA: {idea.cta} · Paylaşım: {idea.paylasimSaati.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!loading && tab === 'uyarilar' && alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={cn('rounded-lg border p-3 text-xs', severityStyles[a.severity] ?? severityStyles.info)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span>{a.message}</span>
                      <span className="flex-shrink-0 text-[10px] opacity-70">
                        {new Date(a.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Trend detay paneli ────────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setDetail(null)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-100">{detail.title}</h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-zinc-500 transition-colors hover:text-zinc-200"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              {platformLabel(detail.platform)} · {KIND_LABELS[detail.kind] ?? detail.kind}
              {detail.country ? ` · ${detail.country}` : ''}
            </p>

            {detail.breakdown && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Skor kırılımı</p>
                {(['hacim', 'hiz', 'etkilesim', 'siralama', 'caprazPlatform', 'tazelik'] as const).map((key) => {
                  const value = Number(detail.breakdown?.[key] ?? 0)
                  const labels: Record<string, string> = {
                    hacim: 'Hacim', hiz: 'Hız', etkilesim: 'Etkileşim',
                    siralama: 'Sıralama', caprazPlatform: 'Çapraz platform', tazelik: 'Tazelik',
                  }
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-28 flex-shrink-0 text-[11px] text-zinc-400">{labels[key]}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full rounded-full bg-[#f2c322]" style={{ width: `${Math.min(value * 3, 100)}%` }} />
                      </div>
                      <span className="w-6 text-right text-[11px] text-zinc-500">{value}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {detail.history.length > 1 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Ölçüm geçmişi</p>
                <ul className="space-y-1 text-[11px] text-zinc-400">
                  {detail.history.slice(-8).map((h) => (
                    <li key={h.captured_at} className="flex justify-between">
                      <span>{new Date(h.captured_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="text-zinc-300">{fmtCount(h.views || h.posts)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.related.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Diğer platformlardaki karşılığı</p>
                <ul className="space-y-1 text-[11px] text-zinc-400">
                  {detail.related.map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span className="truncate">{r.title}</span>
                      <span className="flex-shrink-0 text-zinc-600">{platformLabel(r.platform)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 space-y-2">
              {canCollect && (
                <button
                  type="button"
                  onClick={sendSelectedTrend}
                  disabled={selectionSending}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {selectionSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  {selectionSending ? 'Gönderiliyor...' : 'Bunu WhatsApp’a gönder'}
                </button>
              )}
              {selectionStatus && <p className="text-center text-[11px] text-zinc-400" role="status">{selectionStatus}</p>}
              {detail.url && (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#f2c322] px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-[#ffda3f]"
                >
                  Kaynağı aç
                </a>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
