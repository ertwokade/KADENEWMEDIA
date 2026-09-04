'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Check, CheckCircle2, Clock3, Copy, ExternalLink, Loader2, MessageCircle,
  PackageCheck, RefreshCw, Sparkles, ThumbsDown, Undo2,
} from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import SourcesPanel from '@/components/kade-search/SourcesPanel'
import { apiFetch } from '@/lib/client/api'
import { cn } from '@/lib/utils'

type Status = 'pending' | 'approved' | 'rejected' | 'published'

interface Idea {
  trendId: string
  baslik: string
  kategori: string
  kanca: string
  kurgu: string[]
  cta: string
  hashtagler: string[]
  paylasimSaati: string[]
  neden: string
  kaynak: { platform: string; url: string | null; skor: number; asama: string }
  format: { label: string; aciklama: string }
}

interface Draft {
  title: string
  hook: string
  caption: string
  hashtags: string[]
  visualBrief: string
  shotList: string[]
  cta: string
  platform: string
  sourceUrl: string | null
}

interface Approval {
  trend_id: string
  status: Status
  idea: Idea
  draft: Draft
  notes: string | null
  updated_at: string
}

const tabs: Array<{ key: 'all' | Status; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'approved', label: 'Onaylı' },
  { key: 'rejected', label: 'Reddedilen' },
  { key: 'published', label: 'Yayınlandı' },
]

const statusLabel: Record<Status, string> = {
  pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi', published: 'Yayınlandı',
}

const statusStyle: Record<Status, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
  published: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value)
}

