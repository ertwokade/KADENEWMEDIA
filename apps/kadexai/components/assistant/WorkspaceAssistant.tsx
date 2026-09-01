'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, MessageCircle, X } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import { useProfile } from '@/lib/context/ProfileContext'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'
import { TOOL_REGISTRY, getToolById } from '@/lib/tools/registry'

/**
 * Çalışma alanı asistanı.
 *
 * `/api/assistant` ucu vardı ama panelde onu kullanan hiçbir yer yoktu;
 * yalnızca operasyon kiti çağırıyordu. Burada panelin her sayfasından
 * ulaşılabilen bir yüzey açılıyor ve uca marka profili + son çalışmalar
 * bağlam olarak veriliyor, böylece cevap genel değil sana özel oluyor.
 *
 * NOT: Bu asistan kanaldan bağımsız. WhatsApp üzerinden soru sorulabilmesi
 * için çift yönlü bir sağlayıcı (WhatsApp Business API / Twilio) gerekiyor;
 * bugünkü CallMeBot yalnızca mesaj GÖNDEREBİLİYOR.
 */

type Mesaj = { rol: 'sen' | 'asistan'; metin: string; araclar?: string[] }

/** Cevapta adı geçen araçları bulur; kullanıcı okuyup bırakmak yerine açsın. */
function gecenAraclar(cevap: string): string[] {
  const alt = cevap.toLocaleLowerCase('tr-TR')
  return TOOL_REGISTRY
    .filter((t) => t.enabled && !t.comingSoon && t.permissions.includes('user'))
    .filter((t) => t.name.length > 4 && alt.includes(t.name.toLocaleLowerCase('tr-TR')))
    .map((t) => t.id)
    .slice(0, 3)
}

export default function WorkspaceAssistant() {
  const { account } = useProfile()
  const alanYolu = useWorkspaceHref()
  const [acik, setAcik] = useState(false)
  const [soru, setSoru] = useState('')
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const sonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mesajlar, yukleniyor])

  /** Marka profili + son çalışmalar: cevabın genel olmamasını sağlayan bağlam. */
  const baglamKur = async (): Promise<string> => {
    const marka = account?.brand
    const parcalar = [
      marka?.name ? `Marka: ${marka.name}` : '',
      marka?.niche ? `Niş: ${marka.niche}` : '',
      marka?.audience ? `Hedef kitle: ${marka.audience}` : '',
      marka?.voice ? `Marka sesi: ${marka.voice}` : '',
      marka?.description ? `Açıklama: ${marka.description}` : '',
    ].filter(Boolean)

    try {
      const r = await fetch(apiPath('/api/history?limit=8'))
      if (r.ok) {
        const d = await r.json()
        const adlar = ((d.history ?? []) as Array<{ tool: string }>)
          .map((h) => getToolById(h.tool)?.name)
          .filter(Boolean)
        if (adlar.length) parcalar.push(`Son kullandığı araçlar: ${[...new Set(adlar)].join(', ')}`)
      }
    } catch {
      // Geçmiş okunamazsa asistan yine çalışsın, yalnızca bağlamı daha dar olur.
    }

    return parcalar.join('\n') || 'Kullanıcı henüz marka profilini doldurmadı.'
  }

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    const q = soru.trim()
    if (!q || yukleniyor) return
    setSoru('')
    setHata('')
    setMesajlar((m) => [...m, { rol: 'sen', metin: q }])
    setYukleniyor(true)
    try {
      const baglam = await baglamKur()
      const r = await apiFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: baglam }),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || 'Cevap alınamadı')
      setMesajlar((m) => [...m, { rol: 'asistan', metin: d.answer, araclar: gecenAraclar(d.answer) }])
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-label={acik ? 'Asistanı kapat' : 'Asistanı aç'}
        className="kade-assistant-fab"
      >
        {acik ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {acik && (
        <section className="kade-assistant" role="dialog" aria-label="Çalışma alanı asistanı">
          <header className="kade-assistant-head">
            <span className="kade-eyebrow">Asistan</span>
            <p>Markanı ve son çalışmalarını biliyor.</p>
          </header>

          <div className="kade-assistant-akis">
            {mesajlar.length === 0 && !yukleniyor && (
              <div className="kade-assistant-bos">
                <p>Bugün ne yayınlamalıyım?</p>
                <p>Bu başlık tutar mı?</p>
                <p>Hangi araçla başlamalıyım?</p>
              </div>
            )}
            {mesajlar.map((m, i) => (
              <div key={i} className={`kade-assistant-mesaj kade-assistant-${m.rol}`}>
                <p>{m.metin}</p>
                {m.araclar && m.araclar.length > 0 && (
                  <div className="kade-assistant-araclar">
                    {m.araclar.map((id) => {
                      const t = getToolById(id)
                      if (!t) return null
                      return (
                        <Link key={id} href={alanYolu(t.route)} onClick={() => setAcik(false)}>
                          {t.name} <ArrowRight className="h-3 w-3" />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {yukleniyor && (
              <div className="kade-assistant-mesaj kade-assistant-asistan">
                <p className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Düşünüyor…</p>
              </div>
            )}
            {hata && <p className="kade-assistant-hata">{hata}</p>}
            <div ref={sonRef} />
          </div>

          <form onSubmit={gonder} className="kade-assistant-form">
            <input
              value={soru}
              onChange={(e) => setSoru(e.target.value)}
              placeholder="Bir şey sor…"
              aria-label="Asistana soru"
              maxLength={500}
            />
            <button type="submit" disabled={yukleniyor || !soru.trim()} aria-label="Gönder">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
