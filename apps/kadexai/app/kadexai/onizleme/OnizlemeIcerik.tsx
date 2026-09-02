'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Mic, Square, Volume2 } from 'lucide-react'
import KadeOrb from '@/components/assistant/KadeOrb'
import {
  AdimDurumu,
  ToolInvocation,
  ToolInvocationContentCollapsible,
  ToolInvocationHeader,
  ToolInvocationName,
  ToolInvocationRawData,
} from '@/components/ui/tool-invocation'

/**
 * Yerelde Supabase yok, panele giriş yapılamıyor. Bu sayfa asistan panelinin
 * birebir kopyasını (aynı sınıflar, aynı bileşenler) örnek veriyle basıyor;
 * tasarım kararı oturum açmadan verilebilsin diye.
 */

type Adim = { ad: string; durum: AdimDurumu; veri?: string }

const ADIMLAR: Adim[] = [
  {
    ad: 'Marka profili okundu',
    durum: 'bitti',
    veri: 'Marka: Kade New Media\nNiş: dijital pazarlama\nHedef kitle: KOBİ sahipleri\nMarka sesi: net, iddialı',
  },
  {
    ad: 'Son çalışmalar okundu',
    durum: 'bitti',
    veri: 'Kanal Denetimi, Başlık Üretici, Thumbnail Fikirleri',
  },
]

export default function OnizlemeIcerik() {
  const [tema, setTema] = useState<'light' | 'dark'>('light')
  const [dusunuyor, setDusunuyor] = useState(true)
  const [gorunur, setGorunur] = useState(false)

  useEffect(() => setGorunur(true), [])

  useEffect(() => {
    const kok = document.documentElement
    const onceki = kok.dataset.theme
    kok.dataset.theme = tema
    kok.style.colorScheme = tema
    return () => {
      if (onceki) kok.dataset.theme = onceki
    }
  }, [tema])

  return (
    <main className="min-h-screen bg-[color:var(--kade-bg)] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kade-eyebrow">Yerel önizleme</p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-[color:var(--kade-ink)]">
              Asistan adımları ve küre
            </h1>
            <p className="mt-2 text-sm text-[color:var(--kade-faint)]">
              Yerelde Supabase yok, panele girilemiyor. Burası panelin kopyası — üretimde 404 döner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTema((t) => (t === 'light' ? 'dark' : 'light'))}
              className="rounded-full border border-[color:var(--kade-line-strong)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--kade-ink)]"
            >
              {tema === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç'}
            </button>
            <button
              type="button"
              onClick={() => setDusunuyor((d) => !d)}
              className="rounded-full border border-[color:var(--kade-line-strong)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--kade-ink)]"
            >
              {dusunuyor ? 'Küreyi durdur' : 'Küreyi çalıştır'}
            </button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* Panelin gerçek sınıflarıyla, açık hâlde */}
          <section>
            <p className="kade-eyebrow mb-3">Asistan paneli</p>
            <div className="kade-assistant" style={{ position: 'static', width: '100%' }}>
              <header className="kade-assistant-head">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="kade-eyebrow">Asistan</span>
                    <p>Markanı ve son çalışmalarını biliyor.</p>
                  </div>
                  <button type="button" className="kade-assistant-ses-anahtar" aria-label="Sesli cevap">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className="kade-assistant-akis">
                <div className="kade-assistant-mesaj kade-assistant-sen">
                  <p>Bu hafta hangi videoyu çekmeliyim?</p>
                </div>

                <div className="kade-assistant-adimlar">
                  {ADIMLAR.map((a) => (
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
                  {dusunuyor && (
                    <ToolInvocation>
                      <ToolInvocationHeader>
                        <ToolInvocationName name="Asistan yanıtlıyor" durum="calisiyor" />
                      </ToolInvocationHeader>
                    </ToolInvocation>
                  )}
                </div>

                {dusunuyor && gorunur && (
                  <div className="kade-assistant-dusunuyor">
                    <KadeOrb size={64} />
                    <p className="kade-assistant-dinliyor">Dinliyorum… bitince tekrar bas.</p>
                  </div>
                )}

                {!dusunuyor && (
                  <div className="kade-assistant-mesaj kade-assistant-asistan">
                    <p>
                      KOBİ sahiplerine yönelik &ldquo;3 dakikada reklam bütçesi&rdquo; formatı senin
                      sesine uyuyor. Başlığı Başlık Üretici ile çıkar, kapağı Thumbnail
                      Fikirleri&apos;nde dene.
                    </p>
                    <div className="kade-assistant-araclar">
                      <a href="#">Başlık Üretici <ArrowRight className="h-3 w-3" /></a>
                      <a href="#">Thumbnail Fikirleri <ArrowRight className="h-3 w-3" /></a>
                    </div>
                  </div>
                )}
              </div>

              <form className="kade-assistant-form" onSubmit={(e) => e.preventDefault()}>
                <button type="button" className={dusunuyor ? 'kade-assistant-mikrofon kade-assistant-mikrofon-aktif' : 'kade-assistant-mikrofon'} aria-label="Konuşarak sor">
                  {dusunuyor ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
                </button>
                <input placeholder={dusunuyor ? 'Dinliyorum…' : 'Bir şey sor…'} aria-label="Asistana soru" />
                <button type="submit" aria-label="Gönder"><ArrowRight className="h-4 w-4" /></button>
              </form>
            </div>
          </section>

          <section className="space-y-8">
            <div>
              <p className="kade-eyebrow mb-3">Adım kartları — bütün durumlar</p>
              <div className="grid gap-1.5">
                {[
                  ...ADIMLAR,
                  { ad: 'Asistan yanıtlıyor', durum: 'calisiyor' as AdimDurumu },
                  { ad: 'Son çalışmalar okunamadı', durum: 'hata' as AdimDurumu, veri: 'Sunucu 503 döndü.' },
                ].map((a) => (
                  <ToolInvocation key={`t-${a.ad}`}>
                    <ToolInvocationHeader>
                      <ToolInvocationName name={a.ad} durum={a.durum} />
                    </ToolInvocationHeader>
                    {a.veri && (
                      <ToolInvocationContentCollapsible defaultOpen={a.durum === 'hata'}>
                        <ToolInvocationRawData data={a.veri} title="Ne okundu" />
                      </ToolInvocationContentCollapsible>
                    )}
                  </ToolInvocation>
                ))}
              </div>
            </div>

            <div>
              <p className="kade-eyebrow mb-3">Küre — boyutlar</p>
              <div className="flex flex-wrap items-center gap-8 rounded-[var(--kade-r-card)] border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)] p-8">
                {gorunur && (
                  <>
                    <KadeOrb size={48} />
                    <KadeOrb size={64} />
                    <KadeOrb size={110} />
                  </>
                )}
                <p className="max-w-[16rem] text-sm text-[color:var(--kade-faint)]">
                  Shader spektral çalışıyor; grileştirilip altın katmanla çarpıldı. Tuval zorunlu
                  siyah zeminli — açık temada nasıl durduğuna bak.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
