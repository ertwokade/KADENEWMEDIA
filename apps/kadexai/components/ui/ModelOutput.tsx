import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HIDDEN_OUTPUT_KEYS, humanizeKey, humanizeValue } from '@/lib/ui/outputLabels'

interface ModelOutputProps {
  content: string
  className?: string
}

function parseJson(content: string): unknown | null {
  const trimmed = content.trim()
  const fence = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)
  const clean = fence ? fence[1].trim() : trimmed
  if (!clean.startsWith('{') && !clean.startsWith('[')) return null
  try {
    return JSON.parse(clean) as unknown
  } catch {
    return null
  }
}

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|(?<![\w*])\*[^*\s][^*]*?\*(?![\w*])|(?<![\w_])_[^_\s][^_]*?_(?![\w_]))/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>
    }
    if (part.length > 2 && ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[0.9em] text-violet-200">{part.slice(1, -1)}</code>
    }
    return part
  })
}

const MAX_OBJECT_ITEMS = 25

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'object') {
    return <MarkdownValue content={humanizeValue(value)} />
  }
  if (Array.isArray(value)) {
    // Kelime zaman damgası gibi yüzlerce satırlık teknik listeler okunmuyordu.
    const shown = value.length > MAX_OBJECT_ITEMS && value.some((item) => item && typeof item === 'object') ? value.slice(0, 5) : value
    return (
      <div className="space-y-2">
        {shown !== value && <p className="text-xs text-zinc-500">{value.length.toLocaleString('tr-TR')} kayıttan ilk 5 tanesi gösteriliyor.</p>}
        {shown.map((item, index) => (
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
        if (item === null || item === undefined || item === '' || HIDDEN_OUTPUT_KEYS.has(key)) return null
        return (
          <div key={key}>
            <dt className="mb-1 text-xs font-semibold text-violet-300">{humanizeKey(key)}</dt>
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
  let ordered = false
  let listStart = 1
  let codeLines: string[] | null = null
  let fenceMarker = ''

  const flushBullets = () => {
    if (!bullets.length) return
    const items = bullets.map((item, index) => <li key={index}>{inline(item)}</li>)
    blocks.push(ordered
      ? <ol key={`list-${blocks.length}`} start={listStart} className="list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-300">{items}</ol>
      : <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-300">{items}</ul>)
    bullets = []
  }

  const flushCode = () => {
    if (codeLines === null) return
    blocks.push(<pre key={`code-${blocks.length}`} className="max-w-full overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300"><code>{codeLines.join('\n')}</code></pre>)
    codeLines = null
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (codeLines !== null) {
      if (line === fenceMarker) flushCode()
      else codeLines.push(rawLine)
      continue
    }
    const fence = line.match(/^(`{3,}|~{3,})[\w-]*\s*$/)
    if (fence) {
      flushBullets()
      codeLines = []
      fenceMarker = fence[1]
      continue
    }
    if (!line || /^-{3,}$/.test(line)) {
      flushBullets()
      continue
    }
    const checkbox = line.match(/^(?:[-*•]\s+)?\[( |x|X)\]\s+(.+)/)
    if (checkbox) {
      flushBullets()
      blocks.push(<p key={blocks.length} className="flex gap-2 text-sm leading-6 text-zinc-300"><span aria-hidden="true">{checkbox[1] === ' ' ? '☐' : '☑'}</span><span>{inline(checkbox[2])}</span></p>)
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.+)/)
    const numbered = line.match(/^(\d+)[.)]\s+(.+)/)
    if (bullet || numbered) {
      const isOrdered = Boolean(numbered)
      if (bullets.length && ordered !== isOrdered) flushBullets()
      if (!bullets.length) listStart = numbered ? Number(numbered[1]) : 1
      ordered = isOrdered
      bullets.push(numbered ? numbered[2] : bullet![1])
      continue
    }
    flushBullets()
    const heading = line.match(/^(#{1,4})\s+(.+)/)
    if (heading) {
      blocks.push(<h3 key={blocks.length} className="pt-1 text-sm font-semibold text-zinc-100">{inline(heading[2])}</h3>)
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote key={blocks.length} className="border-l-2 border-violet-500/40 pl-3 text-sm italic leading-6 text-zinc-400">{inline(line.slice(2))}</blockquote>)
    } else {
      blocks.push(<p key={blocks.length} className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{inline(line)}</p>)
    }
  }
  flushBullets()
  flushCode()
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
