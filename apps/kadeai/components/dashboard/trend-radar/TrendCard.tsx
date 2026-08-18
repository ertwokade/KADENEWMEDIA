'use client'

import { ArrowUpRight, Link2, Sparkles } from 'lucide-react'
import { CATEGORIES, KIND_LABELS, STAGES, platformLabel } from '@/lib/kade-search/taxonomy'
import { fmtCount } from '@/lib/kade-search/util'
import type { CurrentTrendRow } from '@/lib/kade-search/types'
import { cn } from '@/lib/utils'

const stageStyles: Record<string, string> = {
  emerging: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rising: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  peak: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  plateau: 'bg-zinc-700 text-zinc-300 border-zinc-600',
  declining: 'bg-red-500/15 text-red-400 border-red-500/30',
  dead: 'bg-zinc-700 text-zinc-400 border-zinc-600',
}

function scoreTone(score: number) {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-zinc-400'
}

export default function TrendCard({
  trend,
  rank,
  onSelect,
}: {
  trend: CurrentTrendRow
  rank?: number
  onSelect?: (trend: CurrentTrendRow) => void
}) {
  const score = trend.score ?? 0
  const stage = trend.stage ? STAGES[trend.stage] : null
  const category = trend.category ? CATEGORIES[trend.category] : null
  const velocity = trend.velocity ?? 0
  const volume = trend.views || trend.posts || trend.followers || 0
  const isInferred = Boolean(trend.inferred)

  return (
    <article className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 transition-colors hover:border-zinc-600">
      <div className="flex items-start gap-3">
        {typeof rank === 'number' && (
          <span className="mt-0.5 w-6 flex-shrink-0 text-xs font-medium text-zinc-600">{rank}</span>
        )}

        <div className="flex flex-shrink-0 flex-col items-center">
          <span className={cn('text-lg font-bold leading-none', scoreTone(score))}>{score.toFixed(0)}</span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">skor</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-100 break-words">{trend.title}</h3>
            {trend.url && (
              <a
                href={trend.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-shrink-0 text-zinc-500 transition-colors hover:text-[#f2c322]"
                aria-label="Kaynağı aç"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {trend.author && <p className="mt-0.5 truncate text-xs text-zinc-500">{trend.author}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {platformLabel(trend.platform)}
            </span>
            <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {KIND_LABELS[trend.kind] ?? trend.kind}
            </span>
            {category && (
              <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {category.emoji} {category.label}
              </span>
            )}
            {stage && (
              <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', stageStyles[trend.stage ?? ''] ?? '')}>
                {stage.emoji} {stage.label}
              </span>
            )}
            {isInferred && (
              <span
                className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
                title="Bu kayıt ölçüm değil, diğer platformlardaki sinyallerden türetilmiş bir tahmindir."
              >
                çıkarım
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            <span>
              Büyüme{' '}
              <b className={velocity >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {velocity >= 0 ? '+' : ''}
                {Math.round(velocity * 100)}%
              </b>
              <span className="text-zinc-600"> / gün</span>
            </span>
            <span>
              Hacim <b className="text-zinc-300">{fmtCount(volume)}</b>
            </span>
            {trend.link_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {trend.link_count} eşleşme
              </span>
            )}
            <span>{trend.snapshot_count} ölçüm</span>
          </div>

          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(trend)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-[#f2c322]/50 hover:text-zinc-100"
            >
              <Sparkles className="h-3 w-3" />
              Detay ve geçmiş
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
