'use client'

import { useEffect, useState } from 'react'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import { apiPath } from '@/lib/appConfig'

interface CalendarEntry {
  id: string
  date: string
  title: string
  platform: Platform
  status: 'taslak' | 'hazır' | 'yayında'
}

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin']

const statusColors = {
  taslak: 'bg-zinc-700 text-zinc-300',
  hazır: 'bg-amber-500/20 text-amber-300',
  yayında: 'bg-emerald-500/20 text-emerald-300',
}

const CALENDAR_STORAGE_KEY = 'kade-content-calendar'

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState({ date: '', title: '', platform: 'youtube' as Platform })
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const title = params.get('title')
    const platform = params.get('platform')
    if (!title) return
    setNewEntry((current) => ({
      ...current,
      title,
      platform: platforms.includes(platform as Platform) ? platform as Platform : current.platform,
    }))
    setShowForm(true)
  }, [])

  useEffect(() => {
    fetch(apiPath('/api/calendar'), { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error('local')
        const cloudEntries = Array.isArray(data.entries) ? data.entries.map((entry: Record<string, unknown>) => ({
          id: String(entry.id),
          date: String(entry.publish_at || '').slice(0, 10),
          title: String(entry.title || ''),
          platform: String(entry.platform || 'youtube') as Platform,
          status: (['taslak', 'hazır', 'yayında'].includes(String(entry.status)) ? entry.status : 'taslak') as CalendarEntry['status'],
        })) : []
        let localEntries: CalendarEntry[] = []
        try {
          const stored = JSON.parse(localStorage.getItem(CALENDAR_STORAGE_KEY) || '[]')
          if (Array.isArray(stored)) localEntries = stored
        } catch { localStorage.removeItem(CALENDAR_STORAGE_KEY) }
        const signature = (entry: CalendarEntry) => `${entry.date}|${entry.platform}|${entry.title}`
        const cloudSignatures = new Set(cloudEntries.map(signature))
        setEntries([...cloudEntries, ...localEntries.filter((entry) => !cloudSignatures.has(signature(entry)))])
      })
      .catch(() => {
        try {
          const stored = JSON.parse(localStorage.getItem(CALENDAR_STORAGE_KEY) || '[]')
          if (Array.isArray(stored)) setEntries(stored)
        } catch { localStorage.removeItem(CALENDAR_STORAGE_KEY) }
        setSyncError('Bulut takvimi yüklenemedi; bu cihazdaki kayıtlar kullanılıyor.')
      })
      .finally(() => setStorageReady(true))
  }, [])

  useEffect(() => {
    if (storageReady) localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(entries))
  }, [entries, storageReady])

  const addEntry = async () => {
    if (!newEntry.date || !newEntry.title) return
    const localId = `local-${Date.now()}`
    const optimistic: CalendarEntry = { id: localId, ...newEntry, status: 'taslak' }
    setEntries((prev) => [...prev, optimistic])
    setNewEntry({ date: '', title: '', platform: 'youtube' })
    setShowForm(false)
    try {
      const response = await fetch(apiPath('/api/calendar'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: optimistic.title, platform: optimistic.platform, publish_at: `${optimistic.date}T12:00:00` }) })
      const data = await response.json()
      if (response.ok && data.entry) setEntries((current) => current.map((entry) => entry.id === localId ? { ...entry, id: data.entry.id } : entry))
      else if (response.status !== 401) setSyncError(data.error || 'Takvim buluta kaydedilemedi.')
    } catch { setSyncError('Takvim bu cihazda kaydedildi; bulut bağlantısı kurulamadı.') }
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (!id.startsWith('local-')) void fetch(apiPath('/api/calendar'), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => setSyncError('Bulut kaydı silinemedi.'))
  }

  const cycleStatus = (id: string) => {
    const statuses: CalendarEntry['status'][] = ['taslak', 'hazır', 'yayında']
    const currentStatus = entries.find((entry) => entry.id === id)?.status || 'taslak'
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length]
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e
        return { ...e, status: nextStatus }
      })
    )
    if (!id.startsWith('local-')) void fetch(apiPath('/api/calendar'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) }).catch(() => setSyncError('Takvim durumu buluta yazılamadı.'))
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col h-full">
      <TopBar title="İçerik Takvimi" description="Yayın planını oluştur ve organize et" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-zinc-300 text-sm font-medium">{entries.length} içerik planlandı</h2>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] transition-colors">
              <Plus className="w-4 h-4" />
              İçerik Ekle
            </button>
          </div>
          {syncError && <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">{syncError}</div>}

          {showForm && (
            <div className="rounded-xl border border-violet-500/30 bg-zinc-800/50 p-5 space-y-4">
              <h3 className="text-zinc-200 font-medium text-sm">Yeni İçerik</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Yayın Tarihi</label>
                  <input type="date" value={newEntry.date} onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Platform</label>
                  <select value={newEntry.platform} onChange={(e) => setNewEntry((p) => ({ ...p, platform: e.target.value as Platform }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                    {platforms.map((p) => <option key={p} value={p}>{getPlatformLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-1">İçerik Başlığı</label>
                <input value={newEntry.title} onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Video veya post başlığı"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div className="flex gap-2">
                <button onClick={addEntry} className="px-4 py-2 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] transition-colors">Ekle</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-600 transition-colors">İptal</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {sorted.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 sm:flex-nowrap sm:gap-4">
                <div className="flex w-28 flex-shrink-0 items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-zinc-400 text-xs">{entry.date}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200 text-sm truncate">{entry.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{getPlatformLabel(entry.platform)}</p>
                </div>
                <button onClick={() => cycleStatus(entry.id)}
                  className={cn('text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors', statusColors[entry.status])}>
                  {entry.status}
                </button>
                <button onClick={() => deleteEntry(entry.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                Henüz içerik planlanmadı. "İçerik Ekle" butonuna tıkla.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
