import { Clock3, Languages, Mic2, Sparkles } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

export default function DubbingPage() {
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <TopBar
        title="Dublaj & Çeviri"
        description="Ses üretimi ve çok dilli içerik dönüşümü"
        showModelSelector={false}
      />

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 sm:p-8">
        <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/30">
          <div className="border-b border-zinc-800 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-7 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <Mic2 className="h-8 w-8" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <Clock3 className="h-3.5 w-3.5" />
              Yakında
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              Dublaj stüdyosu hazırlanıyor
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-400">
              Metinden sese üretim, doğal Türkçe sesler ve çok dilli dublaj notları tek çalışma
              alanında sunulacak. Özellik hazır olduğunda bu ekran otomatik olarak açılacak.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
            {[
              { icon: Mic2, title: 'Doğal sesler', copy: 'Farklı ton ve karakter seçenekleri' },
              { icon: Languages, title: 'Çoklu dil', copy: 'Çeviri ve kültürel uyarlama notları' },
              { icon: Sparkles, title: 'Dublaj akışı', copy: 'Tek ekranda metin, ses ve zamanlama' },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                <Icon className="h-5 w-5 text-violet-300" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-200">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
