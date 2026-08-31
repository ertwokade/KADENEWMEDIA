'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { apiPath } from '@/lib/appConfig'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'
import { getToolById } from '@/lib/tools/registry'

type UsageResponse = {
  plan?: { tier?: string; label?: string; name?: string }
  usage?: {
    periodStart?: string
    billableTokens?: number
    requests?: number
    limit?: number
    remaining?: number | null
  } | null
  available?: boolean
}

type Run = {
  id: string
  tool: string
  status?: 'completed' | 'failed'
  created_at: string
}

/** Kayıt defterindeki id'ler kaynak; burada yalnızca birleştirilen eski
 *  araçların karşılığı tutuluyor, yoksa iki ayrı isim listesi oluşuyor. */
const LEGACY_TOOL_LABELS: Record<string, string> = {
  clips: 'Klip Analizi',
  performance: 'Performans Tahmini',
  analytics: 'Analitik',
  trends: 'Trend Radarı',
  'ab-test': 'Viral Skor · A/B',
  thread: 'Thread Yazarı',
  bulk: 'Toplu Üretim',
}

function toolLabel(id: string) {
  return getToolById(id)?.name ?? LEGACY_TOOL_LABELS[id] ?? id
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(Math.round(value))
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diff)) return ''
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'az önce'
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  return `${Math.round(hours / 24)} gün önce`
}

export default function WorkspaceStatus() {
  const alanYolu = useWorkspaceHref()
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      fetch(apiPath('/api/usage')).then((r) => (r.ok ? r.json() : null)),
      fetch(apiPath('/api/history?limit=6')).then((r) => (r.ok ? r.json() : null)),
    ]).then(([u, h]) => {
      if (!alive) return
      if (u.status === 'fulfilled' && u.value) setUsage(u.value as UsageResponse)
      if (h.status === 'fulfilled' && h.value) setRuns(((h.value.history ?? []) as Run[]).slice(0, 6))
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const plan = usage?.plan
  const summary = usage?.usage ?? null
  const planName = plan?.label ?? plan?.name ?? plan?.tier ?? '—'
  const unlimited = typeof summary?.limit === 'number' && summary.limit < 0
  const used = summary?.billableTokens ?? 0
  const percent = !summary || unlimited || !summary.limit || summary.limit <= 0
    ? null
    : Math.min(100, Math.round((used / summary.limit) * 100))

  const cells: Array<{ etiket: string; deger: string; alt?: string }> = [
    { etiket: 'Plan', deger: String(planName).toUpperCase(), alt: unlimited ? 'Kota sınırsız' : undefined },
    {
      etiket: 'Bu dönem istek',
      deger: summary ? formatNumber(summary.requests ?? 0) : '—',
      alt: summary?.periodStart
        ? `${new Date(summary.periodStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} itibarıyla`
        : undefined,
    },
    {
      etiket: 'Kullanılan token',
      deger: summary ? formatNumber(used) : '—',
      alt: unlimited ? 'Sınır yok' : percent !== null ? `%${percent} kullanıldı` : undefined,
    },
    {
      etiket: 'Son çalışma',
      deger: runs && runs.length > 0 ? relativeTime(runs[0].created_at) : '—',
      alt: runs && runs.length > 0 ? toolLabel(runs[0].tool) : 'Henüz kayıt yok',
    },
  ]

  return (
    <>
      <div className="kade-status-strip">
        {cells.map((cell) => (
          <div key={cell.etiket} className="kade-status-cell">
            <span className="kade-status-label">{cell.etiket}</span>
            <strong className="kade-status-value">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cell.deger}
            </strong>
            {cell.alt && !loading && <small className="kade-status-note">{cell.alt}</small>}
          </div>
        ))}
      </div>

      <div className="kade-recent">
        <div className="kade-recent-head">
          <span>Son çalışmalar</span>
          <Link href={alanYolu('/dashboard/history')}>
            Tüm geçmiş <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading && <p className="kade-recent-empty">Yükleniyor…</p>}
        {!loading && (!runs || runs.length === 0) && (
          <p className="kade-recent-empty">Henüz bir araç çalıştırmadın. Aşağıdan başlayabilirsin.</p>
        )}
        {!loading && runs && runs.length > 0 && (
          <ul className="kade-recent-list">
            {runs.map((run) => {
              const failed = run.status === 'failed'
              const tool = getToolById(run.tool)
              const row = (
                <>
                  {failed
                    ? <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--kade-err-400)]" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--kade-ok-400)]" />}
                  <span className="kade-recent-tool">{toolLabel(run.tool)}</span>
                  <span className="kade-recent-state">{failed ? 'Başarısız' : 'Tamamlandı'}</span>
                  <span className="kade-recent-time">{relativeTime(run.created_at)}</span>
                </>
              )
              return (
                <li key={run.id}>
                  {tool
                    ? <Link href={alanYolu(tool.route)}>{row}</Link>
                    : <span>{row}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
