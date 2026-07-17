'use client'

import { apiFetch } from '@/lib/client/api'
import { useState, useRef } from 'react'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, Loader2, Image as ImageIcon, Upload, Type } from 'lucide-react'

const styles = [
  { id: 'cinematic',   label: 'Sinematik',      prompt: 'cinematic dramatic lighting, professional photography, 8k, wide angle' },
  { id: 'bold',        label: 'Cesur/Bold',      prompt: 'bold vibrant colors, high contrast, eye-catching youtube thumbnail style' },
  { id: 'minimalist',  label: 'Minimalist',      prompt: 'minimalist clean background, modern design, plenty of space for text' },
  { id: 'tech',        label: 'Teknoloji',       prompt: 'futuristic tech background, neon lights, dark theme, digital art' },
  { id: 'lifestyle',   label: 'Lifestyle',       prompt: 'bright lifestyle photography, natural light, warm authentic tones' },
  { id: 'vlog',        label: 'Vlog/Seyahat',    prompt: 'travel vlog style, golden hour, stunning landscape background' },
  { id: 'education',   label: 'Eğitim',          prompt: 'clean educational infographic background, pastel colors, modern flat design' },
  { id: 'cartoon',     label: 'İllüstrasyon',    prompt: 'digital illustration, colorful cartoon style, flat vector design' },
]

const ratios = [
  { id: '16:9', label: 'YouTube (16:9)',      w: 1280, h: 720  },
  { id: '9:16', label: 'Reels/TikTok (9:16)', w: 720,  h: 1280 },
  { id: '1:1',  label: 'Kare (1:1)',          w: 1080, h: 1080 },
  { id: '4:5',  label: 'Instagram (4:5)',     w: 1080, h: 1350 },
]

function fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}

