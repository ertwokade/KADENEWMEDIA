'use client'

import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useState, useEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check, Trash2, Plus, Edit2, X, Save } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'

interface Template {
  id: string
  kategori: string
  baslik: string
  icerik: string
  tarih: string
}

const kategoriler = ['Hook', 'CTA', 'Açıklama', 'Caption', 'DM', 'Diğer']
const STARTER_TEMPLATES: Template[] = [
  { id: 'local-starter-hook', kategori: 'Hook', baslik: 'Merak boşluğu', icerik: '[Hedef kitle] olarak [sonuç] istiyorsan, çoğu kişinin atladığı şu ayrıntıyı bilmelisin: [ayrıntı].', tarih: 'Başlangıç seti' },
  { id: 'local-starter-cta', kategori: 'CTA', baslik: 'Yorum CTA’sı', icerik: 'Sen bu durumda hangi yöntemi kullanıyorsun? Tek kelimeyle yorumlara yaz; en iyi örnekleri bir sonraki içerikte paylaşacağım.', tarih: 'Başlangıç seti' },
  { id: 'local-starter-description', kategori: 'Açıklama', baslik: 'Video açıklaması', icerik: '[Konu] hakkında uygulayabileceğin adımları bu videoda net örneklerle anlatıyorum.\n\nBölümler:\n00:00 Giriş\n[Zaman] [Bölüm]\n\nKaynaklar: [bağlantılar]', tarih: 'Başlangıç seti' },
  { id: 'local-starter-caption', kategori: 'Caption', baslik: 'Problem → çözüm', icerik: '[Sorun] yüzünden [istenmeyen sonuç] yaşıyorsan bu üç adımı dene:\n1. [adım]\n2. [adım]\n3. [adım]\n\nKaydet ve uygularken geri dön.', tarih: 'Başlangıç seti' },
  { id: 'local-starter-dm', kategori: 'DM', baslik: 'İş birliği ilk mesajı', icerik: 'Merhaba [isim], [özgün içerik/çalışma] yaklaşımını özellikle beğendim. [marka/proje] için iki tarafa da değer katacak kısa bir iş birliği fikrim var. Uygunsan ayrıntıları paylaşabilir miyim?', tarih: 'Başlangıç seti' },
]

function readTemplate(value: unknown): Template {
  if (!value || typeof value !== 'object') throw new Error('Geçerli şablon yanıtı alınamadı.')
  const t = value as Record<string, unknown>
  if (typeof t.id !== 'string' || !t.id || typeof t.title !== 'string' || typeof t.content !== 'string' || typeof t.category !== 'string') throw new Error('Geçerli şablon yanıtı alınamadı.')
  const date = typeof t.created_at === 'string' ? new Date(t.created_at) : null
  return { id: t.id, baslik: t.title, icerik: t.content, kategori: t.category, tarih: date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('tr-TR') : 'Tarih belirtilmedi' }
}

const isStarter = (id: string) => STARTER_TEMPLATES.some(template => template.id === id)

