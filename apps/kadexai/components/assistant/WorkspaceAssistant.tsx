'use client'

import { modelDisplayName } from '@/lib/ai/models'
import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle, Mic, Square, Volume2, VolumeX, X } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import { useProfile } from '@/lib/context/ProfileContext'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'
import { TOOL_REGISTRY, getToolById } from '@/lib/tools/registry'
import { cn } from '@/lib/utils'
import KadeOrb from './KadeOrb'
import ModelOutput from '@/components/ui/ModelOutput'
import { assistantToolCatalog } from '@/lib/assistant/toolCatalog'
import { kayitBaslat, sesKaydiDesteklenir, type KayitOturumu } from '@/lib/client/voice'
import {
  AdimDurumu,
  ToolInvocation,
  ToolInvocationContentCollapsible,
  ToolInvocationHeader,
  ToolInvocationName,
  ToolInvocationRawData,
} from '@/components/ui/tool-invocation'

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

// Sohbet ve sesli yanıt tercihi bu tarayıcıda saklanır; sayfa yenilenince kaybolmaz.
const SOHBET_ANAHTARI = 'kade:assistant:messages'
const SES_ANAHTARI = 'kade:assistant:voice-reply'

function kayitliMesajlar(): Mesaj[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(SOHBET_ANAHTARI) || '[]')
    return Array.isArray(value)
      ? value.filter((m): m is Mesaj => m && (m.rol === 'sen' || m.rol === 'asistan') && typeof m.metin === 'string').slice(-30)
      : []
  } catch { return [] }
}

/** Cevap gelmeden önce yapılan işler. Eskiden görünmezdi: kullanıcı yalnızca
 *  "Düşünüyor…" görüp asistanın neyi bildiğini bilmiyordu. */
