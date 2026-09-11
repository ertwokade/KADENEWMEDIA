'use client'

import { useEffect, useState } from 'react'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'

interface CalendarEntry {
  id: string
  date: string
  title: string
  platform: Platform
  status: 'taslak' | 'hazır' | 'yayında'
}

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin', 'pinterest']

const statusColors = {
  taslak: 'bg-zinc-700 text-zinc-300',
  hazır: 'bg-amber-500/20 text-amber-300',
  yayında: 'bg-emerald-500/20 text-emerald-300',
}

function readEntry(value: unknown): CalendarEntry {
  if (!value || typeof value !== 'object') throw new Error('Geçerli takvim kaydı alınamadı.')
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string' || !entry.id || typeof entry.title !== 'string'
    || typeof entry.publish_at !== 'string' || !Number.isFinite(Date.parse(entry.publish_at))
    || !platforms.includes(entry.platform as Platform) || !Object.hasOwn(statusColors, String(entry.status))) {
    throw new Error('Geçerli takvim kaydı alınamadı.')
  }
  return { id: entry.id, title: entry.title, date: entry.publish_at.slice(0, 10), platform: entry.platform as Platform, status: entry.status as CalendarEntry['status'] }
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
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
      title: title.slice(0, 300),
      platform: platforms.includes(platform as Platform) ? platform as Platform : current.platform,
    }))
    setShowForm(true)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true); setLoadError(''); setEntries([])
    apiFetch('/api/calendar', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Takvim için yeniden giriş yapmalısın.' : data.error || 'Takvim yüklenemedi.')
        if (!Array.isArray(data.entries)) throw new Error('Geçerli takvim listesi alınamadı.')
        const cloudEntries = data.entries.map(readEntry)
        // Legacy browser entries have no verified owner. Preserve them on disk,
        // but never merge them into another signed-in account's calendar.
        if (active) setEntries(cloudEntries)
      })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Takvim yüklenemedi.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [revision])

  const addEntry = async () => {
    if (pending || loading || loadError || !newEntry.date || !newEntry.title.trim()) return
    setPending(true); setSyncError('')
    try {
      const response = await apiFetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newEntry.title.trim(), platform: newEntry.platform, publish_at: `${newEntry.date}T12:00:00+03:00` }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Takvim kaydedilemedi. Girdiğin bilgiler formda korundu.')
      const saved = readEntry(data.entry)
      setEntries(current => [...current, saved])
      setNewEntry({ date: '', title: '', platform: 'youtube' }); setShowForm(false)
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Takvim kaydedilemedi.') }
    finally { setPending(false) }
  }

  const deleteEntry = async (id: string) => {
    if (pending || !window.confirm('Bu takvim kaydını silmek istiyor musun?')) return
    setPending(true); setSyncError('')
    try {
      const response = await apiFetch('/api/calendar', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const data = await response.json()
      if (!response.ok || data.success !== true) throw new Error(data.error || 'Takvim kaydı silinemedi.')
      setEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Takvim kaydı silinemedi.') }
    finally { setPending(false) }
  }

  const cycleStatus = async (id: string) => {
    if (pending) return
    const statuses: CalendarEntry['status'][] = ['taslak', 'hazır', 'yayında']
    const currentStatus = entries.find((entry) => entry.id === id)?.status || 'taslak'
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length]
    setPending(true); setSyncError('')
    try {
      const response = await apiFetch('/api/calendar', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Takvim durumu kaydedilemedi.')
      const saved = readEntry(data.entry)
      if (saved.id !== id) throw new Error('Takvim yanıtı kayıtla eşleşmedi.')
      setEntries(prev => prev.map(entry => entry.id === id ? saved : entry))
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Takvim durumu kaydedilemedi.') }
    finally { setPending(false) }
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col h-full">
      <TopBar title="İçerik Takvimi" description="Yayın planını oluştur ve organize et" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-zinc-300 text-sm font-medium">{loading ? 'Takvim yükleniyor…' : loadError ? 'Takvim alınamadı' : `${entries.length} içerik planlandı`}</h2>
            <button disabled={pending || loading || !!loadError} onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] transition-colors">
              <Plus className="w-4 h-4" />
              İçerik Ekle
            </button>
          </div>
          {loadError && <div role="alert" className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">
            <p>{loadError}</p><button onClick={() => setRevision(value => value + 1)} className="min-h-11 underline">Yeniden dene</button>
          </div>}
          {syncError && <div role="alert" className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">{syncError}</div>}
          <p className="text-zinc-500 text-xs">Yalnız bu hesaba ait bulut kayıtları gösterilir. Durum etiketleri takip içindir; içerik otomatik yayınlanmaz.</p>

          {showForm && (
            <div className="rounded-xl border border-violet-500/30 bg-zinc-800/50 p-5 space-y-4">
              <h3 className="text-zinc-200 font-medium text-sm">Yeni İçerik</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="calendar-date" className="block text-zinc-400 text-xs mb-1">Yayın Tarihi</label>
                  <input id="calendar-date" disabled={pending} type="date" value={newEntry.date} onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]" />
                </div>
                <div>
                  <label htmlFor="calendar-platform" className="block text-zinc-400 text-xs mb-1">Platform</label>
                  <select id="calendar-platform" disabled={pending} value={newEntry.platform} onChange={(e) => setNewEntry((p) => ({ ...p, platform: e.target.value as Platform }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                    {platforms.map((p) => <option key={p} value={p}>{getPlatformLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="calendar-title" className="block text-zinc-400 text-xs mb-1">İçerik Başlığı</label>
                <input id="calendar-title" disabled={pending} maxLength={300} value={newEntry.title} onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Video veya post başlığı"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div className="flex gap-2">
                <button disabled={pending || loading || !!loadError || !newEntry.title.trim() || !newEntry.date} onClick={addEntry} className="min-h-11 px-4 py-2 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">{pending ? 'Kaydediliyor…' : 'Ekle'}</button>
                <button disabled={pending} onClick={() => setShowForm(false)} className="min-h-11 px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-600 transition-colors">İptal</button>
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
                <div className="order-first w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
                  <p className="text-zinc-200 text-sm break-words">{entry.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{getPlatformLabel(entry.platform)}</p>
                </div>
                <button disabled={pending} aria-label={`${entry.title}: ${entry.status}, durumu değiştir`} onClick={() => cycleStatus(entry.id)}
                  className={cn('min-h-11 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer transition-colors', statusColors[entry.status])}>
                  {entry.status}
                </button>
                <button disabled={pending} aria-label={`${entry.title} kaydını sil`} onClick={() => deleteEntry(entry.id)}
                  className="flex min-h-11 min-w-11 items-center justify-center text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!loading && !loadError && entries.length === 0 && (
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