export default function AiThumbnailPage() {
  const [topic, setTopic]           = useState('')
  const [titleText, setTitleText]   = useState('')
  const [style, setStyle]           = useState('bold')
  const [ratio, setRatio]           = useState('16:9')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [personPhoto, setPersonPhoto] = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [finalUrl, setFinalUrl]     = useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = useState('')
  const [sourceNote, setSourceNote] = useState('')
  const [error, setError]           = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const selectedRatio = ratios.find(r => r.id === ratio)!
  const selectedStyle = styles.find(s => s.id === style)!

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPersonPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Canvas üzerinde arka plan + kişi fotoğrafı + başlık birleştir
  const compositeOnCanvas = (bgDataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.width = selectedRatio.w
      canvas.height = selectedRatio.h

      const bg = new window.Image()
      bg.crossOrigin = 'anonymous'
      bg.src = bgDataUrl
      bg.onload = () => {
        // 1. Arka plan
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

        const drawFinish = () => {
          // 3. Başlık metni overlay
          if (titleText.trim()) {
            const fontSize = Math.round(canvas.width * 0.055)
            ctx.font = `900 ${fontSize}px Arial, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'bottom'

            const maxW = canvas.width * 0.85
            const words = titleText.split(' ')
            const lines: string[] = []
            let cur = ''
            for (const w of words) {
              const test = cur ? `${cur} ${w}` : w
              if (ctx.measureText(test).width > maxW) { if (cur) lines.push(cur); cur = w }
              else cur = test
            }
            if (cur) lines.push(cur)

            const lineH = fontSize * 1.25
            const totalH = lines.length * lineH + 20
            const startY = canvas.height - 40

            // Gölge arka plan
            ctx.fillStyle = 'rgba(0,0,0,0.65)'
            fillRoundRect(ctx, canvas.width * 0.05, startY - totalH - 10, canvas.width * 0.9, totalH + 20, 8)

            // Metin
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur = 8
            lines.forEach((line, i) => {
              ctx.fillText(line, canvas.width / 2, startY - (lines.length - 1 - i) * lineH)
            })
            ctx.shadowBlur = 0
          }

          resolve(canvas.toDataURL('image/jpeg', 0.92))
        }

        // 2. Kişi fotoğrafı (varsa)
        if (personPhoto) {
          const person = new window.Image()
          person.src = personPhoto
          person.onload = () => {
            const ph = canvas.height * 0.75
            const pw = (person.width / person.height) * ph
            const px = canvas.width - pw - 20
            const py = canvas.height - ph - 20
            ctx.drawImage(person, px, py, pw, ph)
            drawFinish()
          }
          person.onerror = drawFinish
        } else {
          drawFinish()
        }
      }
      bg.onerror = () => reject(new Error('Arka plan yüklenemedi'))
    })

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true); setError(''); setFinalUrl(null); setSourceNote('')

    const fullPrompt = [
      topic,
      selectedStyle.prompt,
      extraPrompt,
      'no text, no watermark, high quality, clean'
    ].filter(Boolean).join(', ')

    try {
      const response = await apiFetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, width: selectedRatio.w, height: selectedRatio.h }),
      })
      const data = await response.json()
      const background = data.image as string | undefined
      if (!response.ok || !background) throw new Error(typeof data.error === 'string' ? data.error : 'Görsel sağlayıcısı yanıt vermedi.')
      const source = 'Yapılandırılmış görsel modeli'
      const note = typeof data.note === 'string' ? data.note : ''

      const final = await compositeOnCanvas(background)
      setFinalUrl(final)
      setSourceLabel(source)
      setSourceNote(note)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Görsel üretilemedi. Tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!finalUrl) return
    const a = document.createElement('a')
    a.href = finalUrl
    a.download = `thumbnail_${topic.slice(0, 20).replace(/\s+/g, '_')}.jpg`
    a.click()
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="AI Thumbnail Üretici" description="Başlık, fotoğraf ve stil ile profesyonel thumbnail üret" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-xs font-medium">Güvenli sunucu üretimi · otomatik yedek</span>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Thumbnail Konusu / Prompt</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={3}
                placeholder="Örn: Yapay zeka ile para kazanmak, laptopla çalışan genç insan..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Başlık Metni <span className="text-zinc-600">(görsel üstüne yazılır)</span>
              </label>
              <input value={titleText} onChange={e => setTitleText(e.target.value)}
                placeholder="SIFIRDAN ZENGİN OLDUM"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Kişi Fotoğrafı <span className="text-zinc-600">(opsiyonel)</span>
              </label>
              <div onClick={() => photoInputRef.current?.click()}
                className={cn('border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
                  personPhoto ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-700 hover:border-zinc-500')}>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {personPhoto
                  ? <div className="flex items-center gap-2 justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={personPhoto} alt="person" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-violet-300 text-xs">Fotoğraf yüklendi ✓</span>
                    </div>
                  : <p className="text-zinc-500 text-xs">Fotoğraf ekle — thumbnail'e yerleştirilir</p>
                }
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Stil</label>
              <div className="grid grid-cols-2 gap-1.5">
                {styles.map(s => (
                  <button key={s.id} type="button" onClick={() => setStyle(s.id)}
                    className={cn('py-1.5 rounded-lg text-xs transition-colors border text-center',
                      style === s.id ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Boyut</label>
              <div className="space-y-1.5">
                {ratios.map(r => (
                  <button key={r.id} type="button" onClick={() => setRatio(r.id)}
                    className={cn('w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors border',
                      ratio === r.id ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                    {r.label} <span className="text-zinc-600 ml-1">{r.w}×{r.h}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Ek Prompt <span className="text-zinc-600">(opsiyonel)</span></label>
              <input value={extraPrompt} onChange={e => setExtraPrompt(e.target.value)}
                placeholder="mavi arka plan, gece şehri..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
            </div>

            <button onClick={generate} disabled={loading || !topic.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2c322] py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#ffda3f] disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Üretiliyor...</> : <><ImageIcon className="w-4 h-4" /> Thumbnail Üret</>}
            </button>
          </div>

          <div className="flex-1 min-w-0 flex flex-col items-center justify-start gap-4">
            {error && <div className="w-full rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}

            {finalUrl && !loading && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={finalUrl} alt="Generated thumbnail" className="rounded-xl border border-zinc-700/50 max-w-full shadow-xl" />
                <div className="flex gap-2">
                  <button onClick={generate} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors border border-zinc-700">
                    <RefreshCw className="w-3.5 h-3.5" /> Yeniden Üret
                  </button>
                  <button onClick={download}
                    className="flex items-center gap-1.5 rounded-lg bg-[#f2c322] px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#ffda3f]">
                    <Download className="w-3.5 h-3.5" /> İndir
                  </button>
                </div>
                {sourceLabel && <p className="text-xs text-zinc-600">Kaynak: {sourceLabel}</p>}
                {sourceNote && <p className="max-w-2xl rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs leading-5 text-amber-300">Ana görsel sağlayıcısı yerine yedek servis kullanıldı: {sourceNote}</p>}
              </>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                <p className="text-zinc-500 text-sm">Görsel üretiliyor... (~5-15 sn)</p>
                <p className="text-zinc-700 text-xs">Arka plan, başlık ve fotoğraf güvenli biçimde birleştiriliyor</p>
              </div>
            )}

            {!finalUrl && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <ImageIcon className="w-12 h-12 text-zinc-800" />
                <p className="text-zinc-600 text-sm">Konu gir ve thumbnail üret</p>
                <p className="text-zinc-700 text-xs">Başlık metni ve fotoğraf canvas'a otomatik eklenir</p>
              </div>
            )}

            {/* Hidden canvas for compositing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  )
}
