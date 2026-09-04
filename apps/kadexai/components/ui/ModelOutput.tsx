import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModelOutputProps {
  content: string
  className?: string
}

function labelOf(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('tr-TR'))
}

function parseJson(content: string): unknown | null {
  const clean = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  if (!clean.startsWith('{') && !clean.startsWith('[')) return null
  try {
    return JSON.parse(clean) as unknown
  } catch {
    return null
  }
}

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[0.9em] text-violet-200">{part.slice(1, -1)}</code>
    }
    return part
  })
}

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'object') {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{String(value)}</p>
  }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className={cn(depth > 0 && 'border-l border-zinc-700/70 pl-3')}>
            <JsonValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <dl className={cn('space-y-3', depth > 0 && 'rounded-lg border border-zinc-800 bg-zinc-950/45 p-3')}>
      {Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (item === null || item === undefined || item === '') return null
        return (
          <div key={key}>
            <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300">{labelOf(key)}</dt>
            <dd><JsonValue value={item} depth={depth + 1} /></dd>
          </div>
        )
      })}
    </dl>
  )
}

function MarkdownValue({ content }: { content: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-300">
        {bullets.map((item, index) => <li key={index}>{inline(item)}</li>)}
      </ul>
    )
    bullets = []
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || /^-{3,}$/.test(line)) {
      flushBullets()
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.+)/)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }
    flushBullets()
    const heading = line.match(/^(#{1,4})\s+(.+)/)
    const numbered = line.match(/^\d+[.)]\s+(.+)/)
    if (heading) {
      blocks.push(<h3 key={blocks.length} className="pt-1 text-sm font-semibold text-zinc-100">{inline(heading[2])}</h3>)
    } else if (numbered) {
      blocks.push(<p key={blocks.length} className="text-sm leading-6 text-zinc-300"><span className="mr-2 text-violet-300">•</span>{inline(numbered[1])}</p>)
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote key={blocks.length} className="border-l-2 border-violet-500/40 pl-3 text-sm italic leading-6 text-zinc-400">{inline(line.slice(2))}</blockquote>)
    } else {
      blocks.push(<p key={blocks.length} className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{inline(line)}</p>)
    }
  }
  flushBullets()
  return <div className="space-y-2">{blocks}</div>
}

/** Model metnini güvenli React düğümleriyle okunur JSON veya sade Markdown olarak çizer. */
export default function ModelOutput({ content, className }: ModelOutputProps) {
  const normalized = String(content || '').replace(/\uFFFD/g, '').trim()
  if (!normalized) return null
  const parsed = parseJson(normalized)

  return (
    <div className={cn('min-w-0', className)}>
      {parsed === null ? <MarkdownValue content={normalized} /> : <JsonValue value={parsed} />}
    </div>
  )
}