export default function TemplatesPage() {
  const [confirm, confirmDialog] = useConfirm()
  const [templates, setTemplates] = useState<Template[]>([])
  const [kategori, setKategori] = useState('Hook')
  const [baslik, setBaslik] = useState('')
  const [icerik, setIcerik] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState('Tümü')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [syncError, setSyncError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true); setLoadError(''); setTemplates([])
    apiFetch('/api/templates', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Şablonlar için yeniden giriş yapmalısın.' : data.error || 'Şablonlar yüklenemedi.')
        if (!Array.isArray(data.templates)) throw new Error('Geçerli şablon listesi alınamadı.')
        const cloud = data.templates.map(readTemplate)
        // Unowned legacy storage is preserved, never displayed or overwritten.
        if (active) setTemplates([...cloud, ...STARTER_TEMPLATES])
      })
      .catch(error => { if (active) { setTemplates(STARTER_TEMPLATES); setLoadError(error instanceof Error ? error.message : 'Şablonlar yüklenemedi.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [revision])

  const handleSave = async () => {
    if (pending || loading || loadError || !baslik.trim() || !icerik.trim()) return
    setPending(true); setSyncError('')
    try {
      const response = await apiFetch('/api/templates', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId || undefined, category: kategori, title: baslik.trim(), content: icerik.trim() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Şablon kaydedilemedi.')
      const saved = readTemplate(data.template)
      if (editingId && saved.id !== editingId) throw new Error('Şablon yanıtı kayıtla eşleşmedi.')
      setTemplates(current => editingId ? current.map(t => t.id === editingId ? saved : t) : [saved, ...current])
      setEditingId(null); setBaslik(''); setIcerik(''); setKategori('Hook')
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Şablon kaydedilemedi.') }
    finally { setPending(false) }
  }

  const handleEdit = (t: Template) => {
    if (pending) return
    setEditingId(isStarter(t.id) ? null : t.id)
    setKategori(t.kategori)
    setBaslik(t.baslik)
    setIcerik(t.icerik)
  }

  const handleDelete = async (id: string) => {
    if (pending || isStarter(id)) return
    if (!(await confirm('Bu şablon kalıcı olarak silinecek.', { title: 'Şablon silinsin mi?', confirmLabel: 'Sil', danger: true }))) return
    setPending(true); setSyncError('')
    try {
      const response = await apiFetch('/api/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const data = await response.json()
      if (!response.ok || data.success !== true) throw new Error(data.error || 'Şablon silinemedi.')
      setTemplates(current => current.filter(t => t.id !== id))
      if (editingId === id) { setEditingId(null); setBaslik(''); setIcerik('') }
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Şablon silinemedi.') }
    finally { setPending(false) }
  }

  const handleCopy = async (t: Template) => {
    setCopiedId(null); setSyncError('')
    try {
      await copyToClipboard(t.icerik)
      setCopiedId(t.id)
      setTimeout(() => setCopiedId(current => current === t.id ? null : current), 2000)
    } catch { setSyncError('Panoya kopyalanamadı. Metni düzenleme alanından seçip kopyalayabilirsin.') }
  }

  const filtered = filterKategori === 'Tümü' ? templates : templates.filter((t) => t.kategori === filterKategori)

  const catColors: Record<string, string> = {
    Hook: 'bg-violet-500/20 text-violet-300',
    CTA: 'bg-blue-500/20 text-blue-300',
    Açıklama: 'bg-emerald-500/20 text-emerald-300',
    Caption: 'bg-pink-500/20 text-pink-300',
    DM: 'bg-cyan-500/20 text-cyan-300',
    Diğer: 'bg-zinc-700 text-zinc-400',
  }

  return (
    <div className="flex flex-col h-full">
      {confirmDialog}
      <TopBar title="Şablon Kütüphanesi" description="Kendi içerik şablonlarını oluştur ve yönet" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-zinc-200 text-sm font-semibold">
                  {editingId ? 'Şablonu Düzenle' : 'Yeni Şablon'}
                </h3>
                {editingId && (
                  <button disabled={pending} aria-label="Düzenlemeyi iptal et" onClick={() => { setEditingId(null); setBaslik(''); setIcerik('') }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="template-category" className="block text-zinc-400 text-xs font-medium mb-1.5">Kategori</label>
                <select id="template-category" disabled={pending} value={kategori} onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {kategoriler.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="template-title" className="block text-zinc-400 text-xs font-medium mb-1.5">Başlık</label>
                <input id="template-title" maxLength={200} disabled={pending} value={baslik} onChange={(e) => setBaslik(e.target.value)}
                  placeholder="Şablon başlığı..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label htmlFor="template-content" className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik</label>
                <textarea id="template-content" maxLength={20000} disabled={pending} value={icerik} onChange={(e) => setIcerik(e.target.value)}
                  placeholder="Şablon içeriği..." rows={6}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button onClick={handleSave} disabled={loading || !!loadError || pending || !baslik.trim() || !icerik.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {pending ? 'Kaydediliyor…' : editingId ? <><Save className="w-4 h-4" />Kaydet</> : <><Plus className="w-4 h-4" />Ekle</>}
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {loadError && <div role="alert" className="mb-4 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">
              <p>{loadError}</p><button onClick={() => setRevision(value => value + 1)} className="min-h-11 underline">Yeniden dene</button>
            </div>}
            {syncError && <div role="alert" className="mb-4 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">{syncError}</div>}
            <p className="mb-3 text-xs text-zinc-500">Başlangıç seti hazır örneklerden oluşur; düzenlediğinde hesabına yeni bir şablon olarak kaydedilir. Kişisel şablonlar yalnız bu hesaptan okunur.</p>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {['Tümü', ...kategoriler].map((k) => (
                <button key={k} onClick={() => setFilterKategori(k)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    filterKategori === k ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600')}>
                  {k}
                </button>
              ))}
              <span className="ml-auto text-zinc-600 text-xs">{loading ? 'Şablonlar yükleniyor…' : `${filtered.length} şablon`}</span>
            </div>
            {!loading && filtered.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                {templates.length === 0 ? 'Henüz şablon eklenmedi' : 'Bu kategoride şablon yok'}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => (
                  <div key={t.id} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', catColors[t.kategori] || catColors.Diğer)}>
                          {t.kategori}
                        </span>
                        <h4 className="text-zinc-200 text-sm font-semibold">{t.baslik}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button aria-label={`${t.baslik} kopyala`} onClick={() => handleCopy(t)} className="flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-violet-400 transition-colors p-1">
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button disabled={pending} aria-label={`${t.baslik} düzenle`} onClick={() => handleEdit(t)} className="flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-amber-400 transition-colors p-1">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isStarter(t.id) && <button disabled={pending} aria-label={`${t.baslik} sil`} onClick={() => handleDelete(t.id)} className="flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>}
                      </div>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">{t.icerik}</p>
                    <p className="text-zinc-700 text-[10px] mt-2">{t.tarih}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