export default function KadeSearchApprovalPage() {
  const params = useSearchParams()
  const selectedTrend = params?.get('trend') ?? null
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [tab, setTab] = useState<'all' | Status>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [dbMissing, setDbMissing] = useState(false)

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const [ideaRes, approvalRes] = await Promise.all([
        apiFetch('/api/kade-search/ideas?limit=24'),
        apiFetch('/api/kade-search/approvals'),
      ])
      const [ideaJson, approvalJson] = await Promise.all([ideaRes.json(), approvalRes.json()])
      if (!ideaRes.ok) throw new Error(ideaJson.error || 'Güncel içerik adayları alınamadı.')
      if (!approvalRes.ok) throw new Error(approvalJson.error || 'Onay kayıtları alınamadı.')
      const nextApprovals = (approvalJson.approvals ?? []) as Approval[]
      /* Uc, Supabase yapilandirilmadiginda 200 + bos liste donuyor. Bunu
         "aday yok" diye gostermek kullaniciyi yaniltiyordu. */
      setDbMissing(ideaJson.localFallback === true)
      setIdeas(ideaJson.fikirler ?? [])
      setApprovals(nextApprovals)
      setNotes(Object.fromEntries(nextApprovals.map((row) => [row.trend_id, row.notes ?? ''])))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Onay merkezi yüklenemedi.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const rows = useMemo(() => {
    const approvalMap = new Map(approvals.map((row) => [row.trend_id, row]))
    const all = ideas.map((idea) => ({ idea, approval: approvalMap.get(idea.trendId) }))
    const seen = new Set(ideas.map((idea) => idea.trendId))
    for (const approval of approvals) {
      if (!seen.has(approval.trend_id)) all.push({ idea: approval.idea, approval })
    }
    return all
      .filter((row) => tab === 'all' || (row.approval?.status ?? 'pending') === tab)
      .sort((a, b) => Number(b.idea.trendId === selectedTrend) - Number(a.idea.trendId === selectedTrend))
  }, [approvals, ideas, selectedTrend, tab])

  const counts = useMemo(() => approvals.reduce<Record<Status, number>>((acc, row) => {
    acc[row.status] += 1
    return acc
  }, { pending: Math.max(0, ideas.length - approvals.length), approved: 0, rejected: 0, published: 0 }), [approvals, ideas])

  const save = async (idea: Idea, status: Status) => {
    setBusy(idea.trendId)
    setNotice('')
    setError('')
    try {
      const response = await apiFetch('/api/kade-search/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId: idea.trendId, idea, status, notes: notes[idea.trendId] ?? '' }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Seçim kaydedilemedi.')
      setApprovals((current) => [json.approval, ...current.filter((row) => row.trend_id !== idea.trendId)])
      setNotice(`“${idea.baslik}” ${statusLabel[status].toLocaleLowerCase('tr-TR')} olarak kaydedildi.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Seçim kaydedilemedi.')
    } finally {
      setBusy('')
    }
  }

  const notify = async (idea: Idea) => {
    setBusy(idea.trendId)
    setNotice('')
    try {
      const response = await apiFetch('/api/kade-search/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId: idea.trendId, action: 'notify' }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'WhatsApp mesajı gönderilemedi.')
      setNotice('Onaylı içerik paketi WhatsApp’a gönderildi.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'WhatsApp mesajı gönderilemedi.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <TopBar title="KadeSearch Onay Merkezi" description="Günlük trend adaylarını seç, üretim paketini hazırla ve WhatsApp’tan al" showModelSelector={false} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
        <section className="mx-auto max-w-7xl space-y-5">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-emerald-400"><Sparkles className="h-4 w-4" /> Günlük karar masası</p>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Bugün ne üreteceğimize sen karar ver.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">KadeSearch güncel sinyalleri toplar. Onayladığın aday için başlık, caption, hashtag, görsel brief ve çekim akışı otomatik hazırlanır.</p>
              </div>
              <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600 disabled:opacity-50">
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /> Yenile
              </button>
            </div>
          </div>

          <SourcesPanel />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Bekleyen', counts.pending, Clock3, 'text-amber-400'],
              ['Onaylı', counts.approved, CheckCircle2, 'text-emerald-400'],
              ['Reddedilen', counts.rejected, ThumbsDown, 'text-red-400'],
              ['Yayınlandı', counts.published, PackageCheck, 'text-cyan-400'],
            ].map(([label, count, Icon, color]) => {
              const IconComponent = Icon as typeof Clock3
              return <div key={String(label)} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><IconComponent className={cn('h-5 w-5', String(color))} /><p className="mt-3 text-2xl font-semibold text-white">{String(count)}</p><p className="text-xs text-zinc-500">{String(label)}</p></div>
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium', tab === item.key ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300')}>{item.label}</button>)}
          </div>

          {notice && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}
          {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
          {dbMissing && (
            <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <p className="font-semibold">Trend veritabanı bağlı değil.</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                Aday listesi boş dönüyor. Uygulamanın çalıştığı ortamda{' '}
                <code className="rounded bg-amber-500/15 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve{' '}
                <code className="rounded bg-amber-500/15 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> tanımlı olmalı.
              </p>
            </div>
          )}

          {loading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-400" /></div> : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-sm text-zinc-500">
              {dbMissing
                ? 'Veritabanı bağlı olmadığı için aday üretilemiyor.'
                : ideas.length === 0 && approvals.length === 0
                  ? 'Henüz aday yok — Trend Radar’da toplama çalıştıktan sonra adaylar burada belirir.'
                  : 'Bu filtrede içerik bulunmuyor.'}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {rows.map(({ idea, approval }) => {
                const status = approval?.status ?? 'pending'
                const draft = approval?.draft
                const isSelected = selectedTrend === idea.trendId
                return <article id={`trend-${encodeURIComponent(idea.trendId)}`} key={idea.trendId} className={cn('rounded-2xl border bg-zinc-900/75 p-5 shadow-sm transition', isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-zinc-800')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs font-medium text-emerald-400">{idea.kaynak.platform} · skor {Math.round(idea.kaynak.skor)} · {idea.kaynak.asama}</p><h3 className="mt-1.5 text-base font-semibold leading-6 text-white">{idea.baslik}</h3><p className="mt-1 text-xs text-zinc-500">{idea.kategori} · {idea.format.label}</p></div>
                    <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold', statusStyle[status])}>{statusLabel[status]}</span>
                  </div>
                  <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm leading-6 text-zinc-300"><span className="font-semibold text-zinc-100">Kanca:</span> {idea.kanca}</p>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">{idea.neden}</p>

                  {draft && ['approved', 'published'].includes(status) && <div className="mt-4 space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Üretim paketi</p><button onClick={() => void copyText(`${draft.title}\n\n${draft.caption}\n\n${draft.hashtags.join(' ')}`)} aria-label="Paketi kopyala" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"><Copy className="h-4 w-4" /></button></div>
                    <div><p className="text-[11px] font-semibold text-zinc-500">CAPTION</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-300">{draft.caption}</p></div>
                    <div><p className="text-[11px] font-semibold text-zinc-500">HASHTAG</p><p className="mt-1 text-sm leading-6 text-emerald-300">{draft.hashtags.join(' ')}</p></div>
                    <div><p className="text-[11px] font-semibold text-zinc-500">GÖRSEL BRIEF</p><p className="mt-1 text-sm leading-6 text-zinc-300">{draft.visualBrief}</p></div>
                    <div><p className="text-[11px] font-semibold text-zinc-500">ÇEKİM AKIŞI</p><ol className="mt-1 space-y-1 text-sm text-zinc-400">{draft.shotList.map((shot, index) => <li key={shot}>{index + 1}. {shot}</li>)}</ol></div>
                  </div>}

                  <label className="mt-4 block text-xs font-medium text-zinc-500">Notun</label>
                  <textarea value={notes[idea.trendId] ?? approval?.notes ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [idea.trendId]: event.target.value }))} maxLength={1000} rows={2} placeholder="Çekimde dikkat edilecek nokta…" className="mt-1.5 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-emerald-500/60" />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void save(idea, 'approved')} disabled={busy === idea.trendId} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"><Check className="h-4 w-4" /> Onayla</button>
                    <button onClick={() => void save(idea, 'rejected')} disabled={busy === idea.trendId} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"><ThumbsDown className="h-4 w-4" /> Reddet</button>
                    {approval && status !== 'pending' && <button onClick={() => void save(idea, 'pending')} disabled={busy === idea.trendId} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"><Undo2 className="h-4 w-4" /> Geri al</button>}
                    {status === 'approved' && <button onClick={() => void save(idea, 'published')} disabled={busy === idea.trendId} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300"><PackageCheck className="h-4 w-4" /> Yayınlandı</button>}
                    {['approved', 'published'].includes(status) && <button onClick={() => void notify(idea)} disabled={busy === idea.trendId} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"><MessageCircle className="h-4 w-4" /> WhatsApp’a gönder</button>}
                    {idea.kaynak.url && <a href={idea.kaynak.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-zinc-500 hover:text-white"><ExternalLink className="h-4 w-4" /> Kaynak</a>}
                    {busy === idea.trendId && <Loader2 className="h-4 w-4 animate-spin self-center text-zinc-500" />}
                  </div>
                </article>
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
