'use client'

import { apiFetch } from '@/lib/client/api'
import { FormEvent, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import { useModel } from '@/lib/context/ModelContext'
import { cn } from '@/lib/utils'

const platformOptions = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'X']

export default function SocialAuditPage() {
  const { selectedModel } = useModel()
  const [accountName, setAccountName] = useState('')
  const [niche, setNiche] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['YouTube', 'Instagram', 'TikTok'])
  const [bio, setBio] = useState('')
  const [metrics, setMetrics] = useState('')
  const [recentPosts, setRecentPosts] = useState('')
  const [goal, setGoal] = useState('Kişisel markayı büyütmek ve ürün/hizmet satışına bağlamak')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePlatform = (platform: string) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.length > 1
          ? current.filter((item) => item !== platform)
          : current
        : [...current, platform]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!accountName.trim() || !niche.trim()) return

    setLoading(true)
    setError('')
    setContent('')

    try {
      const response = await apiFetch('/api/generate/social-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, niche, platforms, bio, metrics, recentPosts, goal, model: selectedModel }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analiz üretilemedi')
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Kişisel Sosyal Medya Analizcisi" description="YouTube, Instagram ve TikTok hesabı için büyüme raporu çıkar" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hesap / kişi adı</label>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Kadir Demir / Kade Media"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Niş</label>
                <input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  placeholder="AI, medya, ajans, organizasyon..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platformlar</label>
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePlatform(item)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                        platforms.includes(item)
                          ? 'border-yellow-400/50 bg-yellow-400/15 text-yellow-200'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Bio / profil metni</label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  placeholder="Profil açıklamasını buraya yapıştır"
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Metrikler</label>
                <textarea
                  value={metrics}
                  onChange={(event) => setMetrics(event.target.value)}
                  rows={4}
                  placeholder="Takipçi, izlenme, etkileşim, satış, trafik..."
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Son içerikler</label>
                <textarea
                  value={recentPosts}
                  onChange={(event) => setRecentPosts(event.target.value)}
                  rows={5}
                  placeholder="Son 5-10 post/video başlığını veya link notlarını yaz"
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hedef</label>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !accountName.trim() || !niche.trim()}
                className="w-full rounded-lg bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Analiz ediliyor...' : 'Sosyal Medya Analizi Yap'}
              </button>
            </form>
          </div>

          <div className="min-w-0 flex-1">
            {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {content && !loading && (
              <div className="rounded-xl border border-yellow-400/20 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-yellow-300">Sosyal medya raporu</p>
                  <CopyButton text={content} />
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{content}</pre>
              </div>
            )}
            {!content && !loading && !error && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-600">
                Hesap bilgilerini gir, büyüme raporu burada oluşsun.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
