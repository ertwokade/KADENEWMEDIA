'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Cloud, HardDrive, LogOut, UserRound } from 'lucide-react'
import { useProfile } from '@/lib/context/ProfileContext'
import { getProfileCompletion, PROFILE_STORAGE_KEY } from '@/lib/profile/types'
import { LOCAL_HISTORY_KEY } from '@/lib/client/api'
import { apiPath, withBasePath } from '@/lib/appConfig'
import { MANUAL_MODEL_STORAGE_KEY } from '@/lib/context/ModelContext'
import { captureAnalytics } from '@/lib/analytics/client'

function splitList(value: string) {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

export default function AccountSettingsPanel() {
  const { account, loading, cloudBacked, error, saveAccount } = useProfile()
  const [draft, setDraft] = useState(account)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(account), [account])

  const update = (section: 'profile' | 'workspace' | 'brand' | 'preferences', key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }))
  }

  const save = async () => {
    setSaving(true)
    await saveAccount(draft)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const logout = async () => {
    captureAnalytics('logout')
    await fetch(apiPath('/api/auth/logout'), { method: 'POST' }).catch(() => undefined)
    ;[PROFILE_STORAGE_KEY, LOCAL_HISTORY_KEY, MANUAL_MODEL_STORAGE_KEY, 'kade-content-calendar', 'contentai-templates', 'kade-kit-v5'].forEach((key) => localStorage.removeItem(key))
    window.location.href = withBasePath('/login')
  }

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400 placeholder:text-zinc-600'
  const labelClass = 'space-y-1.5 text-xs font-medium text-zinc-400'

  return (
    <section className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><UserRound className="h-5 w-5" /></div>
        <div><h2 className="font-semibold text-zinc-100">Profil ve aktif marka</h2><p className="mt-0.5 text-xs text-zinc-500">Araçlar bu bağlamı otomatik kullanır.</p></div>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          {cloudBacked ? <Cloud className="h-4 w-4 text-emerald-400" /> : <HardDrive className="h-4 w-4 text-amber-400" />}
          %{getProfileCompletion(draft)} · {cloudBacked ? 'Hesaba kayıtlı' : 'Bu cihazda'}
        </div>
      </div>

      {loading ? <p className="py-8 text-center text-sm text-zinc-500">Profil yükleniyor…</p> : <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Ad soyad<input className={inputClass} value={draft.profile.displayName} onChange={(e) => update('profile', 'displayName', e.target.value)} /></label>
          <label className={labelClass}>Çalışma alanı<input className={inputClass} value={draft.workspace.name} onChange={(e) => update('workspace', 'name', e.target.value)} /></label>
          <label className={labelClass}>Marka adı<input className={inputClass} value={draft.brand.name} onChange={(e) => update('brand', 'name', e.target.value)} /></label>
          <label className={labelClass}>Niş / sektör<input className={inputClass} value={draft.brand.niche} onChange={(e) => update('brand', 'niche', e.target.value)} /></label>
        </div>
        <label className={labelClass}>Hedef kitle<textarea className={`${inputClass} min-h-20`} value={draft.brand.audience} onChange={(e) => update('brand', 'audience', e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Marka tonu<input className={inputClass} value={draft.brand.voice} onChange={(e) => update('brand', 'voice', e.target.value)} /></label>
          <label className={labelClass}>Varsayılan içerik tonu<input className={inputClass} value={draft.preferences.tone} onChange={(e) => update('preferences', 'tone', e.target.value)} /></label>
          <label className={labelClass}>Platformlar<input className={inputClass} value={draft.preferences.platforms.join(', ')} onChange={(e) => { const next = splitList(e.target.value); update('preferences', 'platforms', next); update('brand', 'preferredPlatforms', next) }} /></label>
          <label className={labelClass}>Ürün / hizmetler<input className={inputClass} value={draft.brand.products.join(', ')} onChange={(e) => update('brand', 'products', splitList(e.target.value))} /></label>
          <label className={labelClass}>Web sitesi<input className={inputClass} value={draft.brand.website} onChange={(e) => update('brand', 'website', e.target.value)} placeholder="https://…" /></label>
          <label className={labelClass}>Anahtar kelimeler<input className={inputClass} value={draft.brand.keywords.join(', ')} onChange={(e) => update('brand', 'keywords', splitList(e.target.value))} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
            <span><strong className="block text-zinc-100">Otomatik model seçimi</strong><span className="mt-0.5 block text-xs text-zinc-500">Açıksa göreve göre yönlendirir; kapalıysa son manuel seçimini korur.</span></span>
            <input type="checkbox" checked={draft.preferences.autoModel} onChange={(e) => update('preferences', 'autoModel', e.target.checked)} className="h-5 w-5 shrink-0 accent-amber-400" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300">
            <span><strong className="block text-zinc-100">Araç girdilerini hatırla</strong><span className="mt-0.5 block text-xs text-zinc-500">Kapalıysa geçmişte istem metni saklanmaz.</span></span>
            <input type="checkbox" checked={draft.preferences.rememberInputs} onChange={(e) => update('preferences', 'rememberInputs', e.target.checked)} className="h-5 w-5 shrink-0 accent-amber-400" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi' : 'Profili kaydet'}</button>
          <Link href="/onboarding" className="rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">Ayrıntılı düzenle</Link>
          <button onClick={logout} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-500 hover:bg-red-950/40 hover:text-red-300"><LogOut className="h-4 w-4" /> Çıkış yap</button>
        </div>
        {error && <p className="text-xs text-amber-400">{error} Yerel kayıt kullanılmaya devam ediyor.</p>}
      </div>}
    </section>
  )
}
