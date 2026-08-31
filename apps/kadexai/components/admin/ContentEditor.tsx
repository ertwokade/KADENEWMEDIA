'use client'

/*
 * Panel planı: hero metinleri → demo paneli etiketleri → CTA'lar →
 * sonuç kartları → özellik kartları → SSS → SEO. Kaydetme, kamuya açık
 * sayfanın önbelleğini de yeniler.
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import type { DemoPageContent } from '@/lib/cms/defaults'

const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400'

export default function ContentEditor() {
  const [content, setContent] = useState<DemoPageContent | null>(null)
  const [defaults, setDefaults] = useState<DemoPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/admin/content?key=kadexai-demo', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İçerik okunamadı.')
      setContent(data.content)
      setDefaults(data.defaults)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İçerik okunamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function save() {
    if (!content) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch('/api/admin/content?key=kadexai-demo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İçerik kaydedilemedi.')
      setContent(data.content)
      setMessage('Kaydedildi. Kamuya açık demo sayfası yenilendi.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İçerik kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof DemoPageContent>(key: K, value: DemoPageContent[K]) {
    setContent((current) => current ? { ...current, [key]: value } : current)
  }

  if (loading) return <p className="text-sm text-zinc-500">İçerik okunuyor…</p>
  if (!content) return <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error || 'İçerik okunamadı.'}</div>

  return (
    <div className="space-y-5">
      {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

      <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-5 text-zinc-400">
        Bu metinler <code className="font-mono text-zinc-300">/kadexai-demo</code> sayfasını besler.
        Kod içindeki varsayılanlar korunur; burada yalnızca üzerine yazılır, bu yüzden
        boş bırakılan bir alan sayfayı boş bırakmaz.
      </p>

      <Section title="Hero">
        <Text label="Üst etiket" value={content.eyebrow} onChange={(value) => set('eyebrow', value)} />
        <Text label="Başlık" value={content.title} onChange={(value) => set('title', value)} />
        <Area label="Açıklama" value={content.description} onChange={(value) => set('description', value)} />
      </Section>

      <Section title="Demo paneli">
        <Text label="Panel başlığı" value={content.panelTitle} onChange={(value) => set('panelTitle', value)} />
        <Text label="Alan etiketi" value={content.panelFieldLabel} onChange={(value) => set('panelFieldLabel', value)} />
        <Text label="Buton" value={content.panelRunLabel} onChange={(value) => set('panelRunLabel', value)} />
        <Text label="Buton (çalışırken)" value={content.panelRunningLabel} onChange={(value) => set('panelRunningLabel', value)} />
        <Text label="Limit notu" value={content.panelLimitNote} onChange={(value) => set('panelLimitNote', value)} />
      </Section>

      <ListSection
        title="Butonlar (CTA)"
        items={content.ctas}
        onChange={(items) => set('ctas', items)}
        empty={{ label: '', href: '' }}
        fields={[['label', 'Metin'], ['href', 'Bağlantı']]}
      />

      <Section title="Sonuç kartları">
        <Text label="Bölüm başlığı" value={content.resultsTitle} onChange={(value) => set('resultsTitle', value)} />
      </Section>
      <ListSection
        title="Sonuç kartı içerikleri"
        items={content.results}
        onChange={(items) => set('results', items)}
        empty={{ title: '', text: '' }}
        fields={[['title', 'Başlık'], ['text', 'Metin']]}
        area="text"
      />

      <Section title="Özellikler">
        <Text label="Bölüm başlığı" value={content.featuresTitle} onChange={(value) => set('featuresTitle', value)} />
      </Section>
      <ListSection
        title="Özellik kartları"
        items={content.features}
        onChange={(items) => set('features', items)}
        empty={{ title: '', text: '' }}
        fields={[['title', 'Başlık'], ['text', 'Metin']]}
        area="text"
      />

      <ListSection
        title="Sık sorulanlar (FAQPage yapısal verisini de besler)"
        items={content.faq}
        onChange={(items) => set('faq', items)}
        empty={{ question: '', answer: '' }}
        fields={[['question', 'Soru'], ['answer', 'Cevap']]}
        area="answer"
      />

      <Section title="SEO">
        <Text label="Sayfa başlığı" value={content.seo.title} onChange={(value) => set('seo', { ...content.seo, title: value })} />
        <Area label="Meta açıklama" value={content.seo.description} onChange={(value) => set('seo', { ...content.seo, description: value })} />
        <Text label="OG başlığı" value={content.seo.ogTitle} onChange={(value) => set('seo', { ...content.seo, ogTitle: value })} />
        <Area label="OG açıklaması" value={content.seo.ogDescription} onChange={(value) => set('seo', { ...content.seo, ogDescription: value })} />
      </Section>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Kaydediliyor…' : 'Kaydet ve yayınla'}
        </button>
        <button
          onClick={() => defaults && setContent(structuredClone(defaults))}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          <RotateCcw className="h-4 w-4" /> Varsayılanlara dön
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {children}
    </section>
  )
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={input} />
    </label>
  )
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={input} />
    </label>
  )
}

function ListSection<T extends Record<string, string>>({
  title, items, onChange, empty, fields, area,
}: {
  title: string
  items: T[]
  onChange: (items: T[]) => void
  empty: T
  fields: Array<[keyof T & string, string]>
  area?: keyof T & string
}) {
  return (
    <Section title={title}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-zinc-800 p-3">
            {fields.map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-1 block text-xs text-zinc-500">{label}</span>
                {area === field ? (
                  <textarea
                    value={item[field]}
                    rows={2}
                    onChange={(event) => onChange(items.map((row, position) => position === index ? { ...row, [field]: event.target.value } : row))}
                    className={input}
                  />
                ) : (
                  <input
                    value={item[field]}
                    onChange={(event) => onChange(items.map((row, position) => position === index ? { ...row, [field]: event.target.value } : row))}
                    className={input}
                  />
                )}
              </label>
            ))}
            <button
              onClick={() => onChange(items.filter((_, position) => position !== index))}
              className="inline-flex items-center gap-1.5 text-xs text-red-300 transition hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" /> Kaldır
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, { ...empty }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-100"
        >
          <Plus className="h-3.5 w-3.5" /> Ekle
        </button>
      </div>
    </Section>
  )
}
