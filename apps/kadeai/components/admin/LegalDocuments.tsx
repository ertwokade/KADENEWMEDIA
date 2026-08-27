'use client'

/*
 * Panel planı: §5'te sayılan zorunlu metinlerin durum listesi → seçilen
 * metnin editörü → taslak kaydet / yayınla.
 *
 * Bu ekran hukuki METİN ÜRETMEZ. Metinler yetkili hukuk danışmanından gelir;
 * panel yalnızca sürümleyerek saklar, yayınlar ve ödeme onayına bağlar.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, Save, Upload } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'

interface DocumentStatus {
  slug: string
  title: string
  checkoutConsent: boolean
  scope: string
  existingPath?: string
  published: boolean
  version: number | null
  updatedAt: string | null
  hasBody: boolean
}

interface DocumentRow {
  slug: string
  title: string
  body: string
  version: number
  status: 'draft' | 'published'
  requires_checkout_consent: boolean
}

const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400'

export default function LegalDocuments() {
  const [documents, setDocuments] = useState<DocumentStatus[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<DocumentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/admin/legal', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Yasal metinler okunamadı.')
      setDocuments(data.documents || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Yasal metinler okunamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadList() }, [loadList])

  const openDocument = useCallback(async (slug: string) => {
    setSelected(slug)
    setError('')
    setMessage('')
    const spec = documents.find((item) => item.slug === slug)
    try {
      const response = await apiFetch(`/api/admin/legal?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Metin okunamadı.')
      setDraft(data.document || {
        slug,
        title: spec?.title || slug,
        body: '',
        version: 0,
        status: 'draft',
        requires_checkout_consent: spec?.checkoutConsent ?? false,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Metin okunamadı.')
    }
  }, [documents])

  async function save(status: 'draft' | 'published') {
    if (!draft) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch('/api/admin/legal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: draft.slug,
          title: draft.title,
          body: draft.body,
          status,
          requiresCheckoutConsent: draft.requires_checkout_consent,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Kaydedilemedi.')
      setDraft(data.document)
      setMessage(status === 'published'
        ? `Yayınlandı (sürüm ${data.document.version}). Onay gerektiriyorsa ödeme ekranında görünür.`
        : 'Taslak kaydedildi. Yayınlanana kadar kimse göremez.')
      await loadList()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const missing = documents.filter((document) => !document.published)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Hukuki inceleme zorunlu</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Bu panel metin üretmez. Otomatik yenileme, cayma hakkı, anında ifa edilen dijital
              hizmet onayı, KVKK veri işleyen rolleri, üçüncü taraf AI sağlayıcılarına veri
              aktarımı ve BYOK sorumluluk sınırları yayımdan önce Türkiye’de yetkili bir hukuk
              danışmanı tarafından hazırlanmalı veya doğrulanmalıdır.
            </p>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

      {loading ? <p className="text-sm text-zinc-500">Durum okunuyor…</p> : (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">
            Zorunlu metinler <span className="ml-1 text-xs font-normal text-zinc-500">{documents.length - missing.length}/{documents.length} yayında</span>
          </h3>
          <ul className="mt-3 space-y-1.5">
            {documents.map((document) => (
              <li key={document.slug}>
                <button
                  onClick={() => void openDocument(document.slug)}
                  className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition ${selected === document.slug ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                  {document.published
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />}
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-200">
                      {document.title}
                      {document.checkoutConsent && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">ödeme onayı</span>}
                      {document.existingPath && <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">ana sitede: {document.existingPath}</span>}
                    </span>
                    <span className="block text-xs text-zinc-500">{document.scope}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {draft && (
        <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">
            {draft.title}
            <span className="ml-2 text-xs font-normal text-zinc-500">
              {draft.version > 0 ? `sürüm ${draft.version} · ${draft.status === 'published' ? 'yayında' : 'taslak'}` : 'henüz kaydedilmedi'}
            </span>
          </h3>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Başlık</span>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={input} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">
              Metin — hukuk danışmanından gelen düz metni buraya yapıştır
            </span>
            <textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              rows={16}
              className={`${input} font-mono text-xs leading-6`}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={draft.requires_checkout_consent}
              onChange={(event) => setDraft({ ...draft, requires_checkout_consent: event.target.checked })}
              className="h-4 w-4 accent-violet-500"
            />
            Ödeme öncesi açık onay gerektirir
          </label>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => void save('draft')} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:text-zinc-100 disabled:opacity-50">
              <Save className="h-4 w-4" /> Taslak kaydet
            </button>
            <button onClick={() => void save('published')} disabled={saving || !draft.body.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50">
              <Upload className="h-4 w-4" /> Yayınla
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Metin her değiştiğinde sürüm artar. Daha önce alınmış onaylar eski sürüme bağlı kalır,
            böylece kullanıcının tam olarak neyi kabul ettiği geriye dönük kanıtlanabilir.
          </p>
        </section>
      )}
    </div>
  )
}