type Adim = { ad: string; durum: AdimDurumu; veri?: string }

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
  const [adimlar, setAdimlar] = useState<Adim[]>([])
  // Sesli kullanım: konuş → yazıya çevrilir → cevap gelir → sesli okunur.
  const [kayitta, setKayitta] = useState(false)
  const [sesliCevap, setSesliCevap] = useState(false)
  const [sesHatasi, setSesHatasi] = useState('')
  const [sesDestegi, setSesDestegi] = useState(false)
  const oturumRef = useRef<KayitOturumu | null>(null)
  const sesRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setSesDestegi(sesKaydiDesteklenir())
    setMesajlar(kayitliMesajlar())
    try { setSesliCevap(window.localStorage.getItem(SES_ANAHTARI) === '1') } catch { /* tercih okunamazsa kapalı kalır */ }
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem(SOHBET_ANAHTARI, JSON.stringify(mesajlar.slice(-30))) } catch { /* depolama kapalı olabilir */ }
  }, [mesajlar])

  // Panel kapanınca ya da bileşen sökülünce mikrofon ve ses açık kalmasın.
  useEffect(() => () => {
    oturumRef.current?.iptal()
    sesRef.current?.pause()
  }, [])
  const sonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mesajlar, yukleniyor, adimlar])

  /** Marka profili + son çalışmalar: cevabın genel olmamasını sağlayan bağlam. */
  const adimYaz = (ad: string, durum: AdimDurumu, veri?: string) =>
    setAdimlar((a) => {
      const i = a.findIndex((x) => x.ad === ad)
      const yeni = { ad, durum, veri }
      if (i === -1) return [...a, yeni]
      const kopya = [...a]
      kopya[i] = yeni
      return kopya
    })

  const baglamKur = async (): Promise<string> => {
    const marka = account?.brand
    const parcalar = [
      marka?.name ? `Marka: ${marka.name}` : '',
      marka?.niche ? `Niş: ${marka.niche}` : '',
      marka?.audience ? `Hedef kitle: ${marka.audience}` : '',
      marka?.voice ? `Marka sesi: ${marka.voice}` : '',
      marka?.description ? `Açıklama: ${marka.description}` : '',
    ].filter(Boolean)

    adimYaz(
      'Marka profili okundu',
      parcalar.length ? 'bitti' : 'hata',
      parcalar.length ? parcalar.join('\n') : 'Marka profili boş — cevap genel kalabilir.',
    )

    adimYaz('Son çalışmalar okunuyor', 'calisiyor')
    try {
      const r = await fetch(apiPath('/api/history?limit=8'))
      if (r.ok) {
        const d = await r.json()
        const adlar = ((d.history ?? []) as Array<{ tool: string }>)
          .map((h) => getToolById(h.tool)?.name)
          .filter(Boolean)
        const tekil = [...new Set(adlar)]
        if (tekil.length) parcalar.push(`Son kullandığı araçlar: ${tekil.join(', ')}`)
        adimYaz(
          'Son çalışmalar okundu',
          'bitti',
          tekil.length ? tekil.join(', ') : 'Henüz kayıtlı çalışma yok.',
        )
      } else {
        adimYaz('Son çalışmalar okunamadı', 'hata', `Sunucu ${r.status} döndü.`)
      }
    } catch {
      // Geçmiş okunamazsa asistan yine çalışsın, yalnızca bağlamı daha dar olur.
      adimYaz('Son çalışmalar okunamadı', 'hata', 'Ağ hatası — bağlam dar kaldı.')
    }

    if (!parcalar.some((p) => p.startsWith('Marka') || p.startsWith('Niş') || p.startsWith('Açıklama'))) parcalar.unshift('Kullanıcı henüz marka profilini doldurmadı.')
    parcalar.push(assistantToolCatalog())
    return parcalar.join('\n')
  }

  /** Cevabı sesli okur. Başarısız olursa sessizce geçilir: metin zaten ekranda. */
  const sesliOku = async (metin: string) => {
    setSesHatasi('')
    try {
      const r = await apiFetch('/api/assistant/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metin }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.ses) { setSesHatasi('Sesli yanıt oluşturulamadı; cevap metin olarak duruyor.'); return }
      sesRef.current?.pause()
      const ses = new Audio(`data:${d.mime || 'audio/wav'};base64,${d.ses}`)
      sesRef.current = ses
      await ses.play()
    } catch {
      // Otomatik oynatma engellenmiş olabilir; cevap metin olarak duruyor.
      setSesHatasi('Tarayıcı sesi otomatik çalmadı; cevap metin olarak duruyor.')
    }
  }

  const mikrofonaBas = async () => {
    if (yukleniyor) return
    setHata('')
    if (kayitta) {
      const oturum = oturumRef.current
      oturumRef.current = null
      setKayitta(false)
      if (!oturum) return
      const kayit = await oturum.durdur()
      if (kayit.size < 1200) { setHata('Kayıt çok kısa.'); return }

      setYukleniyor(true)
      setAdimlar([{ ad: 'Söylediğin yazıya çevriliyor', durum: 'calisiyor' }])
      try {
        const form = new FormData()
        form.append('file', kayit, 'kayit.webm')
        const r = await apiFetch('/api/assistant/voice', { method: 'POST', body: form }, 120_000)
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Ses çözümlenemedi.')
        adimYaz('Söylediğin yazıya çevrildi', 'bitti', d.metin)
        await sor(d.metin, true)
      } catch (err) {
        adimYaz('Ses çözümlenemedi', 'hata', err instanceof Error ? err.message : undefined)
        setHata(err instanceof Error ? err.message : 'Ses çözümlenemedi.')
        setYukleniyor(false)
      }
      return
    }

    try {
      oturumRef.current = await kayitBaslat()
      setKayitta(true)
    } catch {
      setHata('Mikrofona erişilemedi. Tarayıcı iznini kontrol et.')
    }
  }

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    const q = soru.trim()
    if (!q || yukleniyor) return
    setSoru('')
    setHata('')
    setAdimlar([])
    await sor(q, false)
  }

  /** Soruyu gönderir. `sesli` ise cevap ayrıca okunur. */
  const sor = async (q: string, sesli: boolean) => {
    setMesajlar((m) => [...m, { rol: 'sen', metin: q }])
    setAdimlar((a) => [...a, { ad: 'Marka profili okunuyor', durum: 'calisiyor' }])
    setYukleniyor(true)
    try {
      const baglam = await baglamKur()
      adimYaz('Asistan yanıtlıyor', 'calisiyor')
      const r = await apiFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: baglam }),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || 'Cevap alınamadı')
      adimYaz('Asistan yanıtladı', 'bitti', d.model ? `Model: ${modelDisplayName(d.model)}` : undefined)
      setMesajlar((m) => [...m, { rol: 'asistan', metin: d.answer, araclar: gecenAraclar(d.answer) }])
      // Sesli cevap açıksa yazılı ve sesli sorular okunur; mikrofonla sorulunca her zaman okunur.
      if (sesli || sesliCevap) void sesliOku(d.answer)
    } catch (err) {
      adimYaz('Asistan yanıtlayamadı', 'hata', err instanceof Error ? err.message : undefined)
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="kade-eyebrow">Asistan</span>
                <p>{account?.brand?.name || account?.brand?.description ? 'Markanı, araçları ve son çalışmalarını biliyor.' : 'Araçları ve son çalışmalarını biliyor. Marka profilin boş.'}</p>
              </div>
              {sesDestegi && (
                <button
                  type="button"
                  onClick={() => {
                    const yeni = !sesliCevap
                    setSesliCevap(yeni)
                    try { window.localStorage.setItem(SES_ANAHTARI, yeni ? '1' : '0') } catch { /* tercih bu oturumda geçerli */ }
                    if (!yeni) sesRef.current?.pause()
                  }}
                  aria-pressed={sesliCevap}
                  aria-label={sesliCevap ? 'Sesli cevabı kapat' : 'Sesli cevabı aç'}
                  title={sesliCevap ? 'Sesli cevap açık' : 'Sesli cevap kapalı'}
                  className="kade-assistant-ses-anahtar"
                >
                  {sesliCevap ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
            </div>
          </header>

          <div className="kade-assistant-akis">
            {mesajlar.length === 0 && !yukleniyor && (
              <div className="kade-assistant-bos">
                <p>Bugün ne yayınlamalıyım?</p>
                <p>Bu başlık tutar mı?</p>
                <p>Hangi araçla başlamalıyım?</p>
                {sesDestegi && <p className="kade-assistant-ipucu">Mikrofona basıp konuşabilirsin.</p>}
              </div>
            )}
            {mesajlar.map((m, i) => (
              <div key={i} className={`kade-assistant-mesaj kade-assistant-${m.rol}`}>
                {m.rol === 'asistan' ? <ModelOutput content={m.metin} /> : <p>{m.metin}</p>}
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
            {adimlar.length > 0 && (
              <div className="kade-assistant-adimlar">
                {adimlar.map((a) => (
                  <ToolInvocation key={a.ad}>
                    <ToolInvocationHeader>
                      <ToolInvocationName name={a.ad} durum={a.durum} />
                    </ToolInvocationHeader>
                    {a.veri && (
                      <ToolInvocationContentCollapsible>
                        <ToolInvocationRawData data={a.veri} title="Ne okundu" />
                      </ToolInvocationContentCollapsible>
                    )}
                  </ToolInvocation>
                ))}
              </div>
            )}
            {(yukleniyor || kayitta) && (
              <div className="kade-assistant-dusunuyor">
                <KadeOrb size={64} />
                {kayitta && <p className="kade-assistant-dinliyor">Dinliyorum… bitince tekrar bas.</p>}
              </div>
            )}
            {hata && <p className="kade-assistant-hata">{hata}</p>}
            {sesHatasi && <p className="kade-assistant-hata">{sesHatasi}</p>}
            {mesajlar.length > 0 && !yukleniyor && (
              <button type="button" onClick={() => { setMesajlar([]); setAdimlar([]) }} className="justify-self-center text-[11px] text-zinc-500 underline">Sohbeti temizle</button>
            )}
            <div ref={sonRef} />
          </div>

          <form onSubmit={gonder} className="kade-assistant-form">
            {sesDestegi && (
              <button
                type="button"
                onClick={() => void mikrofonaBas()}
                disabled={yukleniyor}
                aria-label={kayitta ? 'Kaydı bitir ve gönder' : 'Konuşarak sor'}
                className={cn('kade-assistant-mikrofon', kayitta && 'kade-assistant-mikrofon-aktif')}
              >
                {kayitta ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <input
              value={soru}
              onChange={(e) => setSoru(e.target.value)}
              placeholder={kayitta ? 'Dinliyorum…' : 'Bir şey sor…'}
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
