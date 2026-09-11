'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { AUTOSOCIAL_PLATFORMS, createAutoSocialSidecar, type AutoSocialPlatform } from '@/lib/autosocial'
import type { ContentStudioPackage } from '@/lib/contentStudio'

const labels = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' }

export default function AutoSocialExport({ captions }: { captions: ContentStudioPackage['captions'] }) {
  const [platform, setPlatform] = useState<AutoSocialPlatform>('instagram')
  const [videoName, setVideoName] = useState('')
  const [drafts, setDrafts] = useState<Partial<Record<AutoSocialPlatform, string>>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const caption = drafts[platform] ?? captions?.[platform] ?? ''

  function download() {
    setError(''); setNotice('')
    try {
      const sidecar = createAutoSocialSidecar(videoName, caption)
      const url = URL.createObjectURL(new Blob([sidecar.text], { type: 'text/plain;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = sidecar.filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice(`${sidecar.filename} için indirme başlatıldı. Henüz hiçbir paylaşım yapılmadı.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Açıklama indirilemedi.')
    }
  }

  return (
    <details className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950/70 p-4">
      <summary className="cursor-pointer py-2 text-sm font-semibold text-violet-300">AutoSocial’a aktar · yerel dosya</summary>
      <div className="mt-3 space-y-4 text-xs leading-5 text-zinc-400">
        <p>Hazırladığın videoyu seç, açıklamayı kontrol et ve indir. Video okunmaz veya sunucuya yüklenmez; yalnız dosya adı kullanılır. Bu işlem paylaşım yapmaz.</p>
        <label className="block">Yayın platformu
          <select value={platform} onChange={(event) => { setPlatform(event.target.value as AutoSocialPlatform); setError(''); setNotice('') }} className="mt-1 block min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-200">
            {AUTOSOCIAL_PLATFORMS.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
          </select>
        </label>
        <label className="block">Hazır video dosyası · yalnız adı kullanılır
          <input type="file" accept=".mp4,.mov,.webm,.avi,.mkv" onChange={(event) => { setVideoName(event.target.files?.[0]?.name ?? ''); setError(''); setNotice('') }} className="mt-1 block min-h-11 w-full min-w-0 text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/15 file:px-3 file:py-3 file:text-violet-300" />
        </label>
        <label className="block">{labels[platform]} açıklaması
          <textarea value={caption} maxLength={5000} rows={5} onChange={(event) => { setDrafts((current) => ({ ...current, [platform]: event.target.value })); setError(''); setNotice('') }} className="mt-1 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200" />
        </label>
        <button type="button" onClick={download} disabled={!videoName || !caption.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" /> Açıklama dosyasını indir</button>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {notice && <p role="status" className="break-words text-emerald-300">{notice}</p>}
        <p>AutoSocial’ı durdurup videoyu ve aynı adlı <code>.description</code> dosyasını <code className="break-all">queue/&lt;hesap&gt;/{platform}/pending</code> klasörüne birlikte koy. Birden fazla platform için ayrı klasör kullan. Açıklamayı ve hedef hesabı doğruladıktan sonra AutoSocial’dan başlat.</p>
        <p className="text-amber-300">Çalışan kuyruğa dosya koymak paylaşımı tetikleyebilir. AutoSocial panelini internete açma; yalnız kendi bilgisayarında kullan. Platform kuralları ve içerik hakları geçerlidir.</p>
        <a href="https://github.com/Katzca/AutoSocial" target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-violet-300 underline">AutoSocial kaynak kodu ve kurulum bilgisi ↗</a>
      </div>
    </details>
  )
}
