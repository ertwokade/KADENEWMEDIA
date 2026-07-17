'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import RawModelOutput from '@/components/ui/RawModelOutput'

interface DayPlan { gun: number; tarih_onerisi: string; icerik_turu: string; baslik: string; format: string; aciklama: string; ipucu: string }
interface WeekTheme { hafta: number; tema: string; hedef: string }
interface Plan { strateji: string; haftalik_temalar: WeekTheme[]; gunler: DayPlan[]; kpi_hedefleri: Record<string, string>; raw?: string }

const typeColors: Record<string, string> = {
  egitici: 'bg-blue-500/20 text-blue-300',
  eğlenceli: 'bg-amber-500/20 text-amber-300',
  kisisel: 'bg-pink-500/20 text-pink-300',
  tanitim: 'bg-emerald-500/20 text-emerald-300',
  trending: 'bg-violet-500/20 text-violet-300',
}

export default function ContentPlanPage() {
  const { selectedModel } = useModel()
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [goal, setGoal] = useState('takipçi büyümesi')
  const [frequency, setFrequency] = useState('haftada 3')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Plan | null>(null)
  const [error, setError] = useState('')
  const [activeWeek, setActiveWeek] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platform, goal, frequency, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.plan)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const weekDays = data?.gunler?.filter((d) => Math.ceil(d.gun / 7) === activeWeek) ?? []

  return (
    <div className="flex flex-col h-full">
      <TopBar title="30 Günlük İçerik Planı" description="Niche ve platforma göre tam aylık içerik stratejisi" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Teknoloji, fitness, yemek..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['youtube', 'instagram', 'tiktok', 'linkedin', 'x', 'pinterest'].map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-1.5 rounded-lg text-xs capitalize transition-colors border',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Hedef</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {['takipçi büyümesi', 'etkileşim artışı', 'marka bilinirliği', 'satış dönüşümü', 'topluluk oluşturma'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Yayın Sıklığı</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['her gün', 'haftada 5', 'haftada 3', 'haftada 2', 'haftada 1', 'iki haftada 1'].map((f) => (
                    <button key={f} type="button" onClick={() => setFrequency(f)}
                      className={cn('py-1.5 rounded-lg text-xs transition-colors border',
                        frequency === f ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading || !niche.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Plan oluşturuluyor...' : '30 Günlük Plan Üret'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={data.raw} />
                {data.strateji && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-violet-400 text-xs font-semibold mb-1">Strateji</p>
                    <p className="text-zinc-300 text-sm">{data.strateji}</p>
                  </div>
                )}
                {/* Week tabs */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((w) => (
                    <button key={w} onClick={() => setActiveWeek(w)}
                      className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        activeWeek === w ? 'bg-[#f2c322] text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      Hafta {w}
                    </button>
                  ))}
                </div>
                {/* Week theme */}
                {data.haftalik_temalar?.[activeWeek - 1] && (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-2 flex gap-4">
                    <span className="text-violet-400 text-xs font-semibold">{data.haftalik_temalar[activeWeek - 1].tema}</span>
                    <span className="text-zinc-500 text-xs">{data.haftalik_temalar[activeWeek - 1].hedef}</span>
                  </div>
                )}
                {/* Day cards */}
                <div className="space-y-2">
                  {weekDays.map((day) => (
                    <div key={day.gun} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-zinc-300 text-xs font-bold">{day.gun}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-zinc-500 text-xs">{day.tarih_onerisi}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded', typeColors[day.icerik_turu] || 'bg-zinc-700 text-zinc-400')}>{day.icerik_turu}</span>
                            <span className="text-zinc-600 text-[10px] ml-auto">{day.format}</span>
                          </div>
                          <p className="text-zinc-200 text-sm font-medium">{day.baslik}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">{day.aciklama}</p>
                          {day.ipucu && <p className="text-amber-500/80 text-[10px] mt-1 italic">{day.ipucu}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Niche ve platform gir, 30 günlük plan al</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
