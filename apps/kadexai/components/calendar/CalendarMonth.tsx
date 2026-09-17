'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, getPlatformLabel } from '@/lib/utils'
import type { Platform } from '@/types'

export interface MonthEntry {
  id: string
  date: string
  title: string
  platform: Platform
  status: 'taslak' | 'hazır' | 'yayında'
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

/** YYYY-MM ayının pazartesiden başlayan gün hücreleri; ay dışı hücreler null. */
export function monthCells(month: string): (string | null)[] {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, monthIndex - 1, 1))
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let day = 1; day <= days; day += 1) cells.push(`${month}-${String(day).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthIndex - 1 + delta, 1)).toISOString().slice(0, 7)
}

interface Props {
  month: string
  entries: MonthEntry[]
  today: string
  onMonthChange: (month: string) => void
  onSelect: (entry: MonthEntry) => void
  onAdd: (date: string) => void
}

export default function CalendarMonth({ month, entries, today, onMonthChange, onSelect, onAdd }: Props) {
  const label = new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00Z`))
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Önceki ay" onClick={() => onMonthChange(shiftMonth(month, -1))} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <button type="button" aria-label="Sonraki ay" onClick={() => onMonthChange(shiftMonth(month, 1))} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
        {WEEKDAYS.map((day) => <div key={day} className="py-1">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthCells(month).map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-20 rounded-lg bg-zinc-900/20" />
          const dayEntries = entries.filter((entry) => entry.date === date)
          return (
            <div key={date} className={cn('group min-h-20 rounded-lg border p-1 text-left', date === today ? 'border-[#f2c322]/60' : 'border-zinc-800 bg-zinc-900/40')}>
              <button type="button" onClick={() => onAdd(date)} aria-label={`${date} için içerik ekle`} className="block w-full text-left text-[10px] text-zinc-500 hover:text-zinc-200">{Number(date.slice(8))}</button>
              <div className="mt-0.5 space-y-0.5">
                {dayEntries.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => onSelect(entry)} title={`${entry.title} · ${getPlatformLabel(entry.platform)} · ${entry.status}`}
                    className={cn('block w-full truncate rounded px-1 py-0.5 text-left text-[10px]', entry.status === 'yayında' ? 'bg-emerald-500/20 text-emerald-200' : entry.status === 'hazır' ? 'bg-amber-500/20 text-amber-200' : 'bg-zinc-700 text-zinc-200')}>
                    {entry.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
