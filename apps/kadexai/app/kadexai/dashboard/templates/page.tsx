'use client'

import { useState, useEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check, Trash2, Plus, Edit2, X, Save } from 'lucide-react'
import { apiPath } from '@/lib/appConfig'

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [kategori, setKategori] = useState('Hook')
  const [baslik, setBaslik] = useState('')
  const [icerik, setIcerik] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState('Tümü')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    fetch(apiPath('/api/templates'), { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error('local')
        const cloud: Template[] = Array.isArray(data.templates) ? data.templates.map((template: Record<string, unknown>) => ({ id: String(template.id), kategori: String(template.category || 'Diğer'), baslik: String(template.title || ''), icerik: String(template.content || ''), tarih: new Date(String(template.created_at)).toLocaleDateString('tr-TR') })) : []
        let local: Template[] = []
        try {
          const saved = JSON.parse(localStorage.getItem('contentai-templates') || '[]')
          if (Array.isArray(saved)) local = saved.filter((template) => String(template?.id || '').startsWith('local-'))
        } catch { /* bozuk yerel kayıt yok sayılır */ }
        const merged = [...cloud, ...local.filter((item) => !cloud.some((saved) => saved.id === item.id))]
        saveToStorage(merged.length ? merged : STARTER_TEMPLATES)
      })
      .catch(() => {
        try {
          const saved = JSON.parse(localStorage.getItem('contentai-templates') || '[]')
          if (Array.isArray(saved) && saved.length) setTemplates(saved)
          else setTemplates(STARTER_TEMPLATES)
        } catch { localStorage.removeItem('contentai-templates') }
        setSyncError('Bulut şablonları yüklenemedi; yerel kayıtlar kullanılıyor.')
      })
  }, [])

  const saveToStorage = (items: Template[]) => {
    localStorage.setItem('contentai-templates', JSON.stringify(items))
    setTemplates(items)
  }

  const handleSave = async () => {
    if (!baslik.trim() || !icerik.trim()) return
    if (editingId) {
      const updated = templates.map((t) =>
        t.id === editingId ? { ...t, kategori, baslik, icerik } : t)
      saveToStorage(updated)
      if (!editingId.startsWith('local-')) {
        void fetch(apiPath('/api/templates'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, category: kategori, title: baslik, content: icerik }) }).then(async (response) => { if (!response.ok && response.status !== 401) setSyncError((await response.json()).error || 'Şablon buluta kaydedilemedi.') }).catch(() => setSyncError('Şablon buluta kaydedilemedi.'))
      }
      setEditingId(null)
    } else {
      const newTemplate: Template = {
        id: `local-${Date.now()}`,
        kategori,
        baslik,
        icerik,
        tarih: new Date().toLocaleDateString('tr-TR'),
      }
      saveToStorage([newTemplate, ...templates])
      try {
        const response = await fetch(apiPath('/api/templates'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: kategori, title: baslik, content: icerik }) })
        const data = await response.json()
        if (response.ok && data.template) saveToStorage([{ ...newTemplate, id: data.template.id }, ...templates])
        else if (response.status !== 401) setSyncError(data.error || 'Şablon buluta kaydedilemedi.')
      } catch { setSyncError('Şablon bu cihazda kaydedildi; bulut bağlantısı kurulamadı.') }
    }
    setBaslik('')
    setIcerik('')
    setKategori('Hook')
  }

  const handleEdit = (t: Template) => {
    setEditingId(t.id)
    setKategori(t.kategori)
    setBaslik(t.baslik)
    setIcerik(t.icerik)
  }

  const handleDelete = (id: string) => {
    saveToStorage(templates.filter((t) => t.id !== id))
    if (editingId === id) { setEditingId(null); setBaslik(''); setIcerik('') }
    if (!id.startsWith('local-')) void fetch(apiPath('/api/templates'), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => setSyncError('Şablon buluttan silinemedi.'))
  }

  const handleCopy = async (t: Template) => {
    await copyToClipboard(t.icerik)
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 2000)
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
                  <button onClick={() => { setEditingId(null); setBaslik(''); setIcerik('') }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Kategori</label>
                <select value={kategori} onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {kategoriler.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Başlık</label>
                <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
                  placeholder="Şablon başlığı..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik</label>
                <textarea value={icerik} onChange={(e) => setIcerik(e.target.value)}
                  placeholder="Şablon içeriği..." rows={6}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button onClick={handleSave} disabled={!baslik.trim() || !icerik.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {editingId ? <><Save className="w-4 h-4" />Kaydet</> : <><Plus className="w-4 h-4" />Ekle</>}
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {syncError && <div className="mb-4 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-300">{syncError}</div>}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {['Tümü', ...kategoriler].map((k) => (
                <button key={k} onClick={() => setFilterKategori(k)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    filterKategori === k ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600')}>
                  {k}
                </button>
              ))}
              <span className="ml-auto text-zinc-600 text-xs">{filtered.length} şablon</span>
            </div>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                {templates.length === 0 ? 'Henüz şablon eklenmedi' : 'Bu kategoride şablon yok'}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => (
                  <div key={t.id} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', catColors[t.kategori] || catColors.Diğer)}>
                          {t.kategori}
                        </span>
                        <h4 className="text-zinc-200 text-sm font-semibold">{t.baslik}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleCopy(t)} className="text-zinc-500 hover:text-violet-400 transition-colors p-1">
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleEdit(t)} className="text-zinc-500 hover:text-amber-400 transition-colors p-1">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
