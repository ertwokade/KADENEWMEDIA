'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { ProfileProvider, useProfile } from '@/lib/context/ProfileContext'
import { getProfileCompletion } from '@/lib/profile/types'

const platforms = ['YouTube', 'Instagram', 'TikTok', 'X', 'LinkedIn', 'Pinterest']

function splitList(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

function OnboardingForm() {
  const router = useRouter()
  const { account, loading, saveAccount, cloudBacked } = useProfile()
  const [draft, setDraft] = useState(account)
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading && !hydrated) {
      setDraft(account)
      setHydrated(true)
    }
  }, [account, hydrated, loading])

  const completion = useMemo(() => getProfileCompletion(draft), [draft])
  const update = (section: 'profile' | 'workspace' | 'brand' | 'preferences', key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }))
  }

  const togglePlatform = (platform: string) => {
    const current = draft.preferences.platforms
    const next = current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]
    update('preferences', 'platforms', next)
    update('brand', 'preferredPlatforms', next)
  }

  const finish = async () => {
    setSaving(true)
    const savedToCloud = await saveAccount(draft)
    setMessage(savedToCloud ? 'Profil ve marka hesabınıza kaydedildi.' : 'Bilgiler bu cihazda kaydedildi; giriş yaptığınızda buluta eşitlenecek.')
    setSaving(false)
    window.setTimeout(() => router.push('/dashboard'), 700)
  }

  const inputClass = 'w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-400 placeholder:text-zinc-600'
  const labelClass = 'space-y-1.5 text-xs font-medium text-zinc-400'
  const steps = ['Profil', 'Marka', 'İçerik', 'Bağlantılar', 'Kontrol']

  if (loading || !hydrated) return <div className="grid min-h-dvh place-items-center bg-[#09090b] text-sm text-zinc-500">Profil hazırlanıyor…</div>

  return (
    <main className="min-h-dvh bg-[#09090b] px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-zinc-950"><Sparkles className="h-5 w-5" /></div>
          <div><p className="font-bold">KADE AI</p><p className="text-xs text-zinc-500">Kişisel çalışma alanını hazırla</p></div>
          <span className="ml-auto text-xs text-zinc-500">%{completion} tamamlandı · {cloudBacked ? 'Hesap' : 'Yerel'}</span>
        </div>

        <div className="mb-6 grid grid-cols-5 gap-2">
          {steps.map((name, index) => (
            <div key={name} className="space-y-2">
              <div className={`h-1 rounded-full ${index <= step ? 'bg-amber-400' : 'bg-zinc-800'}`} />
              <p className={`hidden text-[11px] sm:block ${index === step ? 'text-amber-300' : 'text-zinc-600'}`}>{name}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-5 shadow-2xl sm:p-8">
          {step === 0 && <div className="space-y-5">
            <div><h1 className="text-2xl font-bold">Seni tanıyalım</h1><p className="mt-1 text-sm text-zinc-500">Bu bilgiler araçların dili ve ayrıntı seviyesini belirler.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Ad soyad<input className={inputClass} value={draft.profile.displayName} onChange={(e) => update('profile', 'displayName', e.target.value)} placeholder="Adınız" /></label>
              <label className={labelClass}>Uzmanlık alanı<input className={inputClass} value={draft.profile.expertise} onChange={(e) => update('profile', 'expertise', e.target.value)} placeholder="Örn. e-ticaret, eğitim" /></label>
              <label className={labelClass}>Çalışma alanı adı<input className={inputClass} value={draft.workspace.name} onChange={(e) => update('workspace', 'name', e.target.value)} /></label>
              <label className={labelClass}>Saat dilimi<input className={inputClass} value={draft.profile.timezone} onChange={(e) => update('profile', 'timezone', e.target.value)} /></label>
            </div>
            <label className={labelClass}>Hedeflerin (virgülle ayır)<textarea className={`${inputClass} min-h-24`} value={draft.profile.goals.join(', ')} onChange={(e) => update('profile', 'goals', splitList(e.target.value))} placeholder="Marka bilinirliği, satış, topluluk" /></label>
          </div>}

          {step === 1 && <div className="space-y-5">
            <div><h1 className="text-2xl font-bold">Marka bağlamını oluştur</h1><p className="mt-1 text-sm text-zinc-500">Her üretimde bu bilgiler otomatik olarak kullanılacak.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Marka adı<input className={inputClass} value={draft.brand.name} onChange={(e) => update('brand', 'name', e.target.value)} placeholder="Marka veya proje adı" /></label>
              <label className={labelClass}>Niş / sektör<input className={inputClass} value={draft.brand.niche} onChange={(e) => update('brand', 'niche', e.target.value)} placeholder="Örn. creator economy" /></label>
            </div>
            <label className={labelClass}>Marka açıklaması<textarea className={`${inputClass} min-h-24`} value={draft.brand.description} onChange={(e) => update('brand', 'description', e.target.value)} placeholder="Ne yapıyor, hangi problemi çözüyor?" /></label>
            <label className={labelClass}>Hedef kitle<textarea className={`${inputClass} min-h-20`} value={draft.brand.audience} onChange={(e) => update('brand', 'audience', e.target.value)} placeholder="Kimler, ihtiyaçları ve itirazları neler?" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Marka tonu<input className={inputClass} value={draft.brand.voice} onChange={(e) => update('brand', 'voice', e.target.value)} placeholder="Samimi, net, güvenilir" /></label>
              <label className={labelClass}>Web sitesi<input className={inputClass} value={draft.brand.website} onChange={(e) => update('brand', 'website', e.target.value)} placeholder="https://…" /></label>
              <label className={labelClass}>Ürün / hizmetler<input className={inputClass} value={draft.brand.products.join(', ')} onChange={(e) => update('brand', 'products', splitList(e.target.value))} /></label>
              <label className={labelClass}>Anahtar kelimeler<input className={inputClass} value={draft.brand.keywords.join(', ')} onChange={(e) => update('brand', 'keywords', splitList(e.target.value))} /></label>
            </div>
          </div>}

          {step === 2 && <div className="space-y-6">
            <div><h1 className="text-2xl font-bold">İçerik tercihleri</h1><p className="mt-1 text-sm text-zinc-500">Araçlar form alanlarını mümkün olduğunda bu tercihlerle doldurur.</p></div>
            <div><p className="mb-2 text-xs font-medium text-zinc-400">Platformlar</p><div className="flex flex-wrap gap-2">{platforms.map((platform) => <button type="button" key={platform} onClick={() => togglePlatform(platform.toLowerCase())} className={`rounded-lg border px-3 py-2 text-sm ${draft.preferences.platforms.includes(platform.toLowerCase()) ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>{platform}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>İçerik dili<select className={inputClass} value={draft.preferences.language} onChange={(e) => { update('preferences', 'language', e.target.value); update('brand', 'language', e.target.value) }}><option value="tr">Türkçe</option><option value="en">English</option><option value="de">Deutsch</option></select></label>
              <label className={labelClass}>Varsayılan ton<input className={inputClass} value={draft.preferences.tone} onChange={(e) => update('preferences', 'tone', e.target.value)} placeholder="Samimi ve profesyonel" /></label>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-zinc-800 p-4"><span><strong className="block text-sm">Otomatik model seçimi</strong><span className="text-xs text-zinc-500">Göreve ve kullanılabilir sağlayıcıya göre model seçer.</span></span><input type="checkbox" checked={draft.preferences.autoModel} onChange={(e) => update('preferences', 'autoModel', e.target.checked)} className="h-5 w-5 accent-amber-400" /></label>
            <label className="flex items-center justify-between rounded-xl border border-zinc-800 p-4"><span><strong className="block text-sm">Araç girdilerini hatırla</strong><span className="text-xs text-zinc-500">Çalıştırmalar geçmişte hesap bağlamıyla tutulur.</span></span><input type="checkbox" checked={draft.preferences.rememberInputs} onChange={(e) => update('preferences', 'rememberInputs', e.target.checked)} className="h-5 w-5 accent-amber-400" /></label>
          </div>}

          {step === 3 && <div className="space-y-5">
            <div><h1 className="text-2xl font-bold">Kanal bağlantıları</h1><p className="mt-1 text-sm text-zinc-500">İsteğe bağlıdır. Bunlar yalnızca marka bağlamı için profil adresleridir; OAuth veya veri erişimi anlamına gelmez.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['youtube', 'instagram', 'tiktok', 'x'].map((provider) => <label key={provider} className={labelClass}><span className="capitalize">{provider} profil URL</span><input className={inputClass} value={draft.brand.socialAccounts[provider] || ''} onChange={(event) => update('brand', 'socialAccounts', { ...draft.brand.socialAccounts, [provider]: event.target.value })} placeholder="https://…" /></label>)}
            </div>
            <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4 text-xs leading-relaxed text-cyan-200">Şu anda aktif araçların hiçbiri sosyal hesap yetkisi istemiyor; analiz araçları yalnızca senin girdiğin metriklerle çalışıyor. Gerçek bir platform entegrasyonu eklendiğinde burada açık izin kapsamı ve bağlantı durumu gösterilecek.</div>
          </div>}

          {step === 4 && <div className="space-y-5">
            <div><h1 className="text-2xl font-bold">Hazır görünüyorsun</h1><p className="mt-1 text-sm text-zinc-500">Profil ve marka bilgilerin çalışma alanına kaydedilecek.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{[
              ['Profil', draft.profile.displayName || 'Eksik'], ['Marka', draft.brand.name || 'Eksik'],
              ['Niş', draft.brand.niche || 'Eksik'], ['Hedef kitle', draft.brand.audience || 'Eksik'],
              ['Platformlar', draft.preferences.platforms.join(', ') || 'Eksik'], ['Model', draft.preferences.autoModel ? 'Otomatik' : 'Elle seçim'],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-[11px] uppercase tracking-wider text-zinc-600">{label}</p><p className="mt-1 truncate text-sm text-zinc-200">{value}</p></div>)}</div>
            {message && <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">{message}</p>}
          </div>}

          <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-5">
            <button disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /> Geri</button>
            {step < 4 ? <button onClick={() => setStep((value) => Math.min(4, value + 1))} className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300">Devam <ArrowRight className="h-4 w-4" /></button> : <button disabled={saving} onClick={finish} className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50"><Check className="h-4 w-4" /> {saving ? 'Kaydediliyor…' : 'Çalışma alanına geç'}</button>}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return <ProfileProvider><OnboardingForm /></ProfileProvider>
}
